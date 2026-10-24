// Authoring check for one Ecotone mystery case file:
//   npx tsx utils/scripts/validateEcotoneMystery.ts utils/ecotone/mysteries/cases/<file>.ts
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { compileMystery, validateMystery } from '../ecotone/mysteries'
import type { Mystery } from '../ecotone/mysteries/types'

const file = process.argv[2]
if (!file) throw new Error('usage: validateEcotoneMystery.ts <case file>')
const mod = (await import(pathToFileURL(resolve(file)).href)) as Record<
  string,
  unknown
>
const cases = Object.values(mod).filter((value): value is Mystery =>
  Boolean(value && typeof value === 'object' && 'gates' in value),
)
if (!cases.length) throw new Error(`${file} exports no mystery`)
let failed = false
for (const mystery of cases) {
  const problems = validateMystery(mystery)
  const cards = compileMystery(mystery)
  const words = JSON.stringify(mystery).split(/\s+/).length
  if (problems.length) {
    failed = true
    console.log(`✗ ${mystery.id}`)
    for (const problem of problems) console.log(`  - ${problem}`)
  } else console.log(`✓ ${mystery.id}: ${cards.length} cards, ~${words} words`)
}
process.exit(failed ? 1 : 0)
