'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Sparkles, CreditCard, Loader2, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import {
  getCompanySettings,
  updateCompanySettings,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getAISettings,
  updateAISettings,
  type CompanySettings,
  type Location,
  type AISettings,
} from '../../../lib/settings-helpers';

type Tab = 'general' | 'locations' | 'ai' | 'billing';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Data states
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);

  // Form states for General tab
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // Form state for AI tab
  const [aiInstructions, setAiInstructions] = useState('');

  // Location editing states
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: User },
    { id: 'locations' as Tab, label: 'Locations', icon: MapPin },
    { id: 'ai' as Tab, label: 'AI Assistant', icon: Sparkles },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
  ];

  // Load all settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const [company, locs, ai] = await Promise.all([
        getCompanySettings(),
        getLocations(),
        getAISettings(),
      ]);

      setCompanySettings(company);
      setLocations(locs);
      setAISettings(ai);

      // Initialize form states
      if (company) {
        setCompanyName(company.company_name);
        setContactEmail(company.contact_email);
        setPhoneNumber(company.phone_number);
        setAddress(company.address);
      }

      if (ai) {
        setAiInstructions(ai.review_instructions);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveGeneral() {
    setIsSaving(true);
    setSaveMessage(null);
    const updated = await updateCompanySettings({
      company_name: companyName,
      contact_email: contactEmail,
      phone_number: phoneNumber,
      address,
    });
    if (updated) {
      setCompanySettings(updated);
      setSaveMessage('Changes saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage('Failed to save changes. Please try again.');
    }
    setIsSaving(false);
  }

  async function handleSaveAI() {
    setIsSaving(true);
    setSaveMessage(null);
    const updated = await updateAISettings({
      review_instructions: aiInstructions,
    });
    if (updated) {
      setAISettings(updated);
      setSaveMessage('AI instructions saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage('Failed to save instructions. Please try again.');
    }
    setIsSaving(false);
  }

  async function handleAddLocation() {
    if (!newLocationName.trim() || !newLocationAddress.trim()) return;

    const newLoc = await createLocation({
      name: newLocationName.trim(),
      address: newLocationAddress.trim(),
      city: null,
      state: null,
      zip_code: null,
      phone: null,
      manager_name: null,
      is_active: true,
    });

    if (newLoc) {
      setLocations([...locations, newLoc]);
      setNewLocationName('');
      setNewLocationAddress('');
      setIsAddingLocation(false);
    }
  }

  async function handleUpdateLocation(id: string, updates: Partial<Location>) {
    const updated = await updateLocation(id, updates);
    if (updated) {
      setLocations(locations.map(l => l.id === id ? updated : l));
      setEditingLocationId(null);
    }
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm('Are you sure you want to delete this location?')) return;
    const success = await deleteLocation(id);
    if (success) {
      setLocations(locations.filter(l => l.id !== id));
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Sidebar />
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[13px]">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />

      <main className="min-h-screen lg:ml-60">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight text-black">Settings</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              Manage your account, locations, and billing.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Left Column - Navigation */}
            <div className="w-full shrink-0 md:w-64">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-zinc-100 text-black'
                          : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.75} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Column - Content */}
            <div className="flex-1">
              {/* Save message notification (hidden for AI tab, shown inline instead) */}
              {saveMessage && activeTab !== 'ai' && (
                <div className={`mb-4 rounded-md px-4 py-3 text-[13px] ${
                  saveMessage.includes('success')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {saveMessage}
                </div>
              )}

              {/* Tab 1: General */}
              {activeTab === 'general' && (
                <div className="bg-white border border-gray-200 rounded-md p-6">
                  <h2 className="text-[16px] font-semibold text-black mb-6">Company Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                        Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleSaveGeneral}
                        disabled={isSaving}
                        className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
                      >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Locations */}
              {activeTab === 'locations' && (
                <div className="bg-white border border-gray-200 rounded-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[16px] font-semibold text-black">Restaurant Locations</h2>
                    <button
                      onClick={() => setIsAddingLocation(true)}
                      className="border border-gray-200 bg-white text-gray-700 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Location
                    </button>
                  </div>

                  {/* Add new location form */}
                  {isAddingLocation && (
                    <div className="mb-4 rounded-md border border-gray-200 p-4 bg-zinc-50">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[12px] font-medium text-gray-700">
                            Location Name
                          </label>
                          <input
                            type="text"
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            placeholder="e.g., Downtown Flagship"
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[12px] font-medium text-gray-700">
                            Address
                          </label>
                          <input
                            type="text"
                            value={newLocationAddress}
                            onChange={(e) => setNewLocationAddress(e.target.value)}
                            placeholder="e.g., 123 Main St, Downtown"
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleAddLocation}
                            disabled={!newLocationName.trim() || !newLocationAddress.trim()}
                            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingLocation(false);
                              setNewLocationName('');
                              setNewLocationAddress('');
                            }}
                            className="border border-gray-200 bg-white text-gray-700 hover:bg-zinc-50 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {locations.length === 0 ? (
                      <p className="text-[13px] text-gray-500 py-8 text-center">
                        No locations yet. Click "Add Location" to create one.
                      </p>
                    ) : (
                      locations.map((location) => (
                        <div
                          key={location.id}
                          className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
                        >
                          {editingLocationId === location.id ? (
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                defaultValue={location.name}
                                onBlur={(e) => handleUpdateLocation(location.id, { name: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateLocation(location.id, { name: e.currentTarget.value });
                                  }
                                }}
                                className="w-full rounded-md border border-gray-200 px-2 py-1 text-[13px] text-black outline-none focus:border-gray-400"
                                autoFocus
                              />
                              <input
                                type="text"
                                defaultValue={location.address}
                                onBlur={(e) => handleUpdateLocation(location.id, { address: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateLocation(location.id, { address: e.currentTarget.value });
                                  }
                                }}
                                className="w-full rounded-md border border-gray-200 px-2 py-1 text-[12px] text-gray-600 outline-none focus:border-gray-400"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="text-[13px] font-medium text-black">{location.name}</p>
                              <p className="text-[12px] text-gray-500">{location.address}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingLocationId(editingLocationId === location.id ? null : location.id)}
                              className="text-gray-400 hover:text-black transition-colors p-1"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: AI Assistant */}
              {activeTab === 'ai' && (
                <div className="bg-white border border-gray-200 rounded-md p-6">
                  <h2 className="text-[16px] font-semibold text-black mb-2">AI Review Instructions</h2>
                  <p className="text-[13px] text-gray-500 mb-4">
                    Give the AI specific guidelines on how to format your staff performance reviews.
                  </p>
                  <textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="w-full min-h-[150px] rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0 resize-y"
                  />
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={handleSaveAI}
                      disabled={isSaving}
                      className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Instructions
                    </button>
                    {activeTab === 'ai' && saveMessage && (
                      <span className={`text-[13px] ${
                        saveMessage.includes('success')
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}>
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Billing */}
              {activeTab === 'billing' && (
                <div className="bg-white border border-gray-200 rounded-md p-6">
                  <h2 className="text-[16px] font-semibold text-black mb-6">Billing & Subscription</h2>

                  {/* Current Plan */}
                  <div className="mb-6">
                    <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Current Plan
                    </p>
                    <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
                      <div>
                        <p className="text-[14px] font-semibold text-black">
                          {companySettings?.subscription_plan || 'All Access'}
                        </p>
                        <p className="text-[13px] text-gray-500">
                          ${companySettings?.subscription_price || 75}/mo per location
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                        companySettings?.subscription_status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : companySettings?.subscription_status === 'Past Due'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {companySettings?.subscription_status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-8">
                    <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Payment Method
                    </p>
                    <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-12 items-center justify-center rounded border border-gray-200 bg-white">
                          <svg
                            className="h-4 w-4 text-gray-600"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <rect x="2" y="7" width="20" height="10" rx="2" fill="#1F2937" />
                            <rect x="4" y="9" width="4" height="2" fill="#F3F4F6" />
                          </svg>
                        </div>
                        <span className="text-[13px] text-gray-700">**** **** **** 4242</span>
                      </div>
                      <button className="border border-gray-200 bg-white text-gray-700 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                        Update Payment Method
                      </button>
                    </div>
                  </div>

                  {/* Cancel Subscription */}
                  <div className="pt-4 border-t border-gray-200">
                    <button className="text-[13px] text-red-600 hover:text-red-700 transition-colors">
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
