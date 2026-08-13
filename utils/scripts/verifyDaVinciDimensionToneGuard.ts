// /utils/scripts/verifyDaVinciDimensionToneGuard.ts
//
// Regression guard (davinci/t-021) -- the dimension grid in
// components/conductor/davinci-page.vue previously only distinguished "has
// any positive value" (success green, border-success/40 bg-success/10) from
// everything else, including dimensions the player has actively driven
// negative. Several curated chapters have negative-effect choices by design
// ("The Collapse" costs health: -2, "The Spark" costs health: -1, etc.), so a
// dimension a player has actively damaged looked pixel-identical to one
// they've never touched -- same neutral border-base-300/bg-base-200/40 tone,
// distinguishable only by reading the small numeral inside.
//
// Fixed by giving the pill a real three-way tone: positive keeps the
// existing success styling, negative gets the error equivalent
// (border-error/40 bg-error/10, matching the same status-tint formula used
// throughout the app), and everything else keeps the neutral tone. Extracted
// into dimensionPillClass()/dimensionValueClass() rather than inlining a
// second ternary branch in the template, so the tone rule lives in one place.
//
// This asserts the textual shape of that fix stays in place: the template
// calls dimensionPillClass()/dimensionValueClass() for the dimension pill
// (not a hand-inlined `>= 1 ? success : neutral` ternary that silently drops
// the negative case again), and both functions actually branch on `value < 0`
// into the error tone -- deliberately scoped to this one template/behavior,
// mirroring this project's other narrow textual guards over a general-purpose
// static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

function extractFunctionSource(content: string, name: string): string | null {
  const signature = new RegExp(`^function ${name}\\([^)]*\\)[^{]*\\{`, 'm')
  const match = signature.exec(content)
  if (!match) return null

  const braceOpen = match.index + match[0].length - 1
  let depth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null
  return content.slice(braceOpen, i + 1)
}

export function checkDimensionToneGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(':class="dimensionPillClass(statMap[dim] ?? 0)"')) {
    errors.push(
      'The dimension grid pill no longer binds :class to ' +
        'dimensionPillClass(statMap[dim] ?? 0) -- has it been reverted to ' +
        'an inline ternary that only checks for a positive value, dropping ' +
        'the negative-dimension tone again?',
    )
  }

  if (!content.includes(':class="dimensionValueClass(statMap[dim] ?? 0)"')) {
    errors.push(
      "The dimension grid pill's numeral span no longer binds :class to " +
        'dimensionValueClass(statMap[dim] ?? 0) -- the negative-value text ' +
        'color signal has been dropped.',
    )
  }

  for (const name of ['dimensionPillClass', 'dimensionValueClass']) {
    const body = extractFunctionSource(content, name)
    if (!body) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined back into the template? If so, this guard ' +
          '(and the negative-dimension visibility bug it protects against) ' +
          'needs to move with it.',
      )
      continue
    }
    if (!/value\s*<\s*0/.test(body)) {
      errors.push(
        `${name}() no longer branches on \`value < 0\` -- negative ` +
          'dimensions will fall through to the neutral tone again, ' +
          'identical to an untouched dimension.',
      )
    }
    if (!/error/i.test(body)) {
      errors.push(
        `${name}() no longer references an error/danger tone for negative ` +
          'values.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkDimensionToneGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci dimension-tone guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci dimension-tone guard contract passed: the dimension grid ' +
      'gives negative values a distinct error tone instead of falling back ' +
      'to the neutral/untouched styling.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
