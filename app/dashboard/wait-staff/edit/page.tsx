'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Archive, X, Download } from 'lucide-react';
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
  hourly_rate: number;
  hire_date: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

interface FormData {
  full_name: string;
  job_title: 'Server' | 'Bar Tender';
  hourly_rate: string;
  hire_date: string;
  status: 'Active' | 'Inactive';
}

/* ─────────────────── Config ─────────────────── */

export const dynamic = 'force-dynamic';

/* ─────────────────── Components ─────────────────── */

export default function EditTeamPage() {
  const [staff, setStaff] = useState<WaitStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<WaitStaff | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    job_title: 'Server',
    hourly_rate: '2.13',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'Active',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingJobTitleId, setUpdatingJobTitleId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [jobTitleError, setJobTitleError] = useState<string | null>(null);
  const [jobTitleSuccess, setJobTitleSuccess] = useState<string | null>(null);

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData({
      full_name: '',
      job_title: 'Server',
      hourly_rate: '2.13',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'Active',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(staffMember: WaitStaff) {
    setSelectedStaff(staffMember);
    setFormData({
      full_name: staffMember.full_name,
      job_title: staffMember.job_title,
      hourly_rate: staffMember.hourly_rate.toString(),
      hire_date: staffMember.hire_date,
      status: staffMember.status,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  }

  function openDeleteModal(staffMember: WaitStaff) {
    setSelectedStaff(staffMember);
    setIsDeleteModalOpen(true);
  }

  function closeModals() {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedStaff(null);
    setFormError(null);
    setArchiveError(null);
    setJobTitleError(null);
    setJobTitleSuccess(null);
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required');
      }

      const hourlyRate = parseFloat(formData.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate < 0) {
        throw new Error('Hourly rate must be a valid number');
      }

      const { client, error: supaError } = await getSupabase();
      if (!client) throw new Error(supaError || 'Database not available');

      const { error } = await client.from('wait_staff').insert({
        full_name: formData.full_name.trim(),
        job_title: formData.job_title,
        hourly_rate: hourlyRate,
        hire_date: formData.hire_date,
        status: formData.status,
      });

      if (error) throw error;

      await fetchStaff();
      closeModals();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add staff member';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required');
      }

      const hourlyRate = parseFloat(formData.hourly_rate);
      if (isNaN(hourlyRate) || hourlyRate < 0) {
        throw new Error('Hourly rate must be a valid number');
      }

      const { client, error: supaError } = await getSupabase();
      if (!client) throw new Error(supaError || 'Database not available');

      const { error } = await client
        .from('wait_staff')
        .update({
          full_name: formData.full_name.trim(),
          job_title: formData.job_title,
          hourly_rate: hourlyRate,
          hire_date: formData.hire_date,
          status: formData.status,
        })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      await fetchStaff();
      closeModals();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff member';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!selectedStaff) return;

    setIsSubmitting(true);
    setArchiveError(null);

    try {
      const { client, error: supaError } = await getSupabase();
      if (!client) throw new Error(supaError || 'Database not available');

      const { data, error } = await client
        .from('wait_staff')
        .update({ status: 'Inactive' })
        .eq('id', selectedStaff.id)
        .select();

      if (error) throw error;

      // Check if any row was actually updated
      if (!data || data.length === 0) {
        throw new Error('No employee found with this ID. The employee may have been deleted or the ID has changed.');
      }

      await fetchStaff();
      setArchiveError(null);
      closeModals();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive staff member';
      console.error('Error archiving staff member:', err);
      setArchiveError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async function handleUpdateJobTitle(
    staffId: string,
    newJobTitle: 'Server' | 'Bar Tender'
  ) {
    // Find the staff member to get their name and current job title
    const staffMember = staff.find((s) => s.id === staffId);
    if (!staffMember) return;

    const originalJobTitle = staffMember.job_title;

    // Clear any previous messages
    setJobTitleError(null);
    setJobTitleSuccess(null);
    setUpdatingJobTitleId(staffId);

    // Optimistically update UI
    setStaff((prev) =>
      prev.map((member) =>
        member.id === staffId ? { ...member, job_title: newJobTitle } : member
      )
    );

    try {
      const { client, error: supaError } = await getSupabase();
      if (!client) throw new Error(supaError || 'Database not available');

      const { error, data } = await client
        .from('wait_staff')
        .update({ job_title: newJobTitle })
        .eq('id', staffId)
        .select();

      if (error) throw error;

      // Verify the update was actually applied
      if (!data || data.length === 0) {
        throw new Error('Update may not have been saved - no data returned');
      }

      // Show success message
      setJobTitleSuccess(
        `${staffMember.full_name} updated to ${newJobTitle}`
      );

      // Clear success message after 3 seconds
      setTimeout(() => setJobTitleSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating job title:', err);

      // Revert local state on error
      setStaff((prev) =>
        prev.map((member) =>
          member.id === staffId
            ? { ...member, job_title: originalJobTitle }
            : member
        )
      );

      // Show error message
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update job title';
      setJobTitleError(`${staffMember.full_name}: ${errorMessage}`);

      // Clear error after 5 seconds
      setTimeout(() => setJobTitleError(null), 5000);
    } finally {
      setUpdatingJobTitleId(null);
    }
  }

  // Mock server names from dashboard (fallback when no CSV uploaded yet)
  const mockServerNames = [
    'Addie Stubbe',
    'Alec Ramsey',
    'Caleigh Graves',
    'Chloe Colaianni',
    'Dean Polizos',
    'Eric Fowler',
    'Giselle San Filippo',
    'Karen Mason',
    'Lauren Claxton',
    'Madison Lawrence',
    'Meredith Johnson',
    'Morgan Sparkman',
    'Paige Anderson',
    'Rachel Brunet',
    'Thomas Malone',
    'Ty Buckley',
  ];

  async function openImportModal() {
    setIsImportModalOpen(true);
    setIsLoadingServers(true);
    setImportError(null);
    setImportSuccess(null);
    setSelectedServers(new Set());

    try {
      const { client, error: supaError } = await getSupabase();
      if (!client) {
        // If no database, use mock data but show error in console
        if (supaError) {
          console.error('[Import] Database not configured:', supaError);
        }
        const existingNames = new Set(staff.map((s: WaitStaff) => s.full_name));
        const newServers = mockServerNames.filter((name) => !existingNames.has(name));
        setAvailableServers(newServers);
        return;
      }

      // Get the most recent upload
      const { data: latestUpload, error: uploadError } = await client
        .from('uploads')
        .select('id, date')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (uploadError) throw uploadError;

      let serverNames: string[] = [];

      if (latestUpload) {
        // Get server names from the latest upload
        const { data: scores, error: scoresError } = await client
          .from('server_scores')
          .select('server_name')
          .eq('upload_id', latestUpload.id);

        if (scoresError) throw scoresError;
        serverNames = scores?.map((s: { server_name: string }) => s.server_name) || [];
      }

      // If no uploads yet, fall back to mock data
      if (serverNames.length === 0) {
        serverNames = mockServerNames;
      }

      // Filter out servers that are already in wait_staff
      const { data: existingStaff } = await client
        .from('wait_staff')
        .select('full_name');

      const existingNames = new Set(existingStaff?.map((s: { full_name: string }) => s.full_name) || []);
      const newServers = serverNames.filter((name) => !existingNames.has(name));

      setAvailableServers(newServers);
    } catch (err) {
      console.error('Error fetching available servers:', err);
      // Fall back to mock data on error
      const existingNames = new Set(staff.map((s: WaitStaff) => s.full_name));
      const newServers = mockServerNames.filter((name) => !existingNames.has(name));
      setAvailableServers(newServers);
    } finally {
      setIsLoadingServers(false);
    }
  }

  function closeImportModal() {
    setIsImportModalOpen(false);
    setAvailableServers([]);
    setSelectedServers(new Set());
    setImportError(null);
    setImportSuccess(null);
  }

  function toggleServerSelection(serverName: string) {
    setSelectedServers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serverName)) {
        newSet.delete(serverName);
      } else {
        newSet.add(serverName);
      }
      return newSet;
    });
  }

  function toggleAllServers() {
    if (selectedServers.size === availableServers.length) {
      setSelectedServers(new Set());
    } else {
      setSelectedServers(new Set(availableServers));
    }
  }

  async function handleImportServers() {
    if (selectedServers.size === 0) return;

    setIsSubmitting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const { client, error: supaError } = await getSupabase();
      if (!client) {
        throw new Error(
          supaError ||
          'Database not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables in your Vercel project settings, then redeploy.'
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const newStaff = Array.from(selectedServers).map((name) => ({
        full_name: name,
        job_title: 'Server' as const,
        hourly_rate: 2.13,
        hire_date: today,
        status: 'Active' as const,
      }));

      const { error } = await client.from('wait_staff').insert(newStaff);

      if (error) throw error;

      setImportSuccess(`Successfully imported ${selectedServers.size} staff member${selectedServers.size === 1 ? '' : 's'}`);
      await fetchStaff();

      // Clear selection but keep modal open briefly to show success
      setTimeout(() => {
        closeImportModal();
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import staff members';
      setImportError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />

      <main className="min-h-screen lg:ml-60">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight text-black">
              Team Management
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              Manage server profiles, wages, and employment status.
            </p>
          </div>

          {/* ── Job Title Update Messages ── */}
          {(jobTitleError || jobTitleSuccess) && (
            <div className="mb-4 space-y-2">
              {jobTitleError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                  {jobTitleError}
                </div>
              )}
              {jobTitleSuccess && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                  {jobTitleSuccess}
                </div>
              )}
            </div>
          )}

          {/* ── Action Bar ── */}
          <div className="mb-6 flex justify-end gap-3">
            <button
              onClick={openImportModal}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-zinc-50"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Import from Dashboard
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Staff Member
            </button>
          </div>

          {/* ── Data Table ── */}
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-[25%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Name
                    </th>
                    <th className="w-[15%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Job Title
                    </th>
                    <th className="w-[12%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Status
                    </th>
                    <th className="w-[18%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Hourly Rate
                    </th>
                    <th className="w-[18%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Hire Date
                    </th>
                    <th className="w-[12%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                          Loading staff...
                        </div>
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-[14px] font-medium text-gray-700">
                            No staff members yet
                          </p>
                          <p className="text-[12px] text-gray-400">
                            Click "Add Staff Member" to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-zinc-50/80"
                      >
                        <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                          <span className="font-medium text-black">
                            {member.full_name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 lg:px-5">
                          <div className="relative">
                            <select
                              value={member.job_title}
                              onChange={(e) =>
                                handleUpdateJobTitle(
                                  member.id,
                                  e.target.value as 'Server' | 'Bar Tender'
                                )
                              }
                              disabled={updatingJobTitleId === member.id}
                              className="w-full cursor-pointer appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-[13px] text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400 disabled:opacity-50"
                            >
                              <option value="Server">Server</option>
                              <option value="Bar Tender">Bar Tender</option>
                            </select>
                            {updatingJobTitleId === member.id && (
                              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                              </div>
                            )}
                            {!updatingJobTitleId && (
                              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                                <svg
                                  className="h-4 w-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                              member.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-600 lg:px-5">
                          {formatCurrency(member.hourly_rate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-600 lg:px-5">
                          {formatDate(member.hire_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right lg:px-5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(member)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-zinc-100 hover:text-gray-600"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(member)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── Add/Edit Modal ── */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={closeModals}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-black">
                {isAddModalOpen ? 'Add Staff Member' : 'Edit Staff Member'}
              </h2>
              <button
                onClick={closeModals}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-zinc-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <form
              onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}
              className="p-5"
            >
              {formError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="full_name"
                    className="mb-1.5 block text-[12px] font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-0"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="job_title"
                    className="mb-1.5 block text-[12px] font-medium text-gray-700"
                  >
                    Job Title
                  </label>
                  <select
                    id="job_title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                  >
                    <option value="Server">Server</option>
                    <option value="Bar Tender">Bar Tender</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hourly_rate"
                    className="mb-1.5 block text-[12px] font-medium text-gray-700"
                  >
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    id="hourly_rate"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="2.13"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-0"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="hire_date"
                    className="mb-1.5 block text-[12px] font-medium text-gray-700"
                  >
                    Hire Date
                  </label>
                  <input
                    type="date"
                    id="hire_date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-1.5 block text-[12px] font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-md border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-black px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Saving...
                    </span>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Archive Confirmation Modal ── */}
      {isDeleteModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={closeModals}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Archive
                    className="h-5 w-5 text-gray-600"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-black">
                    Archive Staff Member
                  </h2>
                </div>
              </div>

              {archiveError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {archiveError}
                </div>
              )}

              <p className="mb-6 text-[13px] leading-relaxed text-gray-600">
                Are you sure you want to archive{' '}
                <span className="font-medium text-black">
                  {selectedStaff.full_name}
                </span>
                ? They will be marked as inactive and can be restored later.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-md border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isSubmitting}
                  className="rounded-md bg-gray-700 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Archiving...
                    </span>
                  ) : (
                    'Archive'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Servers Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={closeImportModal}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-black">
                Import from Dashboard
              </h2>
              <button
                onClick={closeImportModal}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-zinc-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="p-5">
              {importError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                  {importSuccess}
                </div>
              )}

              {isLoadingServers ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                  <span className="text-[13px] text-gray-500">Loading available servers...</span>
                </div>
              ) : availableServers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[14px] font-medium text-gray-700">
                    No new servers to import
                  </p>
                  <p className="mt-1 text-[12px] text-gray-400">
                    All dashboard servers are already in your staff list.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-[13px] text-gray-600">
                    Select servers from the dashboard to add to your staff list:
                  </p>

                  <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedServers.size === availableServers.length && availableServers.length > 0}
                      onChange={toggleAllServers}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-0"
                    />
                    <label
                      htmlFor="select-all"
                      className="text-[13px] font-medium text-gray-700 cursor-pointer"
                    >
                      Select All ({availableServers.length})
                    </label>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableServers.map((serverName) => (
                      <div
                        key={serverName}
                        className="flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2 hover:bg-zinc-50"
                      >
                        <input
                          type="checkbox"
                          id={`server-${serverName}`}
                          checked={selectedServers.has(serverName)}
                          onChange={() => toggleServerSelection(serverName)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-0"
                        />
                        <label
                          htmlFor={`server-${serverName}`}
                          className="flex-1 text-[13px] text-gray-800 cursor-pointer"
                        >
                          {serverName}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeImportModal}
                  className="rounded-md border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportServers}
                  disabled={isSubmitting || selectedServers.size === 0}
                  className="rounded-md bg-black px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Importing...
                    </span>
                  ) : (
                    `Import ${selectedServers.size > 0 ? `(${selectedServers.size})` : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
