import { Settings, Key, Globe, Database, Bell, Shield, Code, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-1">Admin dashboard configuration</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Supabase Connection */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Supabase Connection</h2>
              <p className="text-xs text-emerald-400">Connected</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Project URL</label>
              <div className="mt-1 px-4 py-2.5 bg-dark-900/50 rounded-xl text-sm font-mono text-gray-300">
                https://univyfkzocecqstdgtoy.supabase.co
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Service Role Key</label>
              <div className="mt-1 px-4 py-2.5 bg-dark-900/50 rounded-xl text-sm font-mono text-gray-500">
                ••••••••••••••••••••••••
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard/project/univyfkzocecqstdgtoy', icon: Database },
              { label: 'Edge Functions', url: 'https://supabase.com/dashboard/project/univyfkzocecqstdgtoy/functions', icon: Code },
              { label: 'Auth Settings', url: 'https://supabase.com/dashboard/project/univyfkzocecqstdgtoy/auth/users', icon: Shield },
              { label: 'API Documentation', url: 'https://supabase.com/dashboard/project/univyfkzocecqstdgtoy/api', icon: Globe },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
              >
                <link.icon className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                <span className="text-sm text-gray-400 group-hover:text-white">{link.label}</span>
                <ExternalLink className="w-3 h-3 text-gray-600 ml-auto" />
              </a>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Application</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-400">App Name</span>
              <span className="text-xs text-white font-medium">Bible Guide AI</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-dark-700/30">
              <span className="text-xs text-gray-400">Bundle ID</span>
              <span className="text-xs text-white font-mono">com.bibleguideai.app</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-dark-700/30">
              <span className="text-xs text-gray-400">Version</span>
              <span className="text-xs text-white font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-dark-700/30">
              <span className="text-xs text-gray-400">Framework</span>
              <span className="text-xs text-white font-medium">React Native (Expo SDK 54)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-dark-700/30">
              <span className="text-xs text-gray-400">Admin Dashboard</span>
              <span className="text-xs text-white font-medium">Next.js 14</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
