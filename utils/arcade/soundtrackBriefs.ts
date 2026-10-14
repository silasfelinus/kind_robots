// Source briefs only. No playback URL is published until the render has
// been approved, uploaded, and checked against the deployed static file.
export const PRIORITY_ARCADE_AUDIO_GAMES = [
  'gloom-invaders',
  'zuzu-ghost-trail',
  'prize-show-panic',
  'zuzu-showdown',
] as const

export type PriorityArcadeAudioGame = (typeof PRIORITY_ARCADE_AUDIO_GAMES)[number]
export type ArcadeMusicScene = 'level' | 'boss'
export type ArcadeEventCue = 'pickup' | 'danger' | 'impact' | 'victory'
export type ArcadeAudioCue = ArcadeMusicScene | ArcadeEventCue

export type ArcadeAudioBrief = {
  kind: 'music' | 'sfx'
  prompt: string
  seconds: number
  bpm?: number
  loop?: boolean
}

export const SHARED_ARCADE_EVENT_BRIEFS: Record<ArcadeEventCue, ArcadeAudioBrief> = {
  pickup: {
    kind: 'sfx',
    seconds: 1,
    prompt: 'A bright, crisp two-note reward chime with a playful glass-bell finish; no voice, no speech.',
  },
  danger: {
    kind: 'sfx',
    seconds: 2,
    prompt: 'An urgent three-beat warning pulse with a low brass swell; punchy and easily heard over music; no voice.',
  },
  impact: {
    kind: 'sfx',
    seconds: 1,
    prompt: 'A satisfying short mechanical impact with a springy tail, dry enough to repeat rapidly; no voice.',
  },
  victory: {
    kind: 'sfx',
    seconds: 3,
    prompt: 'A confident celebratory fanfare with struck bells and a clean final chord, without a spoken announcement.',
  },
}

export const ARCADE_MUSIC_BRIEFS: Record<
  PriorityArcadeAudioGame,
  Record<ArcadeMusicScene, ArcadeAudioBrief>
> = {
  'gloom-invaders': {
    level: {
      kind: 'music',
      bpm: 138,
      seconds: 48,
      loop: true,
      prompt: 'Instrumental cloud-invasion chiptune: glassy arpeggios, marching analog bass, gentle rainy shaker and a warm synth melody that grows brighter as clouds turn friendly. Seamless 48-second loop, no vocals.',
    },
    boss: {
      kind: 'music',
      bpm: 150,
      seconds: 48,
      loop: true,
      prompt: 'Instrumental storm-front finale: tense descending square-wave ostinato, thunder drums and a bold hopeful rainbow motif. Crisp arcade mix, seamless 48-second loop, no vocals.',
    },
  },
  'zuzu-ghost-trail': {
    level: {
      kind: 'music',
      bpm: 112,
      seconds: 64,
      loop: true,
      prompt: 'Instrumental haunted Weird West road music: dry shamisen plucks, bowed strings, dusty hand percussion, spectral wooden flute, and distant wind. Edo-era ronin meets gothic frontier, no vocals, seamless 64-second loop.',
    },
    boss: {
      kind: 'music',
      bpm: 132,
      seconds: 64,
      loop: true,
      prompt: 'Instrumental abbey boss confrontation: ritual bells, taiko, low bowed strings and tense shamisen strikes. Eerie heroic motif, pulsing but never masking combat cues, no vocals, seamless 64-second loop.',
    },
  },
  'prize-show-panic': {
    level: {
      kind: 'music',
      bpm: 148,
      seconds: 48,
      loop: true,
      prompt: 'Instrumental over-caffeinated robot game show: slap bass, brass stabs, bright synth disco groove and sparkling TV bumper percussion. High-energy but space for shots and audience cues, no vocals, seamless 48-second loop.',
    },
    boss: {
      kind: 'music',
      bpm: 158,
      seconds: 48,
      loop: true,
      prompt: 'Instrumental game-show final round: ominous clock pulses collide with frantic disco drums, robot clang accents and triumphant brass bursts, no vocals, seamless 48-second loop.',
    },
  },
  'zuzu-showdown': {
    level: {
      kind: 'music',
      bpm: 124,
      seconds: 64,
      loop: true,
      prompt: 'Instrumental cinematic 2D fighter stage music: koto and shamisen riffs, snare-driven breakbeats, shadowy bass and windswept western guitar. Clear rhythmic space for attack impacts, no vocals, seamless 64-second loop.',
    },
    boss: {
      kind: 'music',
      bpm: 146,
      seconds: 64,
      loop: true,
      prompt: 'Instrumental final fighter duel: urgent taiko, bowed bass, aggressive plucked strings and a sharp heroic melodic answer to the villain theme. Dynamic without drowning hit feedback, no vocals, seamless 64-second loop.',
    },
  },
}

// This is deliberately empty. A brief or queued ArtJob is not a playable file.
export type ArcadeAudioAsset = {
  game: PriorityArcadeAudioGame
  cue: ArcadeAudioCue
  path: string
  approvedAt: string
  verifiedAt: string
  contentSha256: string
}

export const VERIFIED_ARCADE_AUDIO_ASSETS: readonly ArcadeAudioAsset[] = []

export function arcadeAudioJobKey(game: PriorityArcadeAudioGame, cue: ArcadeAudioCue): string {
  return `arcade-audio:v1:${game}:${cue}`
}

export function publishedArcadeAudioPath(
  game: PriorityArcadeAudioGame,
  cue: ArcadeAudioCue,
  filesConfirmedAccessible: ReadonlySet<string>,
  assets: readonly ArcadeAudioAsset[] = VERIFIED_ARCADE_AUDIO_ASSETS,
): string | null {
  const asset = assets.find((item) => item.game === game && item.cue === cue)
  if (!asset || !asset.approvedAt || !asset.verifiedAt ||
      !/^[0-9a-f]{64}$/.test(asset.contentSha256)) return null
  if (!/^\/images\/arcade\/audio\/[a-z0-9/-]+\.(?:ogg|mp3|wav)$/.test(asset.path)) {
    return null
  }
  return filesConfirmedAccessible.has(asset.path) ? asset.path : null
}
