'use client';

import { AlertCircle, CheckCircle2, Loader2, UploadCloud, XCircle } from 'lucide-react';

export interface ImportPreviewRow {
  row_index: number;
  section_label: string | null;
  source_day: string | null;
  shift_date: string | null;
  employee_name: string | null;
  sales_hr: number | null;
  tips_hr: number | null;
  tip_pct: number | null;
  avg_check: number | null;
  guests_hr: number | null;
  ppa: number | null;
  warnings: string[];
  rejection_reason: string | null;
  accepted: boolean;
  raw_values: string[];
}

export interface ImportPreviewData {
  previewId: string;
  fileName: string;
  locationName: string;
  acceptedCount: number;
  rejectedCount: number;
  detectedColumns: string[];
  metricsDetected: string[];
  fileWarnings: string[];
  sectionLabels: string[];
  dateCounts: Array<{ date: string; row_count: number }>;
  acceptedRowsSample: ImportPreviewRow[];
  rejectedRowsSample: ImportPreviewRow[];
}

interface ImportPreviewModalProps {
  preview: ImportPreviewData | null;
  isConfirming: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function formatMetric(value: number | null, type: 'currency' | 'percentage' | 'number'): string {
  if (value === null) return '—';
  if (type === 'currency') return `$${value.toFixed(2)}`;
  if (type === 'percentage') return `${value.toFixed(1)}%`;
  return value.toFixed(2);
}

export default function ImportPreviewModal({
  preview,
  isConfirming,
  onConfirm,
  onClose,
}: ImportPreviewModalProps) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import Preview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review what Shift Engine extracted from ` {preview.fileName} ` for `{preview.locationName}` before importing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            disabled={isConfirming}
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Accepted Rows</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-800">{preview.acceptedCount}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Rejected Rows</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-amber-800">{preview.rejectedCount}</p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <UploadCloud className="h-4 w-4" />
                <span className="text-sm font-medium">Upload Dates</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-indigo-800">{preview.dateCounts.length}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-5">
              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Import Summary</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.metricsDetected.map((metric) => (
                    <span key={metric} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {metric}
                    </span>
                  ))}
                  {preview.metricsDetected.length === 0 && (
                    <span className="text-sm text-gray-500">No metrics detected.</span>
                  )}
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {preview.dateCounts.map((item) => (
                    <div key={item.date} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span className="font-medium">{item.date}</span> • {item.row_count} rows
                    </div>
                  ))}
                </div>
                {preview.sectionLabels.length > 0 && (
                  <p className="mt-4 text-sm text-gray-500">
                    Sections detected: {preview.sectionLabels.join(', ')}
                  </p>
                )}
              </section>

              {preview.fileWarnings.length > 0 && (
                <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <h3 className="text-sm font-semibold text-amber-900">File Warnings</h3>
                  <ul className="mt-3 space-y-2 text-sm text-amber-800">
                    {preview.fileWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Accepted Row Sample</h3>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-xs text-gray-700">
                    <thead>
                      <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-400">
                        <th className="px-2 py-2">Employee</th>
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Sales/hr</th>
                        <th className="px-2 py-2">Tips/hr</th>
                        <th className="px-2 py-2">Tip %</th>
                        <th className="px-2 py-2">Guests/hr</th>
                        <th className="px-2 py-2">PPA</th>
                        <th className="px-2 py-2">Warnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.acceptedRowsSample.map((row) => (
                        <tr key={`${row.row_index}-${row.employee_name || 'accepted'}`} className="border-b border-gray-100 align-top">
                          <td className="px-2 py-2 font-medium text-gray-900">{row.employee_name || '—'}</td>
                          <td className="px-2 py-2">{row.shift_date || '—'}</td>
                          <td className="px-2 py-2">{formatMetric(row.sales_hr, 'currency')}</td>
                          <td className="px-2 py-2">{formatMetric(row.tips_hr, 'currency')}</td>
                          <td className="px-2 py-2">{formatMetric(row.tip_pct, 'percentage')}</td>
                          <td className="px-2 py-2">{formatMetric(row.guests_hr, 'number')}</td>
                          <td className="px-2 py-2">{formatMetric(row.ppa, 'currency')}</td>
                          <td className="px-2 py-2 text-gray-500">{row.warnings.join(' • ') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-900">Rejected Row Sample</h3>
              </div>
              <div className="mt-3 space-y-3">
                {preview.rejectedRowsSample.length === 0 ? (
                  <p className="text-sm text-gray-500">No rejected rows in the preview.</p>
                ) : (
                  preview.rejectedRowsSample.map((row) => (
                    <div key={`${row.row_index}-${row.employee_name || 'rejected'}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          {row.employee_name || row.section_label || `Row ${row.row_index + 1}`}
                        </p>
                        <span className="text-xs text-amber-700">{row.rejection_reason || 'Rejected'}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {row.raw_values.filter(Boolean).join(' | ') || 'No raw values captured.'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500">
            Confirming import will create or replace uploads for the detected dates at `{preview.locationName}`.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isConfirming || preview.acceptedCount === 0}
              className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
              Import Accepted Rows
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
