import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'
import {
  tplDeviceRegistered,
  tplTransferRequest,
  tplTransferSent,
  tplTransferCompleted,
  tplTransferDeclined,
  tplEcoCreditsEarned,
  tplFacilitySubmitted,
  tplNewFacilityAlert,
  tplFacilityApproved,
  tplFacilityDeactivated,
  tplBaselGranted,
  tplBaselRevoked,
  tplFlagCreated,
} from '../_shared/templates.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle()
  return data as { full_name: string | null; email: string | null } | null
}

async function getAdminEmails(): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .eq('is_verified', true)
  if (!data) return []
  const ids = data.map((r: any) => r.user_id)
  const { data: profiles } = await supabase.from('profiles').select('email').in('id', ids)
  return (profiles ?? []).map((p: any) => p.email).filter(Boolean)
}

function displayName(p: { full_name: string | null; email: string | null } | null): string {
  return p?.full_name ?? p?.email ?? 'User'
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload

    // ── Device registered ─────────────────────────────────────────────────────
    if (table === 'device_lifecycle' && type === 'INSERT' && record.event_type === 'registered') {
      const { data: device } = await supabase
        .from('devices')
        .select('brand, model, imei, current_owner_id')
        .eq('id', record.device_id)
        .maybeSingle()
      if (device) {
        const owner = await getProfile(device.current_owner_id)
        if (owner?.email) {
          const tpl = tplDeviceRegistered({
            name: displayName(owner),
            brand: device.brand,
            model: device.model,
            deviceId: record.device_id,
            imei: device.imei ?? undefined,
          })
          await sendEmail({ to: owner.email, ...tpl })
        }
      }
    }

    // ── Transfer created ──────────────────────────────────────────────────────
    if (table === 'transfers' && type === 'INSERT') {
      const { data: device } = await supabase
        .from('devices')
        .select('brand, model')
        .eq('id', record.device_id)
        .maybeSingle()
      const sender = await getProfile(record.from_user_id)
      const recipient = await getProfile(record.to_user_id)

      if (device && sender && recipient) {
        if (recipient.email) {
          await sendEmail({
            to: recipient.email,
            ...tplTransferRequest({
              recipientName: displayName(recipient),
              senderName: displayName(sender),
              brand: device.brand,
              model: device.model,
              reason: record.reason,
            }),
          })
        }
        if (sender.email) {
          await sendEmail({
            to: sender.email,
            ...tplTransferSent({
              senderName: displayName(sender),
              recipientEmail: recipient.email ?? record.to_user_id,
              brand: device.brand,
              model: device.model,
              reason: record.reason,
            }),
          })
        }
      }
    }

    // ── Transfer status updated ───────────────────────────────────────────────
    if (table === 'transfers' && type === 'UPDATE' && old_record.status !== record.status) {
      const { data: device } = await supabase
        .from('devices')
        .select('brand, model')
        .eq('id', record.device_id)
        .maybeSingle()
      const sender = await getProfile(record.from_user_id)
      const recipient = await getProfile(record.to_user_id)

      if (device && sender && recipient) {
        if (record.status === 'confirmed') {
          if (recipient.email) {
            await sendEmail({
              to: recipient.email,
              ...tplTransferCompleted({ name: displayName(recipient), brand: device.brand, model: device.model, otherParty: displayName(sender), isNewOwner: true }),
            })
          }
          if (sender.email) {
            await sendEmail({
              to: sender.email,
              ...tplTransferCompleted({ name: displayName(sender), brand: device.brand, model: device.model, otherParty: displayName(recipient), isNewOwner: false }),
            })
          }
        }
        if (record.status === 'rejected' && sender.email) {
          await sendEmail({
            to: sender.email,
            ...tplTransferDeclined({ senderName: displayName(sender), recipientName: displayName(recipient), brand: device.brand, model: device.model }),
          })
        }
      }
    }

    // ── EcoCredits earned ─────────────────────────────────────────────────────
    if (table === 'eco_credits' && type === 'INSERT' && (record.type === 'earned' || record.type === 'bonus')) {
      const owner = await getProfile(record.user_id)
      if (owner?.email) {
        const { data: allCredits } = await supabase.from('eco_credits').select('amount, type').eq('user_id', record.user_id)
        const balance = (allCredits ?? []).reduce((s: number, c: any) => c.type === 'redeemed' ? s - c.amount : s + c.amount, 0)

        let brand = 'Your device', model = '', co2: number | undefined
        if (record.device_id) {
          const { data: device } = await supabase.from('devices').select('brand, model, co2_kg_avoided').eq('id', record.device_id).maybeSingle()
          if (device) { brand = device.brand; model = device.model; co2 = device.co2_kg_avoided }
        }

        await sendEmail({
          to: owner.email,
          ...tplEcoCreditsEarned({ name: displayName(owner), brand, model, credits: record.amount, balance, co2 }),
        })
      }
    }

    // ── Recycler facility submitted ───────────────────────────────────────────
    if (table === 'recycler_facilities' && type === 'INSERT') {
      const recycler = await getProfile(record.recycler_id)
      if (recycler?.email) {
        await sendEmail({ to: recycler.email, ...tplFacilitySubmitted({ name: displayName(recycler), facilityName: record.name }) })
      }
      const adminEmails = await getAdminEmails()
      for (const email of adminEmails) {
        await sendEmail({ to: email, ...tplNewFacilityAlert({ facilityName: record.name, recyclerEmail: recycler?.email ?? 'Unknown', city: record.location_city ?? 'Unknown' }) })
      }
    }

    // ── Recycler facility status updated ──────────────────────────────────────
    if (table === 'recycler_facilities' && type === 'UPDATE') {
      const recycler = await getProfile(record.recycler_id)
      if (recycler?.email) {
        if (old_record.is_active !== record.is_active) {
          const tpl = record.is_active
            ? tplFacilityApproved({ name: displayName(recycler), facilityName: record.name })
            : tplFacilityDeactivated({ name: displayName(recycler), facilityName: record.name })
          await sendEmail({ to: recycler.email, ...tpl })
        }
        if (old_record.is_basel_certified !== record.is_basel_certified) {
          const tpl = record.is_basel_certified
            ? tplBaselGranted({ name: displayName(recycler), facilityName: record.name })
            : tplBaselRevoked({ name: displayName(recycler), facilityName: record.name })
          await sendEmail({ to: recycler.email, ...tpl })
        }
      }
    }

    // ── Compliance flag created ───────────────────────────────────────────────
    if (table === 'compliance_flags' && type === 'INSERT') {
      const regulator = await getProfile(record.raised_by)
      if (regulator?.email) {
        await sendEmail({
          to: regulator.email,
          ...tplFlagCreated({
            regulatorName: displayName(regulator),
            deviceId: record.device_id ?? undefined,
            severity: record.severity,
            description: record.description,
          }),
        })
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('notify error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
