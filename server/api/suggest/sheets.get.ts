// /server/api/suggest/sheets.get.ts
import { defineEventHandler } from 'h3'
import { listSuggestSheets } from '@/server/utils/suggest/suggestRegistry'

export default defineEventHandler(() => {
  return {
    success: true,
    data: {
      sheets: listSuggestSheets().map((sheet) => ({
        builder: sheet.builder,
        label: sheet.label,
        fields: Object.keys(sheet.fieldPrompts ?? {}),
        steps: Object.keys(sheet.stepPrompts ?? {}),
        contextFields: (sheet.contextFields ?? []).map((field) => field.source),
      })),
    },
  }
})
