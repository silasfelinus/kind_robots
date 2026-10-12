/**
 * Act I director. One fixed tick is 1/60 s; no random or wall-clock scheduling.
 * A01.OPEN / TURN / AFTER play only in deliberately safe corridors.
 * Full 10-15 minute pacing, stage II and final cinematic art remain future work.
 */
export type PinkwakeEnemy = 'picket' | 'spiral' | 'anchor' | 'urchin'
export type PinkwakeSceneId = 'A01.OPEN' | 'A01.TURN' | 'A01.AFTER'
export type PinkwakeStage = 'opening' | 'waves' | 'turn' | 'boss' | 'aftermath'

export const PINKWAKE = {
  openingEnds: 300,
  turnStarts: 4200,
  bossStarts: 4500,
  sceneLineFrames: 96,
  aftermathFrames: 390,
} as const

export function pinkwakeStage(
  tick: number,
  defeatedAt: number | null,
): PinkwakeStage {
  if (defeatedAt !== null) return 'aftermath'
  if (tick < PINKWAKE.openingEnds) return 'opening'
  if (tick < PINKWAKE.turnStarts) return 'waves'
  if (tick < PINKWAKE.bossStarts) return 'turn'
  return 'boss'
}

export function pinkwakeSpawn(tick: number): PinkwakeEnemy | null {
  if (tick < PINKWAKE.openingEnds || tick >= PINKWAKE.turnStarts) return null
  if (tick < 1200) return tick % 52 === 0 ? 'picket' : null
  if (tick < 2400) return tick % 66 === 0 ? 'spiral' : null
  if (tick < 3300) return tick % 70 === 0 ? 'anchor' : null
  if (tick % 82 === 0) return 'urchin'
  return null
}

export type PinkwakeDialogue = { speaker: string; text: string }
const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const

export function pinkwakeDialogue(
  scene: PinkwakeSceneId,
  elapsed: number,
  playerCount: number,
  rescuedStation: boolean,
): PinkwakeDialogue | null {
  const pilots = PILOTS.slice(0, Math.max(1, Math.min(4, playerCount)))
  const lead = pilots[0]!
  const partner = pilots[pilots.length - 1]!
  const lines: Record<PinkwakeSceneId, PinkwakeDialogue[]> = {
    'A01.OPEN': [
      {
        speaker: 'Lilt-7',
        text: 'Pinkwake Estuary ahead. Rescue beacons are answering with weapons fire.',
      },
      {
        speaker: lead,
        text: 'Then we fly close enough to learn why. Keep the civilians behind us.',
      },
      {
        speaker: partner === lead ? 'Lilt-7' : partner,
        text:
          partner === lead
            ? 'I will count safe passages. You provide the improbable part.'
            : 'I vote we ask politely, with our engines running.',
      },
    ],
    'A01.TURN': [
      {
        speaker: 'Lilt-7',
        text: 'Hold fire a moment. The Pearl Seahorse carries a living escape pod.',
      },
      {
        speaker: partner,
        text: 'That changes everything. Target its weapons, not the passenger.',
      },
      {
        speaker: lead,
        text: rescuedStation
          ? 'Our station survivors can guide that pod out. We bring it home.'
          : 'We missed the station beacon. We can still bring this pod home.',
      },
    ],
    'A01.AFTER': [
      {
        speaker: 'Lilt-7',
        text: 'The pod is free. Its distress signal was hidden beneath a command pulse.',
      },
      {
        speaker: lead,
        text: 'So the fleet is trapped, not invading. We rescue them one ship at a time.',
      },
      {
        speaker: partner === lead ? 'Lilt-7' : partner,
        text:
          partner === lead
            ? 'Plotting the Moonjelly Fields. I believe our mission just changed.'
            : 'Then onward. And nobody gets left in the wake.',
      },
    ],
  }
  const index = Math.floor(elapsed / PINKWAKE.sceneLineFrames)
  return lines[scene][index] ?? null
}

export function pinkwakeScene(
  tick: number,
  defeatedAt: number | null,
): { id: PinkwakeSceneId; elapsed: number } | null {
  if (defeatedAt !== null) {
    const elapsed = tick - defeatedAt
    return elapsed < PINKWAKE.aftermathFrames
      ? { id: 'A01.AFTER', elapsed }
      : null
  }
  if (tick < PINKWAKE.openingEnds) return { id: 'A01.OPEN', elapsed: tick }
  if (tick >= PINKWAKE.turnStarts && tick < PINKWAKE.bossStarts) {
    return { id: 'A01.TURN', elapsed: tick - PINKWAKE.turnStarts }
  }
  return null
}
