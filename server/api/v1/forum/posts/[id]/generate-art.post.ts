import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { authHasScope } from '@/server/utils/authGuard'
import { authAndGate } from '@/server/utils/comfyGate'
import {
  assertForumPostManageable,
  assertMatureForumWriteAllowed,
  forumPostSelect,
  requireForumWriter,
} from '@/server/utils/forumApi'
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
    'Create an illustration inspired by this public forum contribution:\n\n'
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

    assertForumPostManageable(actor.auth, post)
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
        message: 'Forum author and generation-balance owner do not match.',
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

    const forumContext: ForumArtGenerationContext = {
      kind: 'forum-art',
      postId: post.id,
      threadId: post.originId ?? post.id,
      userId: actor.userId,
      botId: actor.botId,
      requestedAt: new Date().toISOString(),
    }

    const payload = {
      workflow,
      promptString,
      save: {
        isPublic: true,
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
        'Forum illustration queued. Generation resources were charged to the authenticated Kind Robots account; this spend is not a charitable donation.',
      data: {
        jobId: job.id,
        status: job.status,
        postId: post.id,
        threadId: post.originId ?? post.id,
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
