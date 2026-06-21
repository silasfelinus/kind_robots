// /server/api/socials/[id]/publish.post.ts
//
// Dispatches automatable targets for a post. Manual platforms (Reddit/FB/IG)
// are never dispatched here — they're handled in the UI via copy + Mark Copied.
// dryRun returns the formatted variants without sending, so the dashboard and
// Cypress can preview through the same code path.
//
// v1.1 changes:
//  - Discord now sends a rich embed (title/description/image) instead of a
//    raw content wall. First image-ish media URL becomes the embed image.
//  - Adapters that aren't wired yet throw NotWiredError -> target SKIPPED
//    (with a friendly note) instead of FAILED, so FAILED means a real failure.

import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import {
  formatForPlatform,
  isAutomatable,
  type SocialMedia,
} from '@/utils/social/formatSocialPost'
import type { SocialPlatform } from '~/prisma/generated/prisma/client'

type PublishBody = {
  platforms?: SocialPlatform[]
  dryRun?: boolean
}

// Thrown by adapters that exist in spirit but aren't wired yet.
// The loop turns this into SKIPPED, not FAILED.
class NotWiredError extends Error {}

// ── Adapters ─────────────────────────────────────────────────────────────
// Each returns { remoteId?, remoteUrl? } on success, throws NotWiredError if
// unbuilt, or throws a normal Error on a real failure.

function firstImageUrl(media: SocialMedia[]): string | undefined {
  const img = media.find(
    (m) =>
      m.type?.toLowerCase().includes('image') ||
      /\.(png|jpe?g|gif|webp)$/i.test(m.url),
  )
  return img?.url ?? media[0]?.url
}

async function dispatchDiscord(
  title: string,
  description: string,
  media: SocialMedia[],
): Promise<{ remoteId?: string }> {
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL not configured.')

  const image = firstImageUrl(media)
  const embed: Record<string, unknown> = {
    title: title.slice(0, 256), // Discord embed title cap
    description: description.slice(0, 4096), // embed description cap
    color: 0xff5fa2, // Kind Robots pink-ish; tweak to taste
  }
  if (image) embed.image = { url: image }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
      // Never accidentally @everyone from user-generated content.
      allowed_mentions: { parse: [] },
    }),
  })
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`)
  }
  return {}
}

async function dispatchMastodon(_content: string): Promise<{ remoteId?: string; remoteUrl?: string }> {
  // TODO: POST {MASTODON_BASE}/api/v1/statuses with Bearer MASTODON_TOKEN.
  // Media is a 2-step: upload to /api/v2/media, then attach media_ids.
  throw new NotWiredError('Mastodon adapter coming soon.')
}

async function dispatchBluesky(_content: string): Promise<{ remoteId?: string; remoteUrl?: string }> {
  // TODO: AT Protocol session + com.atproto.repo.createRecord, link facets.
  throw new NotWiredError('Bluesky adapter coming soon.')
}

export default defineEventHandler(async (event) => {
  let id: number | undefined
  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid SocialPost ID.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }

    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: { targets: true },
    })
    if (!post) {
      throw createError({ statusCode: 404, message: 'SocialPost not found.' })
    }
    if (post.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({ statusCode: 403, message: 'Not authorized to publish this post.' })
    }

    const { platforms, dryRun } = (await readBody<PublishBody>(event)) ?? {}

    // Resolve which targets to act on: requested ∩ existing, automatable only.
    const requested = platforms?.length
      ? post.targets.filter((t) => platforms.includes(t.platform))
      : post.targets
    const autoTargets = requested.filter((t) => isAutomatable(t.platform))

    const media = (Array.isArray(post.mediaUrls) ? post.mediaUrls : []) as SocialMedia[]
    const source = {
      title: post.title,
      body: post.body,
      url: null as string | null,
      media,
      hashtags: [] as string[],
    }

    // dryRun: return variants for ALL requested targets, send nothing.
    if (dryRun) {
      const variants = requested.map((t) => formatForPlatform(t.platform, source))
      return {
        success: true,
        message: `Dry run: ${variants.length} variant(s) generated.`,
        data: { dryRun: true, variants },
        statusCode: 200,
      }
    }

    await prisma.socialPost.update({ where: { id }, data: { status: 'PUBLISHING' } })

    const results: Array<{ platform: SocialPlatform; status: string; note?: string }> = []

    for (const target of autoTargets) {
      const variant = formatForPlatform(target.platform, source)
      try {
        let remote: { remoteId?: string; remoteUrl?: string } = {}
        if (target.platform === ('DISCORD' as SocialPlatform)) {
          remote = await dispatchDiscord(post.title, variant.body, media)
        } else if (target.platform === ('MASTODON' as SocialPlatform)) {
          remote = await dispatchMastodon(variant.body)
        } else if (target.platform === ('BLUESKY' as SocialPlatform)) {
          remote = await dispatchBluesky(variant.body)
        } else if (target.platform === ('RSS' as SocialPlatform)) {
          remote = {} // RSS is generated from the row; nothing to push.
        }

        await prisma.socialTarget.updateMany({
          where: { postId: id, platform: target.platform },
          data: {
            status: 'SENT',
            remoteId: remote.remoteId ?? null,
            remoteUrl: remote.remoteUrl ?? null,
            errorMessage: null,
            sentAt: new Date(),
          },
        })
        results.push({ platform: target.platform, status: 'SENT' })
      } catch (err) {
        const msg = (err as Error).message
        // Un-wired adapters skip honestly; real failures fail.
        const skipped = err instanceof NotWiredError
        await prisma.socialTarget.updateMany({
          where: { postId: id, platform: target.platform },
          data: {
            status: skipped ? 'SKIPPED' : 'FAILED',
            errorMessage: msg,
          },
        })
        results.push({
          platform: target.platform,
          status: skipped ? 'SKIPPED' : 'FAILED',
          note: msg,
        })
      }
    }

    // Post status: PUBLISHED if any genuinely sent; FAILED only if something
    // actually failed and nothing sent; otherwise back to DRAFT (all skipped).
    const anySent = results.some((r) => r.status === 'SENT')
    const anyFailed = results.some((r) => r.status === 'FAILED')
    const finalStatus = anySent ? 'PUBLISHED' : anyFailed ? 'FAILED' : 'DRAFT'
    await prisma.socialPost.update({ where: { id }, data: { status: finalStatus } })

    const sent = results.filter((r) => r.status === 'SENT').length
    const failed = results.filter((r) => r.status === 'FAILED').length
    const skippedCount = results.filter((r) => r.status === 'SKIPPED').length

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Publish complete. ${sent} sent, ${failed} failed, ${skippedCount} skipped.`,
      data: { results, status: finalStatus },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to publish SocialPost with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
