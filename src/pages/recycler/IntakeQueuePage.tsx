import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Device } from '@/types/database'

export function IntakeQueuePage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('devices')
      .select('*')
      .eq('status', 'ready_for_disposal')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setDevices((data as Device[]) ?? [])
        setLoading(false)
      })
  }, [])

  const acceptDevice = async (deviceId: string) => {
    setAccepting(deviceId)
    const { error } = await supabase
      .from('devices')
      .update({ status: 'ready_for_disposal' })
      .eq('id', deviceId)

    if (error) {
      toast.error(error.message)
    } else {
      setDevices(prev => prev.filter(d => d.id !== deviceId))
      toast.success('Device accepted â€” it will now appear in Log Disposal')
    }
    setAccepting(null)
  }

  const HAZARD_LABELS: Record<string, string> = {
    none: 'None', li_ion_battery: 'Li-Ion', toner: 'Toner',
    mercury_ccfl: 'Mercury', mixed: 'Mixed',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Recycler</p>
        <h1 className="text-2xl font-semibold">Intake Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Devices registered as ready for disposal. Accept them into your facility before logging a disposal event.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">Queue is empty</h3>
          <p className="text-sm text-muted-foreground">
            No devices are currently marked as ready for disposal.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-medium">{d.brand} {d.model}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {d.category}
                  </span>
                  {d.hazard_class !== 'none' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                      âš  {HAZARD_LABELS[d.hazard_class]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.serial_number && `SN: ${d.serial_number} Â· `}
                  {d.manufacture_year && `Mfg: ${d.manufacture_year} Â· `}
                  Status: <span className="capitalize">{d.status.replace(/_/g, ' ')}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => acceptDevice(d.id)}
                disabled={accepting === d.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-eco-700 text-eco-700 hover:bg-eco-50 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {accepting === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Accept into facility
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
