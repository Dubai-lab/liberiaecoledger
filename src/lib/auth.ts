import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface SyncPrivyParams {
  privyToken: string
  email?: string
  walletAddress?: string
}

/**
 * Exchanges a Privy JWT for a real Supabase session.
 * Calls the `privy-auth` Edge Function which verifies the token,
 * creates/finds the user, then returns a magic-link hash we exchange here.
 */
export async function syncPrivyToSupabase({ privyToken, email, walletAddress }: SyncPrivyParams) {
  // Step 1: Call Edge Function to verify Privy JWT and get a session token
  const res = await fetch(`${SUPABASE_URL}/functions/v1/privy-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ privyToken, email, walletAddress }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Auth sync failed (${res.status})`)
  }

  const { token_hash, error } = await res.json()
  if (error) throw new Error(error)

  // Step 2: Exchange the magic-link hash for a real Supabase session
  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash,
    type: 'magiclink',
  })

  if (verifyError) throw verifyError

  return data.session
}
