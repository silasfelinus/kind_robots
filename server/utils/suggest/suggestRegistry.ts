// /server/utils/suggest/suggestRegistry.ts
import { suggestSheets } from './sheets'
import type { SuggestSheet, SuggestSheetSummary } from './suggestTypes'

const fallbackSheet = suggestSheets.find((sheet) => sheet.builder === 'adventure') ?? suggestSheets[0]

export function getSuggestSheets(): SuggestSheet[] {
  return suggestSheets
}

export function getSuggestSheet(builder?: string): SuggestSheet {
  if (!builder) return fallbackSheet

  return (
    suggestSheets.find((sheet) => sheet.builder === builder) ??
    fallbackSheet
  )
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
