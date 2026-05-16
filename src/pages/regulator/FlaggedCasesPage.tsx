import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Loader2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
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

function caseId(flag: ComplianceFlag) {
  const year = new Date(flag.created_at).getFullYear()
  const suffix = flag.id.replace(/-/g, '').slice(-4).toUpperCase()
  return `INV-${year}-${suffix}`
}

export function FlaggedCasesPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [flags, setFlags] = useState<ComplianceFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('open')
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
            <motion.button
              key={flag.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/regulator/flags/${flag.id}`)}
              className="w-full bg-white border border-border rounded-xl flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${flag.severity === 'critical' ? 'text-red-600' : 'text-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-medium text-foreground">{caseId(flag)}</p>
                  <span className="text-gray-300 text-xs">·</span>
                  <p className="text-sm text-muted-foreground">{FLAG_TYPE_LABEL[flag.flag_type] ?? flag.flag_type}</p>
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
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
