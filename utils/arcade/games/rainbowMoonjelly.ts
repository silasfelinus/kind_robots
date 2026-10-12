/**
 * Authored Act II encounter director. Uses local 60 Hz frames after the
 * Pinkwake aftermath, so the global combat tick and inventory never reset.
 */
export type MoonjellyEnemy = 'lantern' | 'relay' | 'skimmer' | 'coral'
export type MoonjellyStage = 'opening' | 'waves' | 'turn' | 'remix' | 'approach' | 'boss' | 'aftermath'
export type MoonjellySceneId = 'A02.OPEN' | 'A02.TURN' | 'A02.AFTER'
export type MoonjellyDialogue = { speaker: string; text: string }

export const MOONJELLY = {
  openingEnds: 300,
  nemiAppears: 1480,
  turnStarts: 2300,
  turnEnds: 2600,
  approachStarts: 4550,
  bossStarts: 4850,
  aftermathFrames: 360,
  lineFrames: 96,
} as const

export function moonjellyStage(
  frame: number,
  defeatedAt: number | null,
): MoonjellyStage {
  if (defeatedAt !== null) return 'aftermath'
  if (frame < MOONJELLY.openingEnds) return 'opening'
  if (frame < MOONJELLY.turnStarts) return 'waves'
  if (frame < MOONJELLY.turnEnds) return 'turn'
  if (frame < MOONJELLY.approachStarts) return 'remix'
  if (frame < MOONJELLY.bossStarts) return 'approach'
  return 'boss'
}

export function moonjellySpawn(frame: number): MoonjellyEnemy | null {
  const stage = moonjellyStage(frame, null)
  if (stage !== 'waves' && stage !== 'remix') return null
  if (frame < 1050) return frame % 65 === 0 ? 'lantern' : null
  if (frame < 1800) return frame % 80 === 0 ? 'relay' : null
  if (frame < MOONJELLY.turnStarts) return frame % 95 === 0 ? 'skimmer' : null
  if (frame < 3400) return frame % 85 === 0 ? 'coral' : null
  return frame % 90 === 0
    ? 'relay'
    : frame % 66 === 0
      ? 'lantern'
      : null
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function moonjellyDialogue(
  id: MoonjellySceneId,
  elapsed: number,
  players: number,
  rescuedNemi: boolean,
): MoonjellyDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const lines: Record<MoonjellySceneId, MoonjellyDialogue[]> = {
    'A02.OPEN': [
      { speaker: 'Lilt-7', text: 'Moonjelly Fields. This whole reef is transmitting one broken distress call.' },
      { speaker: lead, text: 'Then we follow the current. No shooting what we can safely rescue.' },
      { speaker: wing === lead ? 'Lilt-7' : wing, text: 'Those bells are beautiful. The lightning inside them is less charming.' },
    ],
    'A02.TURN': [
      { speaker: 'Lilt-7', text: rescuedNemi ? 'Nemi is aboard. She says the lights are pleading for help.' : 'We lost the Nemi beacon. The current still carries her warning.' },
      { speaker: wing, text: 'The transmission changes pitch every time a ship loses control.' },
      { speaker: lead, text: 'The Aurelia Array is a prison, not a weapon. We break its lock.' },
    ],
    'A02.AFTER': [
      { speaker: 'Lilt-7', text: 'The colony is free. I remember that control signature. I wish I did not.' },
      { speaker: lead, text: 'You can tell us when you are ready. For now, we protect the survivors.' },
      { speaker: wing === lead ? 'Lilt-7' : wing, text: 'The trench ahead holds the old relay network. We have more questions than answers.' },
    ],
  }
  return lines[id][Math.floor(elapsed / MOONJELLY.lineFrames)] ?? null
}

export function moonjellyScene(
  frame: number,
  defeatedFrame: number | null,
): { id: MoonjellySceneId; elapsed: number } | null {
  if (defeatedFrame !== null) {
    const elapsed = frame - defeatedFrame
    return elapsed < MOONJELLY.aftermathFrames
      ? { id: 'A02.AFTER', elapsed }
      : null
  }
  if (frame < MOONJELLY.openingEnds) return { id: 'A02.OPEN', elapsed: frame }
  if (frame >= MOONJELLY.turnStarts && frame < MOONJELLY.turnEnds) {
    return { id: 'A02.TURN', elapsed: frame - MOONJELLY.turnStarts }
  }
  return null
}
