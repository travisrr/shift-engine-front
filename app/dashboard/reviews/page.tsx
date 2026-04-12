'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Wand2, Copy, Check, Calendar, X, Settings, Sparkles, AlertCircle, Key, ExternalLink } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';
import { getAISettings, getAIProviderSelectionStatus, type AISettings, type AIProviderKeyPublic } from '@/lib/settings-helpers';

// Lazy Supabase client to avoid build-time errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any = null;
let supabaseError: string | null = null;
async function getSupabase() {
  if (!supabaseClient) {
    const { supabase, getSupabaseError } = await import('@/lib/supabase');
    supabaseClient = supabase;
    supabaseError = getSupabaseError?.() || null;
  }
  return { client: supabaseClient, error: supabaseError };
}

/* ─────────────────── Types ─────────────────── */

interface WaitStaff {
  id: string;
  full_name: string;
  job_title: 'Server' | 'Bar Tender';
  status: 'Active' | 'Inactive';
}

/* ─────────────────── Config ─────────────────── */

export const dynamic = 'force-dynamic';

/* ─────────────────── Components ─────────────────── */

export default function AIReviewBuilderPage() {
  const [staff, setStaff] = useState<WaitStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<string>('last_30_days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [reviewTone, setReviewTone] = useState<string>('professional');
  const [generatedReview, setGeneratedReview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Settings from database
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [aiSettingsLoading, setAiSettingsLoading] = useState(true);

  // AI Provider Key status
  const [defaultProviderKey, setDefaultProviderKey] = useState<AIProviderKeyPublic | null>(null);
  const [providerKeyLoading, setProviderKeyLoading] = useState(true);
  const [providerFallbackWarning, setProviderFallbackWarning] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Fetch staff and AI settings on mount
  useEffect(() => {
    fetchStaff();
    fetchAISettings();
    fetchProviderKey();
  }, []);

  async function fetchAISettings() {
    try {
      setAiSettingsLoading(true);
      const settings = await getAISettings();
      setAiSettings(settings);
      // Default the tone dropdown to the settings value if available
      if (settings?.review_tone) {
        // Use the settings tone directly since dropdown values match database schema
        setReviewTone(settings.review_tone);
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
    } finally {
      setAiSettingsLoading(false);
    }
  }

  async function fetchProviderKey() {
    try {
      setProviderKeyLoading(true);
      const status = await getAIProviderSelectionStatus();
      setDefaultProviderKey(status.selectedKey);
      setProviderFallbackWarning(status.fallbackWarning);
    } catch (err) {
      console.error('Error fetching provider key:', err);
    } finally {
      setProviderKeyLoading(false);
    }
  }

  async function fetchStaff() {
    try {
      setLoading(true);
      const { client } = await getSupabase();
      if (!client) {
        setStaff([]);
        setLoading(false);
        return;
      }

      // Check if Supabase is actually configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        setStaff([]);
        setLoading(false);
        return;
      }

      const { data, error } = await client
        .from('wait_staff')
        .select('id, full_name, job_title, status')
        .eq('status', 'Active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReview() {
    if (!selectedEmployee) return;

    setIsGenerating(true);
    setGenerationError(null);

    const employee = staff.find((s) => s.id === selectedEmployee);
    if (!employee) {
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch('/api/ai/generate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          employeeName: employee.full_name,
          jobTitle: employee.job_title,
          timePeriod,
          customDateRange: isCustomDateRange && customStartDate && customEndDate
            ? { start: customStartDate, end: customEndDate }
            : undefined,
          tone: reviewTone,
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('API returned non-JSON response:', text.substring(0, 200));
        throw new Error(`API returned ${response.status}: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate review');
      }

      setGeneratedReview(data.review);

      // Refresh provider key to get updated usage count
      fetchProviderKey();
    } catch (err) {
      console.error('Error generating review:', err);
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopyReview() {
    if (!generatedReview) return;
    navigator.clipboard.writeText(generatedReview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />

      <main className="min-h-screen lg:ml-60">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          {/* ── Header ── */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-black">
                  AI Review Builder
                </h1>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                  Generate performance reviews for your team using AI-powered insights.
                </p>
              </div>
              <a
                href="/dashboard/settings?tab=ai-keys"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-zinc-50 hover:text-gray-800"
              >
                <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
                AI Settings
              </a>
            </div>

            {/* AI Provider Status */}
            {providerKeyLoading ? (
              <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"></div>
                Checking AI provider status...
              </div>
            ) : defaultProviderKey ? (
              defaultProviderKey.validation_status === 'valid' ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.75} />
                  <span className="text-[12px] text-gray-500">
                    Connected to {defaultProviderKey.provider_name} ({defaultProviderKey.key_last_four}) • {defaultProviderKey.monthly_usage_count} uses this month
                  </span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                  defaultProviderKey.validation_status === 'invalid' || defaultProviderKey.validation_status === 'expired'
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}>
                  <Sparkles className={`h-3.5 w-3.5 ${
                    defaultProviderKey.validation_status === 'invalid' || defaultProviderKey.validation_status === 'expired'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`} strokeWidth={1.75} />
                  <span className={`text-[12px] ${
                    defaultProviderKey.validation_status === 'invalid' || defaultProviderKey.validation_status === 'expired'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}>
                    {defaultProviderKey.validation_status === 'invalid'
                      ? `Your ${defaultProviderKey.provider_name} API key appears to be invalid`
                      : defaultProviderKey.validation_status === 'expired'
                        ? `Your ${defaultProviderKey.provider_name} API key has expired`
                        : `${defaultProviderKey.provider_name} key pending validation`
                    }
                  </span>
                </div>
              )
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5" strokeWidth={1.75} />
                <div>
                  <span className="text-[12px] text-amber-700">
                    No AI provider configured. Add your API key to generate real AI-powered reviews.
                  </span>
                  <a
                    href="/dashboard/settings?tab=ai-keys"
                    className="ml-2 inline-flex items-center gap-0.5 text-[12px] font-medium text-amber-800 hover:text-amber-900 hover:underline"
                  >
                    <Key className="h-3 w-3" />
                    Configure API Key
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                </div>
              </div>
            )}

            {/* AI Settings Status */}
            {aiSettingsLoading ? (
              <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"></div>
                Loading AI instructions...
              </div>
            ) : aiSettings ? (
              <div className="mt-2 flex items-center gap-2 text-[12px] text-gray-500">
                <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                <span>
                  Using custom AI instructions
                  {aiSettings.review_tone && (
                    <span className="text-gray-400"> • Tone: {aiSettings.review_tone}</span>
                  )}
                  {aiSettings.focus_areas && aiSettings.focus_areas.length > 0 && (
                    <span className="text-gray-400">
                      {' '}
                      • Focus: {aiSettings.focus_areas.length} area{aiSettings.focus_areas.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>
            ) : null}

            {providerFallbackWarning && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
                <div>
                  <p className="text-[12px] text-amber-800">{providerFallbackWarning}</p>
                  <a
                    href="/dashboard/settings?tab=ai-keys"
                    className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-amber-900 hover:underline"
                  >
                    <Key className="h-3 w-3" />
                    Review AI key settings
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── Main Content ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Input Panel ── */}
            <div className="space-y-6">
              {/* Employee Selection */}
              <div className="rounded-md border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-[15px] font-semibold text-black">
                  Select Employee
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="employee"
                      className="mb-1.5 block text-[12px] font-medium text-gray-700"
                    >
                      Employee
                    </label>
                    <select
                      id="employee"
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                    >
                      <option value="">
                        {loading ? 'Loading employees...' : 'Select an employee'}
                      </option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name} — {member.job_title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Review Options */}
              <div className="rounded-md border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-[15px] font-semibold text-black">
                  Review Options
                </h2>
                <div className="space-y-4">
                  {/* Time Period Selection */}
                  <div>
                    <label
                      htmlFor="time-period"
                      className="mb-1.5 block text-[12px] font-medium text-gray-700"
                    >
                      Time Period
                    </label>
                    {!isCustomDateRange ? (
                      <select
                        id="time-period"
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                      >
                        <option value="last_30_days">Last 30 Days</option>
                        <option value="last_quarter">Last Quarter</option>
                        <option value="last_6_months">Last 6 Months</option>
                        <option value="last_year">Last Year</option>
                      </select>
                    ) : (
                      <div className="flex items-center justify-between rounded-md border border-gray-200 bg-zinc-50 px-3 py-2 text-[13px] text-gray-600">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                          {customStartDate && customEndDate
                            ? `${new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Select dates below'}
                        </span>
                        <button
                          onClick={() => {
                            setIsCustomDateRange(false);
                            setCustomStartDate('');
                            setCustomEndDate('');
                          }}
                          className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Custom Date Range Section - Collapsible */}
                  {isCustomDateRange ? (
                    <div className="rounded-md border border-gray-200 bg-zinc-50/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[12px] font-medium text-gray-700">
                          Custom Date Range
                        </p>
                        <button
                          onClick={() => {
                            setIsCustomDateRange(false);
                            setCustomStartDate('');
                            setCustomEndDate('');
                          }}
                          className="text-[11px] text-gray-500 hover:text-gray-700"
                        >
                          Back to presets
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="start-date"
                            className="mb-1 block text-[11px] font-medium text-gray-600"
                          >
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="start-date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="end-date"
                            className="mb-1 block text-[11px] font-medium text-gray-600"
                          >
                            End Date
                          </label>
                          <input
                            type="date"
                            id="end-date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                          />
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-gray-400">
                        Perfect for restaurant-specific cycles (e.g., Wed-Tue weeks)
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCustomDateRange(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-zinc-50 hover:text-gray-800"
                    >
                      <Calendar className="h-4 w-4" strokeWidth={1.75} />
                      Or pick a custom date range
                    </button>
                  )}

                  <div>
                    <label
                      htmlFor="review-tone"
                      className="mb-1.5 block text-[12px] font-medium text-gray-700"
                    >
                      Review Tone
                      {aiSettings?.review_tone && (
                        <span className="ml-1 text-[11px] font-normal text-gray-400">
                          (default from settings)
                        </span>
                      )}
                    </label>
                    <select
                      id="review-tone"
                      value={reviewTone}
                      onChange={(e) => setReviewTone(e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="direct">Direct</option>
                      <option value="detailed">Detailed</option>
                    </select>
                    {aiSettings?.review_instructions && (
                      <p className="mt-1.5 text-[11px] text-gray-400">
                        AI instructions from settings will also be applied
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {generationError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-red-800">Generation failed</p>
                      <p className="text-[12px] text-red-700 mt-0.5">{generationError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateReview}
                disabled={
                  !selectedEmployee ||
                  isGenerating ||
                  !defaultProviderKey ||
                  defaultProviderKey.validation_status !== 'valid' ||
                  (isCustomDateRange && (!customStartDate || !customEndDate))
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Generating Review...
                  </>
                ) : !defaultProviderKey ? (
                  <>
                    <Key className="h-4 w-4" strokeWidth={2} />
                    Add API Key to Generate
                  </>
                ) : defaultProviderKey.validation_status !== 'valid' ? (
                  <>
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                    Fix API Key to Generate
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" strokeWidth={2} />
                    Generate Review
                  </>
                )}
              </button>
            </div>

            {/* ── Output Panel ── */}
            <div className="rounded-md border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="text-[15px] font-semibold text-black">
                  Generated Review
                </h2>
                {generatedReview && (
                  <button
                    onClick={handleCopyReview}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-zinc-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-5">
                {generatedReview ? (
                  <div className="prose prose-sm max-w-none">
                    <textarea
                      readOnly
                      value={generatedReview}
                      className="h-[400px] w-full resize-none rounded-md border border-gray-200 bg-zinc-50 px-4 py-3 text-[13px] leading-relaxed text-gray-700 outline-none focus:border-gray-400"
                    />
                  </div>
                ) : (
                  <div className="flex h-[400px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                      <MessageSquare
                        className="h-5 w-5 text-gray-400"
                        strokeWidth={1.75}
                      />
                    </div>
                    <p className="text-[14px] font-medium text-gray-700">
                      No review generated yet
                    </p>
                    <p className="mt-1 max-w-xs text-[12px] text-gray-400">
                      Select an employee and click "Generate Review" to create
                      an AI-powered performance review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
