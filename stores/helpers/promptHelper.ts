// /stores/helpers/promptHelper.ts

import type { Prompt } from '@prisma/client'

/**
 * Validate prompt input string – must be non-empty and contain valid characters.
 */
export function isValidPrompt(prompt: Partial<Prompt>): prompt is Prompt {
  return typeof prompt.prompt === 'string' && prompt.prompt.trim().length > 0
}

/**
 * Estimate token count based on rough word count × multiplier.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.33)
}

/**
 * Build a standardized prompt payload for API submission.
 */
export function buildPromptPayload(p: Partial<Prompt>): Partial<Prompt> {
  return {
    prompt: p.prompt?.trim() || '',
    userId: p.userId ?? 1,
    pitchId: p.pitchId ?? null,
    botId: p.botId ?? null,
    galleryId: p.galleryId ?? null,
    artImageId: p.artImageId ?? null,
  }
}

/**
 * Normalize and extract raw text from a prompt input.
 */
export function normalizePrompt(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Convert a raw prompt string into a shortened label (for display).
 */
export function promptLabel(prompt: string, maxLength = 40): string {
  const clean = normalizePrompt(prompt)
  return clean.length > maxLength ? clean.slice(0, maxLength) + '…' : clean
}

/**
 * Strip known prefix markers (e.g., EXAMPLES:||) from imported prompt-style text.
 */
export function cleanPromptExample(raw: string): string {
  return raw
    .replace(/^EXAMPLES:\|\|/, '')
    .replace(/\|\|"?$/, '')
    .trim()
}

/**
 * Extract pitch-like prefix from a comma-delimited prompt string.
 */
export function extractPitch(promptString: string): string {
  return promptString.split(',')[0].trim() || 'Untitled Prompt'
}

/**
 * Replace __placeholder__ tokens in a prompt using pitchStore's randomEntry method.
 */
export function processPromptPlaceholders(
  prompt: string,
  pitchStore: { randomEntry: (label: string) => string },
): string {
  return prompt.replace(/__(.*?)__/g, (_, label) =>
    pitchStore.randomEntry(label),
  )
}

/**
 * Simple prompt validation — ensure allowed characters only.
 */
export function validatePromptString(prompt: string): boolean {
  const validPattern = /^[a-zA-Z0-9 ,_<>&:"'|!?()-]+$/
  return validPattern.test(prompt)
}
