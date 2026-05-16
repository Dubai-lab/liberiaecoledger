import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Loader2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { ComplianceFlag } from '@/types/database'

const SEVERITY_STYLE: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const STATUS_STYLE: Record<string, string> = {
  open:          'bg-red-50 text-red-600',
  investigating: 'bg-yellow-50 text-yellow-700',
  resolved:      'bg-green-50 text-green-700',
  dismissed:     'bg-gray-50 text-gray-500',
}

const FLAG_TYPE_LABEL: Record<string, string> = {
  unauthorized_export:  'Unauthorized Export',
  informal_collector:   'Informal Collector',
  unverified_disposal:  'Unverified Disposal',
  missing_owner:        'Missing Owner Record',
}

export function FlaggedCasesPage() {
  const { profile } = useAuth()
  const [flags, setFlags] = useState<ComplianceFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadFlags = useCallback(async () => {
    const query = supabase.from('compliance_flags').select('*').order('created_at', { ascending: false })
    if (statusFilter !== 'all') query.eq('status', statusFilter)
    const { data } = await query
    setFlags(data ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { loadFlags() }, [loadFlags])

  const updateStatus = async (id: string, status: string) => {
    if (!profile) return
    setUpdating(id)
    const patch: Partial<ComplianceFlag> = { status: status as ComplianceFlag['status'] }
    if (status === 'resolved') {
      patch.resolved_by = profile.id
      patch.resolved_at = new Date().toISOString()
    }
    const { error } = await supabase.from('compliance_flags').update(patch).eq('id', id)
    if (error) { toast.error(error.message) }
    else {
      toast.success(`Flag marked as ${status}`)
      loadFlags()
    }
    setUpdating(null)
  }

  const raiseFlag = async () => {
    if (!profile) return
    const { error } = await supabase.from('compliance_flags').insert({
      flag_type: 'unverified_disposal',
      severity: 'medium',
      status: 'open',
      description: 'New compliance flag raised by regulator',
      reporter_id: profile.id,
      evidence_urls: [],
      stakeholders_looped: [],
    })
    if (error) { toast.error(error.message); return }
    toast.success('Flag raised')
    loadFlags()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Regulator</p>
          <h1 className="text-2xl font-semibold">Flagged Cases</h1>
        </div>
        <button
          type="button"
          onClick={raiseFlag}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors flex-shrink-0"
          style={{ background: '#0f1410' }}
        >
          <ShieldAlert className="w-4 h-4" />
          Raise Flag
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['open', 'investigating', 'resolved', 'dismissed', 'all'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              statusFilter === s
                ? 'bg-foreground text-background'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : flags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No {statusFilter !== 'all' ? statusFilter : ''} flags found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag, i) => (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white border border-border rounded-xl overflow-hidden"
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpanded(expanded === flag.id ? null : flag.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${flag.severity === 'critical' ? 'text-red-600' : 'text-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-medium">{FLAG_TYPE_LABEL[flag.flag_type] ?? flag.flag_type}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[flag.severity]}`}>
                      {flag.severity}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[flag.status]}`}>
                      {flag.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {new Date(flag.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                    {flag.description && ` · ${flag.description}`}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded === flag.id ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded detail */}
              {expanded === flag.id && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  <p className="text-sm text-foreground">{flag.description}</p>

                  {flag.status !== 'resolved' && flag.status !== 'dismissed' && (
                    <div className="flex gap-2 flex-wrap">
                      {flag.status === 'open' && (
                        <button
                          type="button"
                          disabled={updating === flag.id}
                          onClick={() => updateStatus(flag.id, 'investigating')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                        >
                          {updating === flag.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Investigating'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updating === flag.id}
                        onClick={() => updateStatus(flag.id, 'resolved')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-eco-50 text-eco-700 border border-eco-200 hover:bg-eco-100 transition-colors disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                      <button
                        type="button"
                        disabled={updating === flag.id}
                        onClick={() => updateStatus(flag.id, 'dismissed')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {flag.resolved_at && (
                    <p className="text-xs text-muted-foreground">
                      Resolved {new Date(flag.resolved_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
