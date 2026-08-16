// /utils/scripts/verifyModelBuilderFieldBlobContinuationGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- the FIELDS_AND_PROMPTS
// blob format is "key: value" lines, one per field, but several fields are
// declared `prose: true` in MODEL_FIELDS (modelBuilderFields.ts) --
// backstory, personality, quirks, description, effect, flavorText, botIntro,
// userIntro, prompt, pitch, goal, intros -- specifically to allow long,
// multi-paragraph text (commit.post.ts's own pickText() allows up to 20000
// chars for these). parseFieldLines()/setFieldLine() previously dropped any
// line that didn't itself contain a colon, so a paragraph break typed by a
// user (or wrapped onto a second line by an AI draft) silently discarded
// everything after the first line of that field's value -- including at
// COMMIT time, since commit.post.ts parsed this exact same blob into the
// typed columns it actually writes to the database. The commit preview
// panel shows the raw, un-parsed blob (correct, full text) right up until
// the moment of commit, so the truncation was invisible until after the
// record already existed with silently-missing content -- no error, no
// warning, just a shorter backstory/description/etc. than what was
// approved.
//
// Fixed by treating a line that doesn't open a recognized field (checked
// against the target model's own MODEL_FIELDS keys, when known) as a
// continuation of the previous field's value instead of dropping it.
// commit.post.ts's own hand-rolled duplicate of this exact parsing logic
// was removed in the same change -- it now delegates to the shared,
// schema-aware splitter in modelBuilderFields.ts (the same module the
// client uses) rather than maintaining two copies that can silently drift
// out of sync with each other.
//
// Unlike most sibling Model Builder guards, this one is intentionally
// behavioral rather than purely textual: parseFieldLines/readFieldLine/
// setFieldLine are pure, freestanding functions with no DB/HTTP dependency,
// so importing and directly exercising the real implementation is strictly
// stronger regression protection than pattern-matching its source text
// would be. A light textual check is kept alongside it for the one thing
// behavioral testing can't see -- whether commit.post.ts still delegates to
// the shared splitter instead of re-inlining its own copy.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseFieldLines,
  readFieldLine,
  setFieldLine,
} from '@/stores/helpers/modelBuilderFields'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMMIT_ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

// Exercises the real parseFieldLines/readFieldLine/setFieldLine against
// multi-line fixtures. Exported so the self-test can assert it currently
// passes against the real, fixed implementation.
export function checkFieldBlobContinuation(): string[] {
  const errors: string[] = []

  const multiline =
    'name: Elandra\n' +
    'backstory: Elandra grew up in the northern peaks.\n' +
    'She lost her family in a rockslide and vowed to become strong.\n' +
    'personality: stoic, guarded, secretly kind'

  const expectedBackstory =
    'Elandra grew up in the northern peaks.\n' +
    'She lost her family in a rockslide and vowed to become strong.'

  const parsed = parseFieldLines(multiline, 'Character')
  const backstory = parsed.find((line) => line.key === 'backstory')?.value
  if (backstory !== expectedBackstory) {
    errors.push(
      'parseFieldLines() no longer preserves a multi-line prose value -- ' +
        `expected backstory to equal ${JSON.stringify(expectedBackstory)}, ` +
        `got ${JSON.stringify(backstory)}. A continuation line (no colon, ` +
        'or no recognized field key) must be appended to the previous ' +
        "field's value, not dropped.",
    )
  }

  const personality = parsed.find((line) => line.key === 'personality')?.value
  if (personality !== 'stoic, guarded, secretly kind') {
    errors.push(
      'parseFieldLines() misparsed the field immediately after a ' +
        'multi-line value -- expected personality to equal ' +
        `"stoic, guarded, secretly kind", got ${JSON.stringify(personality)}.`,
    )
  }

  const readBack = readFieldLine(multiline, 'backstory', 'Character')
  if (readBack !== expectedBackstory) {
    errors.push(
      'readFieldLine() does not return the full multi-line value for ' +
        `"backstory" -- got ${JSON.stringify(readBack)}.`,
    )
  }

  // A stray colon inside a continuation line (e.g. a clock time mid-
  // sentence) must not be mistaken for a new field when the target model's
  // known keys are given.
  const withStrayColon =
    'backstory: She arrived at dawn.\nIt was 3:00 in the morning.'
  const strayParsed = parseFieldLines(withStrayColon, 'Character')
  if (strayParsed.length !== 1 || strayParsed[0]?.key !== 'backstory') {
    errors.push(
      'parseFieldLines() treats a stray colon inside a continuation line ' +
        '(e.g. a clock time) as a new field when a modelType is given -- ' +
        `got ${JSON.stringify(strayParsed)}.`,
    )
  } else if (
    strayParsed[0]?.value !==
    'She arrived at dawn.\nIt was 3:00 in the morning.'
  ) {
    errors.push(
      'parseFieldLines() dropped or mangled a continuation line containing ' +
        `a stray colon -- got ${JSON.stringify(strayParsed[0]?.value)}.`,
    )
  }

  // setFieldLine() replacing a field that currently holds a multi-line
  // value must consume the old value's continuation lines too, not leave
  // them behind as orphaned text after the replacement.
  const replaced = setFieldLine(
    multiline,
    'backstory',
    'A short new bio.',
    'Character',
  )
  const replacedParsed = parseFieldLines(replaced, 'Character')
  const replacedBackstory = replacedParsed.find(
    (line) => line.key === 'backstory',
  )?.value
  if (replacedBackstory !== 'A short new bio.') {
    errors.push(
      "setFieldLine() left the old multi-line backstory's continuation " +
        `lines behind after replacing it -- got ${JSON.stringify(replacedBackstory)}.`,
    )
  }
  const replacedPersonality = replacedParsed.find(
    (line) => line.key === 'personality',
  )?.value
  if (replacedPersonality !== 'stoic, guarded, secretly kind') {
    errors.push(
      'setFieldLine() corrupted a sibling field while replacing backstory ' +
        `-- got ${JSON.stringify(replacedPersonality)}.`,
    )
  }

  return errors
}

// Light textual check: commit.post.ts must delegate to the shared splitter
// rather than re-inlining its own hand-rolled "key: value" parser -- the
// exact duplication that let this bug diverge undetected between the two
// copies in the first place. Exported so the self-test can run it against
// synthetic buggy/fixed fixtures without touching the real route file.
export function checkCommitDelegatesToSharedSplitter(
  content: string,
): string[] {
  const errors: string[] = []
  if (!content.includes('parseFieldLines as splitFieldBlob')) {
    errors.push(
      'commit.post.ts no longer imports the shared parseFieldLines splitter ' +
        'from stores/helpers/modelBuilderFields.ts as `splitFieldBlob` -- has ' +
        'a hand-rolled duplicate parser been reintroduced? That is the exact ' +
        'drift risk this guard exists to catch.',
    )
  }
  if (!content.includes('splitFieldBlob(')) {
    errors.push(
      'commit.post.ts imports splitFieldBlob but never calls it -- the ' +
        'FIELDS_AND_PROMPTS blob must be parsed via the shared, schema-aware ' +
        'splitter, not a local reimplementation.',
    )
  }
  return errors
}

function main(): void {
  const errors = checkFieldBlobContinuation()

  const commitContent = readFileSync(COMMIT_ROUTE_PATH, 'utf8')
  errors.push(...checkCommitDelegatesToSharedSplitter(commitContent))

  if (errors.length) {
    console.error('Model Builder field-blob continuation guard failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder field-blob continuation guard passed: multi-line prose ' +
      'values in the FIELDS_AND_PROMPTS blob survive parseFieldLines/' +
      'readFieldLine/setFieldLine round-trips, and commit.post.ts delegates ' +
      'to the shared splitter instead of a hand-rolled duplicate.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
