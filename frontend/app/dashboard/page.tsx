'use client';

import { useState, useCallback, useEffect } from 'react';
// @ts-ignore - papaparse types are installed but not being picked up in build
import Papa from 'papaparse';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import type { ServerData } from '../components/Dashboard';
import { getUploadByDate, getUploadByDateWithJobTitles, saveUpload, type ServerScore } from '../../lib/supabase-helpers';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ─────────────────── Mock Data (shown when no CSV uploaded) ─────────────────── */

const mockServers: ServerData[] = [
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

const mockBartenders: ServerData[] = [
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

function parseToastCSV(csvText: string): ServerScore[] {
  const parseResult = Papa.parse<ToastCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.error('CSV parse errors:', parseResult.errors);
  }

  const servers: ServerScore[] = [];

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

    // Calculate composite score (0-100 scale based on multiple factors)
    // Higher sales/hr, tips/hr, and tip% = higher score
    let score = 50; // Base score

    if (salesHr) {
      // Sales per hour contributes up to 30 points
      score += Math.min(30, (salesHr / 300) * 30);
    }
    if (tipsHr) {
      // Tips per hour contributes up to 30 points
      score += Math.min(30, (tipsHr / 50) * 30);
    }
    if (tipPct) {
      // Tip percentage contributes up to 20 points
      score += Math.min(20, (tipPct / 25) * 20);
    }
    if (avgCheck) {
      // Average check contributes up to 20 points
      score += Math.min(20, (avgCheck / 70) * 20);
    }

    servers.push({
      server_name: name.trim(),
      score: Math.round(score),
      sales_hr: salesHr ? Math.round(salesHr * 100) / 100 : null,
      tips_hr: tipsHr ? Math.round(tipsHr * 100) / 100 : null,
      tip_pct: tipPct ? Math.round(tipPct * 10) / 10 : null,
      avg_check: avgCheck ? Math.round(avgCheck * 100) / 100 : null,
      guests_hr: guestsHr ? Math.round(guestsHr * 10) / 10 : null,
    });
  }

  // Sort by score descending
  return servers.sort((a, b) => b.score - a.score);
}

function serverScoreToServerData(scores: ServerScore[]): ServerData[] {
  return scores.map((s) => ({
    name: s.server_name,
    score: s.score,
    salesHr: s.sales_hr ?? 0,
    tipsHr: s.tips_hr ?? 0,
    tipPct: s.tip_pct ?? 0,
    avgCheck: s.avg_check ?? 0,
    guestsHr: s.guests_hr ?? 0,
  }));
}

/* ─────────────────── Page ─────────────────── */

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [servers, setServers] = useState<ServerData[]>([]);
  const [bartenders, setBartenders] = useState<ServerData[]>([]);
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
        
        setServers(serverScoreToServerData(serverScores));
        setBartenders(serverScoreToServerData(bartenderScores));
        } else {
          console.log('[Dashboard] No data found, using mock data');
          // Fallback to mock data when no CSV has been uploaded
          setServers(mockServers);
          setBartenders(mockBartenders);
        }
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
      // Fallback to mock data on error
      setServers(mockServers);
      setBartenders(mockBartenders);
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
  }, [selectedDate]);

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
