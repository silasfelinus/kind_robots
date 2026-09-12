// /server/utils/sceneAnimatorPromptStore.ts
//
// Per-image motion direction: read, save, clear.
//
// Overrides are keyed by the source image's SHA-256, the same identity the
// render dedupe uses, so one follows its image through a rename or a move
// between folders. The stored folder/filename are display breadcrumbs only.
//
// Every caller resolves the hash by READING THE FILE, never by trusting a hash
// supplied in a request body. A client-supplied hash would let a caller attach
// a prompt to an image it cannot see, and -- worse -- silently retarget another
// operator's override.
import prisma from './prisma'
import {
  normalizePromptInput,
  type SceneAnimatorPromptRecord,
} from './sceneAnimatorPromptResolve'

// Re-exported so callers that need both the decision and the rows keep one
// import. The decision itself lives in the prisma-free module above.
export {
  SCENE_ANIMATOR_PROMPT_MAX,
  normalizePromptInput,
  resolveScenePrompt,
  type SceneAnimatorPromptRecord,
} from './sceneAnimatorPromptResolve'

/**
 * Overrides for a set of source hashes, as a map.
 *
 * Batched rather than queried per source: the folder listing and the enqueue
 * loop both need every override at once, and a folder can hold hundreds of
 * stills.
 */
export async function readSceneAnimatorPrompts(
  sourceHashes: string[],
): Promise<Map<string, SceneAnimatorPromptRecord>> {
  const hashes = [...new Set(sourceHashes.filter(Boolean))]
  if (!hashes.length) return new Map()

  const rows = await prisma.sceneAnimatorPrompt.findMany({
    where: { sourceHash: { in: hashes } },
    select: {
      sourceHash: true,
      prompt: true,
      negativePrompt: true,
      updatedAt: true,
    },
  })

  return new Map(rows.map((row) => [row.sourceHash, row]))
}

export async function saveSceneAnimatorPrompt(input: {
  sourceHash: string
  sourceFolder: string
  sourceFile: string
  prompt: string
  negativePrompt?: string | null
  userId?: number | null
}): Promise<SceneAnimatorPromptRecord> {
  const prompt = normalizePromptInput(input.prompt)
  if (!prompt) {
    throw new Error('Refusing to store an empty prompt; clear the override instead.')
  }
  const negativePrompt = input.negativePrompt
    ? normalizePromptInput(input.negativePrompt) || null
    : null

  const data = {
    sourceFolder: input.sourceFolder.slice(0, 512),
    sourceFile: input.sourceFile.slice(0, 512),
    prompt,
    negativePrompt,
    userId: input.userId ?? null,
  }

  return prisma.sceneAnimatorPrompt.upsert({
    where: { sourceHash: input.sourceHash },
    create: { sourceHash: input.sourceHash, ...data },
    update: data,
    select: {
      sourceHash: true,
      prompt: true,
      negativePrompt: true,
      updatedAt: true,
    },
  })
}

/** Drop an override so the source falls back to the shared default. */
export async function clearSceneAnimatorPrompt(sourceHash: string): Promise<boolean> {
  const result = await prisma.sceneAnimatorPrompt.deleteMany({
    where: { sourceHash },
  })
  return result.count > 0
}
