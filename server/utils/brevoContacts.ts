// /server/utils/brevoContacts.ts
// Sync a user's newsletter opt-in state to a Brevo contact + list. Like
// email.ts, every call is best-effort and never throws: contact-sync failures
// must not break the account action that triggered them.
// `useRuntimeConfig` is auto-imported by Nitro (see server/utils/authGuard.ts).
import prisma from './prisma'
import type { NewsletterFrequency } from '~/prisma/generated/prisma/client'

const BREVO_CONTACTS = 'https://api.brevo.com/v3/contacts'

function cfg() {
  const config = useRuntimeConfig()
  return {
    apiKey: String(config.brevoApiKey || ''),
    listId: Number(config.brevoNewsletterListId || 0) || undefined,
  }
}

async function brevo(path: string, method: string, body?: unknown) {
  const { apiKey } = cfg()
  if (!apiKey) return { ok: false, skipped: true, status: 0 }

  try {
    const res = await fetch(`${BREVO_CONTACTS}${path}`, {
      method,
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { ok: res.ok, status: res.status, res }
  } catch (err) {
    console.error('[brevoContacts] request threw:', err)
    return { ok: false, status: 0 }
  }
}

type NewsletterUser = {
  id: number
  email: string | null
  name: string | null
  username: string
  newsletterFrequency: NewsletterFrequency
  newsletterConfirmedAt: Date | null
  brevoContactId: string | null
}

/**
 * Upsert the user as a Brevo contact and add/remove them from the newsletter
 * list based on confirmed opt-in state. Stores the returned contact id on the
 * user for future syncs. Best-effort.
 */
export async function syncBrevoContact(
  user: NewsletterUser,
): Promise<{ synced: boolean }> {
  const { apiKey, listId } = cfg()
  if (!apiKey || !user.email) return { synced: false }

  const subscribed =
    user.newsletterFrequency !== 'NEVER' && !!user.newsletterConfirmedAt

  const attributes = {
    FIRSTNAME: user.name || user.username,
    NEWSLETTER_FREQ: user.newsletterFrequency,
  }

  // Upsert contact. Brevo's create endpoint updates when updateEnabled=true.
  const result = await brevo('', 'POST', {
    email: user.email,
    attributes,
    updateEnabled: true,
    listIds: subscribed && listId ? [listId] : undefined,
    unlinkListIds: !subscribed && listId ? [listId] : undefined,
  })

  if (result.skipped) return { synced: false }

  // Capture the contact id once (Brevo returns it on create; on update it 204s).
  if (!user.brevoContactId && result.res && result.status < 300) {
    try {
      const data = (await result.res.json().catch(() => null)) as {
        id?: number
      } | null
      if (data?.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { brevoContactId: String(data.id) },
        })
      }
    } catch {
      /* non-fatal */
    }
  }

  return { synced: result.ok }
}

const FREQUENCY_LABELS: Record<NewsletterFrequency, string> = {
  NEVER: 'never',
  SPECIAL: 'only on very special occasions',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  DAILY: 'daily',
}

export function newsletterFrequencyLabel(freq: NewsletterFrequency): string {
  return FREQUENCY_LABELS[freq] ?? 'occasionally'
}
