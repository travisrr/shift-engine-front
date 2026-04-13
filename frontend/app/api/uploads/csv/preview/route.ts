import { NextRequest, NextResponse } from 'next/server'

import { createImportPreview, resolveLocation } from '@/lib/server-ingestion'
import { parseToastCsvPreview } from '@/lib/toast-csv'

function sampleRows(rows: ReturnType<typeof parsePreviewRows>) {
  return rows.slice(0, 12)
}

function parsePreviewRows(rows: Awaited<ReturnType<typeof parseToastCsvPreview>>['rows']) {
  return rows.map((row) => ({
    row_index: row.row_index,
    section_label: row.section_label,
    source_day: row.source_day,
    shift_date: row.shift_date,
    employee_name: row.employee_name,
    sales_hr: row.sales_hr,
    tips_hr: row.tips_hr,
    tip_pct: row.tip_pct,
    avg_check: row.avg_check,
    guests_hr: row.guests_hr,
    ppa: row.ppa,
    warnings: row.warnings,
    rejection_reason: row.rejection_reason,
    accepted: row.accepted,
    raw_values: row.raw_values,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const locationId = String(formData.get('locationId') || '').trim()
    const fallbackDate = String(formData.get('fallbackDate') || '').trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'CSV file is required.' }, { status: 400 })
    }

    if (!locationId) {
      return NextResponse.json({ error: 'Select a location before uploading a CSV.' }, { status: 400 })
    }

    const location = await resolveLocation(locationId)
    const csvText = await file.text()
    const preview = await parseToastCsvPreview(csvText, { fallbackDate })

    if (preview.accepted_count === 0) {
      return NextResponse.json({
        error: 'No supported employee metric rows were detected in the uploaded file.',
        preview: {
          ...preview,
          accepted_rows_sample: [],
          rejected_rows_sample: sampleRows(parsePreviewRows(preview.rows.filter((row) => !row.accepted))),
        },
      }, { status: 400 })
    }

    const previewId = await createImportPreview({
      location,
      fileName: file.name,
      rawCsv: csvText,
      fallbackDate: fallbackDate || null,
      preview,
    })

    const acceptedRows = parsePreviewRows(preview.rows.filter((row) => row.accepted))
    const rejectedRows = parsePreviewRows(preview.rows.filter((row) => !row.accepted))

    return NextResponse.json({
      success: true,
      previewId,
      fileName: file.name,
      locationName: location.name,
      acceptedCount: preview.accepted_count,
      rejectedCount: preview.rejected_count,
      detectedColumns: preview.detected_columns,
      metricsDetected: preview.metrics_detected,
      fileWarnings: preview.file_warnings,
      sectionLabels: preview.section_labels,
      dateCounts: preview.date_counts,
      acceptedRowsSample: sampleRows(acceptedRows),
      rejectedRowsSample: sampleRows(rejectedRows),
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown CSV preview error'
    console.error('CSV preview error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
