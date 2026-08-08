// /server/utils/artPromptContract.ts
//
// A hard gate on what may reach an image model, enforced at the enqueue
// boundary so it binds every producer — Conductor scripts, the art workbench,
// narrative beats, backfill jobs — without each having to remember the rules.
//
// Every rule here is a bug that actually shipped on 2026-08-08 and rendered.
// The full sequence, because the pattern matters more than any single rule:
// the Reward `item-tidefortune-ladle` came back as a picture of fifteen
// strangers and no ladle, and each fix uncovered the next cause underneath.
//
//   1. A CONDITIONAL instruction. Prompts carried "cast characters naturally
//      across many species...; include robots only when the subject or scene
//      explicitly calls for them". "Only when" needs a reader that can evaluate
//      a condition. Krea 2 is a distilled diffusion transformer: it paints the
//      densest concrete noun phrase it is given. That clause IS a crowd.
//
//   2. FORMAT vocabulary. "treasure card illustration" and "2:3 portrait card
//      composition" mean "the art printed on a card" to a person. To a model
//      trained on captions — Qwen-Image lineage, the strongest open text
//      renderer there is — it means a card. Three rewards came back as literal
//      trading cards with title bars and rules boxes full of invented text.
//
//   3. NEGATION PILES. "no readable text, no lettering, no logos, no watermark,
//      no signature" names text five times. At cfg 1 the ComfyUI negative
//      prompt is inert, so those words land in POSITIVE conditioning.
//
//   4. ENGINE MISMATCH. Krea 2 Turbo is distilled for cfg 1 and an 8-step
//      budget; jobs ran at cfg 7 / 20 steps because the queue builder resolved
//      steps per-engine but hardcoded a single generic cfg.
//
// Cost of catching these in CI or review: nothing. Cost of not catching them:
// roughly 150 wasted renders and a day of the owner's attention, discovered
// from a screenshot rather than a test.
//
// Violations are hard errors, not warnings. A warning on a background pipeline
// is a log line nobody reads; the whole failure mode here was bad art rendering
// unnoticed for hours. Producers that trip a rule should fail loudly at enqueue.
import { createError } from 'h3'
import { cleanArtPrompt } from './artPromptQuality'

export type ArtPromptViolation = {
  rule: string
  detail: string
}

export type ArtPromptContractInput = {
  prompt: string
  engine?: string | null
  steps?: number | null
  cfg?: number | null
}

/**
 * Engines distilled to run at a fixed low guidance. Above it the model leaves
 * the distribution it was trained on: burned contrast, crushed colour, and
 * duplicated subjects. `maxSteps` is a sanity ceiling, not the ideal.
 */
export const DISTILLED_ENGINE_LIMITS: Record<
  string,
  { cfg: number; maxSteps: number }
> = {
  krea2: { cfg: 1, maxSteps: 12 },
  // The enqueue endpoint normalizes to "flux2"; Conductor's consumer calls the
  // same engine "flux2-klein". Both spellings reach this gate, so both are keyed
  // rather than relying on either side to normalize first.
  flux2: { cfg: 1, maxSteps: 8 },
  'flux2-klein': { cfg: 1, maxSteps: 8 },
  flux: { cfg: 1, maxSteps: 40 },
}

// "only when", "if the scene", "unless", "where appropriate" — anything that
// asks the model to decide. Producers must decide before they enqueue and state
// one outcome. Deliberately not matched inside a quoted subject (see below).
const CONDITIONAL_PATTERNS: Array<{ pattern: RegExp; rule: string }> = [
  { pattern: /\bonly (?:when|if)\b/i, rule: 'conditional-instruction' },
  { pattern: /\bwhen (?:the )?(?:subject|scene|context)\b/i, rule: 'conditional-instruction' },
  { pattern: /\b(?:if|unless) (?:the )?(?:subject|scene|context|prompt)\b/i, rule: 'conditional-instruction' },
  { pattern: /\bwhere (?:appropriate|relevant|applicable)\b/i, rule: 'conditional-instruction' },
  { pattern: /\bas (?:needed|appropriate)\b/i, rule: 'conditional-instruction' },
  // The same bug wearing different words. Every page backdrop carried "...when
  // any figures APPEAR they are small, distant and incidental to the setting",
  // and none of the patterns above match it: the conditional attaches to a cast
  // noun, not to "the subject" or "the scene". All 222 rendered with a cast —
  // crowds in the side windows of voice-lab, a street full of figures in
  // servers — because the model has no way to reach the "when" and simply
  // paints the forty words of people that follow it.
  //
  // Scoped to a cast noun plus a PRESENCE verb, so ordinary prose that happens
  // to say "when" about people is untouched: "a market at dusk when people
  // light the lanterns" describes a scene, "when people appear" hands the model
  // a decision it cannot make.
  {
    pattern:
      /\b(?:when|if|where|whenever|unless)\s+(?:any\s+|some\s+|the\s+|no\s+)?(?:figures?|people|persons?|characters?|humans?|robots?|creatures?|bystanders?|crowds?|onlookers?)\s+(?:do\s+|are\s+|is\s+)?(?:appear|present|shown|show up|included|visible|featured|depicted)\b/i,
    rule: 'conditional-instruction',
  },
]

// Asking for a card, a poster, or a book cover gets you the object, not the art
// printed on it — including its typography.
const FORMAT_PATTERNS: Array<{ pattern: RegExp; rule: string }> = [
  { pattern: /\b(?:trading[- ])?card (?:illustration|artwork|composition|art)\b/i, rule: 'format-vocabulary' },
  { pattern: /\b(?:treasure|ability|item|reward)[- ]card\b/i, rule: 'format-vocabulary' },
  // "poster composition" is framing language (bold, graphic, close-cropped) and
  // the coloring-book lane uses it deliberately; "a movie poster" is an object
  // request. Only the latter is flagged. Note the asymmetry with "card
  // composition" above, which IS flagged: that one is not a guess — "2:3
  // portrait card composition" demonstrably rendered a titled trading card with
  // a rules box. There is no equivalent evidence for poster framing, so the
  // rule stops where the evidence stops.
  {
    pattern:
      /\b(?:movie |film |book )?(?:poster|book cover|magazine cover|album cover)\b(?!\s+(?:composition|framing|layout|crop))/i,
    rule: 'format-vocabulary',
  },
  { pattern: /\bcomic (?:page|panel|strip)\b/i, rule: 'format-vocabulary' },
]

// "Kind Robots visual style" gives an image model nothing, and used to be
// rewritten downstream into a block that carried the casting instruction.
const VAGUE_BRAND_STYLE =
  /\b(?:(?:rich|cohesive|friendly)\s+)?Kind Robots\s+(?:visual\s+)?(?:style|language)\b/i

// The damage was specific: FIVE text-related nouns ("no readable text, no
// lettering, no logos, no watermark, no signature") in the POSITIVE prompt of a
// text-specialist model running at cfg 1, where the ComfyUI negative prompt is
// inert. Naming text five times to Qwen-Image lineage produces text.
//
// This rule is deliberately narrow. An earlier version counted every "no ..."
// clause and would have rejected the coloring-book lane, which uses eleven
// exclusions on purpose (no border, no comic, no collage...) — and rejected a
// prompt whose subject text merely read "no matter how undocumented". Breadth
// here costs working pipelines; the pathological case is text nouns, in bulk,
// where guidance cannot act on a negative prompt.
const TEXT_EXCLUSION_NOUNS = new Set([
  'text',
  'lettering',
  'letters',
  'words',
  'wording',
  'logo',
  'logos',
  'watermark',
  'watermarks',
  'signature',
  'signatures',
  'caption',
  'captions',
  'typography',
  'writing',
])
// The optional adjective matters: the exact clause that shipped was "no
// READABLE text", and capturing the first word after "no" caught "readable"
// rather than "text", so the pile went uncounted.
const NEGATION_CLAUSE =
  /\bno[ -](?:readable |visible |legible |written |accidental )?([a-z][a-z-]*)/gi
const MAX_TEXT_EXCLUSIONS = 4

function textExclusions(prompt: string): string[] {
  const found: string[] = []
  for (const match of prompt.matchAll(NEGATION_CLAUSE)) {
    const word = match[1]?.toLowerCase()
    if (word && TEXT_EXCLUSION_NOUNS.has(word)) found.push(match[0])
  }
  return found
}

/**
 * True when the ComfyUI negative prompt cannot act, so every exclusion the
 * author writes lands in positive conditioning instead. Distilled engines run
 * at cfg 1 by design; an explicit cfg of 1 or less says the same thing.
 */
function guidanceIsInert(engine: string, cfg: number | null | undefined): boolean {
  if (Number.isFinite(cfg)) return Number(cfg) <= 1
  return Boolean(DISTILLED_ENGINE_LIMITS[engine])
}

/** A format noun the author is EXCLUDING is not a format request. */
function negated(prompt: string, index: number): boolean {
  const before = prompt.slice(Math.max(0, index - 12), index).toLowerCase()
  return /\b(?:no|not|without|avoid|never)\s+[a-z-]*\s*$/.test(before)
}

export function checkArtPromptContract(
  input: ArtPromptContractInput,
): ArtPromptViolation[] {
  const prompt = cleanArtPrompt(input.prompt)
  const violations: ArtPromptViolation[] = []

  if (!prompt) {
    return [{ rule: 'empty-prompt', detail: 'The prompt is empty.' }]
  }

  for (const { pattern, rule } of CONDITIONAL_PATTERNS) {
    const match = prompt.match(pattern)
    if (!match) continue
    violations.push({
      rule,
      detail:
        `"${match[0]}" asks the model to evaluate a condition. Diffusion models ` +
        `cannot; they render the words. Decide before enqueueing and state one outcome.`,
    })
  }

  for (const { pattern, rule } of FORMAT_PATTERNS) {
    const match = prompt.match(pattern)
    if (!match) continue
    if (typeof match.index !== 'number') continue
    // A format noun the author is excluding ("no comic panel") is the opposite
    // of a format request. Flagging it rejected the coloring-book lane, whose
    // prompts legitimately name the formats they are avoiding.
    if (negated(prompt, match.index)) continue
    violations.push({
      rule,
      detail:
        `"${match[0]}" asks for a physical format, so the model renders the ` +
        `format — frame, title bar, and invented text included. Describe the ` +
        `subject and the aspect ratio instead.`,
    })
  }

  if (VAGUE_BRAND_STYLE.test(prompt)) {
    violations.push({
      rule: 'vague-brand-style',
      detail:
        '"Kind Robots visual style" carries no visual information. Write the ' +
        'medium, linework, colour, and lighting out explicitly.',
    })
  }

  const engineName = String(input.engine || '').trim().toLowerCase()
  const textNos = textExclusions(prompt)
  if (
    textNos.length > MAX_TEXT_EXCLUSIONS &&
    guidanceIsInert(engineName, input.cfg)
  ) {
    violations.push({
      rule: 'text-exclusion-pile',
      detail:
        `${textNos.length} text exclusions (${textNos.join(', ')}) on an engine whose ` +
        `negative prompt is inert, so every one of those words lands in POSITIVE ` +
        `conditioning. Say it once, or state the wanted result instead — ` +
        `"unmarked surfaces" beats naming text five times.`,
    })
  }

  const limits = DISTILLED_ENGINE_LIMITS[engineName]
  if (limits) {
    if (Number.isFinite(input.cfg) && Number(input.cfg) > limits.cfg) {
      violations.push({
        rule: 'engine-guidance-mismatch',
        detail:
          `${engineName} is distilled for cfg ${limits.cfg}; got ${input.cfg}. Above it the ` +
          `model leaves its training distribution — burned contrast and duplicated subjects.`,
      })
    }
    if (Number.isFinite(input.steps) && Number(input.steps) > limits.maxSteps) {
      violations.push({
        rule: 'engine-step-mismatch',
        detail:
          `${engineName} runs at roughly ${limits.maxSteps} steps or fewer; got ${input.steps}.`,
      })
    }
  }

  return violations
}

/** Throw a 422 listing every violation, so a producer fixes them in one pass. */
export function assertArtPromptContract(input: ArtPromptContractInput): void {
  const violations = checkArtPromptContract(input)
  if (!violations.length) return

  throw createError({
    statusCode: 422,
    message:
      `Art prompt rejected by the prompt contract (${violations.length} violation` +
      `${violations.length === 1 ? '' : 's'}):\n` +
      violations.map((v) => `  [${v.rule}] ${v.detail}`).join('\n'),
  })
}
