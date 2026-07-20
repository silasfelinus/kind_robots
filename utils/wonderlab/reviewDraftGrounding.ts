import { wonderLabSourceEvidenceByPath } from '@/utils/generated/wonderLabSourceEvidence'
import type { WonderLabComponentSourceEvidence } from '@/utils/wonderlab/componentManifest'

export type WonderLabReviewGroundingMatch = {
  text: string
  highSignalMatches: string[]
  nativeElementMatches: string[]
  unsupportedClaims: string[]
  grounded: boolean
}

export type WonderLabReviewGroundingResult = {
  comment: WonderLabReviewGroundingMatch
  observations: WonderLabReviewGroundingMatch[]
}

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'and',
  'are',
  'because',
  'been',
  'before',
  'being',
  'between',
  'but',
  'can',
  'component',
  'could',
  'does',
  'each',
  'from',
  'have',
  'includes',
  'into',
  'its',
  'more',
  'not',
  'only',
  'source',
  'that',
  'the',
  'their',
  'there',
  'these',
  'this',
  'uses',
  'using',
  'with',
])

const UNSUPPORTED_CLAIM_PATTERNS: Array<{
  label: string
  pattern: RegExp
}> = [
  {
    label: 'unverified smooth runtime behavior',
    pattern:
      /\b(?:smooth|smoothly|silky|fluid|snappy|lag-free)\s+(?:animation|transition|motion|interaction|response|performance)\b/i,
  },
  {
    label: 'unverified runtime performance',
    pattern:
      /\b(?:loads?|renders?|runs?|responds?)\s+(?:quickly|smoothly|fast|perfectly|well)\b/i,
  },
  {
    label: 'unverified device responsiveness',
    pattern:
      /\b(?:responsive|optimized)\s+(?:on|for)\s+(?:mobile|tablet|desktop|devices?|screens?|browsers?)\b/i,
  },
  {
    label: 'unverified accessibility result',
    pattern:
      /\b(?:accessible|accessibility-compliant|wcag|screen-reader friendly|keyboard accessible)\b/i,
  },
  {
    label: 'unverified security result',
    pattern: /\b(?:secure|security-hardened|safe from|vulnerabilit(?:y|ies))\b/i,
  },
  {
    label: 'unverified contrast judgment',
    pattern: /\b(?:excellent|strong|good|poor|weak)\s+(?:color\s+)?contrast\b/i,
  },
  {
    label: 'invented visual styling',
    pattern:
      /\b(?:glowing|vibrant|subtle|beautiful|polished)\s+(?:gradient|palette|colors?|shadows?|glow)\b/i,
  },
  {
    label: 'unsupported personal runtime test',
    pattern:
      /\b(?:tested|used|tried)\s+(?:it|this|the\s+component|the\s+interface)\b/i,
  },
]

function normalizedWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
}

function evidenceTerms(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizedWords(value).join(' ')).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'))
}

function textTerms(value: string): Set<string> {
  return new Set(normalizedWords(value))
}

function matchedTerms(text: string, candidates: string[]): string[] {
  const normalizedText = normalizedWords(text).join(' ')
  const words = textTerms(text)
  return candidates.filter((candidate) =>
    candidate.includes(' ')
      ? normalizedText.includes(candidate)
      : words.has(candidate),
  )
}

function unsupportedClaims(text: string): string[] {
  return UNSUPPORTED_CLAIM_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label)
}

function groundingMatch(
  text: string,
  highSignalTerms: string[],
  nativeElementTerms: string[],
): WonderLabReviewGroundingMatch {
  const highSignalMatches = matchedTerms(text, highSignalTerms)
  const nativeElementMatches = matchedTerms(text, nativeElementTerms)
  const claims = unsupportedClaims(text)
  return {
    text,
    highSignalMatches,
    nativeElementMatches,
    unsupportedClaims: claims,
    grounded:
      claims.length === 0 &&
      (highSignalMatches.length >= 1 || nativeElementMatches.length >= 2),
  }
}

export function resolveWonderLabReviewSourceEvidence(
  sourcePath: string,
  supplied?: WonderLabComponentSourceEvidence | null,
): WonderLabComponentSourceEvidence {
  const evidence =
    supplied || wonderLabSourceEvidenceByPath[sourcePath.trim().toLowerCase()] || null
  if (!evidence?.facts.length) {
    throw new Error(`No source-code evidence is available for ${sourcePath}.`)
  }
  return evidence
}

export function validateWonderLabReviewGrounding(
  comment: string,
  observations: string[],
  evidence: WonderLabComponentSourceEvidence,
): WonderLabReviewGroundingResult {
  const highSignalTerms = evidenceTerms([
    ...evidence.props,
    ...evidence.emits,
    ...evidence.customComponents,
    ...evidence.staticText,
    ...evidence.functionNames,
    ...evidence.localImports,
  ])
  const nativeElementTerms = evidenceTerms(evidence.nativeElements)

  return {
    comment: groundingMatch(comment, highSignalTerms, nativeElementTerms),
    observations: observations.map((observation) =>
      groundingMatch(observation, highSignalTerms, nativeElementTerms),
    ),
  }
}

export function assertWonderLabReviewGrounding(
  comment: string,
  observations: string[],
  evidence: WonderLabComponentSourceEvidence,
): WonderLabReviewGroundingResult {
  const result = validateWonderLabReviewGrounding(comment, observations, evidence)
  if (result.comment.unsupportedClaims.length) {
    throw new Error(
      `Generated review comment makes unsupported claim(s): ${result.comment.unsupportedClaims.join(', ')}.`,
    )
  }
  if (!result.comment.grounded) {
    throw new Error(
      'Generated review comment does not overlap the supplied Component source evidence.',
    )
  }

  const unsupported = result.observations
    .map((observation, index) => ({ observation, index }))
    .filter(({ observation }) => !observation.grounded)
  if (unsupported.length) {
    throw new Error(
      `Generated review contains unsupported source observations at position(s): ${unsupported
        .map(({ index }) => index + 1)
        .join(', ')}.`,
    )
  }

  return result
}
