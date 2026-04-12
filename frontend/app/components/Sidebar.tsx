'use client';

import {
  LayoutDashboard,
  Users,
  UserCog,
  MessageSquare,
  Settings,
  ChevronDown,
  Cog,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  active?: boolean;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  {
    label: 'Wait Staff',
    icon: Users,
    children: [
      { label: 'Edit Team', href: '/dashboard/wait-staff/edit', icon: UserCog },
    ],
  },
  {
    label: 'Reviews',
    icon: MessageSquare,
    children: [
      { label: 'AI Review Builder', href: '/dashboard/reviews', icon: MessageSquare },
    ],
  },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

interface SidebarProps {
  onFileUpload?: (file: File) => void;
}

export default function Sidebar({ onFileUpload }: SidebarProps) {
  const [collapsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Wait Staff', 'Reviews']);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

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

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const isActive = (href?: string) => href && pathname === href;
  const isSectionActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 hidden h-screen flex-col lg:flex
        border-r border-gray-200 bg-white
        transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex h-11 items-center gap-2 border-b border-gray-200 px-3">
        <img
          src="/shift-engine-logo-bw-nobg.webp"
          alt="Shift Engine"
          className="h-6 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="space-y-px px-2 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections.includes(item.label);
          const sectionActive = isSectionActive(item);

          if (hasChildren) {
            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  onClick={() => toggleSection(item.label)}
                  className={`
                    group flex w-full items-center justify-between rounded-md px-2 py-1.5
                    text-[13px] font-medium transition-colors
                    ${sectionActive ? 'bg-zinc-100 text-black' : 'text-gray-600 hover:bg-zinc-50 hover:text-gray-900'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        sectionActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                      strokeWidth={sectionActive ? 2 : 1.75}
                    />
                    {!collapsed && item.label}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-3 space-y-px border-l border-gray-200 pl-2">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`
                            group flex w-full items-center gap-2 rounded-md px-2 py-1.5
                            text-[13px] font-medium transition-colors
                            ${childActive ? 'bg-zinc-100 text-black' : 'text-gray-500 hover:bg-zinc-50 hover:text-gray-700'}
                          `}
                        >
                          <ChildIcon
                            className={`h-4 w-4 shrink-0 ${
                              childActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                            strokeWidth={childActive ? 2 : 1.75}
                          />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href || '#'}
              className={`
                group flex w-full items-center gap-2 rounded-md px-2 py-1.5
                text-[13px] font-medium transition-colors
                ${
                  isActive(item.href)
                    ? 'bg-zinc-100 text-black'
                    : 'text-gray-600 hover:bg-zinc-50 hover:text-gray-900'
                }
              `}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive(item.href) ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'
                }`}
                strokeWidth={isActive(item.href) ? 2 : 1.75}
              />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Compact Dropzone ── */}
      {!collapsed && (
        <div className="px-2 pt-2">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              group flex cursor-pointer items-center gap-2
              rounded-md border border-dashed px-2 py-2
              transition-all duration-150
              ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-50/60'
                  : 'border-gray-300 bg-zinc-50/50 hover:border-gray-400 hover:bg-zinc-100/60'
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
              className="flex w-full cursor-pointer items-center gap-2"
            >
              <div
                className={`
                  flex h-7 w-7 shrink-0 items-center justify-center rounded-md
                  transition-colors duration-150
                  ${dragActive ? 'bg-indigo-100' : 'bg-zinc-100 group-hover:bg-zinc-200/70'}
                `}
              >
                <Upload
                  className={`h-3.5 w-3.5 transition-colors duration-150 ${
                    dragActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-600">
                  Drop CSV
                </p>
                <p className="text-[10px] text-gray-400">
                  or click
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User profile section */}
      <div className="border-t border-gray-200 px-2 py-2">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-50">
          {/* Avatar */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">
            M
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-black">
                  Manager
                </p>
                <p className="truncate text-[10px] text-gray-400">
                  admin@shiftengine.io
                </p>
              </div>
              <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
