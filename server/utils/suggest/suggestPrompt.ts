// /server/utils/suggest/suggestPrompt.ts
import type { SuggestBody, SuggestSheet } from './suggestTypes'

function formatValue(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(' | ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function defaultContextLines(sheet: SuggestSheet, body: SuggestBody): string[] {
  const context = body.context ?? {}
  const keys = sheet.contextKeys ?? []
  const lines: string[] = []

  for (const key of keys) {
    const value = context[key]
    const text = formatValue(value)
    if (text) lines.push(`${key}: ${text}`)
  }

  const extraContext = body.extra?.configContext ?? {}
  for (const [key, value] of Object.entries(extraContext)) {
    const text = formatValue(value)
    if (text) lines.push(`${key}: ${text}`)
  }

  const stepContext = body.extra?.stepContext ?? {}
  for (const [key, value] of Object.entries(stepContext)) {
    const text = formatValue(value)
    if (text) lines.push(`${key}: ${text}`)
  }

  if (body.extra?.cardTitle) lines.push(`Card: ${body.extra.cardTitle}`)
  if (body.extra?.stepTitle) lines.push(`Step: ${body.extra.stepTitle}`)

  return lines
}

export function buildSuggestUserPrompt(sheet: SuggestSheet, body: SuggestBody): string {
  const field = body.field ?? ''
  const stepKey = body.stepKey ?? field
  const current = body.current ?? ''

  const customInstruction = sheet.buildInstruction?.(body)
  const extraInstruction = body.extra?.instruction?.trim()

  const fieldPrompt =
    customInstruction ??
    extraInstruction ??
    sheet.fieldPrompts?.[field] ??
    sheet.stepPrompts?.[stepKey] ??
    `Generate an appropriate value for the "${field || stepKey}" field.`

  const contextLines = sheet.buildContext
    ? sheet.buildContext(body.context ?? {}, body)
    : defaultContextLines(sheet, body)

  const contextBlock = contextLines.length
    ? `\n\nContext:\n${contextLines.join('\n')}`
    : ''

  const currentBlock = current.trim()
    ? `\n\nExisting value to refine:\n"${current.trim()}"\nReturn only the improved version.`
    : '\nReturn only the value. No preamble.'

  return `${fieldPrompt}${contextBlock}${currentBlock}`
}
