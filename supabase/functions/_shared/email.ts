import { SmtpClient } from 'https://deno.land/x/denomailer@0.12.0/mod.ts'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const host = Deno.env.get('SMTP_HOST')!
  const port = Number(Deno.env.get('SMTP_PORT') ?? '587')
  const username = Deno.env.get('SMTP_USER')!
  const password = Deno.env.get('SMTP_PASS')!
  const from = Deno.env.get('SMTP_FROM') ?? username

  const client = new SmtpClient()

  if (port === 465) {
    await client.connectTLS({ hostname: host, port, username, password })
  } else {
    await client.connect({ hostname: host, port, username, password })
  }

  await client.send({ from, to, subject, content: 'auto', html })
  await client.close()
}
