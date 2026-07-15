// /server/api/socials/[id]/publish.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { parseSocialMedia } from '@/server/utils/socialMedia'
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

class NotWiredError extends Error {}

function firstImageUrl(media: SocialMedia[]): string | undefined {
  const image = media.find(
    (item) =>
      item.type?.toLowerCase().includes('image') ||
      /\.(png|jpe?g|gif|webp)$/i.test(item.url),
  )
  return image?.url ?? media[0]?.url
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
    title: title.slice(0, 256),
    description: description.slice(0, 4_096),
    color: 0xff5fa2,
  }
  if (image) embed.image = { url: image }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
      allowed_mentions: { parse: [] },
    }),
  })
  if (!response.ok) {
    throw new Error(
      `Discord webhook failed: ${response.status} ${response.statusText}`,
    )
  }
  return {}
}

async function dispatchMastodon(
  _content: string,
): Promise<{ remoteId?: string; remoteUrl?: string }> {
  throw new NotWiredError('Mastodon adapter coming soon.')
}

async function dispatchBluesky(
  _content: string,
): Promise<{ remoteId?: string; remoteUrl?: string }> {
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
      throw createError({
        statusCode: 403,
        message: 'Not authorized to publish this post.',
      })
    }

    const { platforms, dryRun } = (await readBody<PublishBody>(event)) ?? {}
    const requested = platforms?.length
      ? post.targets.filter((target) => platforms.includes(target.platform))
      : post.targets
    const autoTargets = requested.filter((target) =>
      isAutomatable(target.platform),
    )

    const media = parseSocialMedia<SocialMedia>(post.mediaUrls)
    const source = {
      title: post.title,
      body: post.body,
      url: null as string | null,
      media,
      hashtags: [] as string[],
    }

    if (dryRun) {
      const variants = requested.map((target) =>
        formatForPlatform(target.platform, source),
      )
      return {
        success: true,
        message: `Dry run: ${variants.length} variant(s) generated.`,
        data: { dryRun: true, variants },
        statusCode: 200,
      }
    }

    await prisma.socialPost.update({
      where: { id },
      data: { status: 'PUBLISHING' },
    })

    const results: Array<{
      platform: SocialPlatform
      status: string
      note?: string
    }> = []

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
          remote = {}
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
      } catch (error) {
        const message = (error as Error).message
        const skipped = error instanceof NotWiredError
        await prisma.socialTarget.updateMany({
          where: { postId: id, platform: target.platform },
          data: {
            status: skipped ? 'SKIPPED' : 'FAILED',
            errorMessage: message,
          },
        })
        results.push({
          platform: target.platform,
          status: skipped ? 'SKIPPED' : 'FAILED',
          note: message,
        })
      }
    }

    const anySent = results.some((result) => result.status === 'SENT')
    const anyFailed = results.some((result) => result.status === 'FAILED')
    const finalStatus = anySent ? 'PUBLISHED' : anyFailed ? 'FAILED' : 'DRAFT'
    await prisma.socialPost.update({
      where: { id },
      data: { status: finalStatus },
    })

    const sent = results.filter((result) => result.status === 'SENT').length
    const failed = results.filter((result) => result.status === 'FAILED').length
    const skippedCount = results.filter(
      (result) => result.status === 'SKIPPED',
    ).length

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
      message:
        handled.message || `Failed to publish SocialPost with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
