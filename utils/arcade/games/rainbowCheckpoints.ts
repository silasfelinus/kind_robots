/**
 * Checkpoint and continue rules for the Rainbow Space Princess Acts. A checkpoint sits at the Act's first
 * frame, at every authored section's start and at the boss. When the whole crew is down, a CONTINUE?
 * countdown holds the world still; continuing rewinds the Act clock to the last checkpoint passed, so the
 * authored schedule replays from there with the crew restored and the score as it was at the checkpoint.
 */
export const RAINBOW_CONTINUE = {
  /** Ten seconds to press A before the run ends. */
  countdownFrames: 600,
  /** Fresh ships are untouchable while the replayed section finds its feet. */
  invulnerableFrames: 180,
} as const

export type RainbowCheckpoint = {
  act: 1 | 2
  /** The Act frame the run resumes from: Act I's tick, or Act II's frame since it began. */
  frame: number
  score: number
  rescuedStation: boolean
  rescuedNemi: boolean
  schoolBonuses: number
}

/** Every checkpoint frame of an Act, ascending and without duplicates. */
export function actCheckpoints(
  sections: ReadonlyArray<{ from: number }>,
  bossStarts: number,
): number[] {
  return [
    ...new Set([0, ...sections.map((section) => section.from), bossStarts]),
  ].sort((a, b) => a - b)
}

/** What the CONTINUE? screen calls the checkpoint: the Act start, an authored section or the boss. */
export function checkpointLabel(
  sections: ReadonlyArray<{ name: string; from: number }>,
  bossStarts: number,
  frame: number,
): string {
  if (frame >= bossStarts) return 'THE BOSS'
  return (
    sections.find((section) => section.from === frame)?.name.toUpperCase() ??
    'ACT START'
  )
}

/**
 * The engine tick to rewind to so that the next update replays the checkpoint frame itself. Act I runs on
 * the global tick and has already stepped past frame 0 on its first update; Act II counts from the tick it
 * began on, so its first frame is that tick.
 */
export function resumeTick(
  checkpoint: Pick<RainbowCheckpoint, 'act' | 'frame'>,
  actTwoStart: number | null,
): number {
  if (checkpoint.act === 1) return Math.max(0, checkpoint.frame - 1)
  return (actTwoStart ?? 0) + checkpoint.frame - 1
}

/** The seconds left to show on the CONTINUE? countdown, counting down from 10 to 1. */
export function continueSeconds(framesLeft: number): number {
  return Math.max(0, Math.ceil(framesLeft / 60))
}
