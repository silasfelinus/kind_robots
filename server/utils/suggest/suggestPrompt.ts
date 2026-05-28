// /server/utils/suggest/suggestPrompt.ts
import type {
  RegisteredSuggestSheet,
  SuggestBody,
  SuggestContextEntry,
  SuggestFieldPromptArgs,
  SuggestPromptResult,
} from './suggestTypes'
import { getSuggestSheet } from './suggestRegistry'

function toCleanString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .map((entry) => toCleanString(entry))
      .filter(Boolean)
      .join(', ')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return ''
}

function readContextValue(
  context: Record<string, unknown>,
  entry: SuggestContextEntry,
): unknown {
  const keys = [entry.contextKey, entry.source, ...(entry.aliases ?? [])].filter(
    Boolean,
  ) as string[]

  for (const key of keys) {
    if (key in context) return context[key]
  }

  return undefined
}

function buildContextString(
  sheet: RegisteredSuggestSheet,
  context: Record<string, unknown>,
): string {
  const lines: string[] = []

  for (const entry of sheet.contextFields ?? []) {
    const rawValue = readContextValue(context, entry)

    const value = entry.transform
      ? entry.transform(rawValue, context)
      : toCleanString(rawValue)

    if (!value) continue

    lines.push(`${entry.label ?? entry.source}: ${value}`)
  }

  return lines.join('\n')
}

function resolvePromptTemplate(
  template: string | ((args: SuggestFieldPromptArgs) => string) | undefined,
  args: SuggestFieldPromptArgs,
): string | null {
  if (!template) return null
  if (typeof template === 'function') return template(args).trim()
  return template.trim()
}

function buildFieldPrompt(
  sheet: RegisteredSuggestSheet,
  args: SuggestFieldPromptArgs,
): string {
  return (
    resolvePromptTemplate(sheet.fieldPrompts?.[args.field], args) ??
    resolvePromptTemplate(sheet.stepPrompts?.[args.stepKey], args) ??
    sheet.defaultFieldPrompt ??
    `Generate an appropriate value for the "${args.field}" field.`
  )
}

export function buildSuggestPrompt(body: SuggestBody): SuggestPromptResult {
  const builder = body.builder?.trim() || 'adventure'
  const field = body.field?.trim() || ''
  const stepKey = body.stepKey?.trim() || field
  const current = body.current ?? ''
  const context = body.context ?? {}
  const extra = body.extra ?? {}
  const sheet = getSuggestSheet(builder)

  const args: SuggestFieldPromptArgs = {
    builder,
    field,
    stepKey,
    current,
    context,
    extra,
  }

  const baseFieldPrompt = buildFieldPrompt(sheet, args)
  const instruction = typeof extra.instruction === 'string' && extra.instruction.trim()
    ? extra.instruction.trim()
    : ''
  const fieldPrompt = instruction
    ? `${baseFieldPrompt}\n\nAdditional instruction:\n${instruction}`
    : baseFieldPrompt
  const contextText = buildContextString(sheet, context)
  const contextNote = contextText ? `\n\nContext:\n${contextText}` : ''
  const currentNote = current.trim()
    ? `\n\nExisting value to refine:\n${current.trim()}\nReturn only the improved version.`
    : '\n\nReturn only the value. No preamble, no explanation, no quotation marks.'

  return {
    systemPrompt: sheet.systemPrompt,
    userPrompt: `${fieldPrompt}${contextNote}${currentNote}`,
    maxTokens: sheet.maxTokens ?? 512,
    temperature: sheet.temperature ?? 0.7,
    sheet,
  }
}
