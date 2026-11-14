// /utils/scripts/lintFixChanged.mjs
//
// Applies the mechanical ESLint fixes that keep tripping the lint ratchet, to
// the files a branch changed (same selector as formatChanged.mjs):
//
//   - SAFE_FIX_RULES autofixes (attribute order, import placement/duplicates,
//     prefer-const, type-only imports), and
//   - removal of unused IMPORT specifiers, via typescript-eslint's own
//     "Remove unused variable" suggestion, accepted only when the whole fix
//     sits inside an import declaration (never a local, param or export).
//
// 2026-08-15..11-14 history: Vue attribute order, unused imports, import/first
// and duplicate imports were the lint-ratchet fix-up commits agents made by
// hand, often after a full Contract shard run. Anything else stays for a
// person: this script reports, but never fixes, other rules whose per-file
// count grew against utils/scripts/lint-ratchet-baseline.json.
//
//   node utils/scripts/lintFixChanged.mjs --write   # fix changed files in place
//   node utils/scripts/lintFixChanged.mjs           # report only
//
// Needs the generated `.nuxt/eslint.config.mjs` (`npx nuxi prepare`). Exit is
// 0 unless ESLint itself cannot run; the ESLint ratchet stays the gate.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { changedPaths } from './formatChanged.mjs'

export const SAFE_FIX_RULES = new Set([
  'vue/attributes-order',
  'import/first',
  'import/no-duplicates',
  'prefer-const',
  '@typescript-eslint/consistent-type-imports',
  '@typescript-eslint/no-import-type-side-effects',
])

export const UNUSED_RULES = new Set([
  '@typescript-eslint/no-unused-vars',
  'no-unused-vars',
])

const LINTABLE = /\.(?:[cm]?[jt]sx?|vue)$/

/** [start, end) offsets of every `import ... from '...'` declaration. */
export function importRanges(source) {
  const ranges = []
  const pattern =
    /^[ \t]*import\s+(?:type\s+)?[^;'"]*?\sfrom\s*(['"])[^'"\n]+\1;?/gm
  for (const match of source.matchAll(pattern)) {
    ranges.push([match.index, match.index + match[0].length])
  }
  return ranges
}

/** Offset of a 1-based ESLint line/column. */
export function offsetOf(source, line, column) {
  let offset = 0
  for (let current = 1; current < line; current += 1) {
    const next = source.indexOf('\n', offset)
    if (next === -1) return source.length
    offset = next + 1
  }
  return offset + Math.max(0, column - 1)
}

/**
 * The suggestion fixes that remove unused import specifiers: unused-variable
 * messages whose position AND whole replacement range fall inside one import
 * declaration. Everything else (locals, params, destructuring) is skipped.
 */
export function importRemovals(source, messages) {
  const ranges = importRanges(source)
  const inside = (from, to) =>
    ranges.some(([start, end]) => from >= start && to <= end)
  const fixes = []
  for (const message of messages) {
    if (!UNUSED_RULES.has(message.ruleId)) continue
    const fix = message.suggestions?.[0]?.fix
    if (!fix) continue
    const at = offsetOf(source, message.line ?? 0, message.column ?? 0)
    // Removing a whole declaration also takes its surrounding newline(s);
    // only the non-whitespace part of the removed text must be the import.
    const removed = source.slice(fix.range[0], fix.range[1])
    const from = fix.range[0] + (removed.length - removed.trimStart().length)
    const to = fix.range[1] - (removed.length - removed.trimEnd().length)
    if (!inside(at, at) || !inside(from, Math.max(from, to))) continue
    fixes.push(fix)
  }
  return fixes
}

/** Apply non-overlapping fixes; overlapping ones wait for the next pass. */
export function applyFixes(source, fixes) {
  let output = source
  let applied = 0
  let floor = Infinity
  const ordered = [...fixes].sort((a, b) => b.range[0] - a.range[0])
  for (const { range, text } of ordered) {
    if (range[1] > floor) continue
    output = output.slice(0, range[0]) + text + output.slice(range[1])
    floor = range[0]
    applied += 1
  }
  return { output, applied }
}

/** `file -> rule -> count` from the ratchet baseline's `path:line:col` lists. */
export function baselineCounts(violations) {
  const counts = new Map()
  for (const [rule, entries] of Object.entries(violations ?? {})) {
    for (const entry of entries) {
      const file = entry.replace(/:\d+:\d+$/, '')
      const perFile = counts.get(file) ?? new Map()
      perFile.set(rule, (perFile.get(rule) ?? 0) + 1)
      counts.set(file, perFile)
    }
  }
  return counts
}

/** Messages in rule buckets that grew for this file versus the baseline. */
export function grownMessages(file, messages, counts) {
  const known = counts.get(file) ?? new Map()
  const now = new Map()
  for (const message of messages) {
    const rule = message.ruleId ?? '(parse error)'
    now.set(rule, (now.get(rule) ?? 0) + 1)
  }
  return messages.filter((message) => {
    const rule = message.ruleId ?? '(parse error)'
    return (now.get(rule) ?? 0) > (known.get(rule) ?? 0)
  })
}

async function main() {
  const write = process.argv.includes('--write')
  if (!existsSync(resolve('.nuxt/eslint.config.mjs'))) {
    console.error(
      'Missing .nuxt/eslint.config.mjs; run `npx nuxi prepare` first.',
    )
    process.exitCode = 2
    return
  }
  const { ESLint } = await import('eslint')
  const probe = new ESLint()
  const files = []
  for (const file of changedPaths().filter((path) => LINTABLE.test(path))) {
    if (!(await probe.isPathIgnored(file))) files.push(file)
  }
  if (!files.length) {
    console.log('No changed files need an ESLint autofix pass.')
    return
  }

  if (write) {
    const fixer = new ESLint({
      fix: (message) => SAFE_FIX_RULES.has(message.ruleId),
    })
    const fixed = await fixer.lintFiles(files)
    await ESLint.outputFixes(fixed)
    for (const result of fixed) {
      if (result.output !== undefined) {
        console.log(`ESLint autofix: ${relative('.', result.filePath)}`)
      }
    }

    for (const file of files) {
      for (let pass = 0; pass < 5; pass += 1) {
        const source = readFileSync(file, 'utf8')
        const [result] = await probe.lintText(source, { filePath: file })
        const { output, applied } = applyFixes(
          source,
          importRemovals(source, result?.messages ?? []),
        )
        if (!applied) break
        writeFileSync(file, output)
        console.log(`Removed ${applied} unused import(s): ${file}`)
      }
    }
  }

  const baselinePath = resolve('utils/scripts/lint-ratchet-baseline.json')
  const counts = baselineCounts(
    existsSync(baselinePath)
      ? JSON.parse(readFileSync(baselinePath, 'utf8')).violations
      : {},
  )
  let grown = 0
  for (const result of await probe.lintFiles(files)) {
    const file = relative('.', result.filePath)
    for (const message of grownMessages(file, result.messages, counts)) {
      grown += 1
      const rule = message.ruleId ?? '(parse error)'
      console.log(
        `::warning file=${file},line=${message.line ?? 1},title=ESLint ratchet (${rule})::${message.message.replace(/\r?\n/g, ' ')}`,
      )
    }
  }
  console.log(
    grown
      ? `${grown} ESLint problem(s) in changed files exceed the ratchet baseline and need a hand fix (annotated above).`
      : 'Changed files add no ESLint problems beyond the ratchet baseline.',
  )
}

if (process.argv[1]?.endsWith('lintFixChanged.mjs')) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 2
  })
}
