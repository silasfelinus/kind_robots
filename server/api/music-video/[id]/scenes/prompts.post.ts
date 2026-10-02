import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { parseStoredMusicVideoDoc } from '@/utils/musicVideoDoc'
import {
  buildScenePromptRequest,
  parseScenePromptResponse,
} from '@/utils/musicVideoScenes'
import { sceneRenderProblems } from '@/server/utils/musicVideoScenes'
import {
  loadOwnedMusicVideo,
  readMusicVideoId,
  serializeValidatedDoc,
  toMusicVideoDto,
} from '@/server/utils/musicVideo'

type PromptsBody = { sceneIds?: unknown; overwriteUserPrompts?: unknown }

type GenerateTextResponse = { text?: string }

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = readMusicVideoId(event)
    const record = await loadOwnedMusicVideo(id, auth.user.id)
    const body = (await readBody<PromptsBody>(event)) ?? {}
    const doc = parseStoredMusicVideoDoc(record.doc)

    const requested = Array.isArray(body.sceneIds)
      ? new Set(body.sceneIds.map((value) => String(value)))
      : null
    const overwriteUser = body.overwriteUserPrompts === true
    const targets = doc.scenes.filter(
      (scene) =>
        (!requested || requested.has(scene.id)) &&
        (overwriteUser || scene.promptSource !== 'user' || !scene.prompt),
    )
    if (!targets.length) {
      throw createError({
        statusCode: 400,
        message: doc.scenes.length
          ? 'No scenes need a prompt. User-written prompts are kept unless overwriteUserPrompts is true.'
          : 'This video has no scenes yet. Plan scenes first.',
      })
    }

    const { system, prompt } = buildScenePromptRequest(doc, targets)
    const generated = await event.$fetch<GenerateTextResponse, string>(
      '/api/generate/text',
      {
        method: 'POST',
        body: {
          system,
          prompt,
          temperature: 0.7,
          maxTokens: Math.min(4000, 120 * targets.length + 200),
          stream: false,
        },
      },
    )
    const prompts = parseScenePromptResponse(
      String(generated?.text || ''),
      targets.map((scene) => scene.id),
    )

    const rejected: { sceneId: string; reason: string }[] = []
    const written: string[] = []
    const scenes = doc.scenes.map((scene) => {
      const next = prompts[scene.id]
      if (!next || !targets.some((target) => target.id === scene.id))
        return scene
      const candidate = { ...scene, prompt: next, promptSource: 'llm' as const }
      const problems = sceneRenderProblems(candidate, doc)
      if (problems.length) {
        rejected.push({ sceneId: scene.id, reason: problems.join(' ') })
        return scene
      }
      written.push(scene.id)
      return candidate
    })
    const missing = targets
      .map((scene) => scene.id)
      .filter((sceneId) => !prompts[sceneId])

    const updated = await prisma.musicVideo.update({
      where: { id },
      data: { doc: serializeValidatedDoc({ ...doc, scenes }) },
    })
    return {
      success: true,
      statusCode: 200,
      message: `Wrote ${written.length} scene prompts; ${rejected.length} rejected; ${missing.length} missing.`,
      data: { video: toMusicVideoDto(updated), written, rejected, missing },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
