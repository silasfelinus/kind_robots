import type { CombatRoomId } from './rooms'

/**
 * The Dark Briar's optional bouts: three challengers met again in the
 * reflected realm. A bout is a choice of its own beside the scene's
 * decision, never a gate on it, so a peaceful run loses nothing. Winning is
 * remembered in the Dark Briar save (`duels`); losing costs a heart and the
 * challenger waits for a rematch.
 */
export interface DarkBriarDuel {
  key: string
  room: CombatRoomId
  /** The button that offers the bout. */
  offer: string
  /** The status line once the bout is won. */
  victory: string
}

export const DARK_BRIAR_DUELS: Readonly<Record<string, DarkBriarDuel>> = {
  '5,5': {
    key: '5,5',
    room: 'moss-judge',
    offer: 'Ask the Moss Judge for a bout of your own',
    victory:
      'The Moss Judge chalks your win on the stone board, then chalks her own loss beside it in letters just as large. She presses a moonlit lantern into your hands and says the next contestant will be told the truth about losing.',
  },
  '7,3': {
    key: '7,3',
    room: 'unpaid-patrol',
    offer: 'Accept the duel their contract demands',
    victory:
      'The patrol lower their spears, panting and grinning. For once the memory they are paid with is one they earned. The short one writes you a receipt for the fight; the tall one hands you a lantern so the receipt can be read.',
  },
  '7,1': {
    key: '7,1',
    room: 'empty-armor',
    offer: 'Challenge the empty armor',
    victory:
      'The armor kneels, and nobody inside it can make it stand again. The old sentinel lifts the circlet from its helm and hangs it on the signal-fire post. He gives you his lantern. Tonight he will sleep.',
  },
}

export const DARK_BRIAR_DUEL_KEYS = Object.keys(DARK_BRIAR_DUELS)

/** The Dark Briar bout a combat room belongs to, if any. */
export function darkBriarDuelForRoom(
  room: string | null | undefined,
): DarkBriarDuel | null {
  return (
    Object.values(DARK_BRIAR_DUELS).find((duel) => duel.room === room) ?? null
  )
}

/** A bout is offered where it stands, once the road is explored, until won. */
export function darkBriarCanDuel(
  progress: {
    phase: string
    player: string
    visited: readonly string[]
    duels: readonly string[]
  },
  key: string,
): boolean {
  return (
    Boolean(DARK_BRIAR_DUELS[key]) &&
    progress.phase === 'exploring' &&
    progress.player === key &&
    progress.visited.includes(key) &&
    !progress.duels.includes(key)
  )
}
