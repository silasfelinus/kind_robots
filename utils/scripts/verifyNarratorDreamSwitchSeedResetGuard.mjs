// /utils/scripts/verifyNarratorDreamSwitchSeedResetGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). workspace-narrator.vue
// keeps the narrator conversation in two halves. The live exchanges live in
// narratorStore (`narratorSessionIds` -> `narratorSession`); the seeded topic
// cards -- a topic's opening text plus its follow-up buttons -- live locally in
// this component's `seededMessages`, pushed there by `selectTopic()` and
// `selectStarter()`.
//
// Both halves are Dream-scoped. `topicButtons` is derived from
// `narratorThreads`, which narratorStore derives from the ACTIVE DREAM's
// narrator bot, so every seeded message is text authored for one particular
// Dream.
//
// narratorStore already resets its half when the selection changes: its
// `watch(() => activeDream.value?.id, ...)` empties `narratorSessionIds`, the
// composer draft and the status line. This component had no matching reset, and
// the Dream really can change underneath a mounted dock -- it is not only
// reachable by deselecting back to the gallery (which would remount and reset
// this state for free). dream-relationship-gallery's "Connected Dreams" panel,
// rendered by dream-narration.vue right next to the dock, calls
// `dreamStore.selectDreamById(id)` in place, and dream-interact.vue keeps
// `<LazyWorkspaceNarrator>` mounted the whole time because its
// `v-if="dreamStore.selectedDream"` never goes falsy across that swap.
//
// So opening a connected Dream left the previous Dream's topic cards sitting at
// the top of the new Dream's thread, and `findStarter()` still resolved their
// follow-up keys, so tapping one loaded a prompt written for a Dream that is no
// longer open into the new Dream's composer.
//
// `clearNarratorThread()` already proves the two halves belong together: it
// pairs `clearSession()` with `seededMessages.value = []`. This asserts the
// Dream-switch path performs the same pairing.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOCK_PATH = 'components/navigation/workspace-narrator.vue'
const STORE_PATH = 'stores/narratorStore.ts'
const INTERACT_PATH = 'components/dreams/dream-interact.vue'
const GALLERY_PATH = 'components/dreams/dream-relationship-gallery.vue'

function read(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

// `() => activeDream.value?.id` in the store, `... ?? null` in the dock; both
// are the same signal, so tolerate a nullish-coalescing tail.
const ACTIVE_DREAM_ID_SOURCE =
  '\\(\\)\\s*=>\\s*activeDream\\.value\\?\\.id(?:\\s*\\?\\?\\s*null)?'

function watcherBodyFor(content, path, sourceExpression) {
  const signature = new RegExp(`watch\\(\\s*${sourceExpression}\\s*,`)
  const match = signature.exec(content)
  if (!match) return null

  const braceOpen = content.indexOf('{', match.index + match[0].length)
  if (braceOpen === -1) {
    throw new Error(
      `Found the activeDream watcher in ${path} but could not find its ` +
        'callback body -- has it been restructured? If so, this guard needs ' +
        'to move with it.',
    )
  }

  let depth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }

  return content.slice(braceOpen, i + 1)
}

const dock = read(DOCK_PATH)
const store = read(STORE_PATH)
const interact = read(INTERACT_PATH)
const gallery = read(GALLERY_PATH)

// The premise: the dock still owns a local, Dream-derived seeded thread.
assert.ok(
  /const seededMessages = ref<SeededMessage\[\]>\(\[\]\)/.test(dock),
  `${DOCK_PATH} no longer keeps local seeded topic messages -- if that thread ` +
    'moved into narratorStore (which already resets on Dream change) this ' +
    'guard should move or retire with it.',
)

assert.ok(
  /seededMessages\.value\.push\(/.test(dock),
  `${DOCK_PATH} no longer pushes topic/starter cards into seededMessages -- ` +
    'has topic seeding been reworked? This guard needs to move with it.',
)

assert.ok(
  /narratorThreads\.value\.map\(/.test(dock),
  `${DOCK_PATH} must still build topicButtons from the active Dream's ` +
    'narratorThreads -- that Dream-scoping is the whole reason seeded ' +
    'messages cannot outlive a Dream switch.',
)

// The store half of the reset, which the dock half has to mirror.
const storeWatcher = watcherBodyFor(store, STORE_PATH, ACTIVE_DREAM_ID_SOURCE)

assert.ok(
  storeWatcher,
  `${STORE_PATH} must keep its \`watch(() => activeDream.value?.id, ...)\` ` +
    'reset -- the dock mirrors it, and without it neither half of the ' +
    'narrator thread is Dream-scoped at all.',
)

assert.ok(
  /narratorSessionIds\.value = \[\]/.test(storeWatcher),
  `${STORE_PATH}'s activeDream watcher must still clear narratorSessionIds, ` +
    'the live half of the narrator thread.',
)

// The fix: the dock resets its own half on the same signal.
const dockWatcher = watcherBodyFor(dock, DOCK_PATH, ACTIVE_DREAM_ID_SOURCE)

assert.ok(
  dockWatcher,
  `${DOCK_PATH} must watch \`() => activeDream.value?.id\` and drop its ` +
    'seeded topic messages when the Dream changes. Without it, opening a ' +
    "connected Dream leaves the previous Dream's topic cards at the top of " +
    "the new Dream's thread, with follow-up buttons that still resolve " +
    'through findStarter() and load prompts written for a Dream that is no ' +
    'longer open.',
)

assert.ok(
  /seededMessages\.value = \[\]/.test(dockWatcher),
  `${DOCK_PATH}'s activeDream watcher must empty seededMessages, matching ` +
    'the pairing clearNarratorThread() already uses (clearSession() plus ' +
    '`seededMessages.value = []`). narratorStore clearing only its own half ' +
    "leaves the previous Dream's seeded cards on screen.",
)

assert.ok(
  /\bactiveDream,/.test(dock.slice(0, dock.indexOf('} = storeToRefs('))),
  `${DOCK_PATH} must take activeDream from storeToRefs(narratorStore) so the ` +
    'Dream-switch watcher stays reactive.',
)

// The reset in clearNarratorThread stays as the shape the Dream-switch path
// mirrors -- if that pairing is ever broken, this fix is only half a fix.
assert.ok(
  /function clearNarratorThread\(\): void \{[\s\S]*?seededMessages\.value = \[\][\s\S]*?\n\}/.test(
    dock,
  ),
  `${DOCK_PATH}'s clearNarratorThread() must still empty seededMessages ` +
    'alongside clearSession() -- that is the pairing the Dream-switch reset ' +
    'is modelled on.',
)

// The reachable path that made this a live bug rather than a theoretical one:
// the dock is NOT remounted when the selected Dream is swapped in place.
assert.ok(
  /v-if="dreamStore\.selectedDream"[\s\S]{0,400}?LazyWorkspaceNarrator|LazyWorkspaceNarrator[\s\S]{0,400}?v-if="dreamStore\.selectedDream"/.test(
    interact,
  ),
  `${INTERACT_PATH} must still gate <LazyWorkspaceNarrator> on ` +
    '`dreamStore.selectedDream` alone. That condition stays truthy across an ' +
    'in-place Dream swap, which is exactly why the dock survives the switch ' +
    'and has to reset its own state.',
)

assert.ok(
  /dreamStore\.selectDreamById\(id\)/.test(gallery),
  `${GALLERY_PATH} must still open a connected Dream via selectDreamById() -- ` +
    'that in-place swap (no deselect, no remount of the narrator dock) is the ' +
    'path this guard protects.',
)

console.log(
  'Narrator Dream-switch seed reset contract passed: workspace-narrator drops ' +
    'its seeded topic messages when the active Dream changes, so opening a ' +
    "connected Dream no longer carries the previous Dream's topic cards and " +
    "follow-up prompts into the new Dream's narrator thread.",
)
