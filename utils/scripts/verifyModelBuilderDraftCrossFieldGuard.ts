// /utils/scripts/verifyModelBuilderDraftCrossFieldGuard.ts
//
// Regression guard (model-builder/t-029) -- draftingField is a single
// store-wide slot (see modelBuilderStore.ts's createOwnedSingleton comment):
// only one draft can genuinely be in flight at a time, for any item/field in
// the whole run. Before this fix, each "Draft with AI" button in
// model-builder-item-panel.vue was gated only on `isDrafting(thisField)` --
// whether *that exact* field currently owned the slot. Nothing stopped a
// second click on a *sibling* field (Pitch, then Fields, before Pitch's
// request resolved) or the same/a different field on a *different* item
// from being clickable while a first draft was still pending. That second
// click silently reassigned the shared slot: the first field's
// isDrafting(field) then flipped to false, its "Draft" button and textarea
// re-enabled while its own request was still in flight, and the eventual
// response could clobber whatever the user had typed in the meantime with
// no warning beyond an unrelated success toast. Concrete repro: click
// "Draft with AI" next to Pitch, then before it resolves click "Draft" next
// to Fields, then type in the (now re-enabled) Pitch textarea -- the typed
// text is silently lost the instant the original Pitch draft lands.
//
// Fixed by gating every "Draft with AI" / "Draft" button, and the
// `isManualActionInFlight` computed that also blocks the "Auto" button, on
// `isAnyDraftInFlight` (`store.draftingField !== null`) instead of the
// narrower per-field `isDrafting(field)` -- nothing that can start or race a
// second draft becomes clickable until the one shared slot is actually
// released. (The three textareas' own `:disabled` binding got the same
// treatment; that's covered by its own sibling guard,
// verifyModelBuilderDraftTextareaGuard.ts.)
//
// This asserts the textual shape of the fix stays in place: an
// `isAnyDraftInFlight` computed exists, defined off `store.draftingField`;
// each of the three "Draft" buttons' `:disabled` binding includes it; and
// `isManualActionInFlight` includes it too. Deliberately scoped to this one
// component/bug, mirroring this project's other narrow textual guards over
// a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)

const DRAFT_BUTTONS = [
  { click: '@click="draft(\'pitch\')"', field: 'pitch' },
  { click: '@click="draft(\'fields\')"', field: 'fields' },
  { click: '@click="draft(\'artPrompt\')"', field: 'artPrompt' },
] as const

// Checks the fix's exact shape against the full source text of
// model-builder-item-panel.vue. Exported so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkDraftCrossFieldGuard(content: string): string[] {
  const errors: string[] = []

  const computedMatch =
    /const isAnyDraftInFlight = computed\(\s*\(\)\s*=>\s*store\.draftingField\s*!==\s*null\s*\)/.exec(
      content,
    )
  if (!computedMatch) {
    errors.push(
      'Could not find `const isAnyDraftInFlight = computed(() => ' +
        'store.draftingField !== null)` in model-builder-item-panel.vue -- ' +
        'has it been renamed or restructured? draftingField is a single ' +
        'store-wide slot, so every draft-blocking UI affordance must key ' +
        'off "is *any* draft in flight", not just "is *this* field ' +
        'drafting".',
    )
  }

  for (const { click, field } of DRAFT_BUTTONS) {
    const clickIndex = content.indexOf(click)
    if (clickIndex === -1) {
      errors.push(
        `Could not find a button with \`${click}\` in ` +
          'model-builder-item-panel.vue -- has the Draft button for ' +
          `'${field}' been renamed, removed, or restructured?`,
      )
      continue
    }

    // The :disabled attribute sits above @click in this template's button
    // markup; search backward from @click to the button's opening tag.
    const tagStart = content.lastIndexOf('<button', clickIndex)
    if (tagStart === -1) {
      errors.push(
        `Could not find the opening <button> tag for \`${click}\` -- this ` +
          "guard's anchor point has moved.",
      )
      continue
    }
    const tag = content.slice(tagStart, clickIndex)

    const disabledMatch = /:disabled="([^"]*)"/.exec(tag)
    if (!disabledMatch) {
      errors.push(
        `The '${field}' Draft button has no \`:disabled\` binding -- this ` +
          "guard's anchor point has moved.",
      )
      continue
    }

    if (!disabledMatch[1]!.includes('isAnyDraftInFlight')) {
      errors.push(
        `The '${field}' Draft button's \`:disabled\` binding does not ` +
          'include isAnyDraftInFlight. Gating only on ' +
          `isDrafting('${field}') isn't enough: draftingField is a single ` +
          'store-wide slot, so clicking this button while a *different* ' +
          "field's (or item's) draft is still pending silently steals the " +
          "slot out from under it -- re-enabling the other field's " +
          'button/textarea while its own request is still in flight. ' +
          'Gating on isAnyDraftInFlight (store.draftingField !== null) ' +
          'closes that window.',
      )
    }
  }

  const manualActionMatch =
    /const isManualActionInFlight = computed\(\s*\(\)\s*=>[\s\S]{0,400}?\)/.exec(
      content,
    )
  if (!manualActionMatch) {
    errors.push(
      'Could not find the isManualActionInFlight computed in ' +
        'model-builder-item-panel.vue -- has it been renamed or removed?',
    )
  } else if (!manualActionMatch[0].includes('isAnyDraftInFlight')) {
    errors.push(
      'isManualActionInFlight does not include isAnyDraftInFlight. The ' +
        '"Auto" button (which starts autoBuildItem) is gated on this ' +
        "computed; if it only checks this item's own isDrafting(field) " +
        'calls, clicking Auto while a draft for a *different* item still ' +
        'holds the shared draftingField slot will immediately race that ' +
        'draft instead of being blocked.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(PANEL_PATH, 'utf8')
  const errors = checkDraftCrossFieldGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder draft cross-field guard contract failed for ' +
        'model-builder-item-panel.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder draft cross-field guard contract passed: every Draft ' +
      "button and the Auto button's isManualActionInFlight gate all key " +
      'off isAnyDraftInFlight, so a draft on one field/item can never be ' +
      'silently stolen by starting another before it resolves.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
