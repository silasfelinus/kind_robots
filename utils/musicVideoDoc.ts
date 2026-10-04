// /utils/musicVideoDoc.ts
//
// The MusicVideoDoc contract (conductor music-video DESIGN-BRIEF.md): the one JSON
// document every Music Video lane reads and writes. Pure and DB-free so the server
// routes, the store and the verify script all share one normalizer.
//
// normalizeMusicVideoDoc never throws. It returns a cleaned document plus a list of
// errors; callers reject the write when errors is non-empty. Unknown keys are dropped,
// strings are trimmed and capped, numbers are clamped only where clamping cannot hide a
// real mistake (timings that are out of order or overlap are errors, not silently fixed).

export const MUSIC_VIDEO_DOC_VERSION = 1 as const

export const MUSIC_VIDEO_STATUSES = [
  'DRAFT',
  'READY',
  'EXPORTED',
  'ARCHIVED',
] as const
export type MusicVideoStatus = (typeof MUSIC_VIDEO_STATUSES)[number]

export const MUSIC_VIDEO_SECTION_KINDS = [
  'intro',
  'verse',
  'pre-chorus',
  'chorus',
  'bridge',
  'outro',
] as const
export type MusicVideoSectionKind = (typeof MUSIC_VIDEO_SECTION_KINDS)[number]

export const MUSIC_VIDEO_VOCALS = [
  'female',
  'male',
  'duet',
  'instrumental',
] as const
export type MusicVideoVocal = (typeof MUSIC_VIDEO_VOCALS)[number]

export const MUSIC_VIDEO_ASPECTS = ['16:9', '9:16', '1:1'] as const
export type MusicVideoAspect = (typeof MUSIC_VIDEO_ASPECTS)[number]

export const MUSIC_VIDEO_LIMITS = {
  minDurationSec: 10,
  maxDurationSec: 600,
  defaultDurationSec: 120,
  minBpm: 40,
  maxBpm: 240,
  maxTitle: 255,
  maxPitch: 4000,
  maxStyleBible: 2000,
  maxShortText: 120,
  maxSections: 40,
  maxLinesPerSection: 32,
  maxLine: 300,
  maxScenes: 200,
  maxMarkers: 400,
  maxPrompt: 2000,
  maxTags: 1000,
  maxTransitionSec: 5,
  maxDocBytes: 1_000_000,
} as const

export type MusicVideoSettings = {
  durationSec: number
  genre?: string
  bpm?: number
  mood?: string
  vocal?: MusicVideoVocal
  language?: string
  styleBible: string
  loraResourceIds?: number[]
  aspect: MusicVideoAspect
}

export type MusicVideoSection = {
  id: string
  kind: MusicVideoSectionKind
  lines: string[]
  locked: boolean
}

export type MusicVideoSong = {
  source: 'comfy-acestep' | 'upload'
  artImageId?: number
  jobId?: number
  durationSec?: number
  bpm?: number
  seed?: number
  tags?: string
}

export type MusicVideoMarker = {
  id: string
  atSec: number
  snap: 'beat' | 'bar' | 'free'
}

export type MusicVideoScene = {
  id: string
  startSec: number
  endSec: number
  lyricRefs: { sectionId: string; lineIdx: number }[]
  prompt: string
  promptSource: 'llm' | 'user'
  /** Prose for the clip's movement (music-video/t-026); the clip falls back to prompt. */
  motionPrompt?: string
  image: {
    source: 'generated' | 'upload' | 'gallery'
    artImageId?: number
    jobId?: number
  }
  motion: {
    kind: 'kenburns' | 'clip'
    preset?: string
    clipArtImageId?: number
    jobId?: number
    /** End the clip on the next scene's still (first and last frame). */
    lastFrame?: 'next-scene'
  }
  transition: 'cut' | 'crossfade'
  transitionSec: number
}

export type MusicVideoDoc = {
  version: typeof MUSIC_VIDEO_DOC_VERSION
  pitch: string
  settings: MusicVideoSettings
  lyrics: { sections: MusicVideoSection[] }
  song: MusicVideoSong | null
  timeline: {
    beatGrid: { bpm: number; offsetSec: number; beatsPerBar: number }
    markers: MusicVideoMarker[]
  }
  scenes: MusicVideoScene[]
}

export type MusicVideoDocResult = {
  doc: MusicVideoDoc
  errors: string[]
}

const DEFAULT_BPM = 100

type Obj = Record<string, unknown>

function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function optionalText(value: unknown, max: number): string | undefined {
  const cleaned = text(value, max)
  return cleaned ? cleaned : undefined
}

function finite(value: unknown): number | undefined {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN
  return Number.isFinite(n) ? n : undefined
}

function positiveInt(value: unknown): number | undefined {
  const n = finite(value)
  return n !== undefined && Number.isInteger(n) && n > 0 ? n : undefined
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return typeof value === 'string' &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

function cleanId(value: unknown): string {
  const id = text(value, 64)
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : ''
}

export function isMusicVideoStatus(value: unknown): value is MusicVideoStatus {
  return oneOf(value, MUSIC_VIDEO_STATUSES) !== undefined
}

export function emptyMusicVideoDoc(
  input: { pitch?: unknown; settings?: unknown } = {},
): MusicVideoDoc {
  return normalizeMusicVideoDoc({
    version: MUSIC_VIDEO_DOC_VERSION,
    pitch: input.pitch,
    settings: input.settings,
  }).doc
}

function normalizeSettings(raw: unknown, errors: string[]): MusicVideoSettings {
  const s = isObj(raw) ? raw : {}
  const L = MUSIC_VIDEO_LIMITS
  const requestedDuration = finite(s.durationSec)
  let durationSec: number = L.defaultDurationSec
  if (requestedDuration !== undefined) {
    if (
      requestedDuration < L.minDurationSec ||
      requestedDuration > L.maxDurationSec
    ) {
      errors.push(
        `settings.durationSec must be between ${L.minDurationSec} and ${L.maxDurationSec}.`,
      )
    } else {
      durationSec = round3(requestedDuration)
    }
  }

  let bpm: number | undefined
  const requestedBpm = finite(s.bpm)
  if (requestedBpm !== undefined) {
    if (requestedBpm < L.minBpm || requestedBpm > L.maxBpm) {
      errors.push(`settings.bpm must be between ${L.minBpm} and ${L.maxBpm}.`)
    } else {
      bpm = round3(requestedBpm)
    }
  }

  if (
    s.vocal !== undefined &&
    s.vocal !== null &&
    s.vocal !== '' &&
    !oneOf(s.vocal, MUSIC_VIDEO_VOCALS)
  ) {
    errors.push(
      `settings.vocal must be one of ${MUSIC_VIDEO_VOCALS.join(', ')}.`,
    )
  }
  if (
    s.aspect !== undefined &&
    s.aspect !== null &&
    s.aspect !== '' &&
    !oneOf(s.aspect, MUSIC_VIDEO_ASPECTS)
  ) {
    errors.push(
      `settings.aspect must be one of ${MUSIC_VIDEO_ASPECTS.join(', ')}.`,
    )
  }

  const loraResourceIds = Array.isArray(s.loraResourceIds)
    ? [
        ...new Set(
          s.loraResourceIds
            .map(positiveInt)
            .filter((n): n is number => n !== undefined),
        ),
      ].slice(0, 8)
    : []

  const settings: MusicVideoSettings = {
    durationSec,
    styleBible: text(s.styleBible, L.maxStyleBible),
    aspect: oneOf(s.aspect, MUSIC_VIDEO_ASPECTS) ?? '16:9',
  }
  const genre = optionalText(s.genre, L.maxShortText)
  const mood = optionalText(s.mood, L.maxShortText)
  const language = optionalText(s.language, L.maxShortText)
  const vocal = oneOf(s.vocal, MUSIC_VIDEO_VOCALS)
  if (genre) settings.genre = genre
  if (bpm !== undefined) settings.bpm = bpm
  if (mood) settings.mood = mood
  if (vocal) settings.vocal = vocal
  if (language) settings.language = language
  if (loraResourceIds.length) settings.loraResourceIds = loraResourceIds
  return settings
}

function normalizeSections(
  raw: unknown,
  errors: string[],
): MusicVideoSection[] {
  const list = isObj(raw) && Array.isArray(raw.sections) ? raw.sections : []
  const L = MUSIC_VIDEO_LIMITS
  if (list.length > L.maxSections)
    errors.push(`lyrics may hold at most ${L.maxSections} sections.`)
  const seen = new Set<string>()
  const sections: MusicVideoSection[] = []
  list.slice(0, L.maxSections).forEach((item, index) => {
    if (!isObj(item)) {
      errors.push(`lyrics.sections[${index}] must be an object.`)
      return
    }
    const id = cleanId(item.id)
    const kind = oneOf(item.kind, MUSIC_VIDEO_SECTION_KINDS)
    const duplicate = Boolean(id) && seen.has(id)
    if (!id)
      errors.push(
        `lyrics.sections[${index}].id must be letters, digits, - or _.`,
      )
    else if (duplicate)
      errors.push(`lyrics.sections[${index}].id "${id}" is duplicated.`)
    else seen.add(id)
    if (!kind)
      errors.push(
        `lyrics.sections[${index}].kind must be one of ${MUSIC_VIDEO_SECTION_KINDS.join(', ')}.`,
      )
    const rawLines = Array.isArray(item.lines) ? item.lines : []
    if (rawLines.length > L.maxLinesPerSection) {
      errors.push(
        `lyrics.sections[${index}] may hold at most ${L.maxLinesPerSection} lines.`,
      )
    }
    if (!id || duplicate || !kind) return
    sections.push({
      id,
      kind,
      lines: rawLines
        .slice(0, L.maxLinesPerSection)
        .map((line) =>
          typeof line === 'string' ? line.trim().slice(0, L.maxLine) : '',
        )
        .filter(Boolean),
      locked: item.locked === true,
    })
  })
  return sections
}

function normalizeSong(raw: unknown, errors: string[]): MusicVideoSong | null {
  if (raw === null || raw === undefined) return null
  if (!isObj(raw)) {
    errors.push('song must be an object or null.')
    return null
  }
  const source = oneOf(raw.source, ['comfy-acestep', 'upload'] as const)
  if (!source) {
    errors.push('song.source must be comfy-acestep or upload.')
    return null
  }
  const song: MusicVideoSong = { source }
  const artImageId = positiveInt(raw.artImageId)
  const jobId = positiveInt(raw.jobId)
  const durationSec = finite(raw.durationSec)
  const bpm = finite(raw.bpm)
  const seed = finite(raw.seed)
  const tags = optionalText(raw.tags, MUSIC_VIDEO_LIMITS.maxTags)
  if (artImageId) song.artImageId = artImageId
  if (jobId) song.jobId = jobId
  if (durationSec !== undefined && durationSec > 0)
    song.durationSec = round3(durationSec)
  if (
    bpm !== undefined &&
    bpm >= MUSIC_VIDEO_LIMITS.minBpm &&
    bpm <= MUSIC_VIDEO_LIMITS.maxBpm
  )
    song.bpm = round3(bpm)
  if (seed !== undefined && Number.isInteger(seed) && seed >= 0)
    song.seed = seed
  if (tags) song.tags = tags
  return song
}

function normalizeTimeline(
  raw: unknown,
  fallbackBpm: number,
  errors: string[],
): MusicVideoDoc['timeline'] {
  const t = isObj(raw) ? raw : {}
  const grid = isObj(t.beatGrid) ? t.beatGrid : {}
  const L = MUSIC_VIDEO_LIMITS
  let bpm = finite(grid.bpm) ?? fallbackBpm
  if (bpm < L.minBpm || bpm > L.maxBpm) {
    errors.push(
      `timeline.beatGrid.bpm must be between ${L.minBpm} and ${L.maxBpm}.`,
    )
    bpm = fallbackBpm
  }
  const offset = finite(grid.offsetSec) ?? 0
  const beatsPerBar = positiveInt(grid.beatsPerBar) ?? 4
  if (beatsPerBar > 16)
    errors.push('timeline.beatGrid.beatsPerBar must be 16 or fewer.')

  const rawMarkers = Array.isArray(t.markers) ? t.markers : []
  if (rawMarkers.length > L.maxMarkers)
    errors.push(`timeline may hold at most ${L.maxMarkers} markers.`)
  const seen = new Set<string>()
  const markers: MusicVideoMarker[] = []
  rawMarkers.slice(0, L.maxMarkers).forEach((item, index) => {
    const id = isObj(item) ? cleanId(item.id) : ''
    const atSec = isObj(item) ? finite(item.atSec) : undefined
    if (!id || seen.has(id) || atSec === undefined || atSec < 0) {
      errors.push(
        `timeline.markers[${index}] needs a unique id and a non-negative atSec.`,
      )
      return
    }
    seen.add(id)
    markers.push({
      id,
      atSec: round3(atSec),
      snap:
        oneOf((item as Obj).snap, ['beat', 'bar', 'free'] as const) ?? 'beat',
    })
  })
  markers.sort((a, b) => a.atSec - b.atSec)

  return {
    beatGrid: {
      bpm: round3(bpm),
      offsetSec: round3(Math.max(0, offset)),
      beatsPerBar: Math.min(beatsPerBar, 16),
    },
    markers,
  }
}

function normalizeScenes(
  raw: unknown,
  sections: MusicVideoSection[],
  durationSec: number,
  errors: string[],
): MusicVideoScene[] {
  const list = Array.isArray(raw) ? raw : []
  const L = MUSIC_VIDEO_LIMITS
  if (list.length > L.maxScenes)
    errors.push(`a video may hold at most ${L.maxScenes} scenes.`)
  const sectionLines = new Map(
    sections.map((section) => [section.id, section.lines.length]),
  )
  const seen = new Set<string>()
  const scenes: MusicVideoScene[] = []

  list.slice(0, L.maxScenes).forEach((item, index) => {
    const where = `scenes[${index}]`
    if (!isObj(item)) {
      errors.push(`${where} must be an object.`)
      return
    }
    const id = cleanId(item.id)
    const startSec = finite(item.startSec)
    const endSec = finite(item.endSec)
    if (!id || seen.has(id)) {
      errors.push(`${where}.id must be unique letters, digits, - or _.`)
      return
    }
    if (
      startSec === undefined ||
      endSec === undefined ||
      startSec < 0 ||
      endSec <= startSec
    ) {
      errors.push(`${where} needs 0 <= startSec < endSec.`)
      return
    }
    if (endSec > durationSec + 0.001) {
      errors.push(`${where}.endSec runs past the ${durationSec}s video length.`)
    }
    seen.add(id)

    const lyricRefs = (Array.isArray(item.lyricRefs) ? item.lyricRefs : [])
      .filter(isObj)
      .map((ref) => ({
        sectionId: cleanId(ref.sectionId),
        lineIdx: finite(ref.lineIdx) ?? -1,
      }))
    lyricRefs.forEach((ref) => {
      const count = sectionLines.get(ref.sectionId)
      if (
        count === undefined ||
        !Number.isInteger(ref.lineIdx) ||
        ref.lineIdx < 0 ||
        ref.lineIdx >= count
      ) {
        errors.push(
          `${where}.lyricRefs points at a lyric line that does not exist.`,
        )
      }
    })

    const image = isObj(item.image) ? item.image : {}
    const motion = isObj(item.motion) ? item.motion : {}
    const transitionSec = finite(item.transitionSec) ?? 0
    const scene: MusicVideoScene = {
      id,
      startSec: round3(startSec),
      endSec: round3(endSec),
      lyricRefs,
      prompt: text(item.prompt, L.maxPrompt),
      promptSource: item.promptSource === 'user' ? 'user' : 'llm',
      image: {
        source:
          oneOf(image.source, ['generated', 'upload', 'gallery'] as const) ??
          'generated',
      },
      motion: { kind: motion.kind === 'clip' ? 'clip' : 'kenburns' },
      transition: item.transition === 'crossfade' ? 'crossfade' : 'cut',
      transitionSec: round3(
        Math.min(Math.max(transitionSec, 0), L.maxTransitionSec),
      ),
    }
    const imageArt = positiveInt(image.artImageId)
    const imageJob = positiveInt(image.jobId)
    if (imageArt) scene.image.artImageId = imageArt
    if (imageJob) scene.image.jobId = imageJob
    const preset = optionalText(motion.preset, 64)
    const clipArt = positiveInt(motion.clipArtImageId)
    const clipJob = positiveInt(motion.jobId)
    if (preset) scene.motion.preset = preset
    if (clipArt) scene.motion.clipArtImageId = clipArt
    if (clipJob) scene.motion.jobId = clipJob
    if (motion.lastFrame === 'next-scene') scene.motion.lastFrame = 'next-scene'
    const motionPrompt = text(item.motionPrompt, L.maxPrompt)
    if (motionPrompt) scene.motionPrompt = motionPrompt
    scenes.push(scene)
  })

  scenes.sort((a, b) => a.startSec - b.startSec)
  scenes.forEach((scene, index) => {
    const previous = scenes[index - 1]
    if (previous && scene.startSec < previous.endSec - 0.001) {
      errors.push(`scenes "${previous.id}" and "${scene.id}" overlap.`)
    }
  })
  return scenes
}

export function normalizeMusicVideoDoc(raw: unknown): MusicVideoDocResult {
  const errors: string[] = []
  const input = isObj(raw) ? raw : {}
  if (!isObj(raw)) errors.push('The music video document must be an object.')
  if (
    input.version !== undefined &&
    input.version !== MUSIC_VIDEO_DOC_VERSION
  ) {
    errors.push(
      `Unsupported music video document version ${String(input.version)}.`,
    )
  }

  const settings = normalizeSettings(input.settings, errors)
  const sections = normalizeSections(input.lyrics, errors)
  const song = normalizeSong(input.song, errors)
  const timeline = normalizeTimeline(
    input.timeline,
    settings.bpm ?? song?.bpm ?? DEFAULT_BPM,
    errors,
  )
  const lengthSec = Math.max(settings.durationSec, song?.durationSec ?? 0)
  const scenes = normalizeScenes(input.scenes, sections, lengthSec, errors)

  return {
    doc: {
      version: MUSIC_VIDEO_DOC_VERSION,
      pitch: text(input.pitch, MUSIC_VIDEO_LIMITS.maxPitch),
      settings,
      lyrics: { sections },
      song,
      timeline,
      scenes,
    },
    errors,
  }
}

export function serializeMusicVideoDoc(doc: MusicVideoDoc): string {
  return JSON.stringify(doc)
}

export function parseStoredMusicVideoDoc(
  stored: string | null | undefined,
): MusicVideoDoc {
  try {
    return normalizeMusicVideoDoc(JSON.parse(stored || '{}')).doc
  } catch {
    return emptyMusicVideoDoc()
  }
}
