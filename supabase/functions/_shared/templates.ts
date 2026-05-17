const APP_URL = Deno.env.get('APP_URL') ?? 'https://liberiaecoledger.vercel.app'

function base(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:520px;">
      <tr><td align="center" style="padding-bottom:28px;">
        <div style="display:inline-block;background:#0f0f0e;width:52px;height:52px;border-radius:14px;text-align:center;line-height:52px;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-1px;">E</div>
        <p style="margin:10px 0 0;font-size:18px;font-weight:700;color:#0f0f0e;letter-spacing:-0.3px;">EcoLedger</p>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:20px;padding:36px 32px;">${content}</td></tr>
      <tr><td align="center" style="padding-top:24px;">
        <p style="margin:0;font-size:11px;color:#9b9b98;">EcoLedger · Liberia, West Africa · Sepolia</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0f0f0e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:12px;">${label}</a>`
}

function infoTable(rows: { label: string; value: string }[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e5de;border-radius:12px;overflow:hidden;margin-bottom:24px;">
    ${rows.map((r, i) => `
      <tr style="${i > 0 ? 'border-top:1px solid #f0ede6;' : ''}">
        <td style="padding:10px 14px;font-size:12px;color:#9b9b98;">${r.label}</td>
        <td style="padding:10px 14px;font-size:14px;font-weight:600;color:#0f0f0e;text-align:right;">${r.value}</td>
      </tr>`).join('')}
  </table>`
}

// ─── Invitation ──────────────────────────────────────────────────────────────

export function tplInvitation(o: { email: string; role: string; organization: string; token: string; expiryDays: number }) {
  const roleLabel: Record<string, string> = {
    regulator:    'Regulator',
    auditor:      'NGO / Auditor',
    manufacturer: 'Manufacturer',
    recycler:     'Recycler',
    admin:        'Platform Admin',
  }
  const label = roleLabel[o.role] ?? o.role
  return {
    subject: `Your EcoLedger Access Invitation — ${label}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">You've Been Invited</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        You have been invited to join the <strong>EcoLedger</strong> platform as a <strong>${label}</strong> on behalf of <strong>${o.organization}</strong>.
      </p>
      ${infoTable([
        { label: 'Your role',     value: label },
        { label: 'Organisation',  value: o.organization },
        { label: 'Access code',   value: `<strong style="font-size:16px;letter-spacing:1px;">${o.token}</strong>` },
        { label: 'Expires in',    value: `${o.expiryDays} day${o.expiryDays !== 1 ? 's' : ''}` },
      ])}
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0f0f0e;">How to use your code:</p>
      <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#6b7280;line-height:2.2;">
        <li>Visit the EcoLedger platform using the button below</li>
        <li>Click <strong>"Institutional / Invited access"</strong></li>
        <li>Enter your email address and the access code above</li>
        <li>Set your password and complete account setup</li>
      </ol>
      ${btn(`${APP_URL}/login/institutional`, 'Accept Invitation →')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">This code is personal — do not share it. It expires in ${o.expiryDays} day${o.expiryDays !== 1 ? 's' : ''}. If you believe you received this in error, you can safely ignore it.</p>
    `),
  }
}

// ─── Consumer ────────────────────────────────────────────────────────────────

export function tplDeviceRegistered(o: { name: string; brand: string; model: string; deviceId: string; imei?: string }) {
  const rows = [
    { label: 'Device', value: `${o.brand} ${o.model}` },
    { label: 'Record ID', value: o.deviceId.slice(-8).toUpperCase() },
    ...(o.imei ? [{ label: 'IMEI', value: o.imei }] : []),
  ]
  return {
    subject: `Device registered — ${o.brand} ${o.model}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Device Registered</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, your device has been successfully registered on EcoLedger and its lifecycle is now tracked on the blockchain.</p>
      ${infoTable(rows)}
      ${btn(`${APP_URL}/consumer`, 'View My Devices')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Every transfer and disposal event will be permanently recorded until end of life.</p>
    `),
  }
}

export function tplTransferRequest(o: { recipientName: string; senderName: string; brand: string; model: string; reason: string }) {
  return {
    subject: `${o.senderName} wants to transfer a device to you`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Transfer Request</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.recipientName}, <strong>${o.senderName}</strong> is transferring a device to you on EcoLedger.</p>
      ${infoTable([
        { label: 'Device', value: `${o.brand} ${o.model}` },
        { label: 'From', value: o.senderName },
        { label: 'Reason', value: o.reason },
      ])}
      ${btn(`${APP_URL}/consumer`, 'Accept or Decline')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Log in to your EcoLedger account to respond. This request expires in 7 days.</p>
    `),
  }
}

export function tplTransferSent(o: { senderName: string; recipientEmail: string; brand: string; model: string; reason: string }) {
  return {
    subject: `Transfer initiated — ${o.brand} ${o.model}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Transfer Initiated</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.senderName}, your transfer request has been sent and is awaiting acceptance.</p>
      ${infoTable([
        { label: 'Device', value: `${o.brand} ${o.model}` },
        { label: 'To', value: o.recipientEmail },
        { label: 'Reason', value: o.reason },
      ])}
      ${btn(`${APP_URL}/consumer`, 'View Transfer')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">You will be notified once the recipient accepts or declines.</p>
    `),
  }
}

export function tplTransferCompleted(o: { name: string; brand: string; model: string; otherParty: string; isNewOwner: boolean }) {
  const message = o.isNewOwner
    ? `you are now the registered owner of the <strong>${o.brand} ${o.model}</strong>.`
    : `your <strong>${o.brand} ${o.model}</strong> has been successfully transferred to ${o.otherParty}.`
  return {
    subject: `Transfer completed — ${o.brand} ${o.model}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Transfer Completed</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, ${message}</p>
      ${btn(`${APP_URL}/consumer`, 'View My Devices')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">This transfer has been recorded on the blockchain and is now part of the device's permanent lifecycle history.</p>
    `),
  }
}

export function tplTransferDeclined(o: { senderName: string; recipientName: string; brand: string; model: string }) {
  return {
    subject: `Transfer declined — ${o.brand} ${o.model}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Transfer Declined</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.senderName}, <strong>${o.recipientName}</strong> has declined your transfer request for the <strong>${o.brand} ${o.model}</strong>.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">The device remains in your account. You can initiate a new transfer at any time.</p>
      ${btn(`${APP_URL}/consumer/transfer`, 'Transfer Again')}
    `),
  }
}

export function tplEcoCreditsEarned(o: { name: string; brand: string; model: string; credits: number; balance: number; co2?: number; source?: string }) {
  const sourceMessages: Record<string, { intro: string; label: string }> = {
    registration: { intro: `Hi ${o.name}, your device has been registered on EcoLedger and you've been rewarded.`, label: 'Device registered' },
    transfer:     { intro: `Hi ${o.name}, you transferred your device to a new owner and you've been rewarded.`,   label: 'Device transferred' },
    disposal:     { intro: `Hi ${o.name}, your device has been responsibly recycled and you've been rewarded.`,    label: 'Device recycled' },
  }
  const msg = sourceMessages[o.source ?? ''] ?? { intro: `Hi ${o.name}, you earned EcoCredits on EcoLedger.`, label: 'Device' }

  return {
    subject: `You earned ${o.credits} EcoCredits!`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">EcoCredits Earned</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">${msg.intro}</p>
      <div style="background:#0f0f0e;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#6b6b68;letter-spacing:1px;text-transform:uppercase;">Credits Earned</p>
        <p style="margin:0 0 4px;font-size:36px;font-weight:700;color:#ffffff;">+${o.credits}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#9b9b98;">EcoCredits</p>
        <p style="margin:0;font-size:12px;color:#6b6b68;">New balance: <strong style="color:#ffffff;">${o.balance} EC</strong></p>
      </div>
      ${infoTable([
        { label: msg.label, value: `${o.brand} ${o.model}` },
        ...(o.co2 ? [{ label: 'CO₂ avoided', value: `${o.co2} kg` }] : []),
      ])}
      ${btn(`${APP_URL}/consumer/credits`, 'Cash Out Credits')}
    `),
  }
}

// ─── Recycler ─────────────────────────────────────────────────────────────────

export function tplFacilitySubmitted(o: { name: string; facilityName: string }) {
  return {
    subject: `Facility submitted — pending approval`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Facility Submitted</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, your recycling facility <strong>${o.facilityName}</strong> has been submitted for review.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">The EcoLedger admin team will verify your EPA license and activate your facility within 2–3 business days. You will receive an email once approved.</p>
    `),
  }
}

export function tplNewFacilityAlert(o: { facilityName: string; recyclerEmail: string; city: string }) {
  return {
    subject: `New facility pending approval — ${o.facilityName}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">New Facility Submitted</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">A new recycling facility is pending your approval.</p>
      ${infoTable([
        { label: 'Facility', value: o.facilityName },
        { label: 'City', value: o.city },
        { label: 'Submitted by', value: o.recyclerEmail },
      ])}
      ${btn(`${APP_URL}/admin/recyclers`, 'Review & Approve')}
    `),
  }
}

export function tplFacilityApproved(o: { name: string; facilityName: string }) {
  return {
    subject: `Facility approved — ${o.facilityName}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Facility Approved</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, great news! Your facility <strong>${o.facilityName}</strong> has been verified and is now active on EcoLedger.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">You can now log device disposals and issue EcoCredits to device owners.</p>
      ${btn(`${APP_URL}/recycler`, 'Go to Dashboard')}
    `),
  }
}

export function tplFacilityDeactivated(o: { name: string; facilityName: string }) {
  return {
    subject: `Facility deactivated — ${o.facilityName}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Facility Deactivated</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, your facility <strong>${o.facilityName}</strong> has been deactivated and can no longer log disposals.</p>
      <p style="margin:0 0 0;font-size:14px;color:#6b7280;">If you believe this is an error, please contact the EcoLedger admin team.</p>
    `),
  }
}

export function tplBaselGranted(o: { name: string; facilityName: string }) {
  return {
    subject: `Basel Convention certification granted`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Basel Certification Granted</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, <strong>${o.facilityName}</strong> has been granted Basel Convention certification on EcoLedger.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Your facility is now authorized for cross-border e-waste transfer and export activities.</p>
      ${btn(`${APP_URL}/recycler/facility`, 'View Facility Profile')}
    `),
  }
}

export function tplBaselRevoked(o: { name: string; facilityName: string }) {
  return {
    subject: `Basel Convention certification revoked`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Basel Certification Revoked</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, the Basel Convention certification for <strong>${o.facilityName}</strong> has been revoked.</p>
      <p style="margin:0 0 0;font-size:14px;color:#6b7280;">Cross-border e-waste transfer privileges have been suspended. Contact the admin team for more information.</p>
    `),
  }
}

// ─── Manufacturer ─────────────────────────────────────────────────────────────

export function tplManufacturerDeviceRecycled(o: { name: string; brand: string; model: string; deviceId: string }) {
  return {
    subject: `End-of-life reached — ${o.brand} ${o.model}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Device Reached End of Life</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, one of your registered devices has been marked for recycling on EcoLedger. This is part of your product's lifecycle compliance record.</p>
      ${infoTable([
        { label: 'Device', value: `${o.brand} ${o.model}` },
        { label: 'Record ID', value: o.deviceId.slice(-8).toUpperCase() },
        { label: 'Status', value: 'Ready for Disposal' },
      ])}
      ${btn(`${APP_URL}/manufacturer/analytics`, 'View Analytics')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">This event is permanently recorded on the EcoLedger blockchain for regulatory reporting.</p>
    `),
  }
}

export function tplManufacturerDeviceFlagged(o: { name: string; brand: string; model: string; severity: string; description: string; deviceId: string }) {
  return {
    subject: `Compliance alert — ${o.brand} ${o.model} flagged`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Compliance Alert</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, a compliance flag has been raised against one of your registered devices. Please review the details below.</p>
      ${infoTable([
        { label: 'Device', value: `${o.brand} ${o.model}` },
        { label: 'Record ID', value: o.deviceId.slice(-8).toUpperCase() },
        { label: 'Severity', value: o.severity.toUpperCase() },
        { label: 'Description', value: o.description },
      ])}
      ${btn(`${APP_URL}/manufacturer`, 'View Dashboard')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">If you have information relevant to this case, please contact the EcoLedger compliance team.</p>
    `),
  }
}

// ─── Auditor ──────────────────────────────────────────────────────────────────

export function tplAuditorNewFlag(o: { name: string; flagType: string; severity: string; description: string; deviceId?: string }) {
  const rows = [
    { label: 'Flag Type', value: o.flagType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    { label: 'Severity', value: o.severity.toUpperCase() },
    { label: 'Description', value: o.description },
    ...(o.deviceId ? [{ label: 'Device ID', value: o.deviceId.slice(-8).toUpperCase() }] : []),
  ]
  return {
    subject: `New compliance flag raised — ${o.severity.toUpperCase()}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">New Compliance Flag</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, a new compliance flag has been raised on EcoLedger and requires audit review.</p>
      ${infoTable(rows)}
      ${btn(`${APP_URL}/auditor/records`, 'Review in Audit Console')}
    `),
  }
}

// ─── Recycler (stakeholder) ───────────────────────────────────────────────────

export function tplStakeholderFlagged(o: { name: string; severity: string; description: string; deviceId?: string }) {
  const rows = [
    { label: 'Severity', value: o.severity.toUpperCase() },
    { label: 'Description', value: o.description },
    ...(o.deviceId ? [{ label: 'Device ID', value: o.deviceId.slice(-8).toUpperCase() }] : []),
  ]
  return {
    subject: `Compliance flag — you have been notified`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Compliance Flag — Action May Be Required</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.name}, you have been listed as a stakeholder on a compliance flag raised by a regulator on EcoLedger. Please review the details and cooperate with any investigation.</p>
      ${infoTable(rows)}
      ${btn(`${APP_URL}/recycler`, 'Go to Dashboard')}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">If you believe this is an error or have clarifying information, contact the EcoLedger compliance team.</p>
    `),
  }
}

// ─── Regulator ────────────────────────────────────────────────────────────────

export function tplFlagResolved(o: { regulatorName: string; severity: string; description: string; resolvedBy: string }) {
  return {
    subject: `Compliance flag resolved`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Compliance Flag Resolved</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.regulatorName}, a compliance flag you raised has been marked as resolved.</p>
      ${infoTable([
        { label: 'Severity', value: o.severity.toUpperCase() },
        { label: 'Description', value: o.description },
        { label: 'Resolved by', value: o.resolvedBy },
      ])}
      ${btn(`${APP_URL}/regulator/flags`, 'View All Flags')}
    `),
  }
}

export function tplFlagCreated(o: { regulatorName: string; deviceId?: string; facilityName?: string; severity: string; description: string }) {
  const rows = [
    { label: 'Severity', value: o.severity.toUpperCase() },
    ...(o.deviceId ? [{ label: 'Device ID', value: o.deviceId.slice(-8).toUpperCase() }] : []),
    ...(o.facilityName ? [{ label: 'Facility', value: o.facilityName }] : []),
    { label: 'Description', value: o.description },
  ]
  return {
    subject: `Compliance flag raised — ${o.severity.toUpperCase()}`,
    html: base(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0e;">Compliance Flag Raised</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${o.regulatorName}, your compliance flag has been created and is now active.</p>
      ${infoTable(rows)}
      ${btn(`${APP_URL}/regulator/flags`, 'View All Flags')}
    `),
  }
}
