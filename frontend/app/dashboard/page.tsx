'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import ImportPreviewModal, { type ImportPreviewData } from '../components/ImportPreviewModal';
import type { ServerData } from '../components/Dashboard';
import { getUploadByDateWithJobTitles, type ServerScore } from '../../lib/supabase-helpers';

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

/* ─────────────────── Page ─────────────────── */

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [servers, setServers] = useState<ServerData[]>([]);
  const [bartenders, setBartenders] = useState<ServerData[]>([]);
  const [cohortAverages, setCohortAverages] = useState<ServerData>(EMPTY_COHORT_AVERAGES);
  const [bartenderCohortAverages, setBartenderCohortAverages] = useState<ServerData>(EMPTY_COHORT_AVERAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportConfirming, setIsImportConfirming] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);

  const clearDatasets = useCallback(() => {
    setServers([]);
    setBartenders([]);
    setCohortAverages(EMPTY_COHORT_AVERAGES);
    setBartenderCohortAverages(EMPTY_COHORT_AVERAGES);
  }, []);

  // Load data from Supabase when date changes (fallback to mock data)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedLocation) {
      clearDatasets();
      setIsLoading(false);
      return;
    }

    try {
      console.log('[Dashboard] Loading data for date:', selectedDate, 'location:', selectedLocation);
      const result = await getUploadByDateWithJobTitles(selectedDate, selectedLocation);
      
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
        console.log('[Dashboard] No data found for selected date/location');
        clearDatasets();
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
  }, [clearDatasets, selectedDate, selectedLocation]);

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
    setImportPreview(null);

    if (!selectedLocation) {
      setUploadError('Select a location before uploading Toast data.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('locationId', selectedLocation);
      formData.append('fallbackDate', selectedDate);

      const response = await fetch('/api/uploads/csv/preview', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to process CSV upload');
      }

      setImportPreview(result as ImportPreviewData);
    } catch (err) {
      console.error('Error processing CSV:', err);
      const message = err instanceof Error ? err.message : 'Failed to process CSV file';
      setUploadError(message);
    }
  }, [selectedDate, selectedLocation]);

  const handleConfirmImport = useCallback(async () => {
    if (!importPreview) return;

    try {
      setIsImportConfirming(true);
      setUploadError(null);
      setUploadSuccess(null);

      const response = await fetch('/api/uploads/csv/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: importPreview.previewId }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to finalize CSV import');
      }

      const importedDates = Array.isArray(result?.importedDates) ? result.importedDates as Array<{ date: string; row_count: number }> : [];
      const nextSelectedDate = importedDates.length > 0 && !importedDates.some((row) => row.date === selectedDate)
        ? importedDates[0].date
        : selectedDate;

      if (nextSelectedDate !== selectedDate) {
        setSelectedDate(nextSelectedDate);
      }

      setImportPreview(null);
      if (nextSelectedDate === selectedDate) {
        await loadData();
      }

      const importedCount = typeof result?.importedCount === 'number' ? result.importedCount : 0;
      const locationName = typeof result?.locationName === 'string' ? result.locationName : 'selected location';
      setUploadSuccess(`Imported ${importedCount} accepted rows into ${locationName}.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err) {
      console.error('Error finalizing CSV import:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to finalize CSV import');
    } finally {
      setIsImportConfirming(false);
    }
  }, [importPreview, loadData, selectedDate]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar onFileUpload={handleFileUpload} />
      <div className="flex-1">
        <ImportPreviewModal
          preview={importPreview}
          isConfirming={isImportConfirming}
          onConfirm={handleConfirmImport}
          onClose={() => setImportPreview(null)}
        />
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
          selectedLocation={selectedLocation}
          onDateChange={setSelectedDate}
          onLocationChange={setSelectedLocation}
          hasData={servers.length > 0 || bartenders.length > 0}
          onRefresh={loadData}
          isRefreshing={isLoading}
        />
      </div>
    </div>
  );
}
