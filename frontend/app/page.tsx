'use client';

import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import type { ServerData } from './components/Dashboard';

/* ─────────────────── Mock Data (used until Supabase is connected) ─────────────────── */

const mockServers: ServerData[] = [
  { name: 'Jessica M.', score: 94, salesHr: 312.5, tipsHr: 48.75, tipPct: 22.1, avgCheck: 68.4, guestsHr: 8.2 },
  { name: 'Carlos R.', score: 88, salesHr: 285.0, tipsHr: 42.3, tipPct: 20.6, avgCheck: 54.2, guestsHr: 9.1 },
  { name: 'Aisha T.', score: 82, salesHr: 260.0, tipsHr: 39.1, tipPct: 19.8, avgCheck: 49.5, guestsHr: 7.6 },
  { name: 'Derek L.', score: 76, salesHr: 230.0, tipsHr: 33.5, tipPct: 18.2, avgCheck: 44.8, guestsHr: 7.0 },
  { name: 'Maria S.', score: 71, salesHr: 205.0, tipsHr: 28.9, tipPct: 17.5, avgCheck: 41.0, guestsHr: 6.4 },
  { name: 'Tom K.', score: 63, salesHr: 178.0, tipsHr: 24.1, tipPct: 15.9, avgCheck: 38.2, guestsHr: 5.8 },
];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ─────────────────── Page ─────────────────── */

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [servers] = useState<ServerData[]>(mockServers);

  const handleFileUpload = useCallback((file: File) => {
    console.log('CSV uploaded:', file.name);
    // TODO: parse CSV with PapaParse, save to Supabase via saveUpload(),
    // then refresh the dashboard data for the selected date.
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar onFileUpload={handleFileUpload} />
      <Dashboard
        servers={servers}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        hasData={servers.length > 0}
      />
    </div>
  );
}
