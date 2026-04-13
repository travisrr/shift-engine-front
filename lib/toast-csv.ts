export interface ParsedServerScore {
  server_name: string
  score: number
  sales_hr: number | null
  tips_hr: number | null
  tip_pct: number | null
  avg_check: number | null
  guests_hr: number | null
  ppa: number | null
}

export interface ParsedImportRow {
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
  warnings: string[]
  rejection_reason: string | null
  accepted: boolean
  raw_values: string[]
}

export interface ParsedImportPreview {
  parser_version: string
  detected_columns: string[]
  metrics_detected: string[]
  file_warnings: string[]
  section_labels: string[]
  accepted_count: number
  rejected_count: number
  date_counts: Array<{ date: string; row_count: number }>
  rows: ParsedImportRow[]
}

interface ToastCSVRow {
  'Server Name'?: string
  'Employee'?: string
  'Name'?: string
  'Server'?: string
  'Net Sales'?: string | number
  'Sales'?: string | number
  'Total Sales'?: string | number
  'Sales/hr'?: string | number
  'Tips'?: string | number
  'Total Tips'?: string | number
  'Tip Amount'?: string | number
  'Tips/hr'?: string | number
  'Hours'?: string | number
  'Shift Hours'?: string | number
  'Worked Hours'?: string | number
  'Guests'?: string | number
  'Total Guests'?: string | number
  'Guest Count'?: string | number
  'Guests Served'?: string | number
  'Guests/hr'?: string | number
  'Checks'?: string | number
  'Total Checks'?: string | number
  'Check Count'?: string | number
  'Tip Percentage'?: string | number
  'Tip %'?: string | number
  'Tip Percent'?: string | number
  'Avg Check'?: string | number
  'Average Check'?: string | number
  'PPA'?: string | number
  [key: string]: string | number | undefined
}

type CanonicalColumn =
  | 'server_name'
  | 'shift_date'
  | 'source_day'
  | 'net_sales'
  | 'sales_hr'
  | 'tips'
  | 'tips_hr'
  | 'hours'
  | 'guests'
  | 'guests_hr'
  | 'checks'
  | 'tip_pct'
  | 'avg_check'
  | 'ppa'

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '').trim()
    const parsed = parseFloat(cleaned)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function getColumnValue(row: ToastCSVRow, possibleNames: string[]): string | number | undefined {
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name]
  }
  return undefined
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[%/]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const COLUMN_ALIASES: Record<CanonicalColumn, string[]> = {
  server_name: ['servername', 'employee', 'name', 'server'],
  shift_date: ['date', 'shiftdate', 'businessdate'],
  source_day: ['day', 'weekday'],
  net_sales: ['netsales', 'sales', 'totalsales'],
  sales_hr: ['saleshr'],
  tips: ['tips', 'totaltips', 'tipamount'],
  tips_hr: ['tipshr'],
  hours: ['hours', 'shifthours', 'workedhours'],
  guests: ['guests', 'totalguests', 'guestcount', 'guestsserved'],
  guests_hr: ['guestshr'],
  checks: ['checks', 'totalchecks', 'checkcount'],
  tip_pct: ['tippercentage', 'tip', 'tippercent'],
  avg_check: ['avgcheck', 'averagecheck'],
  ppa: ['ppa'],
}

function matchCanonicalColumn(header: string): CanonicalColumn | null {
  const normalized = normalizeHeader(header)
  const match = Object.entries(COLUMN_ALIASES).find(([, aliases]) => aliases.includes(normalized))
  return (match?.[0] as CanonicalColumn | undefined) ?? null
}

function buildHeaderMap(row: string[]): Map<CanonicalColumn, number> | null {
  const headerMap = new Map<CanonicalColumn, number>()

  row.forEach((cell, index) => {
    const canonical = matchCanonicalColumn(cell)
    if (canonical && !headerMap.has(canonical)) {
      headerMap.set(canonical, index)
    }
  })

  if (!headerMap.has('server_name')) return null

  const hasDirectMetricColumns =
    headerMap.has('sales_hr') ||
    headerMap.has('tips_hr') ||
    headerMap.has('tip_pct') ||
    headerMap.has('ppa') ||
    headerMap.has('guests_hr')

  const hasDerivedMetricColumns =
    headerMap.has('net_sales') ||
    headerMap.has('tips') ||
    headerMap.has('hours') ||
    headerMap.has('guests')

  if (!hasDirectMetricColumns && !hasDerivedMetricColumns) return null

  return headerMap
}

function getMappedValue(row: string[], headerMap: Map<CanonicalColumn, number>, column: CanonicalColumn): string | undefined {
  const index = headerMap.get(column)
  if (index === undefined) return undefined
  return row[index]
}

function parseShiftDate(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!slashMatch) return null

  const month = Number.parseInt(slashMatch[1], 10)
  const day = Number.parseInt(slashMatch[2], 10)
  const rawYear = Number.parseInt(slashMatch[3], 10)
  const year = rawYear < 100 ? 2000 + rawYear : rawYear

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function looksLikeSummaryRow(label: string): boolean {
  const normalized = normalizeHeader(label)
  return normalized.includes('total') || normalized.includes('subtotal') || normalized.includes('grandtotal') || normalized.includes('average')
}

function getSectionLabel(row: string[]): string | null {
  const nonEmpty = row.filter((cell) => cell.length > 0)
  if (nonEmpty.length === 0 || nonEmpty.length > 3) return null
  if (buildHeaderMap(row)) return null

  const firstCell = nonEmpty[0] || ''
  if (looksLikeSummaryRow(firstCell)) return null
  if (matchCanonicalColumn(firstCell)) return null

  const hasMetricLikeValue = nonEmpty.some((cell) => /\d/.test(cell))
  if (hasMetricLikeValue) return null

  return nonEmpty.join(' - ')
}

function roundMetric(value: number | null, decimals: number): number | null {
  if (value === null) return null
  return Math.round(value * 10 ** decimals) / 10 ** decimals
}

type PapaParser = {
  parse: <T>(input: string, config: {
    header?: boolean
    skipEmptyLines: boolean
    transformHeader?: (header: string) => string
  }) => {
    data: T[]
    errors: Array<{ message: string }>
  }
}

export async function parseToastCsvPreview(
  csvText: string,
  options?: { fallbackDate?: string | null }
): Promise<ParsedImportPreview> {
  const { default: Papa } = await import('papaparse') as { default: PapaParser }

  const parseResult = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  })

  if (parseResult.errors.length > 0) {
    console.error('CSV parse errors:', parseResult.errors)
  }

  const parsedRows: ParsedImportRow[] = []
  let activeHeaderMap: Map<CanonicalColumn, number> | null = null
  let activeSectionLabel: string | null = null
  const detectedColumns = new Set<string>()
  const metricsDetected = new Set<string>()
  const sectionLabels = new Set<string>()
  const fileWarnings = new Set<string>()
  const fallbackDate = parseShiftDate(options?.fallbackDate ?? undefined)

  for (let rowIndex = 0; rowIndex < parseResult.data.length; rowIndex += 1) {
    const row = parseResult.data[rowIndex]
    if (!Array.isArray(row)) continue

    const normalizedRow = row.map((cell) => String(cell ?? '').trim())
    if (normalizedRow.every((cell) => cell.length === 0)) continue

    const headerMap = buildHeaderMap(normalizedRow)
    if (headerMap) {
      activeHeaderMap = headerMap
      activeSectionLabel = null
      headerMap.forEach((_index, column) => {
        detectedColumns.add(column)
        if (!['server_name', 'shift_date', 'source_day'].includes(column)) {
          metricsDetected.add(column)
        }
      })
      continue
    }

    const sectionLabel = getSectionLabel(normalizedRow)
    if (sectionLabel) {
      activeSectionLabel = sectionLabel
      sectionLabels.add(sectionLabel)
      continue
    }

    if (!activeHeaderMap) continue

    const name = getMappedValue(normalizedRow, activeHeaderMap, 'server_name')
    const dayLabel = getMappedValue(normalizedRow, activeHeaderMap, 'source_day') || null
    const rawShiftDate = getMappedValue(normalizedRow, activeHeaderMap, 'shift_date')

    if (typeof name === 'string' && looksLikeSummaryRow(name)) {
      parsedRows.push({
        row_index: rowIndex,
        section_label: activeSectionLabel,
        source_day: dayLabel,
        shift_date: parseShiftDate(rawShiftDate) ?? fallbackDate,
        employee_name: name,
        sales_hr: null,
        tips_hr: null,
        tip_pct: null,
        avg_check: null,
        guests_hr: null,
        ppa: null,
        warnings: [],
        rejection_reason: 'summary_row',
        accepted: false,
        raw_values: normalizedRow,
      })
      continue
    }

    if (!name || typeof name !== 'string') {
      parsedRows.push({
        row_index: rowIndex,
        section_label: activeSectionLabel,
        source_day: dayLabel,
        shift_date: parseShiftDate(rawShiftDate) ?? fallbackDate,
        employee_name: null,
        sales_hr: null,
        tips_hr: null,
        tip_pct: null,
        avg_check: null,
        guests_hr: null,
        ppa: null,
        warnings: [],
        rejection_reason: 'missing_employee_name',
        accepted: false,
        raw_values: normalizedRow,
      })
      continue
    }

    const mappedRow: ToastCSVRow = {
      'Server Name': getMappedValue(normalizedRow, activeHeaderMap, 'server_name'),
      Date: getMappedValue(normalizedRow, activeHeaderMap, 'shift_date'),
      'Net Sales': getMappedValue(normalizedRow, activeHeaderMap, 'net_sales'),
      'Sales/hr': getMappedValue(normalizedRow, activeHeaderMap, 'sales_hr'),
      Tips: getMappedValue(normalizedRow, activeHeaderMap, 'tips'),
      'Tips/hr': getMappedValue(normalizedRow, activeHeaderMap, 'tips_hr'),
      Hours: getMappedValue(normalizedRow, activeHeaderMap, 'hours'),
      Guests: getMappedValue(normalizedRow, activeHeaderMap, 'guests'),
      'Guests/hr': getMappedValue(normalizedRow, activeHeaderMap, 'guests_hr'),
      Checks: getMappedValue(normalizedRow, activeHeaderMap, 'checks'),
      'Tip %': getMappedValue(normalizedRow, activeHeaderMap, 'tip_pct'),
      'Avg Check': getMappedValue(normalizedRow, activeHeaderMap, 'avg_check'),
      PPA: getMappedValue(normalizedRow, activeHeaderMap, 'ppa'),
    }

    const warnings: string[] = []
    const netSales = normalizeNumber(getColumnValue(mappedRow, ['Net Sales', 'Sales', 'Total Sales']))
    const directSalesHr = normalizeNumber(getColumnValue(mappedRow, ['Sales/hr']))
    const tips = normalizeNumber(getColumnValue(mappedRow, ['Tips', 'Total Tips', 'Tip Amount']))
    const directTipsHr = normalizeNumber(getColumnValue(mappedRow, ['Tips/hr']))
    const hours = normalizeNumber(getColumnValue(mappedRow, ['Hours', 'Shift Hours', 'Worked Hours']))
    const guests = normalizeNumber(getColumnValue(mappedRow, ['Guests', 'Total Guests', 'Guest Count', 'Guests Served']))
    const directGuestsHr = normalizeNumber(getColumnValue(mappedRow, ['Guests/hr']))
    const checks = normalizeNumber(getColumnValue(mappedRow, ['Checks', 'Total Checks', 'Check Count']))
    const tipPct = normalizeNumber(getColumnValue(mappedRow, ['Tip Percentage', 'Tip %', 'Tip Percent']))
    const avgCheckDirect = normalizeNumber(getColumnValue(mappedRow, ['Avg Check', 'Average Check']))
    const directPpa = normalizeNumber(getColumnValue(mappedRow, ['PPA']))
    const shiftDate = parseShiftDate(rawShiftDate) ?? fallbackDate

    if (!parseShiftDate(rawShiftDate) && fallbackDate) {
      warnings.push('Used selected dashboard date because no row date was detected.')
    }

    const salesHr = directSalesHr ?? (hours && hours > 0 && netSales ? netSales / hours : null)
    const tipsHr = directTipsHr ?? (hours && hours > 0 && tips ? tips / hours : null)
    const avgCheck = avgCheckDirect ?? (checks && checks > 0 && netSales ? netSales / checks : null)
    const guestsHr = directGuestsHr ?? (hours && hours > 0 && guests ? guests / hours : null)
    const ppa = directPpa ?? (guests && guests > 0 && netSales ? netSales / guests : null) ?? (salesHr && guestsHr && guestsHr > 0 ? salesHr / guestsHr : null)

    if (directPpa === null && ppa !== null) {
      warnings.push('Derived PPA from available sales and guest metrics.')
    }

    if (avgCheckDirect === null) {
      warnings.push('Avg Check was not present in the file.')
    }

    const roundedSalesHr = roundMetric(salesHr, 2)
    const roundedTipsHr = roundMetric(tipsHr, 2)
    const roundedTipPct = roundMetric(tipPct, 1)
    const roundedAvgCheck = roundMetric(avgCheck, 2)
    const roundedGuestsHr = roundMetric(guestsHr, 2)
    const roundedPpa = roundMetric(ppa, 2)
    const hasAnyMetric = [roundedSalesHr, roundedTipsHr, roundedTipPct, roundedAvgCheck, roundedGuestsHr, roundedPpa]
      .some((value) => value !== null)

    if (!hasAnyMetric) {
      parsedRows.push({
        row_index: rowIndex,
        section_label: activeSectionLabel,
        source_day: dayLabel,
        shift_date: shiftDate,
        employee_name: name.trim(),
        sales_hr: null,
        tips_hr: null,
        tip_pct: null,
        avg_check: null,
        guests_hr: null,
        ppa: null,
        warnings,
        rejection_reason: 'no_supported_metrics_found',
        accepted: false,
        raw_values: normalizedRow,
      })
      continue
    }

    if (!shiftDate) {
      warnings.push('No date was detected for this row.')
    }

    parsedRows.push({
      row_index: rowIndex,
      section_label: activeSectionLabel,
      source_day: dayLabel,
      shift_date: shiftDate,
      employee_name: name.trim(),
      sales_hr: roundedSalesHr,
      tips_hr: roundedTipsHr,
      tip_pct: roundedTipPct,
      avg_check: roundedAvgCheck,
      guests_hr: roundedGuestsHr,
      ppa: roundedPpa,
      warnings,
      rejection_reason: null,
      accepted: true,
      raw_values: normalizedRow,
    })
  }

  if (detectedColumns.size === 0) {
    fileWarnings.add('No supported metric headers were detected in the uploaded CSV.')
  }

  const dateCounts = new Map<string, number>()
  for (const row of parsedRows) {
    if (!row.accepted || !row.shift_date) continue
    dateCounts.set(row.shift_date, (dateCounts.get(row.shift_date) || 0) + 1)
  }

  return {
    parser_version: 'shift-engine-csv-v1',
    detected_columns: Array.from(detectedColumns),
    metrics_detected: Array.from(metricsDetected),
    file_warnings: Array.from(fileWarnings),
    section_labels: Array.from(sectionLabels),
    accepted_count: parsedRows.filter((row) => row.accepted).length,
    rejected_count: parsedRows.filter((row) => !row.accepted).length,
    date_counts: Array.from(dateCounts.entries())
      .map(([date, row_count]) => ({ date, row_count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    rows: parsedRows,
  }
}

export async function parseToastCsv(csvText: string, options?: { fallbackDate?: string | null }): Promise<ParsedServerScore[]> {
  const preview = await parseToastCsvPreview(csvText, options)

  return preview.rows
    .filter((row) => row.accepted && row.employee_name)
    .map((row) => ({
      server_name: row.employee_name!,
      score: 75,
      sales_hr: row.sales_hr,
      tips_hr: row.tips_hr,
      tip_pct: row.tip_pct,
      avg_check: row.avg_check,
      guests_hr: row.guests_hr,
      ppa: row.ppa,
    }))
    .sort((a, b) => (b.sales_hr ?? 0) - (a.sales_hr ?? 0))
}
