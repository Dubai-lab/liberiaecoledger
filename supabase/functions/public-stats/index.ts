import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const [devRes, recRes, lcRes, credRes, dispRes] = await Promise.all([
    supabase.from('devices').select('*', { count: 'exact', head: true }),
    supabase.from('recycler_facilities').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('device_lifecycle').select('*', { count: 'exact', head: true }),
    supabase.from('eco_credits').select('amount').in('type', ['earned', 'bonus']),
    supabase.from('device_lifecycle').select('*', { count: 'exact', head: true }).eq('event_type', 'disposed'),
  ])

  const creditsIssued = (credRes.data ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

  return new Response(JSON.stringify({
    devices:         devRes.count  ?? 0,
    recyclers:       recRes.count  ?? 0,
    lifecycleEvents: lcRes.count   ?? 0,
    creditsIssued,
    disposedCount:   dispRes.count ?? 0,
  }), { headers: CORS })
})
