/**
 * Save the Plumber's resume point, kept by the Arcade cabinet on this device
 * (utils/arcade/saves.ts): the heroine chosen in the cabinet, the stage to
 * continue from, and the run's score and lives. Untrusted on the way back in.
 */
import { WORLD_ONE } from './savePlumberLevels'

export type PlumberSave = {
  v: 1
  /** The roster seed picked on the cabinet's heroine select. */
  heroine: number
  /** Index into the campaign's stages to continue from. */
  stage: number
  score: number
  lives: number
  tokens: number
  /** World 1 has been cleared at least once. */
  cleared?: boolean
}

export const PLUMBER_SLUG = 'save-the-plumber'

export function readPlumberSave(raw: unknown): PlumberSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const count = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
  if (r.v !== 1) return null
  if (!count(r.heroine, 0xffffffff)) return null
  if (!count(r.stage, WORLD_ONE.length - 1)) return null
  if (!count(r.score, 99_999_999) || !count(r.lives, 99)) return null
  if (!count(r.tokens, 99)) return null
  return {
    v: 1,
    heroine: r.heroine as number,
    stage: r.stage as number,
    score: r.score as number,
    lives: Math.max(1, r.lives as number),
    tokens: r.tokens as number,
    cleared: r.cleared === true,
  }
}
