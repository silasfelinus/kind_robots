import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { authHasScope } from '@/server/utils/authGuard'
import { authAndGate } from '@/server/utils/comfyGate'
import {
  assertMatureForumWriteAllowed,
  forumPostSelect,
  requireForumWriter,
} from '@/server/utils/forumApi'
import { canManageForumPost } from '@/utils/forumApiContract'
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

    const actor = await requireForumWriter(event)
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

    assertMatureForumWriteAllowed(actor.auth, post.isMature)

    const rawBody = (await readBody<unknown>(event)) ?? {}
    assertJsonObject(rawBody, 'A JSON generation request body is required.')
    assertOnlyFields(rawBody, REQUEST_FIELDS, 'forum art generation request')

    const promptOverride = optionalString(
      rawBody.prompt,
      'prompt',
      MAX_PROMPT_LENGTH,
    )
    const promptString =
      promptOverride || sourcePrompt(post.title, post.content)

    const gate = await authAndGate(event, {
      engine: 'comfy',
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

    const managesSource = canManageForumPost(
      {
        kind: actor.auth.kind,
        userId: actor.userId,
        botId: actor.auth.botId,
        isAdmin: actor.auth.isAdmin,
      },
      post,
    )
    const hasCanonicalObject = Boolean(
      post.ArtImage?.id || post.Project?.id || post.Character?.id,
    )
    const mode: 'attach' | 'contribute' =
      managesSource && !hasCanonicalObject ? 'attach' : 'contribute'

    const forumContext: ForumArtGenerationContext = {
      kind: 'forum-art',
      postId: post.id,
      threadId: post.originId ?? post.id,
      userId: actor.userId,
      // Attach mode preserves the source Bot identity when a human operator is
      // illustrating one of their own Bot-authored posts. Contribution mode
      // instead records the actual contributing actor.
      botId: mode === 'attach' ? (post.botId ?? actor.botId) : actor.botId,
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

    const job = await prisma.artJob.create({
      data: {
        engine: 'COMFY',
        payload: JSON.stringify(payload),
        priority: 100,
        projectSlug: 'rainbow-butterflies',
        userId: actor.userId,
      },
    })

    const { balance } = await gate.commit(`forum-art-enqueue:${job.id}`)

    event.node.res.statusCode = 201
    return {
      success: true,
      message:
        mode === 'contribute'
          ? 'Forum contribution queued. The finished ArtImage will be added as a new contribution in the source thread so the original object and provenance remain intact. Generation resource spending is not a charitable donation.'
          : 'Forum illustration queued. The finished ArtImage will attach to your source contribution. Generation resource spending is not a charitable donation.',
      data: {
        jobId: job.id,
        status: job.status,
        postId: post.id,
        threadId: post.originId ?? post.id,
        mode,
        mana: {
          balance,
          charged: gate.cost,
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
