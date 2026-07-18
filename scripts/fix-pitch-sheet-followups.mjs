import { readFileSync, writeFileSync } from 'node:fs'

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

const storePath = 'stores/sheetStore.ts'
const testPath = 'cypress/e2e/api/sheets.cy.ts'

let store = readFileSync(storePath, 'utf8')
store = replaceRequired(
  store,
  'created: res.statusCode === 201,',
  'created: res.status === 201,',
  'PitchSheet command creation status',
)
writeFileSync(storePath, store)

let test = readFileSync(testPath, 'utf8')
test = replaceRequired(
  test,
  '  let pitchSheetId = 0\n  let standaloneSheetId = 0',
  '  let pitchSheetId = 0\n  let deletedPitchSheetId = 0\n  let standaloneSheetId = 0',
  'deleted PitchSheet ID state',
)
test = replaceRequired(
  test,
  '      expect(res.body.data.id).to.eq(pitchSheetId)\n      pitchSheetId = 0',
  '      expect(res.body.data.id).to.eq(pitchSheetId)\n      deletedPitchSheetId = pitchSheetId\n      pitchSheetId = 0',
  'capture deleted PitchSheet ID',
)
test = replaceRequired(
  test,
  '      url: `${sheetsUrl}/${pitchSheetId || 0}`,',
  '      url: `${sheetsUrl}/${deletedPitchSheetId}`,',
  'deleted PitchSheet lookup URL',
)
test = replaceRequired(
  test,
  '      expect([400, 404]).to.include(res.status)',
  '      expect(res.status).to.eq(404)',
  'deleted PitchSheet response assertion',
)
writeFileSync(testPath, test)
