import { supabase } from './supabase'

/* ─────────────────── Types ─────────────────── */

export interface ServerScore {
  server_name: string
  score: number
  sales_hr: number | null
  tips_hr: number | null
  tip_pct: number | null
  avg_check: number | null
  guests_hr: number | null
}

/* ─────────────────── Helpers ─────────────────── */

/**
 * Save (or overwrite) an upload for a given date.
 * Upserts the `uploads` row, deletes old scores, then batch-inserts new ones.
 */
export async function saveUpload(date: string, servers: ServerScore[]) {
  // Upsert the upload row (unique on date)
  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .upsert({ date }, { onConflict: 'date' })
    .select('id')
    .single()

  if (uploadError) throw uploadError

  // Delete existing scores for this upload (overwrite behavior)
  await supabase.from('server_scores').delete().eq('upload_id', upload.id)

  // Batch-insert the new scores
  const rows = servers.map((s) => ({
    upload_id: upload.id,
    server_name: s.server_name,
    score: s.score,
    sales_hr: s.sales_hr,
    tips_hr: s.tips_hr,
    tip_pct: s.tip_pct,
    avg_check: s.avg_check,
    guests_hr: s.guests_hr,
  }))

  const { error: scoresError } = await supabase
    .from('server_scores')
    .insert(rows)

  if (scoresError) throw scoresError

  return upload.id
}

/**
 * Fetch scorecard data for a specific date.
 * Returns null if no upload exists for that date.
 */
export async function getUploadByDate(date: string) {
  const { data: upload, error } = await supabase
    .from('uploads')
    .select('id, date, created_at')
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  if (!upload) return null

  const { data: scores, error: scoresError } = await supabase
    .from('server_scores')
    .select('*')
    .eq('upload_id', upload.id)
    .order('score', { ascending: false })

  if (scoresError) throw scoresError

  return { upload, scores: scores as ServerScore[] }
}

/**
 * Get all dates that have uploaded data.
 * Useful for highlighting dates in the date picker.
 */
export async function getAvailableDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('date')
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => row.date)
}
