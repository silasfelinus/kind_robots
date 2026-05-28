// /server/api/suggest/sheets.get.ts
import { defineEventHandler } from 'h3'
import { getSuggestSheetSummary } from '../../utils/suggest/suggestRegistry'

export default defineEventHandler(() => {
  return {
    success: true,
    message: 'Suggest sheets loaded.',
    data: {
      sheets: getSuggestSheetSummary(),
    },
  }
})
