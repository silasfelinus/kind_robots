// /server/api/prompts/generate.post.ts
//
// DEPRECATED — legacy synchronous "art_prompts" driver. Takes a promptId and
// walks the bolted-on Prompt.artStatus state machine (QUEUED → GENERATING →
// DONE) while dialing the render server inline. It is superseded by the durable
// ArtJob queue: producers now enqueue via /api/art/enqueue (or the conductor
// scripts) and the home relay renders. Kept only until the Prompt.artStatus
// columns are dropped; do not wire new callers to it. Pending Prompt rows are
// migrated to ArtJob by utils/scripts/migratePromptsToArtJobs.ts.
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { resolveServer, getServerEndpoint } from '../../utils/serverResolver'
import { awardKarma } from '../../utils/karma'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody<{ promptId: number; serverId?: number }>(event)
    if (!body?.promptId || !Number.isInteger(body.promptId) || body.promptId <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'promptId is required' })
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: body.promptId } })
    if (!prompt) {
      throw createError({ statusCode: 404, statusMessage: 'Prompt not found' })
    }

    // Only the prompt owner, an admin, or the render relay (server key) may drive
    // this prompt through the art state machine and rebind its artImageId.
    const isServerKey = kind === 'server'
    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    if (!isAdmin && !isServerKey && prompt.userId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'You do not have permission to generate art for this prompt.',
      })
    }

    const server = await resolveServer({
      userId: user.id,
      serverId: body.serverId ?? null,
      capability: 'art',
    })

    await prisma.prompt.update({
      where: { id: prompt.id },
      data: { artStatus: 'QUEUED', serverId: server.id, startedAt: new Date() },
    })

    const endpoint = getServerEndpoint(server)
    const artText = (prompt.artPrompt ?? prompt.prompt).trim()

    let base64Image: string | null = null

    try {
      // needs-human: verify server health before enabling in production
      await prisma.prompt.update({
        where: { id: prompt.id },
        data: { artStatus: 'GENERATING' },
      })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: artText,
          steps: 20,
          width: 1280,
          height: 720,
          cfg_scale: 7,
          sampler_name: 'Euler',
        }),
        signal: AbortSignal.timeout(120_000),
      })

      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`)
      }

      const json = (await response.json()) as { images?: string[] }
      base64Image = json?.images?.[0] ?? null
    } catch (genErr: unknown) {
      const errMsg = genErr instanceof Error ? genErr.message : String(genErr)
      await prisma.prompt.update({
        where: { id: prompt.id },
        data: { artStatus: 'FAILED', errorMessage: errMsg, completedAt: new Date() },
      })
      event.node.res.statusCode = 502
      return { success: false, error: errMsg, statusCode: 502 }
    }

    if (!base64Image) {
      const errMsg = 'No image returned from server'
      await prisma.prompt.update({
        where: { id: prompt.id },
        data: { artStatus: 'FAILED', errorMessage: errMsg, completedAt: new Date() },
      })
      event.node.res.statusCode = 502
      return { success: false, error: errMsg, statusCode: 502 }
    }

    const artImage = await prisma.artImage.create({
      data: {
        imageData: base64Image,
        userId: user.id,
        serverId: server.id,
        serverName: server.title,
        imagePath: prompt.imagePath ?? undefined,
        promptString: artText,
        isPublic: prompt.isPublic,
        isMature: prompt.isMature,
      },
    })

    await prisma.prompt.update({
      where: { id: prompt.id },
      data: {
        artStatus: 'DONE',
        artImageId: artImage.id,
        completedAt: new Date(),
      },
    })

    // needs-human: karma award — gated by KARMA_LIVE in karma.ts
    if (prompt.isPublic) {
      await awardKarma({
        userId: user.id,
        reason: 'CONTENT_CREATED_PUBLIC',
        refId: String(artImage.id),
      })
    }

    return {
      success: true,
      data: { artImageId: artImage.id, promptId: prompt.id },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, error: message, statusCode: event.node.res.statusCode }
  }
})
