import nodemailer from 'npm:nodemailer@6.9.16'

// Spacemail: mail.spacemail.com, port 587 (STARTTLS) or 465 (implicit TLS); user = full mailbox address.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransport() {
  if (transporter) return transporter
  const host = Deno.env.get('SMTP_HOST')
  const user = Deno.env.get('SMTP_USER')
  const pass = Deno.env.get('SMTP_PASS')
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS function secrets')
  }
  const port = Number(Deno.env.get('SMTP_PORT') ?? '587')
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,      // 465 = TLS from the start
    requireTLS: port !== 465,  // 587 = upgrade with STARTTLS
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
  return transporter
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const user = Deno.env.get('SMTP_USER')!
  const from = Deno.env.get('SMTP_FROM') ?? `EcoLedger <${user}>`
  try {
    const info = await getTransport().sendMail({ from, to, subject, html })
    // Some servers accept the message but reject individual recipients
    if (info.rejected?.length) throw new Error(`Recipient rejected by SMTP server: ${info.rejected.join(', ')}`)
    console.log(`[email] sent "${subject}" to ${to} (${info.messageId})`)
    return info
  } catch (err) {
    console.error(`[email] FAILED "${subject}" to ${to}:`, err)
    throw new Error(`Email to ${to} could not be sent: ${err instanceof Error ? err.message : String(err)}`)
  }
}
