// ~/stores/helpers/stageHelper.ts
// -----------------------------------------------------------------------------
// Stage feature helper. Pure functions and types only \u2014 no Pinia stores,
// no Vue runtime, no IO except localStorage and a single fetch helper that
// talks to the existing /api/botcafe/chat endpoint.
//
// Layers:
//   1) Types (everything Stage-related lives here)
//   2) Cast resolution helpers (Character/Bot \u2192 ResolvedCastMember)
//   3) Prompt building (system + user messages for a turn)
//   4) Rotation strategies (who speaks next)
//   5) Streaming fetch (POST /api/botcafe/chat, parse SSE)
//   6) LocalStorage persistence (snapshot shape + load/save)
// -----------------------------------------------------------------------------

import type { Character, Bot } from '~/prisma/generated/prisma/client'

// =============================================================================
// 1) TYPES
// =============================================================================

export type StageRotation =
  | 'round-robin' // Each speaker in order, repeating.
  | 'host-led' // First role speaks every other turn.
  | 'narrator-led' // First role (the narrator) frames, then others react.
  | 'free-for-all' // Pseudo-random but deterministic by turn index.
  | 'paired' // Alternates between exactly two participants.
  | 'spotlight' // One featured participant gets the lion's share.
  | 'user-directed' // The user (or director) chooses the next speaker.

// /stores/helpers/stageHelper.ts

export type StageRole = {
  key: string
  label: string
  description: string
  min: number
  max: number
  promptDescriptor: string
  badgeImagePath?: string
}

export type StagePreset = {
  id: string
  label: string
  icon: string
  tagline: string
  description: string
  systemPrompt: string
  openingCue: string
  roles: StageRole[]
  defaultTurns: number
  rotation: StageRotation
  includeStageDirections: boolean
  imagePath?: string
  utilityImagePath?: string
}

export type TemporaryParticipant = {
  name: string
  species?: string
  imagePath?: string | null
  personality?: string
  comments?: string
  prompt?: string
  artImageId?: number | null
}

export type ResolvedCastMember = {
  slotId: string
  roleKey: string
  role: StageRole
  participantType: StageParticipantType
  displayName: string
  artImageId: number | null
  imagePath: string | null
  blurb: string
}

export type StageTranscriptEntry = {
  id: string
  kind: StageTranscriptKind
  castSlotId: string | null
  speakerLabel: string
  speakerArtImageId: number | null
  speakerImagePath?: string | null
  content: string
  isStageDirection: boolean
  timestamp: number
}

export type StageParticipantType =
  | 'character'
  | 'bot'
  | 'temporary-bot'
  | 'narrator'
  | 'user'
  | 'dream'
  | 'scenario'
  | 'system'

/**
 * A cast slot. Either holds a reference to a DB Character/Bot (by id),
 * or holds a temporary participant inline. Empty slots have nulls everywhere.
 */
export type CastSlot = {
  slotId: string
  roleKey: string
  participantType: StageParticipantType | null
  /** When participantType is 'character' | 'bot', this is the DB id. */
  participantId: number | null
  /** When participantType is 'temporary-bot' | 'narrator', payload lives here. */
  temporary: TemporaryParticipant | null
}

export type StageTranscriptKind =
  | 'stage' // Opening cue from the stage itself.
  | 'speaker' // A cast member's generated line.
  | 'user' // User interjecting as themselves.
  | 'narrator' // User-injected scene direction.
  | 'director' // User-injected director nudge (hidden steering).

// =============================================================================
// 2) CAST RESOLUTION (Character/Bot \u2192 ResolvedCastMember blurb)
// =============================================================================

function characterBlurb(c: Character): string {
  const traits = [
    c.role && `role: ${c.role}`,
    c.alignment && `alignment: ${c.alignment}`,
    c.class && `class: ${c.class}`,
    c.species && `species: ${c.species}`,
    c.gender && `gender: ${c.gender}`,
  ]
    .filter(Boolean)
    .join(', ')

  const flavor = [
    c.personality && `Personality: ${c.personality}`,
    c.drive && `Drive: ${c.drive}`,
    c.quirks && `Quirks: ${c.quirks}`,
    c.backstory && `Backstory: ${c.backstory}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    [traits, flavor].filter(Boolean).join('. ') ||
    'No personality notes on file.'
  )
}

function botBlurb(b: Bot): string {
  return (
    [
      b.tagline && `Tagline: ${b.tagline}`,
      b.personality && `Personality: ${b.personality}`,
      b.botIntro && `Intro: ${b.botIntro}`,
      b.theme && `Theme: ${b.theme}`,
    ]
      .filter(Boolean)
      .join(' ') || 'No personality notes on file.'
  )
}

function temporaryBlurb(t: TemporaryParticipant): string {
  const parts = [
    t.species && `Species: ${t.species}`,
    t.personality && `Personality: ${t.personality}`,
    t.comments && `Notes: ${t.comments}`,
    t.prompt && `Voice: ${t.prompt}`,
  ].filter(Boolean)

  return (
    parts.join(' ') || 'A freshly conjured cast member with no notes on file.'
  )
}
/**
 * Resolve a single CastSlot to a uniform ResolvedCastMember.
 * Returns null if the slot is empty or can't be resolved.
 */
export function resolveCastSlot(
  slot: CastSlot,
  role: StageRole,
  lookup: {
    findCharacter: (id: number) => Character | undefined
    findBot: (id: number) => Bot | undefined
  },
): ResolvedCastMember | null {
  if (slot.participantType === 'character' && slot.participantId != null) {
    const c = lookup.findCharacter(slot.participantId)
    if (!c) return null
    return {
      slotId: slot.slotId,
      roleKey: slot.roleKey,
      role,
      participantType: 'character',
      displayName: c.name,
      artImageId: c.artImageId ?? null,
      imagePath: c.imagePath ?? null,
      blurb: characterBlurb(c),
    }
  }

  if (slot.participantType === 'bot' && slot.participantId != null) {
    const b = lookup.findBot(slot.participantId)
    if (!b) return null
    return {
      slotId: slot.slotId,
      roleKey: slot.roleKey,
      role,
      participantType: 'bot',
      displayName: b.name,
      artImageId: b.artImageId ?? null,
      imagePath: b.avatarImage ?? null,
      blurb: botBlurb(b),
    }
  }

  if (
    (slot.participantType === 'temporary-bot' ||
      slot.participantType === 'narrator') &&
    slot.temporary
  ) {
    return {
      slotId: slot.slotId,
      roleKey: slot.roleKey,
      role,
      participantType: slot.participantType,
      displayName: slot.temporary.name,
      artImageId: slot.temporary.artImageId ?? null,
      imagePath: slot.temporary.imagePath ?? null,
      blurb: temporaryBlurb(slot.temporary),
    }
  }

  return null
}

// =============================================================================
// 3) PROMPT BUILDING
// =============================================================================

export function buildCastDescription(cast: ResolvedCastMember[]): string {
  return cast
    .map(
      (c, idx) =>
        `${idx + 1}. ${c.displayName} ${c.role.promptDescriptor} \u2014 ${c.blurb}`,
    )
    .join('\n')
}

export type BuildTurnPromptArgs = {
  stage: StagePreset
  cast: ResolvedCastMember[]
  transcript: StageTranscriptEntry[]
  /** Index into `cast` of the speaker for this turn. */
  speakerIndex: number
  /** Optional show topic / premise the user typed in. */
  showTopic?: string
  /**
   * Optional one-shot director nudge ("Raise the stakes", "Make it funnier", etc).
   * Injected into the system prompt for THIS turn only.
   */
  directorNudge?: string | null
}

export type BuildTurnPromptResult = {
  system: string
  user: string
}

export function buildTurnPrompt(
  args: BuildTurnPromptArgs,
): BuildTurnPromptResult {
  const { stage, cast, transcript, speakerIndex, showTopic, directorNudge } =
    args
  const speaker = cast[speakerIndex]
  if (!speaker) {
    throw new Error(`[stageHelper] No cast member at index ${speakerIndex}`)
  }

  const stageDirectionsLine = stage.includeStageDirections
    ? '- You MAY occasionally include brief stage directions in parentheses, inline (e.g. "(leans in)"). Keep them sparse.'
    : '- Do NOT include stage directions.'

  const system = [
    stage.systemPrompt,
    '',
    `THE STAGE: ${stage.label}`,
    `OPENING CUE: ${stage.openingCue}`,
    showTopic ? `TOPIC / PREMISE: ${showTopic}` : '',
    '',
    'THE CAST:',
    buildCastDescription(cast),
    '',
    'INSTRUCTIONS:',
    `- Output ONLY the next line of dialogue from ${speaker.displayName}, playing the ${speaker.role.label}.`,
    '- Stay in character. Match the speaker\u2019s voice, vocabulary, and personality.',
    `- No quotation marks around the line. No "${speaker.displayName}:" prefix. Just the line itself.`,
    '- Keep it to 1\u20133 sentences unless the format calls for more.',
    stageDirectionsLine,
    '- Do not break the fourth wall. Do not narrate what other characters do.',
    directorNudge
      ? `\nDIRECTOR\u2019S NOTE FOR THIS TURN: ${directorNudge}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const transcriptText =
    transcript.length === 0
      ? '(The scene begins. No one has spoken yet.)'
      : transcript
          .filter((line) => line.kind !== 'director') // director nudges are hidden from transcript history
          .map((line) =>
            line.isStageDirection
              ? `[${line.speakerLabel}] ${line.content}`
              : `${line.speakerLabel}: ${line.content}`,
          )
          .join('\n')

  const user = [
    'Transcript so far:',
    transcriptText,
    '',
    `Now ${speaker.displayName} speaks as the ${speaker.role.label}. Generate their next line.`,
  ].join('\n')

  return { system, user }
}

// =============================================================================
// 4) ROTATION STRATEGIES
// =============================================================================

export type RotationFn = (
  turnIndex: number,
  cast: ResolvedCastMember[],
  history: StageTranscriptEntry[],
) => number

export const rotationStrategies: Record<StageRotation, RotationFn> = {
  'round-robin': (i, cast) => i % cast.length,

  'host-led': (i, cast) => {
    if (!cast.length) return 0
    if (i % 2 === 0) return 0 // host every other turn
    const others = cast.length - 1
    if (others <= 0) return 0
    return 1 + (Math.floor(i / 2) % others)
  },

  'narrator-led': (i, cast) => {
    // Narrator (index 0) speaks every third turn; others rotate in between.
    if (!cast.length) return 0
    if (i % 3 === 0) return 0
    const others = cast.length - 1
    if (others <= 0) return 0
    return 1 + (Math.floor(i / 3) % others)
  },

  'free-for-all': (i, cast) => {
    if (!cast.length) return 0
    return (i * 7919 + 13) % cast.length
  },

  paired: (i, cast) => {
    if (!cast.length) return 0
    return i % Math.min(2, cast.length)
  },

  spotlight: (i, cast) => {
    // Index 0 gets ~half the turns; others rotate the rest.
    if (!cast.length) return 0
    if (i % 2 === 0) return 0
    const others = cast.length - 1
    if (others <= 0) return 0
    return 1 + (Math.floor(i / 2) % others)
  },

  'user-directed': (i, cast) => {
    // No automatic rotation \u2014 the store consults this only as a fallback.
    // The store should override via an explicit speaker pick.
    return i % cast.length
  },
}

/** Convenience: pick the next speaker index using a stage's rotation. */
export function pickNextSpeakerIndex(
  stage: StagePreset,
  cast: ResolvedCastMember[],
  turnIndex: number,
  history: StageTranscriptEntry[],
): number {
  if (!cast.length) return 0
  const fn = rotationStrategies[stage.rotation]
  return fn(turnIndex, cast, history)
}

// =============================================================================
// 5) STREAMING FETCH (talks to existing /api/botcafe/chat)
// =============================================================================

export type StageStreamOptions = {
  serverId?: number | null
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

type BotCafeChunk = {
  content?: string
  message?: string
  data?: {
    content?: string
    message?: string
    choices?: Array<{
      delta?: { content?: string | null }
      message?: { content?: string | null }
    }>
  }
  choices?: Array<{
    delta?: { content?: string | null }
    message?: { content?: string | null }
  }>
}

/** Pull a token out of one parsed SSE/JSON chunk. */
function extractStreamToken(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const p = payload as BotCafeChunk

  if (typeof p.content === 'string' && p.content) return p.content
  const d = p.choices?.[0]?.delta?.content
  if (typeof d === 'string' && d) return d
  const m = p.choices?.[0]?.message?.content
  if (typeof m === 'string' && m) return m

  const wrapped = p.data
  if (wrapped) {
    if (typeof wrapped.content === 'string' && wrapped.content)
      return wrapped.content
    const wd = wrapped.choices?.[0]?.delta?.content
    if (typeof wd === 'string' && wd) return wd
    const wm = wrapped.choices?.[0]?.message?.content
    if (typeof wm === 'string' && wm) return wm
    if (typeof wrapped.message === 'string' && wrapped.message)
      return wrapped.message
  }

  if (typeof p.message === 'string' && p.message) {
    const generic = new Set([
      'Bot response received.',
      'Response received.',
      'Success',
      'OK',
    ])
    if (!generic.has(p.message.trim())) return p.message
  }
  return ''
}

function parseStreamLine(line: string): string {
  const trimmed = line.trim()
  if (!trimmed || trimmed === '[DONE]' || trimmed.startsWith('event:'))
    return ''
  const raw = trimmed.startsWith('data:')
    ? trimmed.replace(/^data:\s*/, '')
    : trimmed
  if (!raw || raw === '[DONE]') return ''
  try {
    return extractStreamToken(JSON.parse(raw))
  } catch {
    return trimmed.startsWith('data:') ? '' : raw
  }
}

/**
 * Stream a single stage turn from /api/botcafe/chat.
 * Calls `onToken` for each token as it arrives; resolves with the final text.
 *
 * No chatStore involvement. Pure frontend.
 */
export async function streamStageTurn(
  system: string,
  user: string,
  options: StageStreamOptions,
  onToken: (token: string) => void,
): Promise<string> {
  const response = await fetch('/api/botcafe/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: options.temperature ?? 0.85,
      maxTokens: options.maxTokens ?? 400,
      stream: options.stream ?? true,
      serverId: options.serverId ?? null,
    }),
  })

  if (!response.ok) {
    let message = `Stage turn failed (HTTP ${response.status}).`
    try {
      const payload = (await response.json()) as BotCafeChunk
      if (typeof payload?.message === 'string' && payload.message) {
        message = payload.message
      }
    } catch {
      try {
        const text = await response.text()
        if (text) message = text
      } catch {
        /* swallow */
      }
    }
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  const shouldStream =
    options.stream !== false &&
    !!response.body &&
    !contentType.includes('application/json')

  if (!shouldStream) {
    const payload = (await response.json()) as BotCafeChunk
    const text = extractStreamToken(payload)
    if (text) onToken(text)
    return text.trim()
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let pending = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    const lines = pending.split(/\r?\n/)
    pending = lines.pop() ?? ''
    for (const line of lines) {
      const token = parseStreamLine(line)
      if (!token) continue
      full += token
      onToken(token)
    }
  }
  const tail = decoder.decode()
  if (tail) pending += tail
  if (pending.trim()) {
    const token = parseStreamLine(pending)
    if (token) {
      full += token
      onToken(token)
    }
  }

  return full.trim()
}

/** Strip leaked "Name:" prefix and wrapping quotes from a generated line. */
export function cleanGeneratedLine(text: string): string {
  let out = text.trim()
  // Conservative: only strip a single capitalized word followed by colon.
  out = out.replace(/^[A-Z][a-zA-Z'-]{1,29}:\s+/, '')
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith('\u201C') && out.endsWith('\u201D'))
  ) {
    out = out.slice(1, -1).trim()
  }
  return out
}

// =============================================================================
// 6) LOCAL STORAGE PERSISTENCE
// =============================================================================

const STORAGE_KEY = 'stageStore'
const isClient = typeof window !== 'undefined'

/** What we persist between sessions. Keep it serializable. */
export type StageSnapshot = {
  selectedStageId: string
  cast: CastSlot[]
  transcript: StageTranscriptEntry[]
  turnIndex: number
  maxTurns: number
  selectedTextServerId: number | null
  selectedModel: string
  turnDelayMs: number
  customOpening: string
  showTitle: string
  showTopic: string
}

export function saveStageSnapshot(snapshot: StageSnapshot): void {
  if (!isClient) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (err) {
    // Swallow quota / serialization errors; persistence is best-effort.
    console.warn('[stageHelper] saveStageSnapshot failed:', err)
  }
}

export function loadStageSnapshot(): StageSnapshot | null {
  if (!isClient) return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StageSnapshot
  } catch (err) {
    console.warn('[stageHelper] loadStageSnapshot parse failed:', err)
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearStageSnapshot(): void {
  if (!isClient) return
  localStorage.removeItem(STORAGE_KEY)
}

// =============================================================================
// 7) SMALL UTILITIES
// =============================================================================

/** Create an empty cast slot for a given role. */
export function emptyCastSlot(roleKey: string): CastSlot {
  return {
    slotId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `slot-${Math.random().toString(36).slice(2, 11)}`,
    roleKey,
    participantType: null,
    participantId: null,
    temporary: null,
  }
}

/** Initialize cast slots from a stage's required role minimums. */
export function initialCastForStage(stage: StagePreset): CastSlot[] {
  const slots: CastSlot[] = []
  for (const role of stage.roles) {
    for (let i = 0; i < role.min; i++) {
      slots.push(emptyCastSlot(role.key))
    }
  }
  return slots
}

/** Are all the stage's `min` requirements met by the current cast? */
export function isCastReady(stage: StagePreset, cast: CastSlot[]): boolean {
  return stage.roles.every((role) => {
    const filled = cast.filter(
      (c) =>
        c.roleKey === role.key &&
        (c.participantId != null || c.temporary != null),
    ).length
    return filled >= role.min
  })
}

/** Make a UUID-ish string in browsers + older environments. */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
