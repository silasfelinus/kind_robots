export type ArtPromptAssessment = {
  useful: boolean
  reasons: string[]
  referencedArtImageId: number | null
}

const LEGACY_FALLBACK_PATTERNS = [
  /^flat minimal app icon for .+?, bold clean vector shapes, square composition, no text$/i,
  /^polished portrait illustration for .+?, centered subject, rich Kind Robots visual style, no text, 2:3 portrait composition$/i,
  /^wide cinematic hero image for .+?, expressive scene with clear atmosphere and personality, no text, 16:9 landscape composition$/i,
  /^polished web illustration for .+?, clear subject, cohesive Kind Robots visual style, no text$/i,
]

const GENERIC_LABEL_PATTERNS = [
  /^image\s*#?\s*\d+$/i,
  /^art\s*image\s*#?\s*\d+$/i,
  /^asset\s*#?\s*\d+$/i,
  /^image$/i,
  /^artwork$/i,
  /^generated art$/i,
  /^missing image$/i,
  /^untitled$/i,
]

export function cleanArtPrompt(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

export function isGenericArtLabel(value: unknown): boolean {
  const label = cleanArtPrompt(value)
  if (!label) return true
  return GENERIC_LABEL_PATTERNS.some((pattern) => pattern.test(label))
}

export function extractReferencedArtImageId(value: unknown): number | null {
  const text = cleanArtPrompt(value)
  const match = text.match(/\b(?:art\s*)?image\s*#?\s*(\d+)\b/i)
  const id = Number(match?.[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function assessArtPrompt(value: unknown): ArtPromptAssessment {
  const prompt = cleanArtPrompt(value)
  const reasons: string[] = []

  if (!prompt) reasons.push('empty')
  if (prompt && prompt.split(/\s+/).length < 8) reasons.push('too-short')
  if (LEGACY_FALLBACK_PATTERNS.some((pattern) => pattern.test(prompt))) {
    reasons.push('legacy-generic-fallback')
  }

  const referencedArtImageId = extractReferencedArtImageId(prompt)
  if (referencedArtImageId && /\b(clear subject|visual style)\b/i.test(prompt)) {
    reasons.push('database-id-used-as-subject')
  }

  return {
    useful: reasons.length === 0,
    reasons,
    referencedArtImageId,
  }
}

export function firstUsefulArtPrompt(...values: unknown[]): string {
  for (const value of values) {
    const prompt = cleanArtPrompt(value)
    if (assessArtPrompt(prompt).useful) return prompt
  }
  return ''
}
