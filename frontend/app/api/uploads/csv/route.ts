import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { parseToastCsv } from '@/lib/toast-csv'

type LocationRow = {
  id: string
  name: string
  account_id: string | null
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase server credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(_request: NextRequest) {
  try {
    const formData = await _request.formData()
    const file = formData.get('file')
    const date = String(formData.get('date') || '').trim()
    const locationId = String(formData.get('locationId') || '').trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'CSV file is required.' }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ error: 'Upload date is required.' }, { status: 400 })
    }

    if (!locationId) {
      return NextResponse.json({ error: 'Select a location before uploading a CSV.' }, { status: 400 })
    }

    const csvText = await file.text()
    const parsedServers = await parseToastCsv(csvText)

    if (parsedServers.length === 0) {
      return NextResponse.json({ error: 'No valid server data found in CSV. Please check the file format.' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, account_id')
      .eq('id', locationId)
      .maybeSingle()

    if (locationError) {
      throw locationError
    }

    if (!location) {
      return NextResponse.json({ error: 'Selected location could not be found.' }, { status: 404 })
    }

    let accountId = (location as LocationRow).account_id
    if (!accountId) {
      const { data: fallbackAccount, error: fallbackAccountError } = await supabase
        .from('accounts')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (fallbackAccountError) {
        throw fallbackAccountError
      }

      if (!fallbackAccount) {
        return NextResponse.json({ error: 'No account record exists yet. Run the multi-tenant migration before uploading data.' }, { status: 500 })
      }

      accountId = fallbackAccount.id

      const { error: updateLocationError } = await supabase
        .from('locations')
        .update({ account_id: accountId })
        .eq('id', locationId)

      if (updateLocationError) {
        throw updateLocationError
      }
    }

    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .upsert({
        account_id: accountId,
        location_id: locationId,
        date,
        source_type: 'csv',
        source_filename: file.name || null,
      }, { onConflict: 'account_id,location_id,date' })
      .select('id')
      .single()

    if (uploadError) {
      throw uploadError
    }

    const { error: deleteScoresError } = await supabase
      .from('server_scores')
      .delete()
      .eq('upload_id', upload.id)

    if (deleteScoresError) {
      throw deleteScoresError
    }

    const rows = parsedServers.map((score) => ({
      upload_id: upload.id,
      server_name: score.server_name,
      score: score.score,
      sales_hr: score.sales_hr,
      tips_hr: score.tips_hr,
      tip_pct: score.tip_pct,
      avg_check: score.avg_check,
      guests_hr: score.guests_hr,
      ppa: score.ppa,
    }))

    const { error: insertScoresError } = await supabase
      .from('server_scores')
      .insert(rows)

    if (insertScoresError) {
      throw insertScoresError
    }

    return NextResponse.json({
      success: true,
      importedCount: parsedServers.length,
      locationName: (location as LocationRow).name,
      date,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown CSV upload error'
    console.error('CSV upload error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
