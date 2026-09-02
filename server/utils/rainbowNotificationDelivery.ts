import { sendTransactionalEmail } from './email'
import {
  planRainbowNotificationDelivery,
  type RainbowNotificationClass,
  type RainbowNotificationDeliveryReason,
} from './rainbowNotifications'

const RAINBOW_BASE_URL = 'https://rainbowbutterflies.org'

type AgentAttentionNotification = {
  userId: number
  notificationClass: 'AGENT_ATTENTION'
  agentName: string
  kind: string
  title: string
  body?: string | null
}

type ForumReplyNotification = {
  userId: number
  notificationClass: 'FORUM_REPLY_MENTION'
  actorName: string
  threadId: number
  threadTitle?: string | null
  excerpt?: string | null
  isMature?: boolean
}

type ScheduledAgentFailureNotification = {
  userId: number
  notificationClass: 'SCHEDULED_AGENT_FAILURE'
  agentName: string
  summary?: string | null
}

export type RainbowNotificationDeliveryInput =
  | AgentAttentionNotification
  | ForumReplyNotification
  | ScheduledAgentFailureNotification

export type RainbowNotificationSendReason =
  | RainbowNotificationDeliveryReason
  | 'SENT'
  | 'SEND_FAILED'
  | 'DELIVERY_ERROR'

export type RainbowNotificationSendResult = {
  sent: boolean
  skipped: boolean
  reason: RainbowNotificationSendReason
  error?: string
}

type EmailContent = {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function compactText(value: unknown, limit = 360): string {
  const clean = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length <= limit) return clean
  return `${clean.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e6e6ef;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">Rainbow Butterflies</p>
      <h1 style="margin:0 0 16px;font-size:20px;">${title}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px;">
      <p style="font-size:12px;color:#8a8f9c;margin:0;">Optional Rainbow notification · manage preferences on Rainbow Butterflies</p>
    </div>
  </div>
</body></html>`
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 0;"><a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;">${label}</a></p>`
}

function buildEmail(input: RainbowNotificationDeliveryInput): EmailContent {
  switch (input.notificationClass) {
    case 'AGENT_ATTENTION': {
      const agentName = compactText(input.agentName, 120) || 'Your agent'
      const title = compactText(input.title, 180) || 'Human attention requested'
      const detail = compactText(input.body)
      const kind = compactText(input.kind, 80)
      const href = `${RAINBOW_BASE_URL}/dashboard`
      return {
        subject: `Rainbow: ${agentName} needs your attention`,
        html: emailShell(
          'Your agent asked for human input',
          `<p><strong>${escapeHtml(agentName)}</strong> requested ${escapeHtml(kind || 'attention')}.</p><p><strong>${escapeHtml(title)}</strong></p>${
            detail ? `<p>${escapeHtml(detail)}</p>` : ''
          }${button(href, 'Open your Rainbow dashboard')}`,
        ),
        text: `${agentName} requested ${kind || 'attention'}: ${title}${detail ? `\n\n${detail}` : ''}\n\n${href}`,
      }
    }

    case 'FORUM_REPLY_MENTION': {
      const actorName = compactText(input.actorName, 120) || 'Someone'
      const threadTitle = compactText(input.threadTitle, 180)
      const excerpt = input.isMature ? '' : compactText(input.excerpt)
      const href = `${RAINBOW_BASE_URL}/#commons`
      return {
        subject: `Rainbow: ${actorName} replied to you`,
        html: emailShell(
          'New reply in the commons',
          `<p><strong>${escapeHtml(actorName)}</strong> replied${
            threadTitle ? ` in <strong>${escapeHtml(threadTitle)}</strong>` : ''
          }.</p>${
            input.isMature
              ? '<p>The reply is in a mature thread, so its content is not copied into email.</p>'
              : excerpt
                ? `<p>${escapeHtml(excerpt)}</p>`
                : ''
          }${button(href, 'Open the Rainbow commons')}`,
        ),
        text: `${actorName} replied to you${threadTitle ? ` in ${threadTitle}` : ''}.${
          input.isMature
            ? '\n\nThe reply is in a mature thread; open Rainbow to read it.'
            : excerpt
              ? `\n\n${excerpt}`
              : ''
        }\n\n${href}`,
      }
    }

    case 'SCHEDULED_AGENT_FAILURE': {
      const agentName = compactText(input.agentName, 120) || 'Your agent'
      const summary = compactText(input.summary)
      const href = `${RAINBOW_BASE_URL}/dashboard`
      return {
        subject: `Rainbow: ${agentName} scheduled run needs attention`,
        html: emailShell(
          'A scheduled agent run failed',
          `<p><strong>${escapeHtml(agentName)}</strong> reported a scheduled-run failure.</p>${
            summary ? `<p>${escapeHtml(summary)}</p>` : ''
          }${button(href, 'Open your Rainbow dashboard')}`,
        ),
        text: `${agentName} reported a scheduled-run failure.${summary ? `\n\n${summary}` : ''}\n\n${href}`,
      }
    }
  }
}

export async function deliverRainbowNotification(
  input: RainbowNotificationDeliveryInput,
): Promise<RainbowNotificationSendResult> {
  try {
    const decision = await planRainbowNotificationDelivery({
      userId: input.userId,
      notificationClass: input.notificationClass as RainbowNotificationClass,
    })

    const target = decision.targets.find((candidate) => candidate.transport === 'EMAIL')
    if (decision.reason !== 'READY' || !target) {
      return {
        sent: false,
        skipped: true,
        reason: decision.reason,
      }
    }

    const email = buildEmail(input)
    const result = await sendTransactionalEmail({
      to: target.address,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    if (result.sent) {
      return { sent: true, skipped: false, reason: 'SENT' }
    }

    return {
      sent: false,
      skipped: Boolean(result.skipped),
      reason: 'SEND_FAILED',
      error: result.error,
    }
  } catch (error) {
    console.error('[rainbow-notification] delivery failed:', error)
    return {
      sent: false,
      skipped: false,
      reason: 'DELIVERY_ERROR',
      error: error instanceof Error ? error.message : 'unknown',
    }
  }
}
