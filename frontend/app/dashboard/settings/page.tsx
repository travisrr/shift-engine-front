'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Sparkles, CreditCard, Loader2, Plus, Trash2, Edit2, Check, X, Key, Eye, EyeOff, ExternalLink, AlertCircle, CheckCircle2, AlertTriangle, Bot, HelpCircle } from 'lucide-react';
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
  getAIProviderKeys,
  createAIProviderKey,
  updateAIProviderKey,
  deleteAIProviderKey,
  setDefaultAIProviderKey,
  validateAIProviderKey,
  AI_PROVIDER_METADATA,
  type CompanySettings,
  type Location,
  type AISettings,
  type AIProviderKeyPublic,
  type AIProvider,
  type CreateAIProviderKeyResult,
} from '../../../lib/settings-helpers';

type Tab = 'general' | 'locations' | 'ai' | 'ai-keys' | 'billing';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Data states
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [aiSettings, setAISettings] = useState<AISettings | null>(null);
  const [aiProviderKeys, setAiProviderKeys] = useState<AIProviderKeyPublic[]>([]);

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

  // AI Keys states
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyLabel, setKeyLabel] = useState('');
  const [keyNotes, setKeyNotes] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: User },
    { id: 'locations' as Tab, label: 'Locations', icon: MapPin },
    { id: 'ai' as Tab, label: 'AI Assistant', icon: Sparkles },
    { id: 'ai-keys' as Tab, label: 'AI Keys', icon: Key },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
  ];

  // Load all settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const [company, locs, ai, keys] = await Promise.all([
        getCompanySettings(),
        getLocations(),
        getAISettings(),
        getAIProviderKeys(),
      ]);

      setCompanySettings(company);
      setLocations(locs);
      setAISettings(ai);
      setAiProviderKeys(keys);

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

  // AI Keys handlers
  function resetKeyForm() {
    setSelectedProvider('openai');
    setApiKeyInput('');
    setShowApiKey(false);
    setKeyLabel('');
    setKeyNotes('');
    setOrganizationId('');
    setBaseUrl('');
    setSelectedModel('');
    setMakeDefault(false);
    setEditingKeyId(null);
  }

  function handleEditKey(key: AIProviderKeyPublic) {
    setEditingKeyId(key.id);
    setSelectedProvider(key.provider);
    setKeyLabel(key.label || '');
    setSelectedModel(key.default_model);
    setMakeDefault(key.is_default);
    // Don't populate API key for security - user must re-enter
    setApiKeyInput('');
    setIsAddingKey(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveKey() {
    if (!apiKeyInput.trim() && !editingKeyId) {
      setSaveMessage('Please enter an API key');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const metadata = AI_PROVIDER_METADATA[selectedProvider];
    const model = selectedModel || metadata.defaultModels[0];

    let result;
    if (editingKeyId) {
      // Update existing key
      const updates: Parameters<typeof updateAIProviderKey>[1] = {
        label: keyLabel || metadata.name,
        default_model: model,
        is_default: makeDefault,
      };
      if (apiKeyInput.trim()) {
        updates.api_key = apiKeyInput.trim();
      }
      result = await updateAIProviderKey(editingKeyId, updates);
      if (result) {
        setAiProviderKeys(prev => prev.map(k => k.id === editingKeyId ? result : k));
        setSaveMessage('API key updated successfully!');
        resetKeyForm();
        setIsAddingKey(false);
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        setSaveMessage('Failed to update API key. Please try again.');
      }
    } else {
      // Create new key
      const createResult = await createAIProviderKey({
        provider: selectedProvider,
        api_key: apiKeyInput.trim(),
        label: keyLabel || metadata.name,
        notes: keyNotes || undefined,
        organization_id: organizationId || undefined,
        base_url: baseUrl || undefined,
        default_model: model,
        is_default: makeDefault || aiProviderKeys.length === 0,
      });

      if (createResult.success) {
        const newKey = createResult.data;
        setAiProviderKeys(prev => [...prev, newKey]);
        setSaveMessage('API key added successfully!');
        resetKeyForm();
        setIsAddingKey(false);

        // Auto-validate the new key
        setIsValidating(true);
        const validation = await validateAIProviderKey(newKey.id);
        setIsValidating(false);

        if (!validation.success) {
          setSaveMessage(`Key saved but validation failed: ${validation.error}`);
        } else {
          // Refresh to get updated validation status
          const keys = await getAIProviderKeys();
          setAiProviderKeys(keys);
        }

        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        // Display the detailed error message from the backend
        setSaveMessage(createResult.error);
      }
    }

    setIsSaving(false);
  }

  async function handleDeleteKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
    const success = await deleteAIProviderKey(id);
    if (success) {
      setAiProviderKeys(aiProviderKeys.filter(k => k.id !== id));
      setSaveMessage('API key deleted successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleSetDefaultKey(id: string) {
    const result = await setDefaultAIProviderKey(id);
    if (result) {
      setAiProviderKeys(aiProviderKeys.map(k => ({
        ...k,
        is_default: k.id === id,
      })));
      setSaveMessage('Default provider updated');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleValidateKey(id: string) {
    setIsValidating(true);
    const result = await validateAIProviderKey(id);
    setIsValidating(false);

    if (result.success) {
      setSaveMessage('API key validated successfully');
      const keys = await getAIProviderKeys();
      setAiProviderKeys(keys);
    } else {
      setSaveMessage(`Validation failed: ${result.error}`);
    }
    setTimeout(() => setSaveMessage(null), 5000);
  }

  function getProviderBadgeColor(provider: AIProvider): string {
    switch (provider) {
      case 'openai': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'anthropic': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'google': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'azure_openai': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  function getValidationStatusIcon(status: AIProviderKeyPublic['validation_status']) {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'invalid':
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
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

              {/* Tab 4: AI Keys (BYOK) */}
              {activeTab === 'ai-keys' && (
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="bg-white border border-gray-200 rounded-md p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-[16px] font-semibold text-black mb-2">Bring Your Own API Keys</h2>
                        <p className="text-[13px] text-gray-500 max-w-2xl">
                          Connect your own AI provider accounts to power the AI Review Builder. Your keys are encrypted and stored securely. We never share or use your keys for any other purpose.
                        </p>
                      </div>
                      {!isAddingKey && (
                        <button
                          onClick={() => setIsAddingKey(true)}
                          className="border border-gray-200 bg-white text-gray-700 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                          Add API Key
                        </button>
                      )}
                    </div>

                    {/* Configuration Notice */}
                    {aiProviderKeys.length === 0 && !isAddingKey && (
                      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[13px] font-medium text-amber-800">No API keys configured</p>
                            <p className="text-[12px] text-amber-700 mt-0.5">
                              The AI Review Builder requires at least one API key to generate real AI-powered reviews. Add your key above to get started.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add/Edit Key Form */}
                  {isAddingKey && (
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                      <h3 className="text-[14px] font-semibold text-black mb-4">
                        {editingKeyId ? 'Update API Key' : 'Add New API Key'}
                      </h3>

                      <div className="space-y-4">
                        {/* Provider Selection */}
                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                            AI Provider
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(Object.keys(AI_PROVIDER_METADATA) as AIProvider[]).map((provider) => {
                              const meta = AI_PROVIDER_METADATA[provider];
                              return (
                                <button
                                  key={provider}
                                  onClick={() => {
                                    setSelectedProvider(provider);
                                    setSelectedModel(meta.defaultModels[0]);
                                  }}
                                  className={`flex flex-col items-start p-3 rounded-md border text-left transition-all ${
                                    selectedProvider === provider
                                      ? 'border-black bg-zinc-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <span className="text-[13px] font-medium text-black">{meta.name}</span>
                                  <span className="text-[11px] text-gray-500 mt-0.5">{meta.description}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* API Key Input */}
                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                            API Key
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              placeholder={AI_PROVIDER_METADATA[selectedProvider].keyPlaceholder}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 pr-10 text-[13px] text-black outline-none transition-colors focus:border-gray-400 focus:ring-0"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="mt-1.5 text-[11px] text-gray-500">
                            Your key is encrypted and stored securely. We never share it.
                          </p>
                        </div>

                        {/* Optional: Organization ID (OpenAI) */}
                        {AI_PROVIDER_METADATA[selectedProvider].supportsOrganization && (
                          <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                              Organization ID (Optional)
                            </label>
                            <input
                              type="text"
                              value={organizationId}
                              onChange={(e) => setOrganizationId(e.target.value)}
                              placeholder="org-..."
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                            />
                          </div>
                        )}

                        {/* Optional: Base URL (Custom/Azure) */}
                        {AI_PROVIDER_METADATA[selectedProvider].supportsCustomBaseUrl && (
                          <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                              Base URL
                            </label>
                            <input
                              type="text"
                              value={baseUrl}
                              onChange={(e) => setBaseUrl(e.target.value)}
                              placeholder={AI_PROVIDER_METADATA[selectedProvider].keyPlaceholder}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                            />
                          </div>
                        )}

                        {/* Model Selection */}
                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                            Default Model
                          </label>
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                          >
                            {AI_PROVIDER_METADATA[selectedProvider].defaultModels.map((model) => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                          </select>
                        </div>

                        {/* Label */}
                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                            Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={keyLabel}
                            onChange={(e) => setKeyLabel(e.target.value)}
                            placeholder={`My ${AI_PROVIDER_METADATA[selectedProvider].name} Key`}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400"
                          />
                        </div>

                        {/* Notes */}
                        {!editingKeyId && (
                          <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                              Notes (Optional)
                            </label>
                            <textarea
                              value={keyNotes}
                              onChange={(e) => setKeyNotes(e.target.value)}
                              placeholder="e.g., Production key for review generation"
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-black outline-none transition-colors focus:border-gray-400 resize-y min-h-[60px]"
                            />
                          </div>
                        )}

                        {/* Default Checkbox */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="make-default"
                            checked={makeDefault}
                            onChange={(e) => setMakeDefault(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <label htmlFor="make-default" className="text-[13px] text-gray-700">
                            Set as default provider
                          </label>
                        </div>

                        {/* Help Link */}
                        {AI_PROVIDER_METADATA[selectedProvider].keyHelpUrl && (
                          <div className="flex items-center gap-2 text-[12px] text-gray-500">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <a
                              href={AI_PROVIDER_METADATA[selectedProvider].keyHelpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Get a {AI_PROVIDER_METADATA[selectedProvider].name} API key
                            </a>
                          </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={handleSaveKey}
                            disabled={isSaving || (!apiKeyInput.trim() && !editingKeyId)}
                            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
                          >
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editingKeyId ? 'Update Key' : 'Add Key'}
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingKey(false);
                              resetKeyForm();
                            }}
                            className="border border-gray-200 bg-white text-gray-700 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* API Keys List */}
                  {aiProviderKeys.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-md p-6">
                      <h3 className="text-[14px] font-semibold text-black mb-4">Configured API Keys</h3>
                      <div className="space-y-3">
                        {aiProviderKeys.map((key) => (
                          <div
                            key={key.id}
                            className={`flex items-center justify-between rounded-md border px-4 py-3 ${
                              key.is_default ? 'border-black bg-zinc-50/50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${getProviderBadgeColor(key.provider)}`}>
                                <Bot className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-medium text-black">{key.provider_name}</span>
                                  {key.is_default && (
                                    <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-[11px] font-medium text-white">
                                      Default
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    key.validation_status === 'valid' ? 'bg-emerald-50 text-emerald-700' :
                                    key.validation_status === 'invalid' || key.validation_status === 'expired' ? 'bg-red-50 text-red-700' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {getValidationStatusIcon(key.validation_status)}
                                    {key.validation_status === 'valid' ? 'Valid' :
                                     key.validation_status === 'invalid' ? 'Invalid' :
                                     key.validation_status === 'expired' ? 'Expired' : 'Pending'}
                                    {key.validation_status === 'valid' && (
                                      <span className="relative ml-0.5 group/tooltip">
                                        <HelpCircle className="h-3 w-3 cursor-help" />
                                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block w-56 bg-black text-white text-[11px] px-2 py-1.5 rounded-md shadow-lg z-10 whitespace-normal">
                                          Your AI key was tested and works!{key.validation_model && (
                                            <span className="block mt-1 text-gray-300">Tested with: {key.validation_model}</span>
                                          )}
                                          <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-black"></span>
                                        </span>
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[12px] text-gray-500 font-mono">{key.key_last_four || '••••••••'}</span>
                                  {key.label && <span className="text-[12px] text-gray-400">• {key.label}</span>}
                                  <span className="text-[11px] text-gray-400">{key.monthly_usage_count} uses this month</span>
                                </div>
                                {key.validation_error && (
                                  <p className="text-[11px] text-red-600 mt-1">{key.validation_error}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!key.is_default && (
                                <button
                                  onClick={() => handleSetDefaultKey(key.id)}
                                  className="text-gray-400 hover:text-black transition-colors p-1.5"
                                  title="Set as default"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleValidateKey(key.id)}
                                disabled={isValidating}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1.5"
                                title="Validate key"
                              >
                                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleEditKey(key)}
                                className="text-gray-400 hover:text-black transition-colors p-1.5"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteKey(key.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1.5"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Message */}
                  {saveMessage && (
                    <div className={`rounded-md px-4 py-3 text-[13px] ${
                      saveMessage.includes('success') || saveMessage.includes('updated')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {saveMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Billing */}
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
