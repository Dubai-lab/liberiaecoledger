import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { privyToken, email, walletAddress } = await req.json()

    if (!privyToken) {
      return new Response(
        JSON.stringify({ error: 'privyToken is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 1. Verify the Privy JWT using Privy's public JWKS ──────────────
    const privyAppId = Deno.env.get('PRIVY_APP_ID')!
    const JWKS = createRemoteJWKSet(
      new URL(`https://auth.privy.io/api/v1/apps/${privyAppId}/jwks.json`)
    )

    let privyUserId: string
    try {
      const { payload } = await jwtVerify(privyToken, JWKS, {
        issuer: 'privy.io',
        audience: privyAppId,
      })
      privyUserId = payload.sub as string
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired Privy token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Build Supabase admin client ──────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── 3. Find or create Supabase auth user ────────────────────────────
    const userEmail = email ?? `${privyUserId.replace(/[^a-z0-9]/gi, '')}@privy.ecoledger.io`

    // Check if profile already exists for this privy_id
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, supabase_uid, email')
      .eq('privy_id', privyUserId)
      .maybeSingle()

    let supabaseUid: string

    if (existingProfile?.supabase_uid) {
      // Returning user — update wallet if provided
      supabaseUid = existingProfile.supabase_uid
      if (walletAddress) {
        await adminClient
          .from('profiles')
          .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
          .eq('privy_id', privyUserId)
      }
    } else {
      // New user — create Supabase auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        app_metadata: { privy_id: privyUserId, provider: 'privy' },
      })

      if (createError) {
        // Email already registered under a different privy_id — link them
        if (createError.message.includes('already registered')) {
          const { data: { users } } = await adminClient.auth.admin.listUsers()
          const found = users?.find(u => u.email === userEmail)
          if (!found) throw new Error('Cannot resolve existing user')
          supabaseUid = found.id
        } else {
          throw createError
        }
      } else {
        supabaseUid = newUser.user!.id
      }

      // Link privy_id + wallet to the auto-created profile (from the DB trigger)
      await adminClient
        .from('profiles')
        .update({
          privy_id: privyUserId,
          wallet_address: walletAddress ?? null,
          email: userEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('supabase_uid', supabaseUid)
    }

    // ── 4. Generate a one-time magic link token (no email is sent) ──────
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      throw linkError ?? new Error('Failed to generate session token')
    }

    // ── 5. Return token hash — frontend exchanges it for a session ───────
    return new Response(
      JSON.stringify({
        token_hash: linkData.properties.hashed_token,
        email: userEmail,
        privy_id: privyUserId,
        wallet_address: walletAddress ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[privy-auth]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
