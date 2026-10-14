// /utils/arcade/soundtrackBriefs.ts
//
// The Arcade soundtrack manifest (kind_robots#3606), keyed by game and cue.
// Each entry carries its instrumental brief as data (prompt, mood,
// instrumentation, tempo, loop length) and, only once a render has been
// approved, published and verified, the static asset that plays it.
// A brief or a queued ArtJob is not a playable file: until an asset is listed
// in VERIFIED_ARCADE_AUDIO_ASSETS every cabinet keeps its WebAudio oscillator
// music (utils/arcade/sound.ts).

export const PRIORITY_ARCADE_AUDIO_GAMES = [
  'gloom-invaders',
  'zuzu-ghost-trail',
  'prize-show-panic',
  'zuzu-showdown',
] as const

export const EXTRA_ARCADE_AUDIO_GAMES = [
  'butterfly-blaster',
  'brick-bloom',
  'kindness-gauntlet',
] as const

export const ARCADE_AUDIO_GAMES = [
  ...PRIORITY_ARCADE_AUDIO_GAMES,
  ...EXTRA_ARCADE_AUDIO_GAMES,
] as const

export type PriorityArcadeAudioGame =
  (typeof PRIORITY_ARCADE_AUDIO_GAMES)[number]
export type ArcadeAudioGame = (typeof ARCADE_AUDIO_GAMES)[number]
/** Shared event cues are rendered once and reused by every cabinet. */
export type ArcadeAudioOwner = ArcadeAudioGame | 'shared'

export const ARCADE_MUSIC_SCENES = ['level', 'level-2', 'boss'] as const
export const ARCADE_EVENT_CUES = [
  'pickup',
  'danger',
  'impact',
  'victory',
] as const

export type ArcadeMusicScene = (typeof ARCADE_MUSIC_SCENES)[number]
export type ArcadeEventCue = (typeof ARCADE_EVENT_CUES)[number]
export type ArcadeAudioCue = ArcadeMusicScene | ArcadeEventCue

export type ArcadeAudioBrief = {
  kind: 'music' | 'sfx'
  mood: string
  instrumentation: readonly string[]
  prompt: string
  /** Loop length for music, playing length for an event cue. */
  seconds: number
  bpm?: number
  loop?: boolean
}

/** How a cabinet's music sits against its effects. */
export type ArcadeCabinetAudioTheme = {
  /** Music level under the player's volume, 0..1. */
  music: number
  /** Effects level under the player's volume, 0..1. */
  sfx: number
  /** Share of the music level left while an effect plays. */
  duckDepth: number
  /** Seconds a music change crossfades over. */
  fadeSeconds: number
}

export const DEFAULT_ARCADE_AUDIO_THEME: ArcadeCabinetAudioTheme = {
  music: 0.55,
  sfx: 1,
  duckDepth: 0.5,
  fadeSeconds: 0.8,
}

function music(
  bpm: number,
  seconds: number,
  mood: string,
  instrumentation: readonly string[],
  description: string,
): ArcadeAudioBrief {
  return {
    kind: 'music',
    bpm,
    seconds,
    loop: true,
    mood,
    instrumentation,
    prompt: [
      `Instrumental ${description}`,
      `Mood: ${mood}. Featuring ${instrumentation.join(', ')}.`,
      `${bpm} BPM, seamless ${seconds}-second loop, no vocals.`,
    ].join(' '),
  }
}

export const SHARED_ARCADE_EVENT_BRIEFS: Record<
  ArcadeEventCue,
  ArcadeAudioBrief
> = {
  pickup: {
    kind: 'sfx',
    seconds: 1,
    mood: 'bright, rewarding',
    instrumentation: ['glass bells', 'square-wave chime'],
    prompt: [
      'A bright, crisp two-note reward chime with a',
      'playful glass-bell finish; no voice, no speech.',
    ].join(' '),
  },
  danger: {
    kind: 'sfx',
    seconds: 2,
    mood: 'urgent, readable',
    instrumentation: ['low brass swell', 'pulse synth'],
    prompt: [
      'An urgent three-beat warning pulse with a low brass',
      'swell; punchy and easily heard over music; no voice.',
    ].join(' '),
  },
  impact: {
    kind: 'sfx',
    seconds: 1,
    mood: 'punchy, dry',
    instrumentation: ['mechanical thump', 'spring tail'],
    prompt: [
      'A satisfying short mechanical impact with a',
      'springy tail, dry enough to repeat rapidly; no voice.',
    ].join(' '),
  },
  victory: {
    kind: 'sfx',
    seconds: 3,
    mood: 'triumphant, warm',
    instrumentation: ['struck bells', 'brass fanfare'],
    prompt: [
      'A confident celebratory fanfare with struck bells',
      'and a clean final chord, without a spoken announcement.',
    ].join(' '),
  },
}

type CabinetMusic = { level: ArcadeAudioBrief; boss: ArcadeAudioBrief } & {
  'level-2'?: ArcadeAudioBrief
}

export const ARCADE_MUSIC_BRIEFS: Record<ArcadeAudioGame, CabinetMusic> = {
  'gloom-invaders': {
    level: music(
      138,
      48,
      'hopeful, marching, gently rainy',
      ['glassy arpeggios', 'marching analog bass', 'rain shaker', 'warm lead'],
      'cloud-invasion chiptune whose melody grows brighter as clouds turn friendly.',
    ),
    'level-2': music(
      144,
      48,
      'quicker, sunlit, determined',
      ['pulse-wave lead', 'bouncing bass', 'handclaps', 'rainbow pad'],
      'second-wave chiptune where the march speeds up and sunbeams answer the gloom.',
    ),
    boss: music(
      150,
      48,
      'tense storm front resolving to a rainbow',
      ['descending square ostinato', 'thunder drums', 'bold brass synth'],
      'storm-front finale with a hopeful rainbow motif over the thunder.',
    ),
  },
  'zuzu-ghost-trail': {
    level: music(
      112,
      64,
      'haunted, dusty, adventurous',
      ['dry shamisen', 'bowed strings', 'hand percussion', 'wooden flute'],
      'haunted Weird West road music, Edo-era ronin meets gothic frontier, with distant wind.',
    ),
    'level-2': music(
      118,
      64,
      'moonlit, uneasy, creeping',
      ['koto harmonics', 'brushed snare', 'slide guitar', 'low drone'],
      'graveyard-at-night stage music that creeps forward under the moon.',
    ),
    boss: music(
      132,
      64,
      'eerie, heroic, ritual',
      ['ritual bells', 'taiko', 'low bowed strings', 'shamisen strikes'],
      'abbey boss confrontation, pulsing but never masking combat cues.',
    ),
  },
  'prize-show-panic': {
    level: music(
      148,
      48,
      'over-caffeinated, glitzy, playful',
      ['slap bass', 'brass stabs', 'disco synth', 'TV bumper percussion'],
      'robot game-show groove with space for shots and audience cues.',
    ),
    'level-2': music(
      152,
      48,
      'louder studio, rising stakes',
      ['four-on-the-floor kick', 'funk guitar', 'synth horns', 'tambourine'],
      'mid-show segment where the lights flash faster and the prizes get bigger.',
    ),
    boss: music(
      158,
      48,
      'frantic final round, ticking clock',
      ['ominous clock pulse', 'frantic disco drums', 'robot clang', 'brass'],
      'game-show final round where triumphant brass bursts through the panic.',
    ),
  },
  'zuzu-showdown': {
    level: music(
      124,
      64,
      'cinematic, poised, windswept',
      ['koto riffs', 'shamisen', 'breakbeat snare', 'western guitar'],
      '2D fighter stage music with clear rhythmic space for attack impacts.',
    ),
    'level-2': music(
      130,
      64,
      'rival tension, rising pressure',
      ['muted trumpet', 'shakuhachi', 'driving tom groove', 'shadow bass'],
      'rival-match stage music that tightens the groove round by round.',
    ),
    boss: music(
      146,
      64,
      'urgent final duel, villainous',
      ['urgent taiko', 'bowed bass', 'aggressive plucked strings'],
      'final fighter duel with a sharp heroic answer to the villain theme.',
    ),
  },
  'butterfly-blaster': {
    level: music(
      128,
      48,
      'starry, brave, sweet',
      ['twinkling arpeggios', 'soft square bass', 'chime lead'],
      'night-sky shooter music for a rainbow butterfly guarding a village.',
    ),
    boss: music(
      140,
      48,
      'buzzing swarm, heroic',
      ['buzzing saw bass', 'snare rolls', 'soaring lead'],
      'mosquito-swarm wave music that stays light enough to hear every shot.',
    ),
  },
  'brick-bloom': {
    level: music(
      116,
      48,
      'cheerful, springy, garden-bright',
      ['marimba', 'plucked bass', 'bubbly synth', 'light shaker'],
      'garden breakout groove where each cracked crate frees a flower.',
    ),
    boss: music(
      126,
      48,
      'gloomy puff, playful tension',
      ['minor-key marimba', 'wobbling bass', 'kick and clap'],
      'gloom-puff round with a bouncing, slightly mischievous edge.',
    ),
  },
  'kindness-gauntlet': {
    level: music(
      120,
      64,
      'cooperative, exploratory, warm',
      ['harp arpeggios', 'pulse bass', 'hand drums', 'soft brass'],
      'co-op dungeon crawl music that feels kind rather than menacing.',
    ),
    boss: music(
      134,
      64,
      'big-room challenge, resolute',
      ['choir pad without words', 'timpani', 'square lead', 'low strings'],
      'deep-dungeon guardian theme that rallies the whole party.',
    ),
  },
}

export const ARCADE_CABINET_AUDIO_THEMES: Partial<
  Record<ArcadeAudioGame, Partial<ArcadeCabinetAudioTheme>>
> = {
  'gloom-invaders': { music: 0.5, duckDepth: 0.55 },
  'zuzu-ghost-trail': { music: 0.6, duckDepth: 0.45, fadeSeconds: 1.2 },
  'prize-show-panic': { music: 0.5, sfx: 1, duckDepth: 0.4, fadeSeconds: 0.5 },
  'zuzu-showdown': { music: 0.5, duckDepth: 0.4, fadeSeconds: 1 },
}

export function isArcadeAudioGame(game: string): game is ArcadeAudioGame {
  return (ARCADE_AUDIO_GAMES as readonly string[]).includes(game)
}

export function isArcadeMusicScene(cue: unknown): cue is ArcadeMusicScene {
  return (ARCADE_MUSIC_SCENES as readonly unknown[]).includes(cue)
}

export function isArcadeEventCue(cue: unknown): cue is ArcadeEventCue {
  return (ARCADE_EVENT_CUES as readonly unknown[]).includes(cue)
}

/** The audio theme a cabinet plays with; unknown cabinets get the default. */
export function arcadeAudioTheme(game: string): ArcadeCabinetAudioTheme {
  const own = isArcadeAudioGame(game) ? ARCADE_CABINET_AUDIO_THEMES[game] : null
  return { ...DEFAULT_ARCADE_AUDIO_THEME, ...(own ?? {}) }
}

/** The brief for a game's cue: its own music, or the shared event cue. */
export function arcadeAudioBrief(
  owner: ArcadeAudioOwner,
  cue: ArcadeAudioCue,
): ArcadeAudioBrief | null {
  if (isArcadeEventCue(cue))
    return owner === 'shared' ? SHARED_ARCADE_EVENT_BRIEFS[cue] : null
  if (owner === 'shared') return null
  return ARCADE_MUSIC_BRIEFS[owner][cue] ?? null
}

export type ArcadeAudioAsset = {
  game: ArcadeAudioOwner
  cue: ArcadeAudioCue
  path: string
  approvedAt: string
  verifiedAt: string
  contentSha256: string
  /** The ArtJob that rendered it (provenance). */
  artJobId?: number
}

// Deliberately empty until an approved render is published and verified.
export const VERIFIED_ARCADE_AUDIO_ASSETS: readonly ArcadeAudioAsset[] = []

export type ArcadeSoundtrackEntry = {
  owner: ArcadeAudioOwner
  cue: ArcadeAudioCue
  brief: ArcadeAudioBrief
  jobKey: string
}

export function arcadeAudioJobKey(
  game: ArcadeAudioOwner,
  cue: ArcadeAudioCue,
): string {
  return `arcade-audio:v1:${game}:${cue}`
}

/** Every briefed cue: each cabinet's music scenes, then the shared cues. */
export function arcadeSoundtrackEntries(): ArcadeSoundtrackEntry[] {
  const entries: ArcadeSoundtrackEntry[] = []
  for (const owner of ARCADE_AUDIO_GAMES) {
    for (const cue of ARCADE_MUSIC_SCENES) {
      const brief = ARCADE_MUSIC_BRIEFS[owner][cue]
      if (brief)
        entries.push({
          owner,
          cue,
          brief,
          jobKey: arcadeAudioJobKey(owner, cue),
        })
    }
  }
  for (const cue of ARCADE_EVENT_CUES) {
    entries.push({
      owner: 'shared',
      cue,
      brief: SHARED_ARCADE_EVENT_BRIEFS[cue],
      jobKey: arcadeAudioJobKey('shared', cue),
    })
  }
  return entries
}

const PUBLIC_AUDIO_PATH =
  /^\/images\/arcade\/audio\/[a-z0-9-]+\/[a-z0-9-]+[.](ogg|mp3|wav)$/

/** An asset that is approved, verified, checksummed and on the public audio path. */
export function isPublishableArcadeAudioAsset(
  asset: ArcadeAudioAsset,
): boolean {
  return (
    Boolean(asset.approvedAt) &&
    Boolean(asset.verifiedAt) &&
    /^[0-9a-f]{64}$/.test(asset.contentSha256) &&
    PUBLIC_AUDIO_PATH.test(asset.path)
  )
}

/**
 * The file a cabinet should try for a cue: the game's own verified asset, or
 * for an event cue the shared one. A candidate is not proof the file exists:
 * the mixer still loads it and falls back to the oscillators on failure.
 */
export function arcadeAudioCandidatePath(
  game: string,
  cue: ArcadeAudioCue,
  assets: readonly ArcadeAudioAsset[] = VERIFIED_ARCADE_AUDIO_ASSETS,
): string | null {
  const owners: ArcadeAudioOwner[] = []
  if (isArcadeAudioGame(game)) owners.push(game)
  if (isArcadeEventCue(cue)) owners.push('shared')
  for (const owner of owners) {
    const asset = assets.find(
      (item) =>
        item.game === owner &&
        item.cue === cue &&
        isPublishableArcadeAudioAsset(item),
    )
    if (asset) return asset.path
  }
  return null
}

export function publishedArcadeAudioPath(
  game: ArcadeAudioOwner,
  cue: ArcadeAudioCue,
  filesConfirmedAccessible: ReadonlySet<string>,
  assets: readonly ArcadeAudioAsset[] = VERIFIED_ARCADE_AUDIO_ASSETS,
): string | null {
  const asset = assets.find((item) => item.game === game && item.cue === cue)
  if (!asset || !isPublishableArcadeAudioAsset(asset)) return null
  return filesConfirmedAccessible.has(asset.path) ? asset.path : null
}
