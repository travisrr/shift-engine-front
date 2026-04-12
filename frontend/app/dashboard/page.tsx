'use client';

import { useState, useCallback, useEffect } from 'react';
// @ts-ignore - papaparse types are installed but not being picked up in build
import Papa from 'papaparse';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import type { ServerData } from '../components/Dashboard';
import { getUploadByDateWithJobTitles, saveUpload, type ServerScore } from '../../lib/supabase-helpers';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ─────────────────── Mock Data (shown when no CSV uploaded) ─────────────────── */

type MockServerSeed = Omit<ServerData, 'ppa'>;

const mockServers: MockServerSeed[] = [
  { name: 'Chloe Colaianni', score: 95, salesHr: 201.0, tipsHr: 36.3, tipPct: 18.1, avgCheck: 63.0, guestsHr: 5.7 },
  { name: 'Rachel Brunet', score: 91, salesHr: 163.8, tipsHr: 31.5, tipPct: 19.2, avgCheck: 54.1, guestsHr: 5.4 },
  { name: 'Karen Mason', score: 90, salesHr: 152.0, tipsHr: 28.3, tipPct: 18.6, avgCheck: 66.0, guestsHr: 4.5 },
  { name: 'Dean Polizos', score: 89, salesHr: 178.7, tipsHr: 30.9, tipPct: 17.3, avgCheck: 68.7, guestsHr: 4.9 },
  { name: 'Eric Fowler', score: 89, salesHr: 166.5, tipsHr: 30.9, tipPct: 18.5, avgCheck: 64.9, guestsHr: 4.7 },
  { name: 'Ty Buckley', score: 89, salesHr: 160.1, tipsHr: 28.7, tipPct: 17.9, avgCheck: 69.9, guestsHr: 4.2 },
  { name: 'Madison Lawrence', score: 88, salesHr: 182.7, tipsHr: 32.3, tipPct: 17.7, avgCheck: 65.3, guestsHr: 5.6 },
  { name: 'Meredith Johnson', score: 87, salesHr: 163.5, tipsHr: 31.7, tipPct: 19.4, avgCheck: 51.2, guestsHr: 5.6 },
  { name: 'Giselle San Filippo', score: 86, salesHr: 199.4, tipsHr: 27.5, tipPct: 13.8, avgCheck: 64.5, guestsHr: 5.7 },
  { name: 'Morgan Sparkman', score: 86, salesHr: 168.1, tipsHr: 30.9, tipPct: 18.4, avgCheck: 49.1, guestsHr: 5.4 },
  { name: 'Lauren Claxton', score: 80, salesHr: 151.7, tipsHr: 33.1, tipPct: 21.8, avgCheck: 71.3, guestsHr: 4.1 },
  { name: 'Paige Anderson', score: 81, salesHr: 145.5, tipsHr: 29.1, tipPct: 20.0, avgCheck: 55.2, guestsHr: 4.8 },
  { name: 'Thomas Malone', score: 79, salesHr: 181.0, tipsHr: 35.3, tipPct: 19.5, avgCheck: 65.2, guestsHr: 5.2 },
  { name: 'Addie Stubbe', score: 78, salesHr: 151.7, tipsHr: 29.1, tipPct: 19.2, avgCheck: 53.4, guestsHr: 5.4 },
  { name: 'Alec Ramsey', score: 76, salesHr: 116.9, tipsHr: 21.9, tipPct: 18.8, avgCheck: 68.2, guestsHr: 3.0 },
];

const mockBartenders: MockServerSeed[] = [
  { name: 'Caleigh Graves', score: 92, salesHr: 776.2, tipsHr: 163.2, tipPct: 21.0, avgCheck: 45.6, guestsHr: 26.5 },
];

/* ─────────────────── CSV Parsing Helpers ─────────────────── */

interface ToastCSVRow {
  'Server Name'?: string;
  'Employee'?: string;
  'Name'?: string;
  'Server'?: string;
  'Net Sales'?: string | number;
  'Sales'?: string | number;
  'Total Sales'?: string | number;
  'Tips'?: string | number;
  'Total Tips'?: string | number;
  'Tip Amount'?: string | number;
  'Hours'?: string | number;
  'Shift Hours'?: string | number;
  'Worked Hours'?: string | number;
  'Guests'?: string | number;
  'Total Guests'?: string | number;
  'Guest Count'?: string | number;
  'Guests Served'?: string | number;
  'Checks'?: string | number;
  'Total Checks'?: string | number;
  'Check Count'?: string | number;
  'Tip Percentage'?: string | number;
  'Tip %'?: string | number;
  [key: string]: string | number | undefined;
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and parse
    const cleaned = value.replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

function getColumnValue(row: ToastCSVRow, possibleNames: string[]): string | number | undefined {
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name];
  }
  return undefined;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface CohortMetricRow {
  name: string;
  salesHr: number;
  tipsHr: number;
  tipPct: number;
  avgCheck: number;
  guestsHr: number;
  ppa: number;
}

interface CohortDataset {
  servers: ServerData[];
  cohortAverages: ServerData;
}

const EMPTY_COHORT_AVERAGES: ServerData = {
  name: 'Cohort Average',
  score: 75,
  salesHr: 0,
  tipsHr: 0,
  tipPct: 0,
  avgCheck: 0,
  guestsHr: 0,
  ppa: 0,
};

function percentageDeltaFromAverage(value: number, average: number): number {
  if (average <= 0) return 0;
  return (value - average) / average;
}

function buildCohortAverages(rows: CohortMetricRow[]): ServerData {
  if (rows.length === 0) return EMPTY_COHORT_AVERAGES;

  const totals = rows.reduce(
    (acc, row) => ({
      salesHr: acc.salesHr + row.salesHr,
      tipsHr: acc.tipsHr + row.tipsHr,
      tipPct: acc.tipPct + row.tipPct,
      avgCheck: acc.avgCheck + row.avgCheck,
      guestsHr: acc.guestsHr + row.guestsHr,
      ppa: acc.ppa + row.ppa,
    }),
    { salesHr: 0, tipsHr: 0, tipPct: 0, avgCheck: 0, guestsHr: 0, ppa: 0 }
  );

  const count = rows.length;

  return {
    name: 'Cohort Average',
    score: 75,
    salesHr: roundTo(totals.salesHr / count, 2),
    tipsHr: roundTo(totals.tipsHr / count, 2),
    tipPct: roundTo(totals.tipPct / count, 1),
    avgCheck: roundTo(totals.avgCheck / count, 2),
    guestsHr: roundTo(totals.guestsHr / count, 1),
    ppa: roundTo(totals.ppa / count, 2),
  };
}

function calculateCohortScore(row: CohortMetricRow, cohortAverages: ServerData): number {
  const ppaDelta = percentageDeltaFromAverage(row.ppa, cohortAverages.ppa);
  const tipPctDelta = percentageDeltaFromAverage(row.tipPct, cohortAverages.tipPct);
  const salesHrDelta = percentageDeltaFromAverage(row.salesHr, cohortAverages.salesHr);

  const score =
    75 +
    ppaDelta * 40 +
    tipPctDelta * 40 +
    salesHrDelta * 20;

  return Math.round(clamp(score, 40, 100));
}

function buildCohortDataset(rows: CohortMetricRow[]): CohortDataset {
  const cohortAverages = buildCohortAverages(rows);

  const servers = rows
    .map((row) => ({
      ...row,
      score: calculateCohortScore(row, cohortAverages),
    }))
    .sort((a, b) => b.score - a.score || b.ppa - a.ppa || b.salesHr - a.salesHr);

  return { servers, cohortAverages };
}

function scoreRowsToCohortDataset(scores: ServerScore[]): CohortDataset {
  const rows: CohortMetricRow[] = scores.map((score) => {
    const salesHr = score.sales_hr ?? 0;
    const guestsHr = score.guests_hr ?? 0;

    return {
      name: score.server_name,
      salesHr,
      tipsHr: score.tips_hr ?? 0,
      tipPct: score.tip_pct ?? 0,
      avgCheck: score.avg_check ?? 0,
      guestsHr,
      ppa: score.ppa ?? (guestsHr > 0 ? roundTo(salesHr / guestsHr, 2) : 0),
    };
  });

  return buildCohortDataset(rows);
}

function mockRowsToCohortDataset(rows: MockServerSeed[]): CohortDataset {
  return buildCohortDataset(
    rows.map((row) => ({
      name: row.name,
      salesHr: row.salesHr,
      tipsHr: row.tipsHr,
      tipPct: row.tipPct,
      avgCheck: row.avgCheck,
      guestsHr: row.guestsHr,
      ppa: row.guestsHr > 0 ? roundTo(row.salesHr / row.guestsHr, 2) : 0,
    }))
  );
}

function parseToastCSV(csvText: string): ServerScore[] {
  const parseResult = Papa.parse<ToastCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.error('CSV parse errors:', parseResult.errors);
  }

  const parsedRows: ServerScore[] = [];

  for (const row of parseResult.data) {
    // Try to find server name from various possible column names
    const name = getColumnValue(row, ['Server Name', 'Employee', 'Name', 'Server']);
    if (!name || typeof name !== 'string') continue;

    // Parse numeric fields with flexible column name matching
    const netSales = normalizeNumber(getColumnValue(row, ['Net Sales', 'Sales', 'Total Sales']));
    const tips = normalizeNumber(getColumnValue(row, ['Tips', 'Total Tips', 'Tip Amount']));
    const hours = normalizeNumber(getColumnValue(row, ['Hours', 'Shift Hours', 'Worked Hours']));
    const guests = normalizeNumber(getColumnValue(row, ['Guests', 'Total Guests', 'Guest Count', 'Guests Served']));
    const checks = normalizeNumber(getColumnValue(row, ['Checks', 'Total Checks', 'Check Count']));
    const tipPct = normalizeNumber(getColumnValue(row, ['Tip Percentage', 'Tip %', 'Tip Percent']));
    const avgCheckDirect = normalizeNumber(getColumnValue(row, ['Avg Check', 'Average Check']));

    // Skip rows with no meaningful data
    if (!netSales && !tips && !hours) continue;

    // Calculate derived metrics
    const salesHr = hours && hours > 0 && netSales ? netSales / hours : null;
    const tipsHr = hours && hours > 0 && tips ? tips / hours : null;
    // Use direct avg check from CSV if available, otherwise calculate from sales/checks
    const avgCheck = avgCheckDirect ?? (checks && checks > 0 && netSales ? netSales / checks : null);
    const guestsHr = hours && hours > 0 && guests ? guests / hours : null;
    const ppa = guests && guests > 0 && netSales ? netSales / guests : null;

    parsedRows.push({
      server_name: name.trim(),
      // Final cohort-relative grading is calculated after the data is split into
      // role-specific cohorts so servers are only compared with like peers.
      score: 75,
      sales_hr: salesHr ? Math.round(salesHr * 100) / 100 : null,
      tips_hr: tipsHr ? Math.round(tipsHr * 100) / 100 : null,
      tip_pct: tipPct ? Math.round(tipPct * 10) / 10 : null,
      avg_check: avgCheck ? Math.round(avgCheck * 100) / 100 : null,
      guests_hr: guestsHr ? Math.round(guestsHr * 10) / 10 : null,
      ppa: ppa ? Math.round(ppa * 100) / 100 : null,
    });
  }

  return parsedRows.sort((a, b) => (b.sales_hr ?? 0) - (a.sales_hr ?? 0));
}

/* ─────────────────── Page ─────────────────── */

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [servers, setServers] = useState<ServerData[]>([]);
  const [bartenders, setBartenders] = useState<ServerData[]>([]);
  const [cohortAverages, setCohortAverages] = useState<ServerData>(EMPTY_COHORT_AVERAGES);
  const [bartenderCohortAverages, setBartenderCohortAverages] = useState<ServerData>(EMPTY_COHORT_AVERAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Load data from Supabase when date changes (fallback to mock data)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      console.log('[Dashboard] Loading data for date:', selectedDate);
      const result = await getUploadByDateWithJobTitles(selectedDate);
      
      if (result && result.scores && result.scores.length > 0) {
        console.log('[Dashboard] Loaded scores:', result.scores.map(s => ({ name: s.server_name, job_title: s.job_title })));
        
        // Filter by job title
        const serverScores = result.scores.filter(s => s.job_title === 'Server');
        const bartenderScores = result.scores.filter(s => s.job_title === 'Bar Tender');
        
        console.log('[Dashboard] Servers:', serverScores.length, 'Bartenders:', bartenderScores.length);
        
        const serverDataset = scoreRowsToCohortDataset(serverScores);
        const bartenderDataset = scoreRowsToCohortDataset(bartenderScores);

        setServers(serverDataset.servers);
        setBartenders(bartenderDataset.servers);
        setCohortAverages(serverDataset.cohortAverages);
        setBartenderCohortAverages(bartenderDataset.cohortAverages);
        } else {
          console.log('[Dashboard] No data found, using mock data');
          // Fallback to mock data when no CSV has been uploaded
          const serverDataset = mockRowsToCohortDataset(mockServers);
          const bartenderDataset = mockRowsToCohortDataset(mockBartenders);

          setServers(serverDataset.servers);
          setBartenders(bartenderDataset.servers);
          setCohortAverages(serverDataset.cohortAverages);
          setBartenderCohortAverages(bartenderDataset.cohortAverages);
        }
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
      // Fallback to mock data on error
      const serverDataset = mockRowsToCohortDataset(mockServers);
      const bartenderDataset = mockRowsToCohortDataset(mockBartenders);

      setServers(serverDataset.servers);
      setBartenders(bartenderDataset.servers);
      setCohortAverages(serverDataset.cohortAverages);
      setBartenderCohortAverages(bartenderDataset.cohortAverages);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Initial load and when date changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when window regains focus (e.g., after editing job title in another tab)
  useEffect(() => {
    function handleFocus() {
      console.log('[Dashboard] Window focused, refreshing data...');
      loadData();
    }

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Read file contents
      const text = await file.text();

      // Parse the CSV
      const parsedServers = parseToastCSV(text);

      if (parsedServers.length === 0) {
        setUploadError('No valid server data found in CSV. Please check the file format.');
        return;
      }

      // Save to Supabase
      await saveUpload(selectedDate, parsedServers);

      // Reload data to ensure archived employees are filtered out
      await loadData();

      setUploadSuccess(`Successfully imported ${parsedServers.length} servers from ${file.name}`);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err) {
      console.error('Error processing CSV:', err);
      const message = err instanceof Error ? err.message : 'Failed to process CSV file';
      setUploadError(message);
    }
  }, [selectedDate, loadData]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar onFileUpload={handleFileUpload} />
      <div className="flex-1">
        {(uploadError || uploadSuccess || isLoading) && (
          <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
            {uploadError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 shadow-lg">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700 shadow-lg">
                {uploadSuccess}
              </div>
            )}
            {isLoading && (
              <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-600 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                  Loading...
                </div>
              </div>
            )}
          </div>
        )}
        <Dashboard
          servers={servers}
          bartenders={bartenders}
          cohortAverages={cohortAverages}
          bartenderCohortAverages={bartenderCohortAverages}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          hasData={servers.length > 0 || bartenders.length > 0}
          onRefresh={loadData}
          isRefreshing={isLoading}
        />
      </div>
    </div>
  );
}
