// /utils/scripts/verifyDisabledAffordances.ts
//
// Don't draw an option that isn't pertinent.
//
// Silas, 2026-08-10, looking at /bots with nothing selected: "Why is there
// significant space allocated to a greyed out Clear? If we could figure out how
// to automate this kind of fix, it would be great. We don't need to see an
// option if it isn't pertinent. Especially on small and md displays, but really
// in general, why show a blanked out option of this type."
//
// This is that automation. It is deliberately NARROW, and the narrowness is the
// whole reason it can be a hard gate rather than another advisory ratchet.
//
// WHY NOT "FLAG EVERY :disabled"
// ------------------------------
// There were 128 `:disabled="!..."` bindings in components/ and pages/ when
// this was written, and the overwhelming majority are correct. A disabled
// control is the right answer whenever its greyed state TEACHES something:
//
//   Send            disabled until you type      -> tells you input is required
//   Save            disabled until the form is valid
//   Next / Previous disabled at the ends of a pager -> tells you where you are
//   Approve assets  disabled until the stage allows it
//
// In each of those the action exists and is momentarily unavailable, and hiding
// it would leave the user hunting for a control that ought to be there. A
// contract that flagged all of them would be wrong 120 times to be right 5, and
// would be silenced within a week.
//
// THE ONE SHAPE THAT IS ALWAYS WRONG
// ----------------------------------
// A control that CLEARS something, disabled precisely because that something is
// absent. It has no subject, so there is nothing for its disabled state to
// teach -- the absence it reports is already visible in the thing it would have
// cleared. It is pure cost: a labelled button's width, permanently, to say
// "nothing here".
//
// So the rule is the conjunction, not either half:
//
//   1. the control's own label is a clear/reset/remove verb, AND
//   2. its `:disabled` is a PURE negation -- `!x`, no `||`, no `&&`
//
// Condition 2 matters as much as condition 1. dream-brainstorm.vue has both
// buttons side by side: "Clear" (`!candidates.length`) is flagged, while
// "Reject Pending" (`!pendingCandidates.length`) is a real action that can be
// unavailable while candidates exist, and keeps its disabled state. And a
// compound like `!selection || isSaving` is a control that is sometimes busy
// rather than sometimes subjectless, so it is left alone.
//
// THE FIX is always the same shape: swap `:disabled="!x"` for `v-if="x"`.
//
//   npx tsx utils/scripts/verifyDisabledAffordances.ts
//   npx tsx utils/scripts/verifyDisabledAffordances.ts --report   # list, no gate
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { stripComments } from './lib/sourceText'

const ROOT = process.cwd()
const SCAN_DIRS = ['components', 'pages']
const IGNORED_SEGMENTS = new Set(['abandonware', '__tests__', '__fixtures__'])

/**
 * Verbs whose control has no meaning without a subject.
 *
 * Anchored at the START of the label, so "Clear" and "Clear selection" match
 * while "Clearance report" does not -- and, more importantly, so a button
 * merely MENTIONING one of these words in a longer sentence is not caught.
 */
const SUBJECTLESS_VERB = /^(clear|reset|remove|deselect|unselect|discard)\b/i

type Finding = {
  file: string
  line: number
  label: string
  expression: string
}

/** `!foo`, `!foo.bar.length`, `!foo.trim()` — but never a compound. */
function isPureNegation(expression: string): boolean {
  const trimmed = expression.trim()

  if (!trimmed.startsWith('!')) return false
  if (trimmed.includes('||') || trimmed.includes('&&')) return false
  // `!(a || b)` slips past the check above once the operators are inside
  // parentheses, and it is a compound condition however it is spelled.
  if (/^!\s*\(/.test(trimmed)) return false
  // A double negation is a coercion to boolean, not an absence test.
  if (trimmed.startsWith('!!')) return false

  return true
}

/**
 * The control's own visible label.
 *
 * Interpolation is REMOVED rather than guessed at: `{{ busy ? 'Clearing…' :
 * 'Clear' }}` cannot be read statically, and treating the raw mustache as text
 * would match on the word inside it regardless of what it evaluates to. When
 * stripping leaves nothing, the element falls back to `aria-label`, and if
 * there is no aria-label either the element is skipped -- an unlabelled control
 * is a different defect and not this contract's business.
 */
function controlLabel(openTag: string, innerHtml: string): string {
  const text = innerHtml
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text) return text

  // Capture groups are `string | undefined` under noUncheckedIndexedAccess,
  // even when the pattern guarantees them — so read it once and check it.
  const aria = openTag.match(/\baria-label="([^"]+)"/)?.[1]

  return aria ? aria.trim() : ''
}

function collectVueFiles(dir: string, found: string[] = []): string[] {
  let entries: string[]

  try {
    entries = readdirSync(dir)
  } catch {
    return found
  }

  for (const entry of entries) {
    if (IGNORED_SEGMENTS.has(entry)) continue

    const full = join(dir, entry)

    if (statSync(full).isDirectory()) {
      collectVueFiles(full, found)
      continue
    }

    if (extname(full) === '.vue') found.push(full)
  }

  return found
}

function scanSource(source: string, file: string): Finding[] {
  // Comments first, per interface-vision t-068 ("a doc comment can fail 29
  // source-text contracts"): the notes this change added beside each fixed
  // button quote the very binding they replaced, and a scanner that reads them
  // would fail the repo for documenting the fix it asked for.
  const clean = stripComments(source)
  const findings: Finding[] = []
  const element = /<(button|NuxtLink)\b([^>]*)>([\s\S]*?)<\/\1>/g

  let match: RegExpExecArray | null

  while ((match = element.exec(clean)) !== null) {
    const full = match[0]
    const attributes = match[2] ?? ''
    const innerHtml = match[3] ?? ''
    const expression = attributes.match(/:disabled="([^"]+)"/)?.[1]?.trim()

    if (!expression || !isPureNegation(expression)) continue

    const label = controlLabel(full, innerHtml)

    if (!SUBJECTLESS_VERB.test(label)) continue

    findings.push({
      file,
      line: clean.slice(0, match.index).split('\n').length,
      label,
      expression,
    })
  }

  return findings
}

/*
 * A SCANNER THAT MATCHES NOTHING LOOKS EXACTLY LIKE A CLEAN REPO.
 *
 * This contract's pass condition is an empty result, so every way the detector
 * could break -- a regex typo, a Vue syntax it stops recognising, a refactor
 * that drops the attribute match -- produces a confident green. That is the
 * failure mode this whole stage keeps running into ("verify by exit code, never
 * by grepping output"), and a gate cannot be trusted to report zero unless it
 * is first proven able to report one.
 *
 * So the detector is run against known-bad and known-good fixtures on EVERY
 * invocation, not behind a --self-test flag someone has to remember.
 */
const SELF_TEST_MUST_FLAG = [
  `<button :disabled="!hasSelection" @click="clearSelection">Clear</button>`,
  `<button :disabled="!items.length">Reset filters</button>`,
  `<button :disabled="!picked" aria-label="Remove selection"><Icon /></button>`,
]

const SELF_TEST_MUST_PASS = [
  // Real actions that are momentarily unavailable — the 120-odd cases this
  // contract must never touch.
  `<button :disabled="!canSend">Send</button>`,
  `<button :disabled="!form.valid">Save changes</button>`,
  `<button :disabled="!pendingCandidates.length">Reject Pending</button>`,
  // Right verb, compound condition: sometimes busy, not subjectless.
  `<button :disabled="!selection || isSaving">Clear</button>`,
  // Right verb, already correct: no :disabled at all.
  `<button v-if="hasSelection" @click="clearSelection">Clear</button>`,
  // Label that merely starts with a similar word.
  `<button :disabled="!report">Clearance report</button>`,
]

function runSelfTest(): string[] {
  const problems: string[] = []

  SELF_TEST_MUST_FLAG.forEach((fixture, index) => {
    if (scanSource(fixture, 'self-test').length !== 1) {
      problems.push(
        `detector FAILED to flag known-bad fixture #${index + 1}: ${fixture}`,
      )
    }
  })

  SELF_TEST_MUST_PASS.forEach((fixture, index) => {
    if (scanSource(fixture, 'self-test').length !== 0) {
      problems.push(
        `detector WRONGLY flagged known-good fixture #${index + 1}: ${fixture}`,
      )
    }
  })

  return problems
}

/* ------------------------------------------------------------------ */

const selfTestProblems = runSelfTest()

if (selfTestProblems.length) {
  console.error('\nDisabled-affordance contract SELF-TEST FAILED:\n')
  for (const problem of selfTestProblems) console.error(`  ✗ ${problem}`)
  console.error(
    '\nThe detector is broken, so a clean scan would mean nothing. Fix the ' +
      'scanner before trusting this gate.',
  )
  process.exit(1)
}

const files = SCAN_DIRS.flatMap((dir) => collectVueFiles(join(ROOT, dir)))
const findings = files.flatMap((file) =>
  scanSource(readFileSync(file, 'utf8'), relative(ROOT, file)),
)

console.log(
  `Disabled-affordance contract scanned ${files.length} components ` +
    `(detector self-test: ${SELF_TEST_MUST_FLAG.length} must-flag and ` +
    `${SELF_TEST_MUST_PASS.length} must-pass fixtures, all correct).`,
)

if (process.argv.includes('--report')) {
  console.log(`\n${findings.length} subjectless disabled control(s):`)
  for (const f of findings) {
    console.log(
      `  - ${f.file}:${f.line}  "${f.label}"  :disabled="${f.expression}"`,
    )
  }
  process.exit(0)
}

if (findings.length) {
  console.error('\nDisabled-affordance contract FAILED:\n')

  for (const f of findings) {
    console.error(
      `  ✗ ${f.file}:${f.line} — "${f.label}" is drawn but greyed out whenever ` +
        `\`${f.expression.slice(1)}\` is absent.\n` +
        `    It acts on that thing, so with none there it has no subject and ` +
        `its disabled state teaches nothing the empty state does not already ` +
        `show.\n` +
        `    Fix: replace :disabled="${f.expression}" with ` +
        `v-if="${f.expression.slice(1)}".\n`,
    )
  }

  console.error(
    "Silas, 2026-08-10: \"We don't need to see an option if it isn't " +
      'pertinent ... why show a blanked out option of this type."\n\n' +
      'If one of these is genuinely a real action that happens to be ' +
      'unavailable rather than one with no subject, the honest fix is to widen ' +
      'its condition to say so (e.g. `!x || isBusy`), not to loosen this rule.',
  )

  process.exit(1)
}

console.log(
  '\nDisabled-affordance contract passed: no clear/reset control is drawn ' +
    'greyed out purely because the thing it acts on is absent.',
)
