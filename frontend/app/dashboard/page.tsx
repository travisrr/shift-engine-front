'use client';

import { useState, useCallback, useEffect } from 'react';
// @ts-ignore - papaparse types are installed but not being picked up in build
import Papa from 'papaparse';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import type { ServerData } from '../components/Dashboard';
import { getUploadByDate, saveUpload, type ServerScore } from '../../lib/supabase-helpers';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ─────────────────── Mock Data (shown when no CSV uploaded) ─────────────────── */

const mockServers: ServerData[] = [
  { name: 'Jessica M.', score: 94, salesHr: 312.5, tipsHr: 48.75, tipPct: 22.1, avgCheck: 68.4, guestsHr: 8.2 },
  { name: 'Carlos R.', score: 88, salesHr: 285.0, tipsHr: 42.3, tipPct: 20.6, avgCheck: 54.2, guestsHr: 9.1 },
  { name: 'Aisha T.', score: 82, salesHr: 260.0, tipsHr: 39.1, tipPct: 19.8, avgCheck: 49.5, guestsHr: 7.6 },
  { name: 'Derek L.', score: 76, salesHr: 230.0, tipsHr: 33.5, tipPct: 18.2, avgCheck: 44.8, guestsHr: 7.0 },
  { name: 'Maria S.', score: 71, salesHr: 205.0, tipsHr: 28.9, tipPct: 17.5, avgCheck: 41.0, guestsHr: 6.4 },
  { name: 'Tom K.', score: 63, salesHr: 178.0, tipsHr: 24.1, tipPct: 15.9, avgCheck: 38.2, guestsHr: 5.8 },
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
    const guests = normalizeNumber(getColumnValue(row, ['Guests', 'Total Guests', 'Guest Count']));
    const checks = normalizeNumber(getColumnValue(row, ['Checks', 'Total Checks', 'Check Count']));
    const tipPct = normalizeNumber(getColumnValue(row, ['Tip Percentage', 'Tip %', 'Tip Percent']));

    // Skip rows with no meaningful data
    if (!netSales && !tips && !hours) continue;

    // Calculate derived metrics
    const salesHr = hours && hours > 0 && netSales ? netSales / hours : null;
    const tipsHr = hours && hours > 0 && tips ? tips / hours : null;
    const avgCheck = checks && checks > 0 && netSales ? netSales / checks : null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Load data from Supabase when date changes (fallback to mock data)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setUploadError(null);
      setUploadSuccess(null);

      try {
        const result = await getUploadByDate(selectedDate);
        if (result && result.scores && result.scores.length > 0) {
          setServers(serverScoreToServerData(result.scores));
        } else {
          // Fallback to mock data when no CSV has been uploaded
          setServers(mockServers);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        // Fallback to mock data on error
        setServers(mockServers);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedDate]);

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

      // Update the UI
      setServers(serverScoreToServerData(parsedServers));
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
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          hasData={servers.length > 0}
        />
      </div>
    </div>
  );
}
