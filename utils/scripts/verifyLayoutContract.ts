// /utils/scripts/verifyLayoutContract.ts
/*
 * Layout-contract verifier for conductor interface-vision/t-005.
 *
 * WHY THIS EXISTS
 * The previous attempt at a shared design system (conductor project `global-ui`)
 * was closed `finished` at 25/25 tasks while adoption sat around 7%, because
 * nobody ever measured the whole. This script is the measurement. It records a
 * baseline of today's violations and fails CI if any count goes UP.
 *
 * The baseline is a ratchet: `--update` will happily write smaller numbers and
 * REFUSES to write larger ones. So the only way to land a change that adds a
 * violation is to fix something else first, or to argue the rule is wrong and
 * change the rule deliberately.
 *
 *   npm run test:layout-contract            # verify against the baseline
 *   npm run test:layout-contract -- --report  # print current counts, no gate
 *   npm run test:layout-contract -- --update  # ratchet the baseline DOWN only
 *
 * THE RULES (see conductor projects/interface-vision/DESIGN-BRIEF.md)
 *   1. one-header    — the shell renders the page title; a page component never does
 *   2. one-scroll    — a component owns at most one scrolling region
 *   3. no-viewport   — no h-screen/100vh inside a shell that is already h-dvh
 *   4. one-mdc       — a content page mounts one component, not several
 *   5. ghost-prop    — don't pass :show-header to a component that never declared it
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, basename, extname } from 'node:path'

const ROOT = process.cwd()
const BASELINE_PATH = join(ROOT, 'utils/scripts/layout-contract-baseline.json')

type RuleId =
  'one-header' | 'one-scroll' | 'no-viewport' | 'one-mdc' | 'ghost-prop'

type Baseline = {
  note: string
  recorded: string
  violations: Record<RuleId, string[]>
}

const RULE_TITLES: Record<RuleId, string> = {
  'one-header': 'page components rendering their own <h1>',
  'one-scroll': 'components declaring more than one scroll region',
  'no-viewport': 'viewport-height units inside the h-dvh shell',
  'one-mdc': 'content pages mounting more than one component',
  'ghost-prop': ':show-header passed to a component that never declared it',
}

/* screenfx is full-viewport effect canvases by design — genuinely exempt. */
const VIEWPORT_EXEMPT = ['components/screenfx/', 'components/butterfly/']
const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.git',
  'dist',
  '.output',
  'abandonware',
  'archives',
  'cypress',
  'sample',
])

function walk(dir: string, ext: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)
    let isDir: boolean
    try {
      isDir = statSync(full).isDirectory()
    } catch {
      continue
    }

    if (isDir) walk(full, ext, out)
    else if (extname(entry) === ext) out.push(full)
  }

  return out
}

const read = (path: string): string => readFileSync(path, 'utf8')
const rel = (path: string): string => relative(ROOT, path).replace(/\\/g, '/')

/* Strip <script> and <style> so we only ever match real template markup. */
function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
}

/*
 * A "page component" is one that occupies the whole content host: anything under
 * pages/, anything under components/pages/, or a *-page.vue anywhere. These are
 * the ones competing with workspace-header for the title.
 */
function isPageComponent(path: string): boolean {
  const r = rel(path)
  return (
    r.startsWith('pages/') ||
    r.startsWith('components/pages/') ||
    basename(r).endsWith('-page.vue')
  )
}

function countMatches(haystack: string, pattern: RegExp): number {
  return (haystack.match(pattern) ?? []).length
}

function collect(): Record<RuleId, string[]> {
  const vueFiles = [
    ...walk(join(ROOT, 'components'), '.vue'),
    ...walk(join(ROOT, 'pages'), '.vue'),
  ]
  const mdFiles = walk(join(ROOT, 'content'), '.md')

  const violations: Record<RuleId, string[]> = {
    'one-header': [],
    'one-scroll': [],
    'no-viewport': [],
    'one-mdc': [],
    'ghost-prop': [],
  }

  /* Components that legitimately declare a showHeader prop. */
  const declaresShowHeader = new Set<string>()
  for (const file of vueFiles) {
    const source = read(file)
    if (
      /\bshowHeader\b\s*[?:]/.test(source) ||
      /['"]show-header['"]/.test(source)
    ) {
      declaresShowHeader.add(basename(file, '.vue'))
    }
  }

  for (const file of vueFiles) {
    const source = read(file)
    const template = templateOf(source)
    const r = rel(file)

    if (isPageComponent(file) && /<h1[\s>]/.test(template)) {
      violations['one-header'].push(r)
    }

    const scrollers = countMatches(template, /overflow-y-auto|overflow-auto/g)
    if (scrollers > 1) violations['one-scroll'].push(r)

    const exempt = VIEWPORT_EXEMPT.some((prefix) => r.startsWith(prefix))
    if (!exempt && /\b(h-screen|min-h-screen)\b|100vh|100dvh/.test(source)) {
      violations['no-viewport'].push(r)
    }

    /*
     * A call site passing :show-header to a component whose file never declares
     * it. Vue silently turns that into a fallthrough attribute and it does
     * nothing, which reads as "this is configurable" when it isn't.
     */
    for (const match of template.matchAll(
      /<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b[^>]*?:show-header/g,
    )) {
      const target = match[1]
      if (target && !declaresShowHeader.has(target)) {
        violations['ghost-prop'].push(`${r} → <${target}>`)
      }
    }
  }

  for (const file of mdFiles) {
    const body = read(file).replace(/^---[\s\S]*?\n---\n/, '')
    const blocks = body
      .split('\n')
      .filter((line) => /^:{1,2}[a-z][a-z0-9-]*\s*$/.test(line.trim()))

    if (blocks.length > 1) violations['one-mdc'].push(rel(file))
  }

  for (const key of Object.keys(violations) as RuleId[]) {
    violations[key] = [...new Set(violations[key])].sort()
  }

  return violations
}

function loadBaseline(): Baseline | null {
  try {
    return JSON.parse(read(BASELINE_PATH)) as Baseline
  } catch {
    return null
  }
}

function report(
  current: Record<RuleId, string[]>,
  baseline: Baseline | null,
): void {
  console.log('\nLayout contract — current state\n')
  for (const key of Object.keys(RULE_TITLES) as RuleId[]) {
    const now = current[key].length
    const was = baseline?.violations?.[key]?.length
    const delta =
      was === undefined
        ? ''
        : now === was
          ? '  (unchanged)'
          : now < was
            ? `  (-${was - now}) ✅`
            : `  (+${now - was}) ❌`
    console.log(`  ${String(now).padStart(4)}  ${RULE_TITLES[key]}${delta}`)
  }
  console.log('')
}

function main(): void {
  const args = process.argv.slice(2)
  const current = collect()
  const baseline = loadBaseline()

  if (args.includes('--report')) {
    report(current, baseline)
    for (const key of Object.keys(RULE_TITLES) as RuleId[]) {
      if (!current[key].length) continue
      console.log(`${key} — ${RULE_TITLES[key]}:`)
      for (const entry of current[key]) console.log(`  ${entry}`)
      console.log('')
    }
    return
  }

  if (args.includes('--update')) {
    const next: Baseline = {
      note:
        'Layout-contract allow-list. RATCHET: this file may only ever shrink. ' +
        '--update refuses to record a larger count. See utils/scripts/verifyLayoutContract.ts.',
      recorded: new Date().toISOString().slice(0, 10),
      violations: current,
    }

    if (baseline) {
      const grew = (Object.keys(RULE_TITLES) as RuleId[]).filter(
        (key) => current[key].length > (baseline.violations[key]?.length ?? 0),
      )

      if (grew.length) {
        report(current, baseline)
        throw new Error(
          `Refusing to update the baseline — these rules got WORSE: ${grew.join(', ')}.\n` +
            'The allow-list is a ratchet. Fix the new violations, or change the rule deliberately.',
        )
      }
    }

    writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
    report(current, baseline)
    console.log(`Baseline written to ${rel(BASELINE_PATH)}`)
    return
  }

  if (!baseline) {
    report(current, null)
    throw new Error(
      `No baseline at ${rel(BASELINE_PATH)}. Run: npm run test:layout-contract -- --update`,
    )
  }

  const failures: string[] = []

  for (const key of Object.keys(RULE_TITLES) as RuleId[]) {
    const allowed = new Set(baseline.violations[key] ?? [])
    const added = current[key].filter((entry) => !allowed.has(entry))

    if (added.length) {
      failures.push(
        `${key} — ${RULE_TITLES[key]}\n${added.map((entry) => `    + ${entry}`).join('\n')}`,
      )
    }
  }

  report(current, baseline)

  if (failures.length) {
    throw new Error(
      `Layout contract violated by new code:\n\n${failures.join('\n\n')}\n\n` +
        'These are new since the baseline. Fix them — the allow-list only shrinks.\n' +
        'See conductor projects/interface-vision/DESIGN-BRIEF.md for the three rules.',
    )
  }

  const shrunk = (Object.keys(RULE_TITLES) as RuleId[]).filter(
    (key) => current[key].length < (baseline.violations[key]?.length ?? 0),
  )

  if (shrunk.length) {
    console.log(
      `Contract improved (${shrunk.join(', ')}). Run with --update to ratchet the baseline down.\n`,
    )
  }

  console.log('Layout contract holds — no new violations.\n')
}

main()
