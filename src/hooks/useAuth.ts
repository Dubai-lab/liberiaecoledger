import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { syncPrivyToSupabase } from '@/lib/auth'
import type { Profile, UserRole } from '@/types/database'

// If Privy doesn't become ready within this many ms, fall back to
// checking a native Supabase session (so email+password users aren't blocked).
const PRIVY_READY_TIMEOUT_MS = 8000

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  profile: Profile | null
  activeRole: UserRole | null
}

export function useAuth() {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy()
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    profile: null,
    activeRole: null,
  })
  const syncing = useRef(false)
  const profileFetching = useRef(false)
  // Keep a ref so the sync effect doesn't re-fire when Privy regenerates the function reference
  const getTokenRef = useRef(getAccessToken)
  useEffect(() => { getTokenRef.current = getAccessToken }, [getAccessToken])

  // Load profile from whichever Supabase session is currently active.
  // Guard against concurrent calls — multiple effects (Privy, onAuthStateChange, fallback timer)
  // can fire simultaneously; without this the component re-renders on each call and blinks.
  const loadProfile = useCallback(async () => {
    if (profileFetching.current) return
    profileFetching.current = true
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setState({ isLoading: false, isAuthenticated: false, profile: null, activeRole: null })
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('supabase_uid', session.user.id)
        .maybeSingle()

      if (error) console.error('[useAuth] profile load:', error.message)

      setState({
        isLoading: false,
        isAuthenticated: true,
        profile: data ?? null,
        activeRole: data?.active_role ?? 'consumer',
      })
    } finally {
      profileFetching.current = false
    }
  }, [])

  // Fallback: if Privy never becomes ready (no network), load from Supabase directly
  useEffect(() => {
    if (ready) return
    const timer = setTimeout(() => {
      if (!ready) loadProfile()
    }, PRIVY_READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [ready, loadProfile])

  // React to Privy auth state changes
  useEffect(() => {
    if (!ready) return

    if (!authenticated || !user) {
      // Privy not active — check if a native Supabase session exists
      // (email+password users don't go through Privy at all)
      loadProfile()
      return
    }

    if (syncing.current) return
    syncing.current = true

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // No Supabase session yet — exchange Privy JWT for one.
          // Cross-device wallet connect (QR scan) can take 10–15 s to finalise.
          // Use the ref so this loop doesn't re-trigger the outer effect.
          let token: string | null = null
          for (let attempt = 0; attempt < 10; attempt++) {
            token = await getTokenRef.current()
            if (token) break
            await new Promise(r => setTimeout(r, 1500))
          }
          if (!token) throw new Error('No Privy access token')

          const email = user.email?.address
          const wallet =
            user.wallet?.address ??
            (user.linkedAccounts as Array<{ type: string; address?: string }>)
              ?.find(a => a.type === 'wallet')?.address

          await syncPrivyToSupabase({ privyToken: token, email, walletAddress: wallet })
        }

        await loadProfile()
      } catch (err) {
        console.error('[useAuth] Privy→Supabase sync failed:', err)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Native Supabase session (email+password) is still valid — don't wipe it
          await loadProfile()
        } else {
          // Stale/invalid Privy wallet session — clear it so the user gets a fresh modal
          try { await logout() } catch { /* ignore */ }
          setState({ isLoading: false, isAuthenticated: false, profile: null, activeRole: null })
        }
      } finally {
        syncing.current = false
      }
    })()
  }, [ready, authenticated, user, loadProfile])

  // React to Supabase native auth changes (email+password sign-in, token refresh, sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setState({ isLoading: false, isAuthenticated: false, profile: null, activeRole: null })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadProfile()
      }
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const switchRole = async (role: UserRole) => {
    if (!state.profile) return
    await supabase.from('profiles').update({ active_role: role }).eq('id', state.profile.id)
    setState(prev => ({
      ...prev,
      activeRole: role,
      profile: prev.profile ? { ...prev.profile, active_role: role } : null,
    }))
  }

  const signOut = async () => {
    setState({ isLoading: false, isAuthenticated: false, profile: null, activeRole: null })
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    try { if (authenticated) await logout() } catch { /* ignore */ }
  }

  return { ...state, switchRole, signOut, refetch: loadProfile }
}
