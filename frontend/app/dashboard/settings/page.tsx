'use client';

import { useState } from 'react';
import { User, MapPin, Sparkles, CreditCard } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

type Tab = 'general' | 'locations' | 'ai' | 'billing';

interface Location {
  id: string;
  name: string;
  address: string;
}

const mockLocations: Location[] = [
  { id: '1', name: 'Downtown Flagship', address: '123 Main St, Downtown' },
  { id: '2', name: 'Westside Location', address: '456 West Ave, Westside' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // General tab form state
  const [companyName, setCompanyName] = useState('Shift Engine Restaurant Group');
  const [contactEmail, setContactEmail] = useState('admin@shiftengine.io');
  const [phoneNumber, setPhoneNumber] = useState('(555) 123-4567');
  const [address, setAddress] = useState('123 Main St, Suite 100');

  // AI tab state
  const [aiInstructions, setAiInstructions] = useState(
    'Always maintain a professional but encouraging tone. Highlight upsell metrics before discussing table turn speeds. Do not use corporate jargon.'
  );

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: User },
    { id: 'locations' as Tab, label: 'Locations', icon: MapPin },
    { id: 'ai' as Tab, label: 'AI Assistant', icon: Sparkles },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
  ];

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
                      <button className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
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
                    <button className="border border-gray-200 bg-white text-gray-700 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                      + Add Location
                    </button>
                  </div>
                  <div className="space-y-3">
                    {mockLocations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
                      >
                        <div>
                          <p className="text-[13px] font-medium text-black">{location.name}</p>
                          <p className="text-[12px] text-gray-500">{location.address}</p>
                        </div>
                        <button className="text-[13px] text-gray-500 hover:text-black transition-colors">
                          Edit
                        </button>
                      </div>
                    ))}
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
                  <div className="mt-4">
                    <button className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                      Save Instructions
                    </button>
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
                        <p className="text-[14px] font-semibold text-black">All Access</p>
                        <p className="text-[13px] text-gray-500">$75/mo per location</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700">
                        Active
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
