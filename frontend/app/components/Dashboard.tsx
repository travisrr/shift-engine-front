'use client';

import { useState, useMemo } from 'react';
import {
  Trophy,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CalendarDays,
  Info,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

/* ─────────────────── Tooltip Header Component ─────────────────── */

interface TooltipHeaderProps {
  label: string;
  tooltip: string;
  align?: 'left' | 'right';
}

function TooltipHeader({ label, tooltip, align = 'left' }: TooltipHeaderProps) {
  return (
    <div className={`group relative inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
      <span>{label}</span>
      <Info
        className="h-3 w-3 cursor-help text-slate-300 transition-colors group-hover:text-slate-400"
        strokeWidth={1.5}
      />
      {/* Tooltip */}
      <div className={`pointer-events-none absolute bottom-full mb-2 w-48 rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${align === 'right' ? 'right-0' : 'left-0'} z-50`}>
        {tooltip}
        {/* Arrow */}
        <div className={`absolute top-full ${align === 'right' ? 'right-3' : 'left-3'} -mt-1 border-4 border-transparent border-t-slate-800`} />
      </div>
    </div>
  );
}

/* ─────────────────── Sortable Header Component ─────────────────── */

interface SortableHeaderProps {
  label: string;
  tooltip: string;
  sortKey: SortKey;
  currentSort: SortConfig;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}

function SortableHeader({ label, tooltip, sortKey, currentSort, onSort, align = 'left' }: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`group flex items-center gap-1.5 transition-colors hover:text-slate-600 ${align === 'right' ? 'ml-auto' : ''}`}
    >
      <TooltipHeader label={label} tooltip={tooltip} align={align} />
      <span className="inline-flex flex-col">
        <ChevronUp
          className={`h-3 w-3 -mb-0.5 ${isActive && currentSort.direction === 'asc' ? 'text-slate-600' : 'text-slate-300'}`}
          strokeWidth={1.5}
        />
        <ChevronDown
          className={`h-3 w-3 -mt-0.5 ${isActive && currentSort.direction === 'desc' ? 'text-slate-600' : 'text-slate-300'}`}
          strokeWidth={1.5}
        />
      </span>
    </button>
  );
}

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
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type SortKey = 'score' | 'salesHr' | 'tipsHr' | 'tipPct' | 'avgCheck' | 'guestsHr';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
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
  onRefresh,
  isRefreshing = false,
}: DashboardProps) {
  // Sort state for servers table
  const [serverSort, setServerSort] = useState<SortConfig>({ key: 'score', direction: 'desc' });
  // Sort state for bartenders table
  const [bartenderSort, setBartenderSort] = useState<SortConfig>({ key: 'score', direction: 'desc' });

  // Handle sort toggle
  const handleServerSort = (key: SortKey) => {
    setServerSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleBartenderSort = (key: SortKey) => {
    setBartenderSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Sort data based on current sort config
  const sortedServers = useMemo(() => {
    return [...servers].sort((a, b) => {
      const aValue = a[serverSort.key];
      const bValue = b[serverSort.key];
      const multiplier = serverSort.direction === 'asc' ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });
  }, [servers, serverSort]);

  const sortedBartenders = useMemo(() => {
    return [...bartenders].sort((a, b) => {
      const aValue = a[bartenderSort.key];
      const bValue = b[bartenderSort.key];
      const multiplier = bartenderSort.direction === 'asc' ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });
  }, [bartenders, bartenderSort]);

  // Calculate stats based on original score-sorted data
  const topPerformer = servers.length > 0 ? servers[0] : null;
  const highestAvgCheck =
    servers.length > 0
      ? servers.reduce((max, s) => (s.avgCheck > max.avgCheck ? s : max), servers[0])
      : null;

  const topBartender = bartenders.length > 0 ? bartenders[0] : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] lg:ml-60">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {/* ── Header with Date Picker ── */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
              Performance Dashboard
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Upload Toast data to generate server scorecards and surface
              actionable insights.
            </p>
          </div>

          {/* Date Picker and Refresh */}
          <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none lg:w-auto"
                id="date-picker"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Empty State ── */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
              <CalendarDays className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
            </div>
            <p className="text-[14px] font-medium text-slate-700">
              No data for this date
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              Upload a Toast Server Summary CSV using the sidebar to get started.
            </p>
          </div>
        )}

        {hasData && (
          <>
            {/* ── Top-Level Stats ── */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Top Performer */}
              <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Top Performer
                  </span>
                  <Trophy className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {topPerformer?.name ?? '—'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Score: {topPerformer?.score ?? '—'}</span>
                </div>
              </div>

              {/* Highest Avg Check */}
              <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Highest Avg Check
                  </span>
                  <DollarSign className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  ${highestAvgCheck?.avgCheck.toFixed(2) ?? '—'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+5.2% vs. avg</span>
                </div>
              </div>

              {/* Total Servers */}
              <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Servers Analyzed
                  </span>
                  <Users className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-slate-900">{servers.length}</p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-slate-400">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>Current upload</span>
                </div>
              </div>
            </div>

            {/* ── Server Scorecard Table ── */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-slate-900">
                  Server Scorecard
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  Ranked by composite performance score
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-[13px] lg:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="w-[20%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        Server
                      </th>
                      <th className="w-[12%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        <SortableHeader
                          label="Final Score"
                          tooltip="Composite performance score (0-100) based on sales/hr, tips/hr, tip percentage, and average check size"
                          sortKey="score"
                          currentSort={serverSort}
                          onSort={handleServerSort}
                        />
                      </th>
                      <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        <SortableHeader
                          label="Sales/hr"
                          tooltip="Total sales divided by hours worked. Higher values indicate better revenue generation efficiency."
                          sortKey="salesHr"
                          currentSort={serverSort}
                          onSort={handleServerSort}
                          align="right"
                        />
                      </th>
                      <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        <SortableHeader
                          label="Tips/hr"
                          tooltip="Total tips earned divided by hours worked. Reflects customer satisfaction and service quality."
                          sortKey="tipsHr"
                          currentSort={serverSort}
                          onSort={handleServerSort}
                          align="right"
                        />
                      </th>
                      <th className="w-[10%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        <SortableHeader
                          label="Tip %"
                          tooltip="Tips as a percentage of total sales. Indicates how generously customers tip relative to their bill."
                          sortKey="tipPct"
                          currentSort={serverSort}
                          onSort={handleServerSort}
                          align="right"
                        />
                      </th>
                      <th className="w-[14%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        <SortableHeader
                          label="Avg Check"
                          tooltip="Average check amount per guest. Higher values suggest effective upselling and menu knowledge."
                          sortKey="avgCheck"
                          currentSort={serverSort}
                          onSort={handleServerSort}
                          align="right"
                        />
                      </th>
                      <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                        <SortableHeader
                          label="Guests/hr"
                          tooltip="Number of guests served per hour. Measures speed of service and table turnover efficiency."
                          sortKey="guestsHr"
                          currentSort={serverSort}
                          onSort={handleServerSort}
                          align="right"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedServers.map((server, idx) => (
                      <tr
                        key={server.name}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        {/* Server name */}
                        <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                              {idx + 1}
                            </div>
                            <span className="font-medium text-slate-900">
                              {server.name}
                            </span>
                          </div>
                        </td>

                        {/* Score pill */}
                        <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold lg:px-2.5 ${scoreColor(server.score)} ${scoreBorder(server.score)}`}
                          >
                            {server.score}
                          </span>
                        </td>

                        {/* Numeric columns */}
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                          ${server.salesHr.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                          ${server.tipsHr.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                          {server.tipPct.toFixed(1)}%
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                          ${server.avgCheck.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
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
              <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-3.5">
                  <h2 className="text-[14px] font-semibold text-slate-900">
                    Bar Tender Scorecard
                  </h2>
                  <p className="mt-0.5 text-[12px] text-slate-400">
                    Ranked by composite performance score
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-[13px] lg:min-w-0">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="w-[20%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          Bar Tender
                        </th>
                        <th className="w-[12%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          <SortableHeader
                            label="Final Score"
                            tooltip="Composite performance score (0-100) based on sales/hr, tips/hr, tip percentage, and average check size"
                            sortKey="score"
                            currentSort={bartenderSort}
                            onSort={handleBartenderSort}
                          />
                        </th>
                        <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          <SortableHeader
                            label="Sales/hr"
                            tooltip="Total sales divided by hours worked. Higher values indicate better revenue generation efficiency."
                            sortKey="salesHr"
                            currentSort={bartenderSort}
                            onSort={handleBartenderSort}
                            align="right"
                          />
                        </th>
                        <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          <SortableHeader
                            label="Tips/hr"
                            tooltip="Total tips earned divided by hours worked. Reflects customer satisfaction and service quality."
                            sortKey="tipsHr"
                            currentSort={bartenderSort}
                            onSort={handleBartenderSort}
                            align="right"
                          />
                        </th>
                        <th className="w-[10%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          <SortableHeader
                            label="Tip %"
                            tooltip="Tips as a percentage of total sales. Indicates how generously customers tip relative to their bill."
                            sortKey="tipPct"
                            currentSort={bartenderSort}
                            onSort={handleBartenderSort}
                            align="right"
                          />
                        </th>
                        <th className="w-[14%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          <SortableHeader
                            label="Avg Check"
                            tooltip="Average check amount per guest. Higher values suggest effective upselling and menu knowledge."
                            sortKey="avgCheck"
                            currentSort={bartenderSort}
                            onSort={handleBartenderSort}
                            align="right"
                          />
                        </th>
                        <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:px-5">
                          <SortableHeader
                            label="Guests/hr"
                            tooltip="Number of guests served per hour. Measures speed of service and table turnover efficiency."
                            sortKey="guestsHr"
                            currentSort={bartenderSort}
                            onSort={handleBartenderSort}
                            align="right"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedBartenders.map((bartender, idx) => (
                        <tr
                          key={bartender.name}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          {/* Bar Tender name */}
                          <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                                {idx + 1}
                              </div>
                              <span className="font-medium text-slate-900">
                                {bartender.name}
                              </span>
                            </div>
                          </td>

                          {/* Score pill */}
                          <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold lg:px-2.5 ${scoreColor(bartender.score)} ${scoreBorder(bartender.score)}`}
                            >
                              {bartender.score}
                            </span>
                          </td>

                          {/* Numeric columns */}
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                            ${bartender.salesHr.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                            ${bartender.tipsHr.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                            {bartender.tipPct.toFixed(1)}%
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
                            ${bartender.avgCheck.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600 lg:px-5">
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
