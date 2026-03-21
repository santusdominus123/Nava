import { Zap, CheckCircle, Clock, ArrowRight, Globe, Shield, MessageSquare, Bell } from 'lucide-react';

const functions = [
  {
    name: 'ai-chat',
    description: 'Proxies OpenAI API calls with auth validation, rate limiting, and SSE streaming. Keeps API keys server-side.',
    status: 'deployed',
    method: 'POST',
    auth: 'JWT',
    features: ['Rate limiting', 'SSE streaming', 'Chat history', 'Auto-save messages'],
    color: 'violet',
  },
  {
    name: 'chat-rate-limit',
    description: 'Server-side rate limit validation. Free users: 5/day, Premium: 100/day.',
    status: 'deployed',
    method: 'POST',
    auth: 'Service Role',
    features: ['Premium detection', 'Daily reset', 'Audit logging'],
    color: 'amber',
  },
  {
    name: 'send-daily-reminder',
    description: 'Cron-triggered function that sends push notifications via Expo Push API based on user reminder preferences.',
    status: 'deployed',
    method: 'POST',
    auth: 'Service Role',
    features: ['Timezone-aware', 'Batch sending', 'Verse of the day', 'Analytics logging'],
    color: 'blue',
  },
  {
    name: 'purchase-webhook',
    description: 'Handles RevenueCat webhook events for subscription lifecycle management.',
    status: 'deployed',
    method: 'POST',
    auth: 'Webhook Secret',
    features: ['Purchase validation', 'Renewal handling', 'Cancellation', 'Expiration'],
    color: 'emerald',
  },
];

const iconMap: Record<string, any> = {
  'ai-chat': MessageSquare,
  'chat-rate-limit': Shield,
  'send-daily-reminder': Bell,
  'purchase-webhook': Zap,
};

const colorMap: Record<string, string> = {
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
};

export default function EdgeFunctionsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Edge Functions</h1>
        <p className="text-gray-400 mt-1">Supabase Edge Functions powering Bible Guide AI backend</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Functions</p>
          <p className="text-2xl font-bold text-white mt-1">{functions.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Deployed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{functions.filter(f => f.status === 'deployed').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Runtime</p>
          <p className="text-2xl font-bold text-white mt-1">Deno</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Region</p>
          <p className="text-2xl font-bold text-white mt-1">Edge</p>
        </div>
      </div>

      {/* Functions List */}
      <div className="space-y-4">
        {functions.map((fn) => {
          const IconComponent = iconMap[fn.name] || Zap;
          return (
            <div key={fn.name} className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[fn.color]} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-bold font-mono text-sm">{fn.name}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase">
                        <CheckCircle className="w-3 h-3" /> {fn.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xl">{fn.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold">{fn.method}</span>
                      <span className="text-[10px] text-gray-500">Auth: {fn.auth}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {fn.features.map((f) => (
                        <span key={f} className="px-2 py-1 rounded-lg bg-dark-700/50 text-[10px] text-gray-400 font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invocation Guide */}
      <div className="glass-card rounded-2xl p-6 mt-8">
        <h2 className="text-sm font-bold text-white mb-3">Invocation URL</h2>
        <code className="block bg-dark-900/50 rounded-xl p-4 text-sm font-mono text-blue-400 overflow-x-auto">
          https://univyfkzocecqstdgtoy.supabase.co/functions/v1/{'<function-name>'}
        </code>
        <p className="text-xs text-gray-500 mt-3">
          Deploy with: <code className="text-gray-400">supabase functions deploy {'<function-name>'} --project-ref univyfkzocecqstdgtoy</code>
        </p>
      </div>
    </div>
  );
}
