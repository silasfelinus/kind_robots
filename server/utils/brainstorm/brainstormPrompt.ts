import { BRAINSTORM_RETURN_TYPES } from '../../../types/brainstorm'
import type {
  BrainstormGenerateRequest,
  BrainstormReturnTypeId,
  BrainstormReturnTypeRequest,
} from '../../../types/brainstorm'

export type BrainstormPrompts = {
  systemPrompt: string
  userPrompt: string
}

const CREATIVE_DIRECTION_INSTRUCTIONS: Record<string, string> = {
  stranger:
    'Push past the first obvious answers. Explore surprising mechanisms and combinations while staying meaningfully connected to the premise.',
  grounded:
    'Favor ideas that are practical, usable, and plausibly actionable. Keep variety and surprise, but make the value concrete.',
  'darker-funnier':
    'Look for sharper comic premises, escalation, irony, gallows humor, cartoon peril, or darker absurdity where allowed. Do not substitute cruelty, shock value, random grossness, or merely whimsical weirdness for an actual joke. This changes the comic angle, not the output shape established by the user examples.',
  shorter:
    'Compress each idea to its strongest useful core. Prefer punchy seeds over explanations, throat-clearing, or polished marketing copy.',
  'different-angle':
    'Attack the premise from viewpoints, mechanisms, relationships, structures, or assumptions that the current obvious approach would miss.',
  'genre-shift':
    'Recast the premise through meaningfully different genres or creative grammars. Change what kind of idea it is, not just its vocabulary.',
  invert:
    'Reverse a central assumption, role, incentive, cause-and-effect relationship, or expected outcome and develop the consequences into useful ideas.',
}

const RETURN_TYPE_INSTRUCTIONS: Record<BrainstormReturnTypeId, string> = {
  'dark-humor':
    'dark humor: the darkness must exist in the premise itself -- harm, mortality, exploitation, taboo, bleak consequence, or similarly dark material -- and the joke must interact with it; ordinary whimsical absurdity is not dark humor',
  pun: 'pun / wordplay: language drives the idea, but the wordplay must create or sharpen a premise rather than merely rename a noun',
  'dad-joke':
    'dad joke: an earnest groaner, literal misunderstanding, obvious setup, or proudly corny mechanism that still lands as an actual joke',
  'dry-observation':
    'dry observation: underplayed, deadpan, or sharply observed; trust the premise instead of announcing the punchline',
  'absurd-escalation':
    'absurd escalation: take one coherent mechanism farther until its consequences become delightfully unreasonable',
  practical:
    'practical: useful, buildable, or actionable while still avoiding the most obvious first answer',
  inversion:
    'inversion: reverse a role, assumption, incentive, cause, or expected outcome and follow the consequences',
  'left-field':
    'left field: a surprising but premise-connected angle that changes the mechanism instead of adding random weird nouns',
}

// conductor brainstorm/t-015: art-prompt output domain. Orthogonal to `mode`
// (the creative-direction style knob above) -- this changes WHAT KIND of
// thing a candidate's "text" is, not how it's stylistically pushed. Only the
// text prompt is produced here; nothing in this module (or anywhere in the
// Brainstorm request/generate pipeline) enqueues or requests an actual image
// -- that stays a deliberately separate, not-yet-built "Generate art" action
// per this task's own roadmap note.
const IDEA_QUALITY_BAR = [
  '- Attack the actual premise. Do not merely free-associate around its nouns.',
  '- Make candidates conceptually different from one another. Change the mechanism, angle, implication, relationship, escalation, structure, or point of view, not just adjectives and nouns.',
  '- Prefer specific, generative ideas a human can develop, combine, reject, or mutate.',
  '- The candidate text itself is the deliverable. Do not inflate a compact idea into a setup paragraph, mini-scene, dialogue exchange, explanation, moral, or commentary unless the user asks for that form.',
  '- Include non-obvious angles. At least some candidates should make the user think “I would not have immediately written that.”',
  '- Understand comic premise and escalation when humor is requested. Random weird nouns are not a substitute for a joke.',
  '- Do not confuse safe with bland. When allowed by ordinary safety boundaries, dark humor, gallows humor, cartoon peril, sarcasm, absurdity, strangeness, horror, seriousness, and moral ambiguity may all be useful creative material.',
  '- Avoid stock LLM habits: corporate naming sludge, fake profundity, generic inspiration, symmetrical filler, repetitive sentence templates, and explanations longer than the idea.',
  '- Respect explicit user constraints precisely.',
  '- Leave room for human development. Do not over-finish every seed into marketing copy.',
]

const ART_PROMPT_QUALITY_BAR = [
  '- Every candidate’s "text" is a single, ready-to-use TEXT PROMPT for an image generator -- not a narrative idea, a caption, or a description of one.',
  '- Vary composition (framing, shot distance, camera angle, centered vs. rule-of-thirds, negative space), subject (who or what is depicted, and how many), action (what is actually happening in the frame -- never the same static pose repeated across candidates), environment (setting, time of day, weather, background depth), and visual direction (lighting, palette, medium/style, mood) across the batch. Change more than one of these per candidate, and no two candidates may share the same combination.',
  '- Write each prompt as a dense, concrete string an image model can consume directly: specific nouns and visual adjectives, not vague mood words alone.',
  '- Stay grounded in the premise (and the grounded source, if any) as the actual subject. Do not drift into generic stock-art description that could apply to any premise.',
  '- Never describe the act of generating, rendering, requesting, or enqueuing an image, and never address the user directly (“here’s a prompt you could use...”). Write only the prompt text itself.',
  '- Respect explicit user constraints precisely.',
]

function isArtPromptDomain(request: BrainstormGenerateRequest): boolean {
  return request.outputDomain === 'art-prompts'
}

function compactExamples(examples: string[] | undefined): string[] {
  return (examples || [])
    .map((example) => example.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function creativeDirection(mode: string | undefined): string | null {
  const normalized = mode?.trim() || 'freeform'
  if (normalized === 'freeform') return null
  return CREATIVE_DIRECTION_INSTRUCTIONS[normalized] || normalized
}

function returnTypeLabel(id: BrainstormReturnTypeId): string {
  return BRAINSTORM_RETURN_TYPES.find((entry) => entry.id === id)?.label || id
}

function exampleContract(examples: string[]): string[] {
  if (!examples.length) return []

  return [
    '',
    'EXAMPLE CONTRACT',
    'The examples below are not merely topical context. Treat their shared FORM as the user’s target output contract unless an explicit constraint says otherwise.',
    'Infer and match their approximate length, sentence count, point of view, grammatical shape, voice, joke density, and amount of explanation. If the examples are terse one-sentence assertions, every candidate text should be a terse one-sentence assertion. Do not turn a one-line pattern into a paragraph.',
    'Their CONTENT is already-used territory. Do not reuse, paraphrase, explain, extend, sequel, or lightly remix a fact, joke, object, or mechanism from an example. Generate genuinely new material that belongs beside the examples rather than material derived from them.',
    'User examples / target references:',
    ...examples.map((example, index) => `${index + 1}. ${example}`),
  ]
}

function assortmentInstructions(
  count: number,
  returnTypes: BrainstormReturnTypeRequest[] | undefined,
): string[] {
  const selected = returnTypes || []
  if (!selected.length) {
    return [
      'Batch shape: ASSORTMENT.',
      'Deliberately vary the response lenses across the batch. Choose lenses that fit the actual premise instead of forcing comedy into a practical request or practicality into a joke request.',
      `When the premise supports comedy, available lenses include ${BRAINSTORM_RETURN_TYPES.map((entry) => entry.label).join(', ')}. For other premises, use these labels as useful creative strategies rather than compulsory joke formats.`,
      `For ${count} candidates, use at least ${Math.min(count, 3)} distinct returnType labels when possible.`,
    ]
  }

  const pinned = selected.filter((entry) => entry.count)
  const automatic = selected.filter((entry) => !entry.count)
  const pinnedTotal = pinned.reduce(
    (total, entry) => total + (entry.count || 0),
    0,
  )
  const minimumSelected = pinnedTotal + automatic.length
  const wildcardSlots = Math.max(0, count - minimumSelected)

  const lines = [
    'Batch shape: ASSORTMENT with user-selected response lenses.',
    'Each selected Auto lens must appear at least once. Each pinned count is an exact quota.',
  ]

  if (pinned.length) {
    lines.push(
      `Pinned quotas: ${pinned
        .map((entry) => `${returnTypeLabel(entry.id)} ×${entry.count}`)
        .join('; ')}.`,
    )
  }

  if (automatic.length) {
    lines.push(
      `Auto lenses: ${automatic.map((entry) => returnTypeLabel(entry.id)).join(', ')}. Spread available slots among them rather than letting one dominate.`,
    )
  }

  if (wildcardSlots > 0) {
    lines.push(
      `${wildcardSlots} remaining wildcard slot${wildcardSlots === 1 ? '' : 's'} may use an Auto lens again or another valid response lens if it materially improves the batch, but must never exceed a pinned quota.`,
    )
  } else {
    lines.push(
      'The selected quotas consume the whole batch; do not introduce unselected response lenses.',
    )
  }

  lines.push(
    'Response lenses must change the creative approach, not merely add a pun or adjective to the same underlying idea.',
  )
  return lines
}

export function buildBrainstormPrompts(
  request: BrainstormGenerateRequest,
  sourceContext?: string | null,
): BrainstormPrompts {
  const artPrompts = isArtPromptDomain(request)
  const systemPrompt = [
    artPrompts
      ? 'You are Brainstorm, a creative divergence engine for humans, currently in ART PROMPT mode.'
      : 'You are Brainstorm, a creative divergence engine for humans.',
    artPrompts
      ? 'Your job is to write varied, ready-to-use text prompts for an image generator -- not to generate, request, or enqueue any image yourself.'
      : 'Your job is to enlarge the human idea-space, not replace human taste with polished machine filler.',
    '',
    'QUALITY BAR',
    ...(artPrompts ? ART_PROMPT_QUALITY_BAR : IDEA_QUALITY_BAR),
    '',
    'RESPONSE LENSES',
    ...BRAINSTORM_RETURN_TYPES.map(
      (entry) => `- ${entry.id}: ${RETURN_TYPE_INSTRUCTIONS[entry.id]}.`,
    ),
    ...(artPrompts
      ? [
          'In ART PROMPT mode, a response lens describes the tonal/stylistic treatment of the image concept (for example, a "dark-humor" prompt depicts a darkly funny visual gag; a "practical" prompt is a straightforward, useful reference-quality image). It never becomes visible text inside the prompt itself.',
        ]
      : []),
    '',
    'OUTPUT CONTRACT',
    '- Return JSON only. No markdown fence, introduction, numbering, commentary, apology, or wrap-up.',
    '- Return one object with a "candidates" array.',
    artPrompts
      ? '- Every candidate must contain a short "title" (a human label for the prompt, not part of the prompt itself), a "text" field holding the complete image-generation prompt, and one valid "returnType" lens id.'
      : '- Every candidate must contain a short "title" (navigation metadata only), a "text" field containing only the idea itself, and one valid "returnType" lens id.',
    '- The returnType describes the candidate’s creative approach; it must not replace the title or become visible boilerplate inside the idea text.',
    '- Return exactly the requested candidate count.',
  ].join('\n')

  const examples = compactExamples(request.examples)
  const direction = creativeDirection(request.mode)
  const lines = [
    `Premise: ${request.premise.trim()}`,
    `Generate exactly ${request.count} distinct candidate${request.count === 1 ? '' : 's'}.`,
  ]

  if (sourceContext?.trim()) {
    lines.push(
      '',
      'Grounded in this Kind Robots object. Preserve these canonical traits -- do not contradict them, rename the subject, or drift it into a generic archetype:',
      sourceContext.trim(),
    )
  }

  if (request.constraints?.trim()) {
    lines.push(`Constraints: ${request.constraints.trim()}`)
  }

  if (direction) {
    lines.push(`Creative direction: ${direction}`)
  }

  if (request.batchShape === 'assortment') {
    lines.push(
      '',
      ...assortmentInstructions(request.count, request.returnTypes),
    )
  } else {
    lines.push(
      '',
      'Batch shape: FOCUSED. Keep the batch coherent around the premise and selected creative direction while still making the underlying concepts materially different. Assign each candidate the closest returnType lens.',
    )
  }

  lines.push(...exampleContract(examples))

  if (request.referenceCandidate?.text?.trim()) {
    const reference = request.referenceCandidate
    lines.push(
      '',
      request.parentCandidateId
        ? 'Branching task: generate a new idea that preserves what is promising about this candidate while changing enough of the concept to be independently useful.'
        : 'Replacement task: replace this candidate with a materially different idea that still serves the original premise.',
      `Reference candidate: ${reference.title?.trim() ? `${reference.title.trim()}: ` : ''}${reference.text.trim()}`,
    )

    if (request.feedback?.trim()) {
      lines.push(`Human feedback on the reference: ${request.feedback.trim()}`)
    }
  }

  lines.push(
    '',
    'Before answering, silently compare the candidates against each other and replace obvious paraphrases or repeated mechanisms. Also compare them against every user example and replace anything that reuses an example’s content rather than merely matching its form.',
    'Return only: {"candidates":[{"title":"...","text":"...","returnType":"dry-observation"}]}',
  )

  return {
    systemPrompt,
    userPrompt: lines.join('\n'),
  }
}

export function brainstormJsonSchema(count: number): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      candidates: {
        type: 'array',
        minItems: count,
        maxItems: count,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 120,
            },
            text: {
              type: 'string',
              minLength: 1,
              maxLength: 4000,
            },
            returnType: {
              type: 'string',
              enum: BRAINSTORM_RETURN_TYPES.map((entry) => entry.id),
            },
          },
          required: ['title', 'text', 'returnType'],
        },
      },
    },
    required: ['candidates'],
  }
}
