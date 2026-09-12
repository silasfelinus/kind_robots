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
import { SCENE_ANIMATOR_PROMPT } from '@/utils/sceneAnimatorPrompt'

export type SceneAnimatorPromptRecord = {
  sourceHash: string
  prompt: string
  negativePrompt: string | null
  updatedAt: Date
}

/** Longer than any sensible motion direction, short enough to bound the row. */
export const SCENE_ANIMATOR_PROMPT_MAX = 2000

export function normalizePromptInput(value: unknown): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, SCENE_ANIMATOR_PROMPT_MAX)
}

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

/**
 * The prompt a render should actually use for one source.
 *
 * The single place that decides override-or-default, so the enqueue path and
 * the admin surface can never disagree about what will be sent.
 */
export function resolveScenePrompt(
  override: SceneAnimatorPromptRecord | null | undefined,
): { prompt: string; isOverridden: boolean } {
  const custom = override?.prompt?.trim()
  return custom
    ? { prompt: custom, isOverridden: true }
    : { prompt: SCENE_ANIMATOR_PROMPT, isOverridden: false }
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
