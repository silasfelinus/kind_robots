// /utils/scripts/auditWonderLabPreviews.ts
/*
 * The --strict gate is a RATCHET, same shape as verifyLayoutContract.ts's
 * layout-contract-baseline.json (interface-vision/t-058). wonderlab-preview-
 * baseline.json records today's known-uncovered components; --strict only
 * fails on a component that is uncovered and NOT already in that allow-list.
 * The 29-component backlog that existed when this ratchet was introduced can
 * be worked down opportunistically without blocking unrelated PRs.
 *
 *   npm run audit:wonderlab-previews             # report, no gate
 *   npm run audit:wonderlab-previews -- --strict  # fail on NEW uncovered components
 *   npm run audit:wonderlab-previews -- --update  # ratchet the baseline down (or seed it)
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getWonderLabPreviewFixture } from '../wonderlab/previewFixtureCatalog'

const componentRoot = path.resolve(process.cwd(), 'components')
const ignoredSegments = new Set(['abandonware', '__tests__', '__fixtures__'])
const strict = process.argv.includes('--strict')
const update = process.argv.includes('--update')
const BASELINE_PATH = path.resolve(
  process.cwd(),
  'utils/scripts/wonderlab-preview-baseline.json',
)

type Baseline = {
  note: string
  recorded: string
  uncovered: string[]
}

async function loadBaseline(): Promise<Baseline | null> {
  try {
    const raw = await fs.readFile(BASELINE_PATH, 'utf8')
    return JSON.parse(raw) as Baseline
  } catch {
    return null
  }
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

function shouldIgnore(relativePath: string): boolean {
  return toPosix(relativePath)
    .split('/')
    .some((segment) => ignoredSegments.has(segment))
}

async function collectVueFiles(directory: string, files: string[] = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.relative(componentRoot, absolutePath)

    if (shouldIgnore(relativePath)) continue

    if (entry.isDirectory()) {
      await collectVueFiles(absolutePath, files)
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(absolutePath)
    }
  }

  return files
}

function extractTypeRequiredProps(source: string): string[] {
  const matches = source.matchAll(/defineProps\s*<\s*\{([\s\S]*?)\}\s*>\s*\(/g)
  const props = new Set<string>()

  for (const match of matches) {
    const body = match[1] || ''
    const lines = body.split('\n')

    for (const line of lines) {
      const property = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*/)
      if (property?.[1]) props.add(property[1])
    }
  }

  return [...props]
}

function extractRuntimeRequiredProps(source: string): string[] {
  const props = new Set<string>()
  const objectMatch = source.match(/defineProps\s*\(\s*\{([\s\S]*?)\}\s*\)/)
  const body = objectMatch?.[1] || ''
  const propertyPattern = /([A-Za-z_$][\w$]*)\s*:\s*\{([\s\S]*?)\}(?:,|$)/g

  for (const match of body.matchAll(propertyPattern)) {
    if (/required\s*:\s*true/.test(match[2] || '') && match[1]) {
      props.add(match[1])
    }
  }

  return [...props]
}

function extractRequiredProps(source: string): string[] {
  return [
    ...new Set([
      ...extractTypeRequiredProps(source),
      ...extractRuntimeRequiredProps(source),
    ]),
  ].sort()
}

async function main() {
  const files = await collectVueFiles(componentRoot)
  const uncovered: Array<{
    sourcePath: string
    componentName: string
    requiredProps: string[]
    missingProps: string[]
  }> = []
  let covered = 0

  for (const absolutePath of files) {
    const source = await fs.readFile(absolutePath, 'utf8')
    const requiredProps = extractRequiredProps(source)
    if (!requiredProps.length) continue

    const relativePath = toPosix(path.relative(componentRoot, absolutePath))
    const sourcePath = `components/${relativePath}`
    const componentName = path.basename(relativePath, '.vue')
    const fixture = getWonderLabPreviewFixture(componentName, sourcePath)

    if (fixture?.skipReason) {
      covered += 1
      continue
    }

    const fixtureProps = new Set(Object.keys(fixture?.props || {}))
    const missingProps = requiredProps.filter((prop) => !fixtureProps.has(prop))

    if (missingProps.length) {
      uncovered.push({
        sourcePath,
        componentName,
        requiredProps,
        missingProps,
      })
    } else {
      covered += 1
    }
  }

  console.log(`WonderLab preview audit scanned ${files.length} Vue components.`)
  console.log(`${covered} required-prop components have fixture coverage or an explicit skip reason.`)
  console.log(`${uncovered.length} required-prop components still need preview coverage.`)

  for (const item of uncovered) {
    console.log(
      `- ${item.sourcePath}: missing fixture props ${item.missingProps.join(', ')}`,
    )
  }

  const currentPaths = uncovered.map((item) => item.sourcePath).sort()
  const baseline = await loadBaseline()

  if (update) {
    if (baseline && currentPaths.length > baseline.uncovered.length) {
      console.error(
        `\nRefusing to update the baseline — uncovered count grew from ` +
          `${baseline.uncovered.length} to ${currentPaths.length}.\n` +
          'The allow-list is a ratchet. Fix the new gap, or re-run without --update to see it.',
      )
      process.exitCode = 1
      return
    }

    const next: Baseline = {
      note:
        'WonderLab preview-fixture coverage allow-list. RATCHET: this file may only ever ' +
        'shrink. --update refuses to record a larger count. See ' +
        'utils/scripts/auditWonderLabPreviews.ts.',
      recorded: new Date().toISOString().slice(0, 10),
      uncovered: currentPaths,
    }
    await fs.writeFile(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
    console.log(`\nBaseline written to ${path.relative(process.cwd(), BASELINE_PATH)}`)
    return
  }

  if (!strict) return

  if (!baseline) {
    console.error(
      `\nNo baseline at ${path.relative(process.cwd(), BASELINE_PATH)}. ` +
        'Run: npm run audit:wonderlab-previews -- --update',
    )
    process.exitCode = 1
    return
  }

  const allowed = new Set(baseline.uncovered)
  const added = currentPaths.filter((entry) => !allowed.has(entry))

  if (added.length) {
    console.error(
      `\n${added.length} component(s) newly missing preview-fixture coverage since the baseline:\n` +
        added.map((entry) => `  + ${entry}`).join('\n') +
        '\n\nThese are new since the baseline. Fix them, or add a fixture/skip reason — ' +
        'the allow-list only shrinks.',
    )
    process.exitCode = 1
    return
  }

  const removed = baseline.uncovered.filter((entry) => !currentPaths.includes(entry))
  if (removed.length) {
    console.log(
      `\nCoverage improved — baseline can shrink by ${removed.length} entr${removed.length === 1 ? 'y' : 'ies'}. ` +
        'Run with --update to ratchet the baseline down.',
    )
  }
}

main().catch((error) => {
  console.error('WonderLab preview audit failed:', error)
  process.exitCode = 1
})
