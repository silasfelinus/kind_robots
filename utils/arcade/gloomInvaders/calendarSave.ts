// A safe, bounded checkpoint for the first two seasons of Gloom Invaders.
export type GloomCalendarRun = {
  wave: 1 | 10
  score: number
  lives: number
}

export type GloomCalendarSave = {
  v: 1
  run: GloomCalendarRun
}

const whole = (n: unknown, max: number): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max

export function readGloomCalendarSave(raw: unknown): GloomCalendarSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  if (record.v !== 1 || !record.run || typeof record.run !== 'object') {
    return null
  }
  if (Array.isArray(record.run)) return null
  const run = record.run as Record<string, unknown>
  if (run.wave !== 1 && run.wave !== 10) return null
  if (!whole(run.score, 99_999_999)) return null
  if (!whole(run.lives, 99) || run.lives < 1) return null
  return {
    v: 1,
    run: { wave: run.wave, score: run.score, lives: run.lives },
  }
}
