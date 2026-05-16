import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, Loader2, Search, Plus, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Device } from '@/types/database'

const STATUS_STYLE: Record<string, string> = {
  in_use:               'bg-green-50 text-green-700',
  awaiting_transfer:    'bg-yellow-50 text-yellow-700',
  ready_for_disposal:   'bg-orange-50 text-orange-700',
  disposed:             'bg-blue-50 text-blue-600',
  flagged:              'bg-red-50 text-red-600',
}

const STATUS_OPTIONS = ['all', 'in_use', 'awaiting_transfer', 'ready_for_disposal', 'disposed', 'flagged']

export function ProductCataloguePage() {
  const { profile } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    if (!profile) return
    const { data } = await supabase
      .from('devices')
      .select('*')
      .eq('original_owner_id', profile.id)
      .order('created_at', { ascending: false })
    setDevices(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const filtered = devices.filter(d => {
    const matchSearch = !search ||
      d.brand.toLowerCase().includes(search.toLowerCase()) ||
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      (d.serial_number ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Manufacturer</p>
          <h1 className="text-2xl font-semibold">Device Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link
          to="/manufacturer/register"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white flex-shrink-0"
          style={{ background: '#0f1410' }}
        >
          <Plus className="w-4 h-4" />
          Register Device
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by brand, model, serial…"
            className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'bg-white border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Cpu className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== 'all' ? 'No devices match your filter.' : 'No devices registered yet.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link
              to="/manufacturer/register"
              className="mt-4 px-4 py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: '#0f1410' }}
            >
              Register your first device
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground w-8" />
            <span className="text-xs font-medium text-muted-foreground">Device</span>
            <span className="text-xs font-medium text-muted-foreground hidden md:block">Category</span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:block">Serial</span>
            <span className="text-xs font-medium text-muted-foreground">Status</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{device.brand} {device.model}</p>
                  <p className="text-xs text-muted-foreground">{new Date(device.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}</p>
                </div>

                <span className="text-xs text-muted-foreground hidden md:block">{device.category}</span>

                <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                  {device.serial_number ?? '—'}
                </span>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLE[device.status] ?? 'bg-gray-50 text-gray-600'}`}>
                  {device.status.replace(/_/g, ' ')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
