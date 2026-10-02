// /utils/musicVideoLyrics.ts
//
// Lyrics for the Music Video creator (music-video/t-005). Pure and DB-free: the
// section plan, the LLM prompt, the response parser, the lock-respecting merge, and
// the ACE-Step lyric text the song engine (t-010) sends to Comfy.
//
// The model is asked for plain bracket-tagged sections ("[Verse 1]" then lines),
// the same shape ACE-Step consumes, so what Silas edits is what gets sung.

import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoScene,
  type MusicVideoSection,
  type MusicVideoSectionKind,
  type MusicVideoSettings,
} from './musicVideoDoc'

export type LyricSectionPlan = {
  id: string
  kind: MusicVideoSectionKind
  lines: number
}

export type LyricsPrompt = {
  system: string
  prompt: string
}

const KIND_PREFIX: Record<MusicVideoSectionKind, string> = {
  intro: 'i',
  verse: 'v',
  'pre-chorus': 'p',
  chorus: 'c',
  bridge: 'b',
  outro: 'o',
}

const KIND_LABEL: Record<MusicVideoSectionKind, string> = {
  intro: 'Intro',
  verse: 'Verse',
  'pre-chorus': 'Pre-Chorus',
  chorus: 'Chorus',
  bridge: 'Bridge',
  outro: 'Outro',
}

const LINES_PER_SECTION: Record<MusicVideoSectionKind, number> = {
  intro: 2,
  verse: 4,
  'pre-chorus': 2,
  chorus: 4,
  bridge: 4,
  outro: 2,
}

function structureFor(durationSec: number): MusicVideoSectionKind[] {
  if (durationSec < 45) return ['verse', 'chorus']
  if (durationSec < 90) return ['verse', 'chorus', 'verse', 'chorus']
  if (durationSec < 150) {
    return ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus']
  }
  if (durationSec < 240) {
    return [
      'intro',
      'verse',
      'pre-chorus',
      'chorus',
      'verse',
      'pre-chorus',
      'chorus',
      'bridge',
      'chorus',
      'outro',
    ]
  }
  return [
    'intro',
    'verse',
    'pre-chorus',
    'chorus',
    'verse',
    'pre-chorus',
    'chorus',
    'verse',
    'chorus',
    'bridge',
    'chorus',
    'outro',
  ]
}

export function planLyricSections(
  settings: Pick<MusicVideoSettings, 'durationSec' | 'bpm' | 'vocal'>,
): LyricSectionPlan[] {
  if (settings.vocal === 'instrumental') return []
  const counts: Partial<Record<MusicVideoSectionKind, number>> = {}
  const slowSong = (settings.bpm ?? 100) < 80
  return structureFor(settings.durationSec).map((kind) => {
    const n = (counts[kind] ?? 0) + 1
    counts[kind] = n
    const baseLines = LINES_PER_SECTION[kind]
    const lines =
      slowSong && kind !== 'chorus' ? Math.max(2, baseLines - 1) : baseLines
    return { id: `${KIND_PREFIX[kind]}${n}`, kind, lines }
  })
}

export function sectionTag(
  kind: MusicVideoSectionKind,
  ordinal: number,
): string {
  return kind === 'verse' ? `[Verse ${ordinal}]` : `[${KIND_LABEL[kind]}]`
}

function planTags(plan: LyricSectionPlan[]): string[] {
  const verseCount: Record<string, number> = {}
  return plan.map((section) => {
    verseCount[section.kind] = (verseCount[section.kind] ?? 0) + 1
    return `${sectionTag(section.kind, verseCount[section.kind] ?? 1)} — ${section.lines} lines`
  })
}

function settingsLine(settings: MusicVideoSettings): string {
  const parts = [
    settings.genre && `genre: ${settings.genre}`,
    settings.mood && `mood: ${settings.mood}`,
    settings.bpm && `tempo: ${settings.bpm} BPM`,
    settings.vocal && `vocal: ${settings.vocal}`,
    settings.language && `language: ${settings.language}`,
    `length: about ${Math.round(settings.durationSec)} seconds`,
  ].filter(Boolean)
  return parts.join('; ')
}

export const LYRICS_SYSTEM_PROMPT = [
  'You write singable song lyrics for a music video.',
  'Answer with lyrics only: each section starts with its tag on its own line, exactly as given',
  '(for example [Verse 1] or [Chorus]), followed by its lines, one lyric line per line.',
  'No commentary, no titles, no notes, no markdown, no blank sections.',
  'Keep lines short enough to sing (under 12 words), with concrete images a camera could film.',
  'Repeated choruses should share their hook line.',
].join(' ')

export function buildLyricsPrompt(input: {
  pitch: string
  settings: MusicVideoSettings
  plan: LyricSectionPlan[]
  keep?: MusicVideoSection[]
}): LyricsPrompt {
  const keep = (input.keep ?? []).filter((section) => section.lines.length)
  const keepBlock = keep.length
    ? [
        '',
        'These sections are already written and must stay word for word; write the rest to fit them:',
        ...keep.map(
          (section) => `${section.kind}: ${section.lines.join(' / ')}`,
        ),
      ]
    : []
  return {
    system: LYRICS_SYSTEM_PROMPT,
    prompt: [
      `Song idea: ${input.pitch.trim() || 'an untitled song'}`,
      `Settings: ${settingsLine(input.settings)}`,
      '',
      'Write these sections, in this order:',
      ...planTags(input.plan),
      ...keepBlock,
    ].join('\n'),
  }
}

const TAG_PATTERN = /^\s*\[([A-Za-z -]+?)\s*(\d+)?\]\s*$/

function kindFromTag(label: string): MusicVideoSectionKind | null {
  const cleaned = label.trim().toLowerCase().replace(/\s+/g, '-')
  if (cleaned === 'prechorus') return 'pre-chorus'
  if (cleaned === 'hook' || cleaned === 'refrain') return 'chorus'
  return (Object.keys(KIND_LABEL) as MusicVideoSectionKind[]).includes(
    cleaned as MusicVideoSectionKind,
  )
    ? (cleaned as MusicVideoSectionKind)
    : null
}

function cleanLyricLine(line: string): string {
  return line
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .replace(/\*\*/g, '')
    .trim()
    .slice(0, MUSIC_VIDEO_LIMITS.maxLine)
}

export function parseLyricsResponse(text: string): MusicVideoSection[] {
  const sections: MusicVideoSection[] = []
  const counts: Partial<Record<MusicVideoSectionKind, number>> = {}
  let current: MusicVideoSection | null = null
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const tag = rawLine.match(TAG_PATTERN)
    if (tag) {
      const kind = kindFromTag(tag[1] ?? '')
      if (!kind) {
        current = null
        continue
      }
      const n = (counts[kind] ?? 0) + 1
      counts[kind] = n
      current = {
        id: `${KIND_PREFIX[kind]}${n}`,
        kind,
        lines: [],
        locked: false,
      }
      sections.push(current)
      continue
    }
    const line = cleanLyricLine(rawLine)
    if (!line || !current) continue
    if (current.lines.length < MUSIC_VIDEO_LIMITS.maxLinesPerSection)
      current.lines.push(line)
  }
  return sections
    .filter((section) => section.lines.length)
    .slice(0, MUSIC_VIDEO_LIMITS.maxSections)
}

export function mergeLyricSections(
  existing: MusicVideoSection[],
  generated: MusicVideoSection[],
  onlySectionId?: string,
): MusicVideoSection[] {
  if (onlySectionId) {
    const target = existing.find((section) => section.id === onlySectionId)
    if (!target || target.locked) return existing
    const replacement =
      generated.find((section) => section.id === onlySectionId) ??
      generated.find((section) => section.kind === target.kind)
    if (!replacement) return existing
    return existing.map((section) =>
      section.id === onlySectionId
        ? { ...section, lines: replacement.lines }
        : section,
    )
  }
  const lockedById = new Map(
    existing
      .filter((section) => section.locked)
      .map((section) => [section.id, section]),
  )
  const merged = generated.map(
    (section) => lockedById.get(section.id) ?? section,
  )
  for (const locked of lockedById.values()) {
    if (!merged.some((section) => section.id === locked.id)) merged.push(locked)
  }
  return merged
}

export function pruneDanglingLyricRefs(
  scenes: MusicVideoScene[],
  sections: MusicVideoSection[],
): MusicVideoScene[] {
  const lineCounts = new Map(
    sections.map((section) => [section.id, section.lines.length]),
  )
  return scenes.map((scene) => ({
    ...scene,
    lyricRefs: scene.lyricRefs.filter((ref) => {
      const count = lineCounts.get(ref.sectionId)
      return count !== undefined && ref.lineIdx >= 0 && ref.lineIdx < count
    }),
  }))
}

export function toAceStepLyrics(sections: MusicVideoSection[]): string {
  const counts: Partial<Record<MusicVideoSectionKind, number>> = {}
  return sections
    .filter((section) => section.lines.length)
    .map((section) => {
      const n = (counts[section.kind] ?? 0) + 1
      counts[section.kind] = n
      return [sectionTag(section.kind, n), ...section.lines].join('\n')
    })
    .join('\n\n')
}
