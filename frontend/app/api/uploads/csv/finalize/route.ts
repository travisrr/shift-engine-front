import { NextRequest, NextResponse } from 'next/server'

import { finalizeImportPreview, resolveLocation } from '@/lib/server-ingestion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const previewId = String(body.previewId || '').trim()

    if (!previewId) {
      return NextResponse.json({ error: 'Preview ID is required.' }, { status: 400 })
    }

    const result = await finalizeImportPreview(previewId)
    const location = await resolveLocation(result.location_id)

    return NextResponse.json({
      success: true,
      locationName: location.name,
      importedDates: result.imported_dates,
      importedCount: result.imported_dates.reduce((sum, row) => sum + row.row_count, 0),
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown CSV finalize error'
    console.error('CSV finalize error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
