// /utils/zuzuLair/types.ts
//
// Zuzu's Lair (conductor zuzu-lair): the scene-graph and run types. Framework-free, no DOM.

export type LairButton = 'up' | 'down' | 'left' | 'right' | 'sword'
export type LairNodeKind =
  'opening' | 'moment' | 'success' | 'death' | 'closing'
export type LairDifficulty = 'classic' | 'assist'

export interface LairNode {
  id: string
  kind: LairNodeKind
  /** Clip length in seconds (the generator makes 2-5 s clips). */
  seconds: number
  /** Moments only: the Classic input window, seconds into the clip. */
  window?: [number, number]
  expect?: LairButton
  /** opening / success nodes: where the run goes after the clip. */
  next?: string
  /** moments: the clip that plays on the right press / on a miss. */
  success?: string
  death?: string
  /** death nodes: the moment that killed you, replayed after the clip. */
  retry?: string
}

export interface LairChapter {
  id: string
  title: string
  /** Seconds added to the end of every window on Assist. */
  assistExtra: number
  lives: number
  nodes: LairNode[]
}

export type LairPhase = 'playing' | 'gameover' | 'complete'

export interface LairRun {
  chapter: LairChapter
  difficulty: LairDifficulty
  phase: LairPhase
  node: string
  /** Seconds into the current clip. */
  t: number
  lives: number
  score: number
  deaths: number
  continues: number
  /** Total seconds of clip time played, for the time bonus. */
  elapsed: number
  /** Moment id the run last reached, for continue-after-game-over. */
  lastMoment: string
  /** Set once the run completes. */
  bonus: { noDeath: number; time: number } | null
}

export type LairAction =
  | { type: 'tick'; dt: number }
  | { type: 'press'; button: LairButton }
  | { type: 'continue' }
