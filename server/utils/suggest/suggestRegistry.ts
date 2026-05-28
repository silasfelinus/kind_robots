// /server/utils/suggest/suggestRegistry.ts
import { suggestSheets } from './sheets'
import type { SuggestSheet, SuggestSheetSummary } from './suggestTypes'

function getFallbackSuggestSheet(): SuggestSheet {
  const fallback =
    suggestSheets.find((sheet) => sheet.builder === 'adventure') ??
    suggestSheets[0]

  if (!fallback) {
    throw new Error(
      '[suggestRegistry] No suggest sheets are registered. Add at least adventureSuggest to /server/utils/suggest/sheets/index.ts.',
    )
  }

  return fallback
}

export function getSuggestSheets(): SuggestSheet[] {
  return suggestSheets
}

export function getSuggestSheet(builder?: string): SuggestSheet {
  const fallback = getFallbackSuggestSheet()

  if (!builder) return fallback

  return suggestSheets.find((sheet) => sheet.builder === builder) ?? fallback
}

export function getSuggestSheetSummary(): SuggestSheetSummary[] {
  return suggestSheets.map((sheet) => ({
    builder: sheet.builder,
    label: sheet.label,
    contextKeys: sheet.contextKeys ?? [],
    fieldPromptKeys: Object.keys(sheet.fieldPrompts ?? {}),
    stepPromptKeys: Object.keys(sheet.stepPrompts ?? {}),
  }))
}
