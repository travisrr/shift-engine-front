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
  ppa: number | null
}

/* ─────────────────── Helpers ─────────────────── */

/**
 * CSV uploads are now server-owned so account/location metadata stays authoritative.
 */
export async function saveUpload() {
  throw new Error('CSV uploads now go through /api/uploads/csv. Use the server upload route instead.')
}

type UploadRow = {
  id: string
  date: string
  created_at: string
}

async function getUploadRow(date: string, locationId?: string): Promise<UploadRow | null> {
  if (locationId) {
    const { data: scopedUpload, error: scopedError } = await supabase
      .from('uploads')
      .select('id, date, created_at')
      .eq('date', date)
      .eq('location_id', locationId)
      .maybeSingle()

    if (scopedError) throw scopedError
    if (scopedUpload) return scopedUpload as UploadRow

    const { data: legacyUpload, error: legacyError } = await supabase
      .from('uploads')
      .select('id, date, created_at')
      .eq('date', date)
      .is('location_id', null)
      .maybeSingle()

    if (legacyError) throw legacyError
    return legacyUpload as UploadRow | null
  }

  const { data: upload, error } = await supabase
    .from('uploads')
    .select('id, date, created_at')
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  return upload as UploadRow | null
}

/**
 * Fetch scorecard data for a specific date.
 * Returns null if no upload exists for that date.
 */
export async function getUploadByDate(date: string, locationId?: string) {
  const upload = await getUploadRow(date, locationId)
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
 * Fetch scorecard data with job title information from wait_staff.
 * Returns scores with job_title for filtering into Servers and Bar Tenders.
 */
export async function getUploadByDateWithJobTitles(date: string, locationId?: string) {
  const upload = await getUploadRow(date, locationId)
  if (!upload) return null

  // Fetch scores for this upload
  const { data: scores, error: scoresError } = await supabase
    .from('server_scores')
    .select('*')
    .eq('upload_id', upload.id)
    .order('score', { ascending: false })

  if (scoresError) throw scoresError

  // Fetch all wait_staff to map names to job titles
  const { data: staff, error: staffError } = await supabase
    .from('wait_staff')
    .select('full_name, job_title')

  if (staffError) throw staffError

  // Create a map of name -> job_title
  const jobTitleMap = new Map<string, string>()
  staff?.forEach((s: { full_name: string; job_title: string }) => {
    jobTitleMap.set(s.full_name, s.job_title)
  })

  // Map scores to include job_title (default to 'Server' if not found)
  const scoresWithTitles = (scores || []).map((row: ServerScore & { id: string; upload_id: string; created_at: string }) => ({
    ...row,
    job_title: jobTitleMap.get(row.server_name) || 'Server',
  }))

  return { upload, scores: scoresWithTitles as (ServerScore & { job_title: string; id: string; upload_id: string; created_at: string })[] }
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
