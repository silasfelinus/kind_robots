// /server/utils/email.ts
// Brevo (Sendinblue) transactional email. All sends go through
// `sendTransactionalEmail`, which never throws — a mail outage must never turn
// an account action (register, password change, restrict) into a 500. Callers
// get `{ sent: boolean }` and can log/ignore as appropriate.
// `useRuntimeConfig` is auto-imported by Nitro (see server/utils/authGuard.ts).

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export type SendEmailInput = {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
}

export type SendEmailResult = { sent: boolean; skipped?: boolean; error?: string }

function brevoConfig() {
  const config = useRuntimeConfig()
  return {
    apiKey: String(config.brevoApiKey || ''),
    senderEmail: String(config.brevoSenderEmail || 'hello@kindrobots.org'),
    senderName: String(config.brevoSenderName || 'Kind Robots'),
    baseUrl: String(config.public?.appBaseUrl || 'https://kindrobots.org'),
  }
}

/** Public base URL used to build links inside emails. */
export function appBaseUrl(): string {
  return brevoConfig().baseUrl.replace(/\/$/, '')
}

export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const { apiKey, senderEmail, senderName } = brevoConfig()

  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — skipping send to', input.to)
    return { sent: false, skipped: true }
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: input.to, name: input.toName || input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text || stripHtml(input.html),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Brevo send failed (${res.status}):`, body)
      return { sent: false, error: `brevo ${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    console.error('[email] Brevo send threw:', err)
    return { sent: false, error: (err as Error)?.message || 'unknown' }
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// --- Shared shell ---------------------------------------------------------

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e6e6ef;">
      <h1 style="margin:0 0 16px;font-size:20px;">${title}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px;">
      <p style="font-size:12px;color:#8a8f9c;margin:0;">Kind Robots · a kinder corner of the internet 🦋</p>
    </div>
  </div>
</body></html>`
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;">${label}</a></p>
  <p style="font-size:13px;color:#8a8f9c;margin:0;">Or paste this link into your browser:<br><span style="word-break:break-all;">${href}</span></p>`
}

// --- Named helpers --------------------------------------------------------

export function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${appBaseUrl()}/api/auth/email/verify?token=${encodeURIComponent(token)}`
  return sendTransactionalEmail({
    to,
    toName: name,
    subject: 'Verify your Kind Robots email',
    html: shell(
      'Confirm your email',
      `<p>Hi ${escapeHtml(name)}, tap below to confirm this is your email address. The link expires in 48 hours.</p>${button(url, 'Verify email')}`,
    ),
  })
}

export function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`
  return sendTransactionalEmail({
    to,
    toName: name,
    subject: 'Reset your Kind Robots password',
    html: shell(
      'Reset your password',
      `<p>Hi ${escapeHtml(name)}, we got a request to reset your password. This link expires in 1 hour. If you didn't ask for this, you can safely ignore this email.</p>${button(url, 'Choose a new password')}`,
    ),
  })
}

export function sendNewsletterConfirmEmail(
  to: string,
  name: string,
  token: string,
  frequencyLabel: string,
) {
  const url = `${appBaseUrl()}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
  return sendTransactionalEmail({
    to,
    toName: name,
    subject: 'Confirm your Kind Robots updates',
    html: shell(
      'One more tap to subscribe',
      `<p>Hi ${escapeHtml(name)}, please confirm you'd like Kind Robots updates <strong>${escapeHtml(frequencyLabel)}</strong>. We only send what you ask for, and you can change or stop this any time from your account settings.</p>${button(url, 'Confirm subscription')}`,
    ),
  })
}

export function sendRestrictionNotice(to: string, name: string, reason?: string) {
  return sendTransactionalEmail({
    to,
    toName: name,
    subject: 'A change to your Kind Robots account',
    html: shell(
      'Your account visibility changed',
      `<p>Hi ${escapeHtml(name)}, a moderator has made your Kind Robots content private while we review your account. You can still sign in, but your posts and creations are hidden from the public directory for now.</p>${
        reason ? `<p style="color:#8a8f9c;font-size:14px;">Reason: ${escapeHtml(reason)}</p>` : ''
      }<p>Questions? Just reply to this email.</p>`,
    ),
  })
}

export function sendWelcomeEmail(to: string, name: string) {
  return sendTransactionalEmail({
    to,
    toName: name,
    subject: 'Welcome to Kind Robots 🦋',
    html: shell(
      'Welcome aboard',
      `<p>Hi ${escapeHtml(name)}, your account is ready. The robots are mostly house-trained.</p><p>Head to your account settings any time to verify your email, tune your privacy, or opt into updates.</p>${button(
        `${appBaseUrl()}/account`,
        'Open account settings',
      )}`,
    ),
  })
}

function escapeHtml(v: string): string {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
