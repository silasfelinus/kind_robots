// /server/api/stylist/receipt-email.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { sendTransactionalEmail } from '../../utils/email'

const INTERNAL_RECIPIENTS = [
  'hairbysuperkate@gmail.com',
  'silasfelinus@gmail.com',
] as const
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_SENDS = 10
const receiptSendsByUser = new Map<number, number[]>()

type ReceiptEmailBody = {
  date?: unknown
  clientName?: unknown
  servicesProvided?: unknown
  hours?: unknown
  rate?: unknown
  productCost?: unknown
  clientEmail?: unknown
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw createError({
      statusCode: 400,
      message: `Missing required field: ${label}.`,
    })
  }

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${label} must be ${maxLength} characters or fewer.`,
    })
  }

  return normalized
}

function optionalText(value: unknown, maxLength: number): string {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized.slice(0, maxLength)
}

function nonNegativeNumber(
  value: unknown,
  label: string,
  maximum: number,
): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) {
    throw createError({
      statusCode: 400,
      message: `${label} must be between 0 and ${maximum}.`,
    })
  }

  return parsed
}

function normalizeEmail(value: unknown): string {
  const email = requiredText(value, 'clientEmail', 254).toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      message: 'clientEmail must be a valid email address.',
    })
  }

  return email
}

function normalizeDate(value: unknown): string {
  const date = requiredText(value, 'date', 10)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({
      statusCode: 400,
      message: 'date must use YYYY-MM-DD format.',
    })
  }

  return date
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function enforceRateLimit(userId: number): void {
  const now = Date.now()
  const recent = (receiptSendsByUser.get(userId) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  )

  if (recent.length >= RATE_LIMIT_MAX_SENDS) {
    throw createError({
      statusCode: 429,
      message: 'Too many receipt emails were sent recently. Try again shortly.',
    })
  }

  recent.push(now)
  receiptSendsByUser.set(userId, recent)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    enforceRateLimit(auth.user.id)

    const body = (await readBody(event)) as ReceiptEmailBody | null
    const date = normalizeDate(body?.date)
    const clientName = requiredText(body?.clientName, 'clientName', 120)
    const servicesProvided = optionalText(body?.servicesProvided, 1000)
    const clientEmail = normalizeEmail(body?.clientEmail)
    const hours = nonNegativeNumber(body?.hours, 'hours', 48)
    const rate = nonNegativeNumber(body?.rate, 'rate', 5000)
    const productCost = nonNegativeNumber(
      body?.productCost,
      'productCost',
      50000,
    )
    const rateCents = Math.round(rate * 100)
    const productCostCents = Math.round(productCost * 100)
    const totalCents = Math.round(hours * rateCents) + productCostCents
    const subject = `Hair by Superkate receipt — ${date}`
    const serviceLine = servicesProvided
      ? `<p><strong>Services:</strong> ${escapeHtml(servicesProvided)}</p>`
      : ''
    const html = `
      <h1>Hair by Superkate</h1>
      <p>Hi ${escapeHtml(clientName)}!</p>
      <p>Thank you for your visit on ${escapeHtml(date)}.</p>
      ${serviceLine}
      <p><strong>Hours:</strong> ${hours}</p>
      <p><strong>Rate:</strong> ${formatMoney(rateCents)} per hour</p>
      <p><strong>Product cost:</strong> ${formatMoney(productCostCents)}</p>
      <p><strong>Total:</strong> ${formatMoney(totalCents)}</p>
      <p>Superkate loves you!</p>
    `
    const recipients = [...new Set([clientEmail, ...INTERNAL_RECIPIENTS])]
    const results = await Promise.all(
      recipients.map((to) =>
        sendTransactionalEmail({
          to,
          toName: to === clientEmail ? clientName : 'Hair by Superkate',
          subject,
          html,
        }),
      ),
    )
    const failed = results.filter((result) => !result.sent)

    if (failed.length > 0) {
      throw createError({
        statusCode: 502,
        message: 'Brevo could not deliver every receipt copy.',
      })
    }

    return {
      success: true,
      message: 'Receipt email sent.',
      statusCode: 200,
      data: {
        totalCents,
        sentCount: recipients.length,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to send the receipt email.',
      statusCode: handled.statusCode || 500,
    }
  }
})
