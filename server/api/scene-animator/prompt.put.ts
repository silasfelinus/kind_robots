// /server/api/scene-animator/prompt.put.ts
//
// Save or clear the motion direction for one source still.
//
// Silas, 2026-09-12: "I should also be able to edit the individual prompts for
// each image, and edit them before resubmitting." The shared default is tuned
// for the common case -- a figure that should blink, smile, and gesture -- but
// the first real batch showed how much per-image direction is worth: the clip
// he rated highly moved a robot deliberately and gave it an interaction, while
// a logo that wanted a gentle shimmer got a Segway rider instead.
//
// Saving does NOT enqueue a render. A prompt edit is cheap and a render is
// minutes of GPU, so the two stay separate actions -- edit, read it back, then
// press Re-render when it says what you meant.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { readSceneAnimatorSource } from '@/server/utils/sceneAnimator'
import {
  SCENE_ANIMATOR_PROMPT_MAX,
  clearSceneAnimatorPrompt,
  normalizePromptInput,
  saveSceneAnimatorPrompt,
} from '@/server/utils/sceneAnimatorPromptStore'

type PromptRequest = {
  folder?: string | null
  sourceFile?: string | null
  prompt?: string | null
  negativePrompt?: string | null
}

export default defineEventHandler(async (event) => {
  const auth = await requireAdminApiUser(event)
  const body = ((await readBody(event)) ?? {}) as PromptRequest

  const folder = String(body.folder ?? '').trim()
  const sourceFile = String(body.sourceFile ?? '').trim()
  if (!sourceFile) {
    throw createError({ statusCode: 400, message: 'sourceFile is required.' })
  }

  /*
   * Read the file to get its hash rather than accepting one from the caller.
   * The hash is the override's primary key, so a supplied one would let a
   * request attach a prompt to an image it never saw -- or overwrite the
   * override on somebody else's. readSceneAnimatorSource also enforces the
   * containment rules, so a traversal attempt fails here rather than deeper in.
   */
  const source = await readSceneAnimatorSource(folder, sourceFile)

  const prompt = normalizePromptInput(body.prompt)

  // An empty prompt means "use the shared default again", not "store nothing".
  if (!prompt) {
    const cleared = await clearSceneAnimatorPrompt(source.hash)
    return {
      success: true,
      message: cleared
        ? `Custom prompt cleared for ${source.filename}; it will use the shared default.`
        : `${source.filename} was already using the shared default.`,
      data: { sourceFile: source.filename, prompt: null, isOverridden: false },
    }
  }

  if (String(body.prompt ?? '').trim().length > SCENE_ANIMATOR_PROMPT_MAX) {
    throw createError({
      statusCode: 400,
      message: `Prompt is longer than ${SCENE_ANIMATOR_PROMPT_MAX} characters.`,
    })
  }

  const saved = await saveSceneAnimatorPrompt({
    sourceHash: source.hash,
    sourceFolder: source.folder,
    sourceFile: source.filename,
    prompt,
    negativePrompt: body.negativePrompt ?? null,
    userId: typeof auth?.user?.id === 'number' ? auth.user.id : null,
  })

  return {
    success: true,
    message: `Custom prompt saved for ${source.filename}. Re-render to use it.`,
    data: {
      sourceFile: source.filename,
      prompt: saved.prompt,
      negativePrompt: saved.negativePrompt,
      isOverridden: true,
    },
  }
})
