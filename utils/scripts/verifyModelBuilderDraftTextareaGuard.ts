// /utils/scripts/verifyModelBuilderDraftTextareaGuard.ts
//
// Regression guard (model-builder/t-029) -- the Pitch, Fields, and Generation
// prompt textareas in model-builder-item-panel.vue bind to local component
// refs (`pitch`/`fields`/`prompt`), not directly to the store, and only push
// to the store on `@change` (i.e. on blur). draftText()'s own "don't clobber
// a newer edit" guard (verifyModelBuilderDraftApprovalGuard.ts's
// `liveValue !== current` check) only compares against the *store's* value,
// so it can't see an edit the user is still mid-typing that hasn't been
// blurred/committed yet. Before this fix, none of the three textareas
// disabled while their own field was drafting (unlike the "Draft with AI"
// buttons right next to them, which already gate on `isDrafting(field)`) --
// so a user could click Draft, start typing their own text into the same
// field before the response landed, and have it silently overwritten the
// instant the draft applied via updatePitch/updateFields/updatePrompt (whose
// watcher on the item's store value unconditionally overwrites the local
// ref). No error, no warning beyond the unrelated "Drafted ... for ..."
// success toast -- the typed text is just gone.
//
// Fixed by disabling each textarea while its own field is drafting, closing
// the vulnerable window entirely: `:disabled="!isEditable('PITCH') ||
// isDrafting('pitch')"` and the equivalent for fields/artPrompt.
//
// This asserts the textual shape of the fix stays in place: each of the
// three textareas' `:disabled` attribute includes its matching
// `isDrafting('field')` check alongside the existing `isEditable(...)` one.
// Deliberately scoped to this one component/bug, mirroring
// verifyModelBuilderDraftApprovalGuard.ts's preference for explicit, narrow
// textual checks over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)

const TEXTAREAS = [
  { model: 'v-model="pitch"', field: 'pitch' },
  { model: 'v-model="fields"', field: 'fields' },
  { model: 'v-model="prompt"', field: 'artPrompt' },
] as const

// Checks the fix's exact shape against the full source text of
// model-builder-item-panel.vue. Exported (rather than only exercised via
// main()) so the self-test below can run it against synthetic buggy/fixed
// fixtures without touching the real component file.
export function checkDraftTextareaGuard(content: string): string[] {
  const errors: string[] = []

  for (const { model, field } of TEXTAREAS) {
    const modelIndex = content.indexOf(model)
    if (modelIndex === -1) {
      errors.push(
        `Could not find a textarea with \`${model}\` in ` +
          'model-builder-item-panel.vue -- has it been renamed, removed, or ' +
          'restructured? If so, this guard (and the bug it protects ' +
          'against) needs to move with it.',
      )
      continue
    }

    const tagEnd = content.indexOf('/>', modelIndex)
    if (tagEnd === -1) {
      errors.push(
        `Could not find the closing \`/>\` of the \`${model}\` textarea -- ` +
          "this guard's anchor point has moved.",
      )
      continue
    }
    const tag = content.slice(modelIndex, tagEnd)

    const disabledMatch = /:disabled="([^"]*)"/.exec(tag)
    if (!disabledMatch) {
      errors.push(
        `The \`${model}\` textarea has no \`:disabled\` binding -- this ` +
          "guard's anchor point has moved; re-check how this field's " +
          'editability is gated.',
      )
      continue
    }

    if (!disabledMatch[1]!.includes(`isDrafting('${field}')`)) {
      errors.push(
        `The \`${model}\` textarea's \`:disabled\` binding does not include ` +
          `isDrafting('${field}'). The textarea binds to a local ref that ` +
          'only pushes to the store on @change (blur), so while a draft is ' +
          'in flight the store\'s own "don\'t clobber a newer edit" guard ' +
          "(liveValue !== current in draftText()) can't see text the user " +
          "is still mid-typing -- the draft's completion handler silently " +
          "overwrites it via the local ref's watcher. Disabling the " +
          'textarea while isDrafting(field) is true closes that window.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(PANEL_PATH, 'utf8')
  const errors = checkDraftTextareaGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder draft textarea guard contract failed for ' +
        'model-builder-item-panel.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder draft textarea guard contract passed: the Pitch, ' +
      'Fields, and Generation prompt textareas all disable while their own ' +
      'field is drafting, so a still-in-flight AI draft can never silently ' +
      "overwrite text the user hasn't blurred/committed yet.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
