// /utils/scripts/verifyModelBuilderDraftSourceSnapshotGuard.ts
//
// Regression guard (model-builder/t-029, cycle 56) -- draftText() (the
// store function behind every "Draft with AI" click for pitch/fields/
// artPrompt) sent `source: state.selectedSource ?? undefined` as the
// `context.source` the 'model-builder' suggest sheet
// (server/utils/suggest/sheets/modelBuilderSuggest.ts's buildSourceContext)
// uses to ground the draft in the selected SOURCE record's canon
// (name/class/species/personality/quirks/backstory/description/pitch/
// flavorText/botIntro).
//
// state.selectedSource is only ever set by an in-session selectSource()
// call and is deliberately nulled in every "adopt a different run" branch
// of resumeRun()/openRun() (cycle 24's own fix -- see
// verifyModelBuilderStaleSelectionOnReopenGuard.ts and adaptRun's comment).
// So after resuming a run -- a page reload, or reopening one from Run
// History, both ordinary paths -- state.selectedSource is null and
// draftText's `context.source` silently became `undefined`. The suggest
// sheet's whole canon-grounding block vanished from the prompt with no
// error surfaced anywhere: the request still "succeeds", it just drafts
// generic, ungrounded text that can contradict the source's established
// identity -- exactly what modelBuilderSuggest.ts's own system prompt says
// never to do.
//
// model-builder-progress-matrix.vue's `source` computed already solved the
// identical resume-survival problem for the read-only "Source context"
// card by preferring the run's persisted `sourceSnapshot` and falling back
// to `selectedSource` only when that's absent (`run.value?.sourceSnapshot
// ?? store.selectedSource ?? null`) -- draftText's request payload just
// never adopted the same precedence. Fixed by matching it exactly:
// `state.run.sourceSnapshot ?? state.selectedSource ?? undefined`.
//
// This asserts the textual shape of that fix stays in place: the
// `context.source:` line inside draftText's /api/suggest request body
// reads the run's sourceSnapshot before falling back to selectedSource,
// rather than reading selectedSource alone.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const ANCHOR = 'fields: item.fieldsDraft,'
const FIXED_SOURCE_LINE =
  'source: state.run.sourceSnapshot ?? state.selectedSource ?? undefined,'
const BARE_SOURCE_LINE = 'source: state.selectedSource ?? undefined,'

// Checks the fix's exact shape against the full source text of a file
// shaped like modelBuilderStore.ts. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store
// file.
export function checkDraftSourceSnapshotGuard(content: string): string[] {
  const errors: string[] = []

  const anchorIndex = content.indexOf(ANCHOR)
  if (anchorIndex === -1) {
    errors.push(
      `Could not find \`${ANCHOR}\` in modelBuilderStore.ts -- has ` +
        "draftText()'s /api/suggest request body been renamed or " +
        'restructured? If so, this guard needs to move with it.',
    )
    return errors
  }

  // The source line follows the anchor, possibly after an explanatory
  // comment block -- give it a generous window rather than requiring an
  // exact line count. Collapse whitespace before matching so prettier
  // wrapping a long `source:` line onto its own continuation line (as it
  // does for the fixed shape) doesn't defeat a literal substring match.
  const window = content
    .slice(anchorIndex, anchorIndex + 1200)
    .replace(/\s+/g, ' ')

  if (window.includes(FIXED_SOURCE_LINE.replace(/\s+/g, ' '))) {
    return errors
  }

  if (window.includes(BARE_SOURCE_LINE.replace(/\s+/g, ' '))) {
    errors.push(
      "draftText()'s context.source still reads `state.selectedSource ?? " +
        'undefined` alone -- state.selectedSource is deliberately nulled ' +
        'on every resumeRun()/openRun() "adopt a different run" branch ' +
        '(cycle 24), so after resuming a run (a reload, or reopening one ' +
        'from Run History) every subsequent "Draft with AI" request ' +
        "silently drops the suggest sheet's entire canon-grounding block " +
        '(source name/class/species/personality/backstory/etc.) with no ' +
        'error, producing generic drafts that can contradict the source ' +
        "record's established identity. Fall back to the run's persisted " +
        `\`state.run.sourceSnapshot\` first, matching model-builder-` +
        "progress-matrix.vue's identical `source` computed precedence: " +
        `\`${FIXED_SOURCE_LINE}\``,
    )
    return errors
  }

  errors.push(
    "Could not find draftText()'s `context.source:` line in its expected " +
      'shape near the fieldsDraft anchor -- has the /api/suggest request ' +
      'body been restructured? If so, verify by hand that context.source ' +
      'still falls back to state.run.sourceSnapshot before ' +
      'state.selectedSource, and update this guard to match.',
  )
  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkDraftSourceSnapshotGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder draft source-snapshot guard contract failed for ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder draft source-snapshot guard contract passed: ' +
      "draftText()'s /api/suggest request falls back to the run's " +
      'persisted sourceSnapshot before selectedSource, so an AI draft ' +
      'requested after resuming a run still grounds in the source ' +
      "record's canon instead of silently going generic.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
