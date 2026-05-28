// /server/utils/suggest/suggestRegistry.ts
import type { RegisteredSuggestSheet, SuggestSheet } from './suggestTypes'

const modules = import.meta.glob('./sheets/*.ts', {
  eager: true,
  import: 'default',
}) as Record<string, SuggestSheet | SuggestSheet[]>

function normalizeSheet(sheet: SuggestSheet): RegisteredSuggestSheet | null {
  if (!sheet?.builder?.trim()) return null

  return {
    ...sheet,
    builder: sheet.builder.trim(),
    label: sheet.label?.trim() || sheet.builder.trim(),
    fieldPrompts: sheet.fieldPrompts ?? {},
    stepPrompts: sheet.stepPrompts ?? {},
    contextFields: sheet.contextFields ?? [],
    maxTokens: sheet.maxTokens ?? 512,
    temperature: sheet.temperature ?? 0.7,
  }
}

function loadSuggestSheets(): Record<string, RegisteredSuggestSheet> {
  const registry: Record<string, RegisteredSuggestSheet> = {}

  for (const moduleValue of Object.values(modules)) {
    const sheets = Array.isArray(moduleValue) ? moduleValue : [moduleValue]

    for (const rawSheet of sheets) {
      const sheet = normalizeSheet(rawSheet)
      if (!sheet) continue
      registry[sheet.builder] = sheet
    }
  }

  return registry
}

export const suggestSheetRegistry = loadSuggestSheets()

export function getSuggestSheet(builder = 'adventure'): RegisteredSuggestSheet {
  const requested = builder.trim() || 'adventure'
  const sheet = suggestSheetRegistry[requested]

  if (sheet) return sheet

  const fallbackBuilder = suggestSheetRegistry[requested]?.fallbackBuilder
  if (fallbackBuilder && suggestSheetRegistry[fallbackBuilder]) {
    return suggestSheetRegistry[fallbackBuilder]
  }

  return (
    suggestSheetRegistry.adventure ?? {
      builder: 'default',
      label: 'Default',
      systemPrompt: 'You are a concise creative writing assistant for Kind Robots. Return only the requested value.',
      defaultFieldPrompt: 'Generate an appropriate value for this field.',
      fieldPrompts: {},
      stepPrompts: {},
      contextFields: [],
      maxTokens: 512,
      temperature: 0.7,
    }
  )
}

export function listSuggestSheets(): RegisteredSuggestSheet[] {
  return Object.values(suggestSheetRegistry).sort((a, b) =>
    a.builder.localeCompare(b.builder),
  )
}
