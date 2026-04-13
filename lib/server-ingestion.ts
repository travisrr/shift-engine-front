import type { ParsedImportPreview, ParsedImportRow } from '@/lib/toast-csv'
import { getSupabaseAdminClient } from '@/lib/server-supabase'

export type ResolvedLocation = {
  id: string
  name: string
  account_id: string
}

type ImportRowRecord = ParsedImportRow & {
  id: string
}

type ImportRowQueryResult = {
  id: string
  row_index: number
  section_label: string | null
  source_day: string | null
  shift_date: string | null
  employee_name: string | null
  sales_hr: number | null
  tips_hr: number | null
  tip_pct: number | null
  avg_check: number | null
  guests_hr: number | null
  ppa: number | null
  warnings: string[] | null
  rejection_reason: string | null
  is_accepted: boolean
  raw_values: string[] | null
}

export async function resolveLocation(locationId: string): Promise<ResolvedLocation> {
  const supabase = getSupabaseAdminClient()

  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, name, account_id')
    .eq('id', locationId)
    .maybeSingle()

  if (locationError) throw locationError
  if (!location) throw new Error('Selected location could not be found.')

  let accountId = location.account_id as string | null
  if (!accountId) {
    const { data: fallbackAccount, error: fallbackError } = await supabase
      .from('accounts')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (fallbackError) throw fallbackError
    if (!fallbackAccount) {
      throw new Error('No account record exists yet. Run the multi-tenant migration before importing data.')
    }

    accountId = fallbackAccount.id

    const { error: updateLocationError } = await supabase
      .from('locations')
      .update({ account_id: accountId })
      .eq('id', locationId)

    if (updateLocationError) throw updateLocationError
  }

  if (!accountId) {
    throw new Error('Location account could not be resolved.')
  }

  return {
    id: location.id,
    name: location.name,
    account_id: accountId,
  }
}

export async function createImportPreview(params: {
  location: ResolvedLocation
  fileName: string
  rawCsv: string
  fallbackDate: string | null
  preview: ParsedImportPreview
}) {
  const supabase = getSupabaseAdminClient()

  const { data: importRecord, error: importError } = await supabase
    .from('ingestion_uploads')
    .insert({
      account_id: params.location.account_id,
      location_id: params.location.id,
      source_type: 'csv',
      source_filename: params.fileName || null,
      fallback_date: params.fallbackDate || null,
      raw_csv: params.rawCsv,
      parser_version: params.preview.parser_version,
      status: 'previewed',
      detected_columns: params.preview.detected_columns,
      metrics_detected: params.preview.metrics_detected,
      file_warnings: params.preview.file_warnings,
      accepted_row_count: params.preview.accepted_count,
      rejected_row_count: params.preview.rejected_count,
    })
    .select('id')
    .single()

  if (importError) throw importError

  if (params.preview.rows.length > 0) {
    const rowPayload = params.preview.rows.map((row) => ({
      ingestion_upload_id: importRecord.id,
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
      is_accepted: row.accepted,
      raw_values: row.raw_values,
    }))

    const { error: rowsError } = await supabase
      .from('ingestion_upload_rows')
      .insert(rowPayload)

    if (rowsError) throw rowsError
  }

  return importRecord.id as string
}

export async function finalizeImportPreview(importId: string) {
  const supabase = getSupabaseAdminClient()

  const { data: importRecord, error: importError } = await supabase
    .from('ingestion_uploads')
    .select('id, account_id, location_id, source_filename')
    .eq('id', importId)
    .maybeSingle()

  if (importError) throw importError
  if (!importRecord) throw new Error('Import preview not found.')

  const { data: importRows, error: rowsError } = await supabase
    .from('ingestion_upload_rows')
    .select('id, row_index, section_label, source_day, shift_date, employee_name, sales_hr, tips_hr, tip_pct, avg_check, guests_hr, ppa, warnings, rejection_reason, is_accepted, raw_values')
    .eq('ingestion_upload_id', importId)
    .eq('is_accepted', true)
    .order('row_index', { ascending: true })

  if (rowsError) throw rowsError

  const rows: ImportRowRecord[] = ((importRows || []) as ImportRowQueryResult[]).map((row) => ({
    id: row.id,
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
    warnings: row.warnings || [],
    rejection_reason: row.rejection_reason,
    accepted: row.is_accepted,
    raw_values: row.raw_values || [],
  }))
  const rowsWithDates = rows.filter((row) => row.shift_date && row.employee_name)

  if (rowsWithDates.length === 0) {
    throw new Error('No accepted rows with dates were available to import.')
  }

  const groupedByDate = new Map<string, ImportRowRecord[]>()
  for (const row of rowsWithDates) {
    const date = row.shift_date as string
    const existing = groupedByDate.get(date) || []
    existing.push(row)
    groupedByDate.set(date, existing)
  }

  const importedDates: Array<{ date: string; row_count: number }> = []

  for (const [date, groupedRows] of Array.from(groupedByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .upsert({
        account_id: importRecord.account_id,
        location_id: importRecord.location_id,
        date,
        source_type: 'csv',
        source_filename: importRecord.source_filename || 'preview-finalized.csv',
      }, { onConflict: 'account_id,location_id,date' })
      .select('id')
      .single()

    if (uploadError) throw uploadError

    const { error: deleteError } = await supabase
      .from('server_scores')
      .delete()
      .eq('upload_id', upload.id)

    if (deleteError) throw deleteError

    const scorePayload = groupedRows.map((row) => ({
      upload_id: upload.id,
      server_name: row.employee_name,
      score: 75,
      sales_hr: row.sales_hr,
      tips_hr: row.tips_hr,
      tip_pct: row.tip_pct,
      avg_check: row.avg_check,
      guests_hr: row.guests_hr,
      ppa: row.ppa,
    }))

    const { error: insertError } = await supabase
      .from('server_scores')
      .insert(scorePayload)

    if (insertError) throw insertError

    importedDates.push({ date, row_count: groupedRows.length })
  }

  const { error: finalizeError } = await supabase
    .from('ingestion_uploads')
    .update({
      status: 'finalized',
      finalized_at: new Date().toISOString(),
    })
    .eq('id', importId)

  if (finalizeError) throw finalizeError

  return {
    location_id: importRecord.location_id as string,
    imported_dates: importedDates,
  }
}
