// /server/utils/sceneAnimatorPromptResolve.ts
//
// The prompt decision, with no database attached.
//
// Split from sceneAnimatorPromptStore.ts (which imports prisma, and therefore
// throws on import without a DATABASE_URL) so the rule that decides what a
// render is actually directed to do can be exercised by the DB-free
// contract-tests workflow -- the one that gates every pull request.
//
// This is the second time the same trap has been walked into: see
// artImageEncoding.ts, split out of artImageOffload.ts on 2026-09-11 for
// exactly this reason. The shape to recognise is "a pure decision living in a
// module that happens to also talk to the database", and the fix is always to
// move the decision, not to hand the workflow a database.
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
 * The prompt a render should actually use for one source.
 *
 * The single place that decides override-or-default, so the enqueue path and
 * the admin surface can never disagree about what will be sent. A
 * whitespace-only override is not an override.
 */
export function resolveScenePrompt(
  override: SceneAnimatorPromptRecord | null | undefined,
): { prompt: string; isOverridden: boolean } {
  const custom = override?.prompt?.trim()
  return custom
    ? { prompt: custom, isOverridden: true }
    : { prompt: SCENE_ANIMATOR_PROMPT, isOverridden: false }
}
