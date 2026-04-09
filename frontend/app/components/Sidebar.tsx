'use client';

import {
  LayoutDashboard,
  Users,
  Star,
  Settings,
  ChevronDown,
  Cog,
  Upload,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Wait Staff', icon: Users, active: false },
  { label: 'Reviews', icon: Star, active: false },
];

interface SidebarProps {
  onFileUpload?: (file: File) => void;
}

export default function Sidebar({ onFileUpload }: SidebarProps) {
  const [collapsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file && onFileUpload) onFileUpload(file);
    },
    [onFileUpload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onFileUpload) onFileUpload(file);
    },
    [onFileUpload],
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 hidden h-screen flex-col lg:flex
        border-r border-slate-200 bg-white
        transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-5">
        <Cog className="h-5 w-5 text-slate-900" strokeWidth={2} />
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Shift-Engine
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-0.5 px-3 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`
                group flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px]
                text-[13px] font-medium transition-colors
                ${
                  item.active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }
              `}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  item.active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                }`}
                strokeWidth={item.active ? 2 : 1.75}
              />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Compact Dropzone ── */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              group flex cursor-pointer items-center gap-2.5
              rounded-md border border-dashed px-2.5 py-2.5
              transition-all duration-150
              ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-50/60'
                  : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/60'
              }
            `}
            role="button"
            tabIndex={0}
            id="csv-dropzone"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="sr-only"
              id="csv-file-input"
              onChange={handleFileChange}
            />
            <label
              htmlFor="csv-file-input"
              className="flex w-full cursor-pointer items-center gap-2.5"
            >
              <div
                className={`
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                  transition-colors duration-150
                  ${dragActive ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-slate-200/70'}
                `}
              >
                <Upload
                  className={`h-3.5 w-3.5 transition-colors duration-150 ${
                    dragActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-slate-600">
                  Drop CSV
                </p>
                <p className="text-[10px] text-slate-400">
                  or click to browse
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User profile section */}
      <div className="border-t border-slate-200 px-3 py-3">
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left transition-colors hover:bg-slate-50">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            M
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-900">
                  Manager
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  admin@shiftengine.io
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </div>
          )}
        </button>
        <button className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
          <Settings className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          {!collapsed && 'Settings'}
        </button>
      </div>
    </aside>
  );
}
