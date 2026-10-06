// /utils/musicVideoScenes.ts
//
// Scenes for the Music Video creator (music-video/t-008). Pure and DB-free: an
// automatic scene plan on the beat grid, the scene-prompt request and parser, the
// prompt checker, and the Krea 2 frame size for each aspect ratio.
//
// Scene prompts go to Krea 2, which paints the nouns it is given and has no
// instruction-following layer (ART-PROMPTS.md). The checker rejects the three
// things that have burned this pipeline before: negations, art-direction jargon,
// and words that summon lettering. It also enforces the first-run trailer's IP
// guardrail: no franchise names, because the model renders what it is told.
//
// music-video/t-025: a video can instead borrow a Comic Studio series' style, so
// its stills render through that series' house lane (an SDXL-family checkpoint
// with the lane's prefix, suffix and series negatives). settings.bannedTerms is
// enforced on every engine, for a story's secret or a franchise guardrail.

import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoAspect,
  type MusicVideoDoc,
  type MusicVideoScene,
} from './musicVideoDoc'
import {
  buildComicLaneEnqueueBody,
  type ComicLane,
  type ComicSeriesStyle,
} from './comicLanes'
import { checkpointFamily, checkpointProfile } from './checkpointProfiles'

/*
 * Any catalog checkpoint as an image lane (Silas, 2026-10-06: "why am i
 * missing so many checkpoints on the music video selection list?"). The key is
 * "ckpt:" plus the checkpoint's Comfy path; steps, cfg and sampler come from
 * the family's measured profile, and Illustrious and Pony read tag prompts.
 */
const CHECKPOINT_LANE_PREFIX = 'ckpt:'

export function checkpointLaneKey(checkpointPath: string): string {
  return `${CHECKPOINT_LANE_PREFIX}${checkpointPath}`
}

export function checkpointPathFromLaneKey(
  key: string | null | undefined,
): string | null {
  if (!key?.startsWith(CHECKPOINT_LANE_PREFIX)) return null
  return key.slice(CHECKPOINT_LANE_PREFIX.length).trim() || null
}

export function checkpointLane(checkpointPath: string): ComicLane {
  const profile = checkpointProfile(checkpointPath)
  const family = checkpointFamily(checkpointPath)
  return {
    key: checkpointLaneKey(checkpointPath),
    label: checkpointPath,
    engine: 'comfy',
    checkpoint: checkpointPath,
    promptStyle:
      family === 'illustrious' || family === 'pony' ? 'tags' : 'prose',
    steps: profile.steps,
    cfg: profile.cfg,
    sampler: profile.sampler,
    active: true,
  }
}

export type ScenePromptRequest = {
  system: string
  prompt: string
}

export type ScenePromptViolation = {
  rule: 'negation' | 'jargon' | 'lettering' | 'franchise' | 'empty' | 'too-long'
  detail: string
}

const TARGET_SCENE_SECONDS = 4
const MIN_SCENE_SECONDS = 2

export function kreaFrameSize(aspect: MusicVideoAspect): {
  width: number
  height: number
} {
  if (aspect === '9:16') return { width: 768, height: 1344 }
  if (aspect === '1:1') return { width: 1024, height: 1024 }
  return { width: 1344, height: 768 }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function planScenes(doc: MusicVideoDoc): MusicVideoScene[] {
  const durationSec = Math.max(
    doc.settings.durationSec,
    doc.song?.durationSec ?? 0,
  )
  const { bpm, beatsPerBar } = doc.timeline.beatGrid
  const barSec = (60 / bpm) * beatsPerBar
  const barsPerScene = Math.max(1, Math.round(TARGET_SCENE_SECONDS / barSec))
  const sceneSec = Math.max(MIN_SCENE_SECONDS, barsPerScene * barSec)
  const count = Math.min(
    MUSIC_VIDEO_LIMITS.maxScenes,
    Math.max(1, Math.floor(durationSec / sceneSec)),
  )

  const lines = doc.lyrics.sections.flatMap((section) =>
    section.lines.map((_, lineIdx) => ({ sectionId: section.id, lineIdx })),
  )

  return Array.from({ length: count }, (_, i) => {
    const startSec = round3(i * sceneSec)
    const endSec =
      i === count - 1 ? round3(durationSec) : round3((i + 1) * sceneSec)
    const from = Math.floor((i * lines.length) / count)
    const to = Math.floor(((i + 1) * lines.length) / count)
    return {
      id: `s${i + 1}`,
      startSec,
      endSec,
      lyricRefs: lines.slice(from, to),
      prompt: '',
      promptSource: 'llm',
      image: { source: 'generated' },
      motion: { kind: 'kenburns' },
      transition: 'cut',
      transitionSec: 0,
    }
  })
}

export const SCENE_PROMPT_SYSTEM = [
  'You write image prompts for the scenes of an animated music video.',
  'Each prompt describes one still frame a painter could paint: lead with the physical',
  'subject (who or what, material, shape, pose), then the setting, then light and colour.',
  'Write what IS in the frame. Never write what is absent, and never use the words no,',
  'not, without, never or avoid, because the image model paints every noun it reads.',
  'Never ask for words, lettering, captions, logos or signs in the picture.',
  'Never name a film, show, brand or existing franchise character.',
  'Answer with one line per scene, exactly in the form "s1: <prompt>", nothing else.',
  'Keep each prompt under 60 words.',
].join(' ')

export function buildScenePromptRequest(
  doc: MusicVideoDoc,
  scenes: MusicVideoScene[],
): ScenePromptRequest {
  const lineText = new Map<string, string>()
  for (const section of doc.lyrics.sections) {
    section.lines.forEach((line, idx) =>
      lineText.set(`${section.id}:${idx}`, line),
    )
  }
  const sceneLines = scenes.map((scene) => {
    const lyric = scene.lyricRefs
      .map((ref) => lineText.get(`${ref.sectionId}:${ref.lineIdx}`))
      .filter(Boolean)
      .join(' / ')
    const seconds = `${scene.startSec.toFixed(1)}-${scene.endSec.toFixed(1)}s`
    return `${scene.id} (${seconds}): ${lyric || 'instrumental passage'}`
  })
  return {
    system: SCENE_PROMPT_SYSTEM,
    prompt: [
      `Video idea: ${doc.pitch.trim() || 'an untitled music video'}`,
      doc.settings.genre ? `Music: ${doc.settings.genre}` : '',
      doc.settings.mood ? `Mood: ${doc.settings.mood}` : '',
      doc.settings.styleBible
        ? `Every frame shares this look, so describe content rather than style: ${doc.settings.styleBible}`
        : '',
      doc.settings.bannedTerms?.length
        ? `Never use any of these words or phrases: ${doc.settings.bannedTerms.join(', ')}.`
        : '',
      '',
      'Write one image prompt for each scene, following the lyric it plays under:',
      ...sceneLines,
    ]
      .filter((line, idx, all) => line || all[idx - 1])
      .join('\n'),
  }
}

const SCENE_LINE = /^\s*(s\d+)\s*[:\-–]\s*(.+?)\s*$/i

export function parseScenePromptResponse(
  text: string,
  sceneIds: string[],
): Record<string, string> {
  const wanted = new Set(sceneIds)
  const prompts: Record<string, string> = {}
  for (const raw of String(text || '').split(/\r?\n/)) {
    const match = raw.replace(/\*\*/g, '').match(SCENE_LINE)
    const id = match?.[1]?.toLowerCase()
    const prompt = match?.[2]?.replace(/^["']|["']$/g, '').trim()
    if (!id || !prompt || !wanted.has(id) || prompts[id]) continue
    prompts[id] = prompt.slice(0, MUSIC_VIDEO_LIMITS.maxPrompt)
  }
  return prompts
}

const NEGATION =
  /\b(no|not|without|never|avoid|don't|doesn't|isn't|aren't|none)\b/i
const JARGON =
  /\b(iconic|concrete|focal subject|focal point|silhouette|emblem|thumbnail|masterpiece|best quality|highly detailed|trending on|award[- ]winning)\b/i
const LETTERING =
  /\b(text|caption|captions|logo|logos|lettering|subtitle|subtitles|signage|title card|words|typography|watermark)\b/i
const FRANCHISE =
  /\b(tmnt|teenage mutant|ninja turtles?|cowabunga|shredder|splinter|krang|april o'neil|leonardo|donatello|raphael|michelangelo)\b/i

/**
 * Which scenes to animate when none is marked (t-031, rule from Silas,
 * 2026-10-06: "we should always open with a hero, or within the first two
 * shots. Start strong, end strong. strong surprise middle"). The first shot,
 * the last, the middle, then the rest spread evenly, in scene order.
 */
export function heroSceneIndexes(count: number, total: number): number[] {
  const want = Math.min(Math.max(Math.floor(count), 0), total)
  const picked = new Set<number>()
  const anchors = [0, total - 1, Math.floor(total / 2)]
  for (const index of anchors) {
    if (picked.size < want && index >= 0) picked.add(index)
  }
  for (let step = 0; picked.size < want; step += 1) {
    const spread = Math.floor(((step + 0.5) * total) / want)
    const index = [spread, spread + 1, spread - 1].find(
      (candidate) =>
        candidate >= 0 && candidate < total && !picked.has(candidate),
    )
    if (index !== undefined) picked.add(index)
    else {
      const free = [...Array(total).keys()].find((i) => !picked.has(i))
      if (free === undefined) break
      picked.add(free)
    }
  }
  return [...picked].sort((a, b) => a - b)
}

export function checkScenePrompt(prompt: string): ScenePromptViolation[] {
  const text = String(prompt || '').trim()
  if (!text) return [{ rule: 'empty', detail: 'The scene prompt is empty.' }]
  const violations: ScenePromptViolation[] = []
  const checks: [RegExp, ScenePromptViolation['rule'], string][] = [
    [NEGATION, 'negation', 'is a negation; Krea paints the noun it negates'],
    [JARGON, 'jargon', 'is commissioning jargon; Krea paints the word itself'],
    [LETTERING, 'lettering', 'summons lettering into the frame'],
    [
      FRANCHISE,
      'franchise',
      'names a franchise or its characters (first-run IP guardrail)',
    ],
  ]
  for (const [pattern, rule, why] of checks) {
    const found = text.match(pattern)?.[0]
    if (found) violations.push({ rule, detail: `"${found}" ${why}.` })
  }
  if (text.length > MUSIC_VIDEO_LIMITS.maxPrompt) {
    violations.push({
      rule: 'too-long',
      detail: 'The scene prompt is too long.',
    })
  }
  return violations
}

export function composeScenePrompt(
  scenePrompt: string,
  styleBible: string,
): string {
  const style = styleBible.trim()
  return style ? `${scenePrompt.trim()}, ${style}` : scenePrompt.trim()
}

export const MUSIC_VIDEO_KREA_STEPS = 8
export const MUSIC_VIDEO_KREA_CFG = 1

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The banned terms a text contains, matched as whole words or phrases and
 * ignoring case, so "people" never matches inside "peopled".
 */
export function findBannedTerms(
  text: string,
  terms: readonly string[] | undefined,
): string[] {
  if (!terms?.length || !text) return []
  const haystack = text.toLowerCase()
  return terms.filter((term) => {
    const needle = term.trim().toLowerCase()
    if (!needle) return false
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(needle).replace(/ /g, '\\s+')}($|[^a-z0-9])`,
    )
    return pattern.test(haystack)
  })
}

export type MusicVideoStillBody = {
  engine: string
  promptString: string
  negativePrompt?: string
  checkpoint?: string
  width: number
  height: number
  steps?: number
  cfg?: number
  sampler?: string
  loraResourceIds: number[]
  isPublic: false
  isMature: false
  designer: string
  projectSlug: string
}

/**
 * The /api/art/enqueue body for one scene still. Krea 2 by default; with a comic
 * lane, the series' checkpoint, lane prefix and suffix, series style and
 * negatives, at the video's aspect. Always private.
 */
export function musicVideoStillBody(
  doc: MusicVideoDoc,
  scene: Pick<MusicVideoScene, 'prompt'> & {
    image?: Pick<MusicVideoScene['image'], 'loraResourceIds'>
  },
  options: {
    projectSlug: string
    lane?: ComicLane | null
    series?: ComicSeriesStyle | null
  },
): MusicVideoStillBody {
  const composed = composeScenePrompt(scene.prompt, doc.settings.styleBible)
  const shared = {
    // The video's LoRAs plus this scene's own (t-032), at most 8.
    loraResourceIds: [
      ...new Set([
        ...(doc.settings.loraResourceIds ?? []),
        ...(scene.image?.loraResourceIds ?? []),
      ]),
    ].slice(0, 8),
    isPublic: false as const,
    isMature: false as const,
    designer: 'Music Video',
    projectSlug: options.projectSlug,
  }
  if (!options.lane) {
    const { width, height } = kreaFrameSize(doc.settings.aspect)
    return {
      engine: 'krea2',
      promptString: composed,
      width,
      height,
      steps: MUSIC_VIDEO_KREA_STEPS,
      cfg: MUSIC_VIDEO_KREA_CFG,
      ...shared,
    }
  }
  const body = buildComicLaneEnqueueBody(
    options.lane,
    {
      promptProse: composed,
      promptTags: options.lane.promptStyle === 'tags' ? composed : null,
      aspect: doc.settings.aspect,
      useSeriesStyle: true,
      negativePrompt:
        [options.series?.negativeTags, doc.settings.negativePrompt]
          .map((part) => String(part ?? '').trim())
          .filter(Boolean)
          .join(', ') || null,
    },
    { ...(options.series ?? {}), isPublicArt: false },
  )
  return {
    engine: body.engine,
    promptString: body.promptString,
    ...(body.negativePrompt ? { negativePrompt: body.negativePrompt } : {}),
    ...(body.checkpoint ? { checkpoint: body.checkpoint } : {}),
    width: body.width,
    height: body.height,
    ...(body.steps ? { steps: body.steps } : {}),
    ...(body.cfg ? { cfg: body.cfg } : {}),
    ...(body.sampler ? { sampler: body.sampler } : {}),
    ...shared,
  }
}
