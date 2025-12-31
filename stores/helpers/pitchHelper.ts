// /stores/helpers/pitchHelper.ts

import type { Pitch } from '~/server/generated/prisma'

export enum PitchType {
  ARTPITCH = 'ARTPITCH',
  BRAINSTORM = 'BRAINSTORM',
  RANDOMLIST = 'RANDOMLIST',
  TITLE = 'TITLE',
  WEIRDLANDIA = 'WEIRDLANDIA',
}

// === Random Entry Logic ===

/**
 * Selects a random example from a RANDOMLIST pitch by title.
 */
export function randomEntry(pitchName: string, allPitches: Pitch[]): string {
  const pitch = allPitches.find(
    (p) =>
      p.PitchType === PitchType.RANDOMLIST &&
      p.title?.toLowerCase() === pitchName.toLowerCase(),
  )
  if (!pitch || !pitch.examples) return pitchName

  const examples = pitch.examples
    .split('|')
    .map((e: string) => e.trim())
    .filter(Boolean)
  return examples.length
    ? examples[Math.floor(Math.random() * examples.length)]
    : pitchName
}

// === Filtering & Grouping ===

export function filterPitchesByType(type: PitchType, pitches: Pitch[]) {
  return pitches.filter((p) => p.PitchType === type)
}

export function groupPitchesByTitle(pitches: Pitch[]): Record<string, Pitch[]> {
  return pitches.reduce(
    (acc, pitch) => {
      const key = pitch.title || 'Untitled'
      if (!acc[key]) acc[key] = []
      acc[key].push(pitch)
      return acc
    },
    {} as Record<string, Pitch[]>,
  )
}

export function filterPublicPitches(pitches: Pitch[], userId: number) {
  return pitches.filter(
    (p) => p.isPublic || p.userId === userId || p.userId === 0,
  )
}

// === Example Utils ===

export function extractExamples(exampleString?: string): string[] {
  if (!exampleString) return []
  return exampleString
    .replace(/^EXAMPLES:\|\|/, '')
    .replace(/\|\|"?$/, '')
    .split('|')
    .map((e) => e.trim())
    .filter(Boolean)
}

export function joinExamples(examples: string[]): string {
  return examples.map((e) => e.trim()).join('|')
}

// === Prompt Builders ===

export function buildTitleStormPrompt(
  title: string,
  description: string,
  numberOfRequests: number,
  exampleString?: string,
): string {
  return `Please generate ${numberOfRequests} new and original examples for: ${title}. ${description}. Separate examples by a | delimiter, and fully bookend with two delimiters, using this response format: EXAMPLES:||${exampleString}||"`
}

export function buildBrainstormPrompt(
  title: string,
  description: string,
  numberOfRequests: number,
  exampleString?: string,
): string {
  let prompt = `Title: ${title}\nDescription: ${description}\nPlease provide ${numberOfRequests} examples separated by | delimiters`
  if (exampleString) prompt += `\nExamples: ||${exampleString}||`
  return prompt
}

// === Pitch Validation ===

export function isValidPitch(pitch: Partial<Pitch>): pitch is Pitch {
  return typeof pitch.pitch === 'string' && pitch.pitch.length > 0
}

export function hasExamples(pitch: Partial<Pitch>): boolean {
  return typeof pitch.examples === 'string' && pitch.examples.includes('|')
}

// === Display Helpers ===

export function pitchTypeLabel(type: PitchType): string {
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.33)
}

// === Parsing & Payloads ===

export function parsePitchType(value: string): PitchType {
  return PitchType[value as keyof typeof PitchType] || PitchType.ARTPITCH
}

export function buildPitchPayload(p: Partial<Pitch>): Partial<Pitch> {
  return {
    title: p.title?.trim() || 'Untitled',
    pitch: p.pitch?.trim() || '',
    PitchType: p.PitchType || PitchType.ARTPITCH,
    description: p.description?.trim() || '',
    examples: p.examples?.trim(),
    flavorText: p.flavorText?.trim(),
    highlightImage: p.highlightImage?.trim(),
    isPublic: p.isPublic ?? true,
    isMature: p.isMature ?? false,
    imagePrompt: p.imagePrompt?.trim(),
    artImageId: p.artImageId ?? null,
    designer: p.designer?.trim(),
  }
}
