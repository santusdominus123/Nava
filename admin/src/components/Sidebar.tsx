'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, BarChart3, FileText, Settings,
  BookOpen, Bell, Shield, Database, Globe, Activity,
  Award, AlertTriangle, UsersRound, BarChart, ShieldAlert,
} from 'lucide-react';

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/activity', label: 'Activity Feed', icon: Activity },
      { href: '/engagement', label: 'Engagement Map', icon: BarChart },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { href: '/users', label: 'Users', icon: Users },
      { href: '/content', label: 'Content', icon: FileText },
      { href: '/devotionals', label: 'Devotionals', icon: BookOpen },
      { href: '/groups', label: 'Groups', icon: UsersRound },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'MODERATION',
    items: [
      { href: '/reports', label: 'Reports', icon: AlertTriangle },
      { href: '/auto-mod', label: 'Auto-Mod', icon: ShieldAlert },
    ],
  },
  {
    label: 'ENGAGEMENT',
    items: [
      { href: '/achievements', label: 'Achievements', icon: Award },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/database', label: 'Database', icon: Database },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-dark-800/80 backdrop-blur-xl border-r border-dark-700/50 flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">Nava</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <p className="text-xs text-emerald-400 font-medium">Admin Console</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-gray-500 tracking-[0.15em] mb-2 px-4">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/10 text-blue-400 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700/50">
        <div className="glass-card rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-white">Supabase Connected</p>
          </div>
          <p className="text-[10px] text-gray-500 font-mono truncate">univyfkzocecqstdgtoy</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
