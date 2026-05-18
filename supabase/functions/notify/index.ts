import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'
import {
  tplInvitation,
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
  tplFlagResolved,
  tplStakeholderFlagged,
  tplAuditorNewFlag,
  tplManufacturerDeviceRecycled,
  tplManufacturerDeviceFlagged,
} from '../_shared/templates.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const APP_URL = Deno.env.get('APP_URL') ?? 'https://liberiaecoledger.com'

async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle()
  return data as { full_name: string | null; email: string | null } | null
}

async function getAdmins(): Promise<{ id: string; email: string | null }[]> {
  const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin').eq('is_verified', true)
  if (!data) return []
  const ids = data.map((r: any) => r.user_id)
  const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', ids)
  return (profiles ?? []) as { id: string; email: string | null }[]
}

async function getAuditors(): Promise<{ id: string; email: string | null; full_name: string | null }[]> {
  const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'auditor').eq('is_verified', true)
  if (!data) return []
  const ids = data.map((r: any) => r.user_id)
  const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', ids)
  return (profiles ?? []) as { id: string; email: string | null; full_name: string | null }[]
}

async function getManufacturerByBrand(brand: string): Promise<{ id: string; email: string | null; full_name: string | null } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .ilike('organization', brand)
    .limit(1)
    .maybeSingle()
  return data as { id: string; email: string | null; full_name: string | null } | null
}

function displayName(p: { full_name: string | null; email: string | null } | null): string {
  return p?.full_name ?? p?.email ?? 'User'
}

async function saveNotification(
  userId: string,
  title: string,
  body: string,
  type: 'info' | 'warning' | 'action_required' | 'success',
  link: string | null = null,
) {
  await supabase.from('notifications').insert({ user_id: userId, title, body, type, is_read: false, link })
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload

    // ── Invitation created ────────────────────────────────────────────────────
    if (table === 'invitations' && type === 'INSERT') {
      const tpl = tplInvitation({
        email:      record.email,
        role:       record.role,
        organization: record.organization ?? '',
        token:      record.token,
        expiryDays: record.expiry_days ?? 7,
      })
      await sendEmail({ to: record.email, ...tpl })
    }

    // ── Device registered ─────────────────────────────────────────────────────
    if (table === 'device_lifecycle' && type === 'INSERT' && record.event_type === 'registered') {
      const { data: device } = await supabase
        .from('devices')
        .select('brand, model, imei, current_owner_id')
        .eq('id', record.device_id)
        .maybeSingle()
      if (device) {
        const owner = await getProfile(device.current_owner_id)
        const tpl = tplDeviceRegistered({
          name: displayName(owner),
          brand: device.brand,
          model: device.model,
          deviceId: record.device_id,
          imei: device.imei ?? undefined,
        })
        if (owner?.email) await sendEmail({ to: owner.email, ...tpl })
        await saveNotification(
          device.current_owner_id,
          `Device Registered — ${device.brand} ${device.model}`,
          `Your ${device.brand} ${device.model} has been registered on EcoLedger and its lifecycle is now tracked on the blockchain.`,
          'success',
          `${APP_URL}/consumer`,
        )
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
        await saveNotification(
          record.to_user_id,
          `Transfer Request — ${device.brand} ${device.model}`,
          `${displayName(sender)} wants to transfer a ${device.brand} ${device.model} to you. Log in to accept or decline.`,
          'action_required',
          `${APP_URL}/consumer`,
        )

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
        await saveNotification(
          record.from_user_id,
          `Transfer Initiated — ${device.brand} ${device.model}`,
          `Your transfer request has been sent to ${displayName(recipient)} and is awaiting acceptance.`,
          'info',
          `${APP_URL}/consumer`,
        )
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
          await saveNotification(
            record.to_user_id,
            `Transfer Completed — ${device.brand} ${device.model}`,
            `You are now the registered owner of the ${device.brand} ${device.model}.`,
            'success',
            `${APP_URL}/consumer`,
          )

          if (sender.email) {
            await sendEmail({
              to: sender.email,
              ...tplTransferCompleted({ name: displayName(sender), brand: device.brand, model: device.model, otherParty: displayName(recipient), isNewOwner: false }),
            })
          }
          await saveNotification(
            record.from_user_id,
            `Transfer Completed — ${device.brand} ${device.model}`,
            `Your ${device.brand} ${device.model} has been transferred to ${displayName(recipient)}.`,
            'success',
            `${APP_URL}/consumer`,
          )
        }

        if (record.status === 'rejected') {
          if (sender.email) {
            await sendEmail({
              to: sender.email,
              ...tplTransferDeclined({ senderName: displayName(sender), recipientName: displayName(recipient), brand: device.brand, model: device.model }),
            })
          }
          await saveNotification(
            record.from_user_id,
            `Transfer Declined — ${device.brand} ${device.model}`,
            `${displayName(recipient)} declined your transfer request. The device remains in your account.`,
            'warning',
            `${APP_URL}/consumer`,
          )
        }
      }
    }

    // ── EcoCredits earned ─────────────────────────────────────────────────────
    if (table === 'eco_credits' && type === 'INSERT' && (record.type === 'earned' || record.type === 'bonus')) {
      const owner = await getProfile(record.user_id)
      const { data: allCredits } = await supabase.from('eco_credits').select('amount, type').eq('user_id', record.user_id)
      const balance = (allCredits ?? []).reduce((s: number, c: any) => c.type === 'redeemed' ? s - c.amount : s + c.amount, 0)

      let brand = 'Your device', model = '', co2: number | undefined
      if (record.device_id) {
        const { data: device } = await supabase.from('devices').select('brand, model, co2_kg_avoided').eq('id', record.device_id).maybeSingle()
        if (device) { brand = device.brand; model = device.model; co2 = device.co2_kg_avoided }
      }

      const source: string = record.source ?? ''
      const notifBodies: Record<string, string> = {
        registration: `${brand}${model ? ' ' + model : ''} has been registered on EcoLedger. New balance: ${balance} EC.`,
        transfer:     `You transferred ${brand}${model ? ' ' + model : ''} to a new owner. New balance: ${balance} EC.`,
        disposal:     `${brand}${model ? ' ' + model : ''} has been responsibly recycled.${co2 ? ` ${co2} kg of CO₂ avoided.` : ''} New balance: ${balance} EC.`,
      }
      const notifBody = notifBodies[source] ?? `New balance: ${balance} EC.`

      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          ...tplEcoCreditsEarned({ name: displayName(owner), brand, model, credits: record.amount, balance, co2, source }),
        })
      }
      await saveNotification(
        record.user_id,
        `You earned ${record.amount} EcoCredits!`,
        notifBody,
        'success',
        `${APP_URL}/consumer/credits`,
      )
    }

    // ── Recycler facility submitted ───────────────────────────────────────────
    if (table === 'recycler_facilities' && type === 'INSERT') {
      const recycler = await getProfile(record.recycler_id)
      if (recycler?.email) {
        await sendEmail({ to: recycler.email, ...tplFacilitySubmitted({ name: displayName(recycler), facilityName: record.name }) })
      }
      await saveNotification(
        record.recycler_id,
        `Facility Submitted — ${record.name}`,
        `Your facility has been submitted for review. The admin team will verify and activate it within 2–3 business days.`,
        'info',
        `${APP_URL}/recycler/facility`,
      )

      const admins = await getAdmins()
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({ to: admin.email, ...tplNewFacilityAlert({ facilityName: record.name, recyclerEmail: recycler?.email ?? 'Unknown', city: record.location_city ?? 'Unknown' }) })
        }
        await saveNotification(
          admin.id,
          `New Facility Pending Approval — ${record.name}`,
          `A new recycling facility submitted by ${recycler?.email ?? 'Unknown'} in ${record.location_city ?? 'Unknown'} needs your review.`,
          'action_required',
          `${APP_URL}/admin/recyclers`,
        )
      }
    }

    // ── Recycler facility status updated ──────────────────────────────────────
    if (table === 'recycler_facilities' && type === 'UPDATE') {
      const recycler = await getProfile(record.recycler_id)
      if (old_record.is_active !== record.is_active) {
        if (recycler?.email) {
          const tpl = record.is_active
            ? tplFacilityApproved({ name: displayName(recycler), facilityName: record.name })
            : tplFacilityDeactivated({ name: displayName(recycler), facilityName: record.name })
          await sendEmail({ to: recycler.email, ...tpl })
        }
        if (record.is_active) {
          await saveNotification(
            record.recycler_id,
            `Facility Approved — ${record.name}`,
            `Your facility has been verified and is now active on EcoLedger. You can now log device disposals and issue EcoCredits.`,
            'success',
            `${APP_URL}/recycler`,
          )
        } else {
          await saveNotification(
            record.recycler_id,
            `Facility Deactivated — ${record.name}`,
            `Your facility has been deactivated and can no longer log disposals. Contact the admin team if you believe this is an error.`,
            'warning',
            `${APP_URL}/recycler/facility`,
          )
        }
      }

      if (old_record.is_basel_certified !== record.is_basel_certified) {
        if (recycler?.email) {
          const tpl = record.is_basel_certified
            ? tplBaselGranted({ name: displayName(recycler), facilityName: record.name })
            : tplBaselRevoked({ name: displayName(recycler), facilityName: record.name })
          await sendEmail({ to: recycler.email, ...tpl })
        }
        if (record.is_basel_certified) {
          await saveNotification(
            record.recycler_id,
            `Basel Certification Granted`,
            `${record.name} has been granted Basel Convention certification and is now authorized for cross-border e-waste transfers.`,
            'success',
            `${APP_URL}/recycler/facility`,
          )
        } else {
          await saveNotification(
            record.recycler_id,
            `Basel Certification Revoked`,
            `The Basel Convention certification for ${record.name} has been revoked. Cross-border transfer privileges are suspended.`,
            'warning',
            `${APP_URL}/recycler/facility`,
          )
        }
      }
    }

    // ── Compliance flag created ───────────────────────────────────────────────
    if (table === 'compliance_flags' && type === 'INSERT') {
      const reporterId = record.raised_by ?? record.reporter_id
      const regulator = await getProfile(reporterId)

      // Confirm to regulator
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
      if (reporterId) {
        await saveNotification(reporterId, `Compliance Flag Raised — ${record.severity.toUpperCase()}`,
          `Your compliance flag has been created and is now active. ${record.description}`, 'info', `${APP_URL}/regulator/flags`)
      }

      // Notify all auditors
      const auditors = await getAuditors()
      for (const auditor of auditors) {
        if (auditor.email) {
          await sendEmail({
            to: auditor.email,
            ...tplAuditorNewFlag({
              name: auditor.full_name ?? auditor.email ?? 'Auditor',
              flagType: record.flag_type ?? 'compliance',
              severity: record.severity,
              description: record.description,
              deviceId: record.device_id ?? undefined,
            }),
          })
        }
        await saveNotification(auditor.id, `New Compliance Flag — ${record.severity.toUpperCase()}`,
          `A new ${record.severity} compliance flag has been raised and requires audit review.`, 'action_required', `${APP_URL}/auditor/records`)
      }

      // Notify stakeholders looped in (recyclers, others)
      const stakeholders: string[] = Array.isArray(record.stakeholders_looped) ? record.stakeholders_looped : []
      for (const userId of stakeholders) {
        if (userId === reporterId) continue
        const stakeholder = await getProfile(userId)
        if (stakeholder?.email) {
          await sendEmail({
            to: stakeholder.email,
            ...tplStakeholderFlagged({
              name: displayName(stakeholder),
              severity: record.severity,
              description: record.description,
              deviceId: record.device_id ?? undefined,
            }),
          })
        }
        await saveNotification(userId, `Compliance Flag — Action May Be Required`,
          `You have been listed as a stakeholder on a ${record.severity} compliance flag. ${record.description}`, 'warning', `${APP_URL}/recycler`)
      }

      // Notify manufacturer if a device is involved
      if (record.device_id) {
        const { data: device } = await supabase.from('devices').select('brand, model').eq('id', record.device_id).maybeSingle()
        if (device) {
          const manufacturer = await getManufacturerByBrand(device.brand)
          if (manufacturer && manufacturer.email) {
            await sendEmail({
              to: manufacturer.email,
              ...tplManufacturerDeviceFlagged({
                name: displayName(manufacturer),
                brand: device.brand,
                model: device.model,
                severity: record.severity,
                description: record.description,
                deviceId: record.device_id,
              }),
            })
            await saveNotification(manufacturer.id, `Compliance Alert — ${device.brand} ${device.model}`,
              `A compliance flag has been raised against your device. Severity: ${record.severity.toUpperCase()}.`, 'warning', `${APP_URL}/manufacturer`)
          }
        }
      }
    }

    // ── Compliance flag resolved ──────────────────────────────────────────────
    if (table === 'compliance_flags' && type === 'UPDATE' &&
        old_record.status !== 'resolved' && record.status === 'resolved') {
      const reporterId = record.raised_by ?? record.reporter_id
      const regulator = await getProfile(reporterId)
      const resolver = record.resolved_by ? await getProfile(record.resolved_by) : null
      if (regulator?.email) {
        await sendEmail({
          to: regulator.email,
          ...tplFlagResolved({
            regulatorName: displayName(regulator),
            severity: record.severity,
            description: record.description,
            resolvedBy: displayName(resolver),
          }),
        })
      }
      if (reporterId) {
        await saveNotification(reporterId, `Compliance Flag Resolved`,
          `A compliance flag you raised (${record.severity.toUpperCase()}) has been marked as resolved by ${displayName(resolver)}.`,
          'success', `${APP_URL}/regulator/flags`)
      }
    }

    // ── Device marked ready for disposal → notify manufacturer ───────────────
    if (table === 'devices' && type === 'UPDATE' &&
        old_record.status !== 'ready_for_disposal' && record.status === 'ready_for_disposal') {
      const manufacturer = await getManufacturerByBrand(record.brand)
      if (manufacturer && manufacturer.email) {
        await sendEmail({
          to: manufacturer.email,
          ...tplManufacturerDeviceRecycled({
            name: displayName(manufacturer),
            brand: record.brand,
            model: record.model,
            deviceId: record.id,
          }),
        })
        await saveNotification(manufacturer.id, `Device Reached End of Life — ${record.brand} ${record.model}`,
          `Your ${record.brand} ${record.model} has been marked for recycling on EcoLedger.`, 'info', `${APP_URL}/manufacturer/analytics`)
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('notify error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
