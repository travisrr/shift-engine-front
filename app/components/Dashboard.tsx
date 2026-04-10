'use client';

import {
  Trophy,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

/* ─────────────────── Types ─────────────────── */

export interface ServerData {
  name: string;
  score: number;
  salesHr: number;
  tipsHr: number;
  tipPct: number;
  avgCheck: number;
  guestsHr: number;
}

interface DashboardProps {
  servers: ServerData[];
  bartenders?: ServerData[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  hasData: boolean;
}

/* ─────────────────── Helpers ─────────────────── */

function scoreColor(score: number) {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700';
  if (score >= 80) return 'bg-emerald-50/60 text-emerald-600';
  if (score >= 70) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-600';
}

function scoreBorder(score: number) {
  if (score >= 90) return 'border-emerald-200';
  if (score >= 80) return 'border-emerald-100';
  if (score >= 70) return 'border-amber-200';
  return 'border-red-200';
}

/* ─────────────────── Component ─────────────────── */

export default function Dashboard({
  servers,
  bartenders = [],
  selectedDate,
  onDateChange,
  hasData,
}: DashboardProps) {
  const topPerformer = servers.length > 0 ? servers[0] : null;
  const highestAvgCheck =
    servers.length > 0
      ? servers.reduce((max, s) => (s.avgCheck > max.avgCheck ? s : max), servers[0])
      : null;
  
  const topBartender = bartenders.length > 0 ? bartenders[0] : null;

  return (
    <div className="ml-60 min-h-screen bg-gray-50/60">
      <div className="mx-auto max-w-[1120px] px-8 py-8">
        {/* ── Header with Date Picker ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">
              Performance Dashboard
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              Upload Toast data to generate server scorecards and surface
              actionable insights.
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <CalendarDays className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border-none bg-transparent text-[13px] font-medium text-gray-700 outline-none"
              id="date-picker"
            />
          </div>
        </div>

        {/* ── Empty State ── */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <CalendarDays className="h-5 w-5 text-gray-400" strokeWidth={1.75} />
            </div>
            <p className="text-[14px] font-medium text-gray-700">
              No data for this date
            </p>
            <p className="mt-1 text-[12px] text-gray-400">
              Upload a Toast Server Summary CSV using the sidebar to get started.
            </p>
          </div>
        )}

        {hasData && (
          <>
            {/* ── Top-Level Stats ── */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Top Performer */}
              <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Top Performer
                  </span>
                  <Trophy className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {topPerformer?.name ?? '—'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Score: {topPerformer?.score ?? '—'}</span>
                </div>
              </div>

              {/* Highest Avg Check */}
              <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Highest Avg Check
                  </span>
                  <DollarSign className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  ${highestAvgCheck?.avgCheck.toFixed(2) ?? '—'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+5.2% vs. avg</span>
                </div>
              </div>

              {/* Total Servers */}
              <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Servers Analyzed
                  </span>
                  <Users className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-gray-900">{servers.length}</p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-gray-400">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>Current upload</span>
                </div>
              </div>
            </div>

            {/* ── Server Scorecard Table ── */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-gray-900">
                  Server Scorecard
                </h2>
                <p className="mt-0.5 text-[12px] text-gray-400">
                  Ranked by composite performance score
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Server
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Final Score
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Sales/hr
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Tips/hr
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Tip %
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Avg Check
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Guests/hr
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {servers.map((server, idx) => (
                      <tr
                        key={server.name}
                        className="transition-colors hover:bg-gray-50/80"
                      >
                        {/* Server name */}
                        <td className="whitespace-nowrap px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                              {idx + 1}
                            </div>
                            <span className="font-medium text-gray-900">
                              {server.name}
                            </span>
                          </div>
                        </td>

                        {/* Score pill */}
                        <td className="whitespace-nowrap px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[12px] font-semibold ${scoreColor(server.score)} ${scoreBorder(server.score)}`}
                          >
                            {server.score}
                          </span>
                        </td>

                        {/* Numeric columns */}
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                          ${server.salesHr.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                          ${server.tipsHr.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                          {server.tipPct.toFixed(1)}%
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                          ${server.avgCheck.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                          {server.guestsHr.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bar Tender Scorecard Table ── */}
            {bartenders.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-3.5">
                  <h2 className="text-[14px] font-semibold text-gray-900">
                    Bar Tender Scorecard
                  </h2>
                  <p className="mt-0.5 text-[12px] text-gray-400">
                    Ranked by composite performance score
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Bar Tender
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Final Score
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Sales/hr
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Tips/hr
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Tip %
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Avg Check
                        </th>
                        <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Guests/hr
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bartenders.map((bartender, idx) => (
                        <tr
                          key={bartender.name}
                          className="transition-colors hover:bg-gray-50/80"
                        >
                          {/* Bar Tender name */}
                          <td className="whitespace-nowrap px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                                {idx + 1}
                              </div>
                              <span className="font-medium text-gray-900">
                                {bartender.name}
                              </span>
                            </div>
                          </td>

                          {/* Score pill */}
                          <td className="whitespace-nowrap px-5 py-3">
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[12px] font-semibold ${scoreColor(bartender.score)} ${scoreBorder(bartender.score)}`}
                            >
                              {bartender.score}
                            </span>
                          </td>

                          {/* Numeric columns */}
                          <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                            ${bartender.salesHr.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                            ${bartender.tipsHr.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                            {bartender.tipPct.toFixed(1)}%
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                            ${bartender.avgCheck.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                            {bartender.guestsHr.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
