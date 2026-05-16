import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Info, AlertTriangle, CheckCircle, Zap, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types/database'

const TYPE_META = {
  info:            { icon: <Info className="w-4 h-4" />,           bg: 'bg-blue-50',   text: 'text-blue-600' },
  warning:         { icon: <AlertTriangle className="w-4 h-4" />,  bg: 'bg-yellow-50', text: 'text-yellow-600' },
  action_required: { icon: <Zap className="w-4 h-4" />,            bg: 'bg-red-50',    text: 'text-red-600' },
  success:         { icon: <CheckCircle className="w-4 h-4" />,    bg: 'bg-green-50',  text: 'text-eco-700' },
}

export function NotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotifications(data ?? [])
        setLoading(false)
      })

    // Mark all as read
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(() => {})
  }, [profile])

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Consumer</p>
          <h1 className="text-2xl font-semibold">Notifications</h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-medium">
            {notifications.filter(n => !n.is_read).length} new
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">All caught up</h3>
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const meta = TYPE_META[n.type]
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                type="button"
                onClick={() => markRead(n.id)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  n.is_read
                    ? 'bg-white border-border'
                    : 'bg-white border-border shadow-sm ring-1 ring-eco-700/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg}`}>
                  <span className={meta.text}>{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-medium truncate ${n.is_read ? 'text-foreground' : 'text-foreground'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-eco-700 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(n.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}
                    {' · '}
                    {new Date(n.created_at).toLocaleTimeString('en-LR', { timeStyle: 'short' })}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
