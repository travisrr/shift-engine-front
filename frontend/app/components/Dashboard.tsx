'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronDownIcon,
  ChevronUp,
  DollarSign,
  Info,
  RefreshCw,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { getActiveLocations, type Location } from '@/lib/settings-helpers';

/* ─────────────────── Types ─────────────────── */

export interface ServerData {
  name: string;
  score: number;
  salesHr: number;
  tipsHr: number;
  tipPct: number;
  avgCheck: number;
  guestsHr: number;
  ppa: number;
}

interface DashboardProps {
  servers: ServerData[];
  bartenders?: ServerData[];
  cohortAverages: ServerData;
  bartenderCohortAverages?: ServerData;
  selectedDate: string;
  onDateChange: (date: string) => void;
  hasData: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type SortKey = 'score' | 'salesHr' | 'tipsHr' | 'tipPct' | 'ppa' | 'guestsHr';
type SortDirection = 'asc' | 'desc';
type MetricFormat = 'currency' | 'percentage' | 'number';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface TooltipHeaderProps {
  label: string;
  tooltip: string;
  align?: 'left' | 'right';
}

interface SortableHeaderProps {
  label: string;
  tooltip: string;
  sortKey: SortKey;
  currentSort: SortConfig;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}

interface DeltaMetricCellProps {
  value: number;
  average: number;
  format: MetricFormat;
}

interface ScorecardTableProps {
  title: string;
  entityLabel: string;
  rows: ServerData[];
  cohortAverages: ServerData;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  collapsed: boolean;
  onToggle: () => void;
}

/* ─────────────────── Helpers ─────────────────── */

function scoreColor(score: number) {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700';
  if (score >= 80) return 'bg-emerald-50/70 text-emerald-600';
  if (score >= 70) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-600';
}

function scoreBorder(score: number) {
  if (score >= 90) return 'border-emerald-200';
  if (score >= 80) return 'border-emerald-100';
  if (score >= 70) return 'border-amber-200';
  return 'border-red-200';
}

function formatMetricValue(value: number, format: MetricFormat): string {
  if (format === 'currency') return `$${value.toFixed(2)}`;
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

function getDeltaDisplay(value: number, average: number, format: MetricFormat) {
  const delta = value - average;
  const absoluteDelta = Math.abs(delta);
  const epsilon = format === 'percentage' ? 0.05 : 0.01;

  if (absoluteDelta < epsilon) {
    return {
      label: 'Avg',
      className: 'text-gray-400',
    };
  }

  const prefix = delta > 0 ? '+' : '-';
  const formattedDelta =
    format === 'currency'
      ? `$${absoluteDelta.toFixed(2)}`
      : format === 'percentage'
        ? `${absoluteDelta.toFixed(1)}%`
        : absoluteDelta.toFixed(1);

  return {
    label: `${prefix} ${formattedDelta}`,
    className: delta > 0 ? 'text-emerald-600' : 'text-red-500',
  };
}

/* ─────────────────── Shared UI ─────────────────── */

function TooltipHeader({ label, tooltip, align = 'left' }: TooltipHeaderProps) {
  return (
    <div className={`group relative inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
      <span>{label}</span>
      <Info
        className="h-3 w-3 cursor-help text-gray-300 transition-colors group-hover:text-gray-400"
        strokeWidth={1.5}
      />
      <div
        className={`pointer-events-none absolute top-full z-50 mt-2 w-48 rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${align === 'right' ? 'right-0' : 'left-0'}`}
      >
        {tooltip}
        <div
          className={`absolute bottom-full ${align === 'right' ? 'right-3' : 'left-3'} -mb-1 border-4 border-transparent border-b-gray-900`}
        />
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  tooltip,
  sortKey,
  currentSort,
  onSort,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey;

  return (
    <div className={`group flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
      <TooltipHeader label={label} tooltip={tooltip} align={align} />
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center transition-colors hover:text-gray-600"
      >
        <span className="inline-flex flex-col">
          <ChevronUp
            className={`-mb-0.5 h-3 w-3 ${isActive && currentSort.direction === 'asc' ? 'text-gray-600' : 'text-gray-300'}`}
            strokeWidth={1.5}
          />
          <ChevronDown
            className={`-mt-0.5 h-3 w-3 ${isActive && currentSort.direction === 'desc' ? 'text-gray-600' : 'text-gray-300'}`}
            strokeWidth={1.5}
          />
        </span>
      </button>
    </div>
  );
}

function DeltaMetricCell({ value, average, format }: DeltaMetricCellProps) {
  const delta = getDeltaDisplay(value, average, format);

  return (
    <div className="flex flex-col items-end gap-1 leading-none">
      <span className="tabular-nums text-gray-700">{formatMetricValue(value, format)}</span>
      <span className={`text-[10px] font-medium leading-none ${delta.className}`}>
        {delta.label}
      </span>
    </div>
  );
}

function ScorecardTable({
  title,
  entityLabel,
  rows,
  cohortAverages,
  sortConfig,
  onSort,
  collapsed,
  onToggle,
}: ScorecardTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-b border-gray-200 px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
      >
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-[12px] text-gray-400">
            {collapsed ? `${rows.length} ${entityLabel.toLowerCase()}s hidden` : 'Ranked by cohort-relative performance score'}
          </p>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-md">
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
            strokeWidth={2}
          />
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px] lg:min-w-0">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-[20%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  {entityLabel}
                </th>
                <th className="w-[12%] overflow-visible whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  <SortableHeader
                    label="Final Score"
                    tooltip="Cohort-relative score (40-100). A cohort-average result starts at 75, then PPA and Tip % contribute 40% each, with Sales/hr contributing 20%."
                    sortKey="score"
                    currentSort={sortConfig}
                    onSort={onSort}
                  />
                </th>
                <th className="w-[14%] overflow-visible whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  <SortableHeader
                    label="Sales/hr"
                    tooltip="Net sales per hour worked. Delta shows the absolute difference from the cohort average."
                    sortKey="salesHr"
                    currentSort={sortConfig}
                    onSort={onSort}
                    align="right"
                  />
                </th>
                <th className="w-[12%] overflow-visible whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  <SortableHeader
                    label="Tips/hr"
                    tooltip="Tips earned per hour worked."
                    sortKey="tipsHr"
                    currentSort={sortConfig}
                    onSort={onSort}
                    align="right"
                  />
                </th>
                <th className="w-[12%] overflow-visible whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  <SortableHeader
                    label="Tip %"
                    tooltip="Tips as a percentage of sales. Delta shows the gap versus the cohort average."
                    sortKey="tipPct"
                    currentSort={sortConfig}
                    onSort={onSort}
                    align="right"
                  />
                </th>
                <th className="w-[14%] overflow-visible whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  <SortableHeader
                    label="PPA"
                    tooltip="Per Person Average: Net Sales divided by Guests Served. Delta shows how far above or below cohort average the server is."
                    sortKey="ppa"
                    currentSort={sortConfig}
                    onSort={onSort}
                    align="right"
                  />
                </th>
                <th className="w-[12%] overflow-visible whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:px-5">
                  <SortableHeader
                    label="Guests/hr"
                    tooltip="Guests served per hour worked."
                    sortKey="guestsHr"
                    currentSort={sortConfig}
                    onSort={onSort}
                    align="right"
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => (
                <tr key={row.name} className="transition-colors hover:bg-gray-50/80">
                  <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-900">{row.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold lg:px-2.5 ${scoreColor(row.score)} ${scoreBorder(row.score)}`}
                    >
                      {row.score}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right lg:px-5">
                    <DeltaMetricCell value={row.salesHr} average={cohortAverages.salesHr} format="currency" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700 lg:px-5">
                    ${row.tipsHr.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right lg:px-5">
                    <DeltaMetricCell value={row.tipPct} average={cohortAverages.tipPct} format="percentage" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right lg:px-5">
                    <DeltaMetricCell value={row.ppa} average={cohortAverages.ppa} format="currency" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700 lg:px-5">
                    {row.guestsHr.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Component ─────────────────── */

export default function Dashboard({
  servers,
  bartenders = [],
  cohortAverages,
  bartenderCohortAverages = cohortAverages,
  selectedDate,
  onDateChange,
  hasData,
  onRefresh,
  isRefreshing = false,
}: DashboardProps) {
  const [serverSort, setServerSort] = useState<SortConfig>({ key: 'score', direction: 'desc' });
  const [bartenderSort, setBartenderSort] = useState<SortConfig>({ key: 'score', direction: 'desc' });
  const [isServersCollapsed, setIsServersCollapsed] = useState(false);
  const [isBartendersCollapsed, setIsBartendersCollapsed] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isRestaurantDropdownOpen, setIsRestaurantDropdownOpen] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLocations() {
      setIsLoadingLocations(true);
      const activeLocations = await getActiveLocations();
      setLocations(activeLocations);

      if (activeLocations.length > 0 && !selectedLocation) {
        setSelectedLocation(activeLocations[0].id);
      }

      setIsLoadingLocations(false);
    }

    fetchLocations();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRestaurantDropdownOpen(false);
      }
    }

    if (isRestaurantDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isRestaurantDropdownOpen]);

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

  const sortedServers = useMemo(() => {
    return [...servers].sort((a, b) => {
      const aValue = a[serverSort.key];
      const bValue = b[serverSort.key];
      const multiplier = serverSort.direction === 'asc' ? 1 : -1;

      if (aValue === bValue) return a.name.localeCompare(b.name);
      return (aValue - bValue) * multiplier;
    });
  }, [servers, serverSort]);

  const sortedBartenders = useMemo(() => {
    return [...bartenders].sort((a, b) => {
      const aValue = a[bartenderSort.key];
      const bValue = b[bartenderSort.key];
      const multiplier = bartenderSort.direction === 'asc' ? 1 : -1;

      if (aValue === bValue) return a.name.localeCompare(b.name);
      return (aValue - bValue) * multiplier;
    });
  }, [bartenders, bartenderSort]);

  const topPerformer = servers.length > 0 ? servers[0] : null;
  const highestPpa =
    servers.length > 0
      ? servers.reduce((max, server) => (server.ppa > max.ppa ? server : max), servers[0])
      : null;

  const activeLocation = locations.find((location) => location.id === selectedLocation) ?? locations[0];

  return (
    <div className="min-h-screen bg-zinc-50 lg:ml-60">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">
                Performance Dashboard
              </h1>
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsRestaurantDropdownOpen(!isRestaurantDropdownOpen)}
                  disabled={isLoadingLocations || locations.length === 0}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Building2 className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                  <span>{isLoadingLocations ? 'Loading...' : activeLocation?.name ?? 'No locations'}</span>
                  {locations.length > 0 && (
                    <ChevronDownIcon
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        isRestaurantDropdownOpen ? 'rotate-180' : ''
                      }`}
                      strokeWidth={2}
                    />
                  )}
                </button>
                {isRestaurantDropdownOpen && locations.length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {locations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => {
                          setSelectedLocation(location.id);
                          setIsRestaurantDropdownOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 text-left text-[13px] transition-colors hover:bg-gray-50 ${
                          selectedLocation === location.id ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        <span className="flex-1">{location.name}</span>
                        {selectedLocation === location.id && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-500">
              Upload Toast data to generate server scorecards and surface actionable insights.
            </p>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
                className="w-full border-none bg-transparent text-[13px] font-medium text-gray-700 outline-none lg:w-auto"
                id="date-picker"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {!hasData && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <CalendarDays className="h-5 w-5 text-gray-400" strokeWidth={1.75} />
            </div>
            <p className="text-[14px] font-medium text-gray-700">No data for this date</p>
            <p className="mt-1 text-[12px] text-gray-400">
              Upload a Toast Server Summary CSV using the sidebar to get started.
            </p>
          </div>
        )}

        {hasData && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Top Performer
                  </span>
                  <Trophy className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-gray-900">{topPerformer?.name ?? '—'}</p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Score: {topPerformer?.score ?? '—'}</span>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Highest PPA
                  </span>
                  <DollarSign className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {highestPpa ? `$${highestPpa.ppa.toFixed(2)}` : '—'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>{highestPpa?.name ?? '—'}</span>
                </div>
              </div>

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

            <ScorecardTable
              title="Server Scorecard"
              entityLabel="Server"
              rows={sortedServers}
              cohortAverages={cohortAverages}
              sortConfig={serverSort}
              onSort={handleServerSort}
              collapsed={isServersCollapsed}
              onToggle={() => setIsServersCollapsed(!isServersCollapsed)}
            />

            {bartenders.length > 0 && (
              <div className="mt-8">
                <ScorecardTable
                  title="Bar Tender Scorecard"
                  entityLabel="Bar Tender"
                  rows={sortedBartenders}
                  cohortAverages={bartenderCohortAverages}
                  sortConfig={bartenderSort}
                  onSort={handleBartenderSort}
                  collapsed={isBartendersCollapsed}
                  onToggle={() => setIsBartendersCollapsed(!isBartendersCollapsed)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
