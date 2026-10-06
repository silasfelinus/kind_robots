// /utils/arcade/machine.ts
//
// The cabinet's flow, as a pure reducer so it can be unit tested:
//
//   attract loop:  title -> howto -> scores -> demo -> title ...
//   START:         any attract screen -> playing
//   game over:     playing -> gameover -> initials (if it made the board)
//                  -> scores (with the new entry highlighted) -> attract

export type ArcadePhase =
  | 'title'
  | 'howto'
  | 'scores'
  | 'demo'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'initials'

export type ArcadeState = {
  phase: ArcadePhase
  /** Milliseconds spent in the current phase. */
  elapsed: number
}

export type ArcadeEvent =
  | { type: 'tick'; ms: number }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'gameOver' }
  | { type: 'demoOver' }
  | { type: 'initialsDone' }
  | { type: 'skip' }

export const PHASE_MS: Partial<Record<ArcadePhase, number>> = {
  title: 7000,
  howto: 7000,
  scores: 7000,
  demo: 25000,
  gameover: 2500,
}

const ATTRACT_NEXT: Partial<Record<ArcadePhase, ArcadePhase>> = {
  title: 'howto',
  howto: 'scores',
  scores: 'demo',
  demo: 'title',
}

export const ATTRACT_PHASES: ArcadePhase[] = [
  'title',
  'howto',
  'scores',
  'demo',
]

export function initialArcadeState(): ArcadeState {
  return { phase: 'title', elapsed: 0 }
}

const to = (phase: ArcadePhase): ArcadeState => ({ phase, elapsed: 0 })

/**
 * `qualifies` says whether the score just finished belongs on the board; the
 * cabinet decides that from the leaderboard it already has loaded.
 */
export function arcadeReducer(
  state: ArcadeState,
  event: ArcadeEvent,
  qualifies = false,
): ArcadeState {
  const attract = ATTRACT_PHASES.includes(state.phase)
  switch (event.type) {
    case 'start':
      return attract ? to('playing') : state
    case 'pause':
      return state.phase === 'playing' ? to('paused') : state
    case 'resume':
      return state.phase === 'paused' ? to('playing') : state
    case 'gameOver':
      return state.phase === 'playing' ? to('gameover') : state
    case 'demoOver':
      return state.phase === 'demo' ? to('title') : state
    case 'initialsDone':
      return state.phase === 'initials' ? to('scores') : state
    case 'skip':
      if (attract) return to(ATTRACT_NEXT[state.phase]!)
      if (state.phase === 'gameover')
        return to(qualifies ? 'initials' : 'scores')
      return state
    case 'tick': {
      const elapsed = state.elapsed + event.ms
      const limit = PHASE_MS[state.phase]
      if (limit === undefined || elapsed < limit) {
        return { phase: state.phase, elapsed }
      }
      if (state.phase === 'gameover') {
        return to(qualifies ? 'initials' : 'scores')
      }
      const next = ATTRACT_NEXT[state.phase]
      return next ? to(next) : { phase: state.phase, elapsed }
    }
  }
}

/** Does `score` earn a place on a top-`size` board (highest first)? */
export function qualifiesForBoard(
  score: number,
  board: Array<{ score: number }>,
  size = 10,
): boolean {
  if (score <= 0) return false
  if (board.length < size) return true
  return score > (board[size - 1]?.score ?? 0)
}
