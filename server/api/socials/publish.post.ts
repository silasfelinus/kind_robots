// /server/api/socials/[id]/publish.post.ts
//
// Dispatches automatable targets for a post. Manual platforms (Reddit/FB/IG)
// are never dispatched here — they're handled in the UI via copy + Mark Copied.
// dryRun returns the formatted variants without sending, so the dashboard and
// Cypress can preview through the same code path.

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

// ── Adapters ─────────────────────────────────────────────────────────────
// Each returns { remoteId?, remoteUrl? } on success or throws on failure.

async function dispatchDiscord(content: string): Promise<{ remoteId?: string }> {
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL not configured.')
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      // Never accidentally @everyone from user-generated content.
      allowed_mentions: { parse: [] },
    }),
  })
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`)
  }
  return {}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function dispatchMastodon(_content: string): Promise<{ remoteId?: string; remoteUrl?: string }> {
  // TODO: POST to {MASTODON_BASE}/api/v1/statuses with Bearer MASTODON_TOKEN.
  throw new Error('Mastodon adapter not yet wired.')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function dispatchBluesky(_content: string): Promise<{ remoteId?: string; remoteUrl?: string }> {
  // TODO: AT Protocol session + com.atproto.repo.createRecord.
  throw new Error('Bluesky adapter not yet wired.')
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

    const source = {
      title: post.title,
      body: post.body,
      url: null as string | null,
      media: (Array.isArray(post.mediaUrls) ? post.mediaUrls : []) as SocialMedia[],
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

    const results: Array<{ platform: SocialPlatform; status: string; error?: string }> = []

    for (const target of autoTargets) {
      const variant = formatForPlatform(target.platform, source)
      try {
        let remote: { remoteId?: string; remoteUrl?: string } = {}
        if (target.platform === ('DISCORD' as SocialPlatform)) {
          remote = await dispatchDiscord(variant.body)
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
        await prisma.socialTarget.updateMany({
          where: { postId: id, platform: target.platform },
          data: { status: 'FAILED', errorMessage: msg },
        })
        results.push({ platform: target.platform, status: 'FAILED', error: msg })
      }
    }

    // Post status: PUBLISHED if any sent, FAILED if all attempted failed.
    const anySent = results.some((r) => r.status === 'SENT')
    const finalStatus = anySent ? 'PUBLISHED' : autoTargets.length ? 'FAILED' : 'DRAFT'
    await prisma.socialPost.update({ where: { id }, data: { status: finalStatus } })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Publish complete. ${results.filter((r) => r.status === 'SENT').length} sent, ${results.filter((r) => r.status === 'FAILED').length} failed.`,
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
