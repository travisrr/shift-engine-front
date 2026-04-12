'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Wand2, Copy, Check } from 'lucide-react';
import Sidebar from '@/app/components/Sidebar';

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
  const [reviewTone, setReviewTone] = useState<string>('professional');
  const [generatedReview, setGeneratedReview] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch staff data on mount
  useEffect(() => {
    fetchStaff();
  }, []);

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

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const employee = staff.find((s) => s.id === selectedEmployee);
    if (!employee) {
      setIsGenerating(false);
      return;
    }

    // Placeholder review content
    const review = generatePlaceholderReview(employee, timePeriod, reviewTone);
    setGeneratedReview(review);
    setIsGenerating(false);
  }

  function generatePlaceholderReview(
    employee: WaitStaff,
    period: string,
    tone: string
  ): string {
    const periodText =
      period === 'last_30_days'
        ? 'the past 30 days'
        : period === 'last_quarter'
          ? 'the last quarter'
          : period === 'last_6_months'
            ? 'the last 6 months'
            : 'the past year';

    const toneOpening =
      tone === 'professional'
        ? 'It is my pleasure to recommend'
        : tone === 'enthusiastic'
          ? 'I am thrilled to recommend'
          : 'I would like to recognize';

    const toneClosing =
      tone === 'professional'
        ? 'an asset to our team'
        : tone === 'enthusiastic'
          ? 'truly exceptional'
          : 'a valued member of our staff';

    return `${toneOpening} ${employee.full_name} for their outstanding performance as a ${employee.job_title} during ${periodText}.

${employee.full_name} has consistently demonstrated excellence in customer service, maintaining a positive attitude even during the busiest shifts. Their attention to detail and ability to work efficiently under pressure have significantly contributed to our restaurant's success.

Team members frequently praise ${employee.full_name.split(' ')[0]} for their willingness to help others and their collaborative approach to problem-solving. Customers regularly provide positive feedback about their dining experience when served by ${employee.full_name.split(' ')[0]}.

I wholeheartedly endorse ${employee.full_name} as ${toneClosing} and am confident they will continue to excel in their role.`;
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
            <h1 className="text-[22px] font-semibold tracking-tight text-black">
              AI Review Builder
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              Generate performance reviews for your team using AI-powered insights.
            </p>
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
                  <div>
                    <label
                      htmlFor="time-period"
                      className="mb-1.5 block text-[12px] font-medium text-gray-700"
                    >
                      Time Period
                    </label>
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
                  </div>

                  <div>
                    <label
                      htmlFor="review-tone"
                      className="mb-1.5 block text-[12px] font-medium text-gray-700"
                    >
                      Review Tone
                    </label>
                    <select
                      id="review-tone"
                      value={reviewTone}
                      onChange={(e) => setReviewTone(e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                    >
                      <option value="professional">Professional</option>
                      <option value="enthusiastic">Enthusiastic</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateReview}
                disabled={!selectedEmployee || isGenerating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Generating Review...
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
