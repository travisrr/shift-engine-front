'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';

/* ─────────────────── Types ─────────────────── */

interface WaitStaff {
  id: string;
  full_name: string;
  hourly_rate: number;
  hire_date: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

interface FormData {
  full_name: string;
  hourly_rate: string;
  hire_date: string;
  status: 'Active' | 'Inactive';
}

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
    hourly_rate: '2.13',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'Active',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff data on mount
  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wait_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData({
      full_name: '',
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

      const { error } = await supabase.from('wait_staff').insert({
        full_name: formData.full_name.trim(),
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

      const { error } = await supabase
        .from('wait_staff')
        .update({
          full_name: formData.full_name.trim(),
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

  async function handleDelete() {
    if (!selectedStaff) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('wait_staff')
        .delete()
        .eq('id', selectedStaff.id);

      if (error) throw error;

      await fetchStaff();
      closeModals();
    } catch (err) {
      console.error('Error deleting staff member:', err);
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

          {/* ── Action Bar ── */}
          <div className="mb-6 flex justify-end">
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
                    <th className="w-[30%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Name
                    </th>
                    <th className="w-[15%] whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Status
                    </th>
                    <th className="w-[20%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Hourly Rate
                    </th>
                    <th className="w-[20%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Hire Date
                    </th>
                    <th className="w-[15%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:px-5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                          Loading staff...
                        </div>
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
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
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
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

      {/* ── Delete Confirmation Modal ── */}
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle
                    className="h-5 w-5 text-red-600"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-black">
                    Remove Staff Member
                  </h2>
                </div>
              </div>

              <p className="mb-6 text-[13px] leading-relaxed text-gray-600">
                Are you sure you want to remove{' '}
                <span className="font-medium text-black">
                  {selectedStaff.full_name}
                </span>
                ? This cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="rounded-md border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Removing...
                    </span>
                  ) : (
                    'Delete'
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
