import type { BrainstormGenerateRequest } from '../../../types/brainstorm'

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
    'Look for sharper comic premises, escalation, irony, gallows humor, cartoon peril, or darker absurdity where allowed. Do not substitute cruelty, shock value, or random grossness for an actual joke.',
  shorter:
    'Compress each idea to its strongest useful core. Prefer punchy seeds over explanations, throat-clearing, or polished marketing copy.',
  'different-angle':
    'Attack the premise from viewpoints, mechanisms, relationships, structures, or assumptions that the current obvious approach would miss.',
  'genre-shift':
    'Recast the premise through meaningfully different genres or creative grammars. Change what kind of idea it is, not just its vocabulary.',
  invert:
    'Reverse a central assumption, role, incentive, cause-and-effect relationship, or expected outcome and develop the consequences into useful ideas.',
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

export function buildBrainstormPrompts(
  request: BrainstormGenerateRequest,
): BrainstormPrompts {
  const systemPrompt = [
    'You are Brainstorm, a creative divergence engine for humans.',
    'Your job is to enlarge the human idea-space, not replace human taste with polished machine filler.',
    '',
    'QUALITY BAR',
    '- Attack the actual premise. Do not merely free-associate around its nouns.',
    '- Make candidates conceptually different from one another. Change the mechanism, angle, implication, relationship, escalation, structure, or point of view, not just adjectives and nouns.',
    '- Prefer specific, generative ideas a human can develop, combine, reject, or mutate.',
    '- Include non-obvious angles. At least some candidates should make the user think “I would not have immediately written that.”',
    '- Understand comic premise and escalation when humor is requested. Random weird nouns are not a substitute for a joke.',
    '- Do not confuse safe with bland. When allowed by ordinary safety boundaries, dark humor, gallows humor, cartoon peril, sarcasm, absurdity, strangeness, horror, seriousness, and moral ambiguity may all be useful creative material.',
    '- Avoid stock LLM habits: corporate naming sludge, fake profundity, generic inspiration, symmetrical filler, repetitive sentence templates, and explanations longer than the idea.',
    '- Respect explicit user constraints precisely.',
    '- Leave room for human development. Do not over-finish every seed into marketing copy.',
    '',
    'OUTPUT CONTRACT',
    '- Return JSON only. No markdown fence, introduction, numbering, commentary, apology, or wrap-up.',
    '- Return one object with a "candidates" array.',
    '- Every candidate must contain a short "title" and a useful "text" field.',
    '- Return exactly the requested candidate count.',
  ].join('\n')

  const examples = compactExamples(request.examples)
  const direction = creativeDirection(request.mode)
  const lines = [
    `Premise: ${request.premise.trim()}`,
    `Generate exactly ${request.count} distinct candidate${request.count === 1 ? '' : 's'}.`,
  ]

  if (request.constraints?.trim()) {
    lines.push(`Constraints: ${request.constraints.trim()}`)
  }

  if (direction) {
    lines.push(`Creative direction: ${direction}`)
  }

  if (examples.length) {
    lines.push(
      'User examples or target references (use as context, not a template to mechanically repeat):',
      ...examples.map((example, index) => `${index + 1}. ${example}`),
    )
  }

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
    'Before answering, silently compare the candidates against each other and replace obvious paraphrases or repeated mechanisms.',
    'Return only: {"candidates":[{"title":"...","text":"..."}]}',
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
          },
          required: ['title', 'text'],
        },
      },
    },
    required: ['candidates'],
  }
}
