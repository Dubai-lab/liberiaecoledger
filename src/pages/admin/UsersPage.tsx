import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2, ShieldCheck, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Profile, UserRole } from '@/types/database'

interface UserWithRoles extends Profile {
  roles: UserRole[]
}

const ROLE_COLORS: Record<UserRole, string> = {
  consumer:     'bg-gray-100 text-gray-600',
  manufacturer: 'bg-blue-100 text-blue-700',
  recycler:     'bg-green-100 text-green-700',
  regulator:    'bg-purple-100 text-purple-700',
  auditor:      'bg-yellow-100 text-yellow-700',
  admin:        'bg-red-100 text-red-700',
}

export function UsersPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  const loadUsers = useCallback(async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!profiles) { setLoading(false); return }

    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('user_id, role')

    const roleMap = new Map<string, UserRole[]>()
    for (const r of roleRows ?? []) {
      const existing = roleMap.get(r.user_id) ?? []
      roleMap.set(r.user_id, [...existing, r.role as UserRole])
    }

    setUsers(profiles.map(p => ({ ...p, roles: roleMap.get(p.id) ?? ['consumer'] })))
    setLoading(false)
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const promoteRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role,
      is_verified: true,
      metadata: {},
    })
    if (error) { toast.error(error.message); return }
    toast.success(`Role "${role}" assigned`)
    loadUsers()
  }

  const filtered = users.filter(u => {
    const matchQuery = !query || [u.email, u.full_name, u.organization]
      .some(v => v?.toLowerCase().includes(query.toLowerCase()))
    const matchRole = roleFilter === 'all' || u.roles.includes(roleFilter)
    return matchQuery && matchRole
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">Platform Admin</p>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} registered accounts</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email or org…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
          className="border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eco-700/20 focus:border-eco-700 transition-colors"
        >
          <option value="all">All roles</option>
          <option value="consumer">Consumer</option>
          <option value="manufacturer">Manufacturer</option>
          <option value="recycler">Recycler</option>
          <option value="regulator">Regulator</option>
          <option value="auditor">Auditor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <User className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No users found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#2f6b3a] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {(user.full_name ?? user.email ?? 'U').slice(0, 2).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-medium truncate">
                    {user.full_name ?? user.email ?? 'Unknown'}
                  </p>
                  {user.roles.map(r => (
                    <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r]}`}>
                      {r}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                  {user.organization && ` · ${user.organization}`}
                  {` · Joined ${new Date(user.created_at).toLocaleDateString('en-LR', { dateStyle: 'medium' })}`}
                </p>
              </div>

              {/* Quick role assign */}
              {!user.roles.includes('admin') && (
                <div className="flex-shrink-0">
                  <select
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) promoteRole(user.id, e.target.value as UserRole)
                      e.target.value = ''
                    }}
                    className="text-xs border border-border rounded-md px-2 py-1.5 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-eco-700/30 transition-colors"
                  >
                    <option value="" disabled>+ Add role</option>
                    {(['manufacturer', 'recycler', 'regulator', 'auditor', 'admin'] as UserRole[])
                      .filter(r => !user.roles.includes(r))
                      .map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
              {user.roles.includes('admin') && (
                <ShieldCheck className="w-4 h-4 text-eco-700 flex-shrink-0" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
