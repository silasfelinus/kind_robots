import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { authHasScope } from '@/server/utils/authGuard'
import { krea2GenerationGate } from '@/server/utils/krea2GenerationGate'
import {
  assertMatureForumWriteAllowed,
  forumPostSelect,
} from '@/server/utils/forumApi'
import {
  canManageForumV2Post,
  requireForumV2Writer,
} from '@/server/utils/agentForumV2'
import { assertAgentForumChannelAllowed } from '@/server/utils/agentForumPolicy'
import {
  assertJsonObject,
  assertOnlyFields,
  optionalString,
} from '@/server/utils/chatApi'
import { buildKrea2WorkflowFromRequest } from '@/server/api/comfy/krea2/utils/workflow'
import type { ForumArtGenerationContext } from '@/server/utils/forumGeneration'

const REQUEST_FIELDS = new Set(['prompt'])
const DEFAULT_STEPS = 8
const DEFAULT_CFG = 1
const DEFAULT_WIDTH = 1024
const DEFAULT_HEIGHT = 1024
const DEFAULT_SAMPLER = 'euler'
const DEFAULT_SCHEDULER = 'simple'
const MAX_PROMPT_LENGTH = 4000

function sourcePrompt(title: string | null, content: string): string {
  const source = [title?.trim(), content.trim()].filter(Boolean).join('\n\n')
  const prefix =
    'Create a new illustration that builds constructively on this public forum contribution. Preserve the useful idea, but make a distinct reusable work:\n\n'
  const room = Math.max(0, MAX_PROMPT_LENGTH - prefix.length)
  return `${prefix}${source.slice(0, room)}`
}

export default defineEventHandler(async (event) => {
  const postId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(postId) || postId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum post ID.' })
    }

    const actor = await requireForumV2Writer(event)
    if (!authHasScope(actor.auth, 'generation:art')) {
      throw createError({
        statusCode: 403,
        message:
          'This agent credential cannot spend generation resources. Add the explicit "generation:art" scope to a replacement credential.',
      })
    }

    const post = await prisma.chat.findFirst({
      where: {
        id: postId,
        type: 'ToForum',
        isPublic: true,
        isActive: true,
      },
      select: forumPostSelect,
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        message: `Public forum post ${postId} was not found.`,
      })
    }

    await assertAgentForumChannelAllowed(actor.auth, post.channel)
    assertMatureForumWriteAllowed(actor.auth, post.isMature)

    const rawBody = (await readBody<unknown>(event)) ?? {}
    assertJsonObject(rawBody, 'A JSON generation request body is required.')
    assertOnlyFields(rawBody, REQUEST_FIELDS, 'forum art generation request')

    const promptOverride = optionalString(
      rawBody.prompt,
      'prompt',
      MAX_PROMPT_LENGTH,
    )
    const promptString = promptOverride || sourcePrompt(post.title, post.content)

    // Forum Krea2 generation draws from the same canonical-human allowance as
    // Rainbow's ordinary Generate page. AgentProfile credentials remain useful
    // provenance, but connecting extra agents can never multiply the 10/day pool.
    const gate = await krea2GenerationGate(event, {
      steps: DEFAULT_STEPS,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    })

    if (gate.user.id !== actor.userId) {
      throw createError({
        statusCode: 403,
        message: 'Forum contributor and generation-balance owner do not match.',
      })
    }

    const { workflow } = buildKrea2WorkflowFromRequest({
      prompt: promptString,
      negativePrompt: null,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      steps: DEFAULT_STEPS,
      cfg: DEFAULT_CFG,
      seed: null,
      sampler: DEFAULT_SAMPLER,
      scheduler: DEFAULT_SCHEDULER,
      denoise: null,
      loraName: null,
      loraStrength: null,
      loras: null,
    })

    const managesSource = await canManageForumV2Post(actor.auth, post)
    const hasCanonicalObject = Boolean(
      post.ArtImage?.id || post.Project?.id || post.Character?.id,
    )
    const mode: 'attach' | 'contribute' =
      managesSource && !hasCanonicalObject ? 'attach' : 'contribute'
    const sourceBotId = post.botId ?? actor.botId

    const forumContext: ForumArtGenerationContext = {
      kind: 'forum-art',
      postId: post.id,
      threadId: post.originId ?? post.id,
      userId: actor.userId,
      botId: mode === 'attach' ? sourceBotId : actor.botId,
      agentProfileId: actor.agentProfileId,
      requestedAt: new Date().toISOString(),
      mode,
      actorDisplayName: actor.displayName,
      actorBotName: actor.botName,
      actorShadowRestricted: actor.shadowRestricted,
    }

    const payload = {
      workflow,
      promptString,
      save: {
        isPublic: !actor.shadowRestricted,
        isMature: post.isMature,
        designer: actor.displayName,
        artCollectionIds: [],
      },
      forumContext,
    }

    const outcome = await gate.enqueueArtJob(
      {
        engine: 'COMFY',
        payload: JSON.stringify(payload),
        priority: 100,
        projectSlug: 'rainbow-butterflies',
        userId: actor.userId,
      },
      'forum-art-enqueue',
    )
    const job = outcome.job

    event.node.res.statusCode = 201
    const capacityMessage =
      outcome.quotaMode === 'DEFERRED_FREE'
        ? ' Free public capacity is currently full, so this request will wait without charging tokens.'
        : outcome.quotaMode === 'PAID_TOKENS'
          ? ' The human liaison’s daily free Krea2 allowance is used, so this request uses paid tokens.'
          : ''

    return {
      success: true,
      message:
        (mode === 'contribute'
          ? 'Forum contribution queued. The finished ArtImage will be added as a new contribution in the source thread so the original object and provenance remain intact.'
          : 'Forum illustration queued. The finished ArtImage will attach to your source contribution.') +
        capacityMessage +
        ' Generation resource spending is not a charitable donation.',
      data: {
        jobId: job.id,
        status: job.status,
        postId: post.id,
        threadId: post.originId ?? post.id,
        mode,
        // Compatibility for existing clients. `charged` may be TOKENS on the
        // paid-overflow path, just as manaGate historically could fund art from
        // tokens; the explicit generation block below is the canonical v2 view.
        mana: {
          balance: outcome.balance,
          charged: outcome.charged,
        },
        generation: {
          engine: 'krea2',
          quotaMode: outcome.quotaMode,
          quota: outcome.quota,
          tokensCharged: outcome.charged,
          sharedAcrossAgents: true,
        },
      },
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
