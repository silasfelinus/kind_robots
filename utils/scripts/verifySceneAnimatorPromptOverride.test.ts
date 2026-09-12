// /utils/scripts/verifySceneAnimatorPromptOverride.test.ts
//
// Per-image motion direction, and the one property that makes it safe to ship.
//
// Silas, 2026-09-12: "I should also be able to edit the individual prompts for
// each image, and edit them before resubmitting."
//
// THE DANGEROUS PART is not the editor, it is the dedupe key. Every Scene
// Animator job ever rendered stores a configKey and a dedupeKey derived from
// sceneAnimatorConfigKey(). A custom prompt has to produce a DIFFERENT key --
// otherwise an edited prompt would collide with the result it was meant to
// replace -- while a source with no custom prompt has to produce the EXACT key
// it always has. Get the second half wrong and every finished render in the
// folder is orphaned at once: every card flips to `missing`, and the next batch
// run redoes the entire folder on a GPU that does one clip at a time.
//
// So the default-prompt key is pinned to a literal below. It is not
// decoration: it is the value real rows in the database already carry, and a
// change to it is a migration, not a refactor.
//
//   npx tsx utils/scripts/verifySceneAnimatorPromptOverride.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  sceneAnimatorConfigKey,
  sceneAnimatorDedupeKey,
  type SceneAnimatorRenderConfig,
} from '../../server/utils/sceneAnimator.js'
import { resolveScenePrompt } from '../../server/utils/sceneAnimatorPromptResolve.js'
import { SCENE_ANIMATOR_PROMPT } from '../../utils/sceneAnimatorPrompt.js'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')

// wan-startup-webp, the default for engine 'wan' and therefore what every
// Scene Animator job in the animate folder was rendered with.
const CONFIG: SceneAnimatorRenderConfig = {
  engine: 'wan',
  presetId: 'wan-startup-webp',
  durationSeconds: 2.5,
  fps: 16,
  width: 768,
  height: 768,
  outputFormat: 'webp',
  loop: true,
  renderScale: 1,
  isMature: false,
}

/* -- 1. the default-prompt key is frozen ------------------------------------ */

const FROZEN_DEFAULT_KEY = 'wan|wan-startup-webp|768x768|2.5s|16fps|webp|loop|scale-1|general'

assert.equal(
  sceneAnimatorConfigKey(CONFIG),
  FROZEN_DEFAULT_KEY,
  'the config key for a source with NO custom prompt changed. Every existing ' +
    'ArtJob stores a dedupeKey derived from this string, so this orphans every ' +
    'finished render in the folder and invites a batch run to redo all of them.',
)

// Passing an explicitly empty/absent override must be indistinguishable from
// not passing one at all -- resolveScenePrompt returns the shared default in
// that case, and the caller must not key on it.
for (const empty of [undefined, null, '', '   ']) {
  assert.equal(
    sceneAnimatorConfigKey(CONFIG, empty),
    FROZEN_DEFAULT_KEY,
    `an override of ${JSON.stringify(empty)} must not change the key`,
  )
}

const SOURCE_HASH = 'a'.repeat(64)
const defaultDedupe = sceneAnimatorDedupeKey(SOURCE_HASH, CONFIG)
assert.equal(
  defaultDedupe,
  sceneAnimatorDedupeKey(SOURCE_HASH, CONFIG, null),
  'the dedupe key must be identical with and without an absent override',
)
assert.ok(defaultDedupe.startsWith(`scene-animator:${SOURCE_HASH}:`))

/* -- 2. a custom prompt is a different render ------------------------------- */

const CUSTOM = 'The robot waves, winks, and leans toward the camera.'
const customKey = sceneAnimatorConfigKey(CONFIG, CUSTOM)

assert.notEqual(
  customKey,
  FROZEN_DEFAULT_KEY,
  'a custom prompt must produce its own key, or an edited prompt collides ' +
    'with the very result it was written to replace',
)
assert.ok(
  customKey.startsWith(`${FROZEN_DEFAULT_KEY}|`),
  'the prompt fingerprint must be APPENDED to the existing key, not woven ' +
    'into it — anything else changes the default case too',
)

assert.notEqual(
  sceneAnimatorDedupeKey(SOURCE_HASH, CONFIG, CUSTOM),
  defaultDedupe,
  'a custom prompt must dedupe independently of the default-prompt render',
)

// Two different prompts are two different renders; the same prompt is one.
assert.notEqual(
  sceneAnimatorConfigKey(CONFIG, CUSTOM),
  sceneAnimatorConfigKey(CONFIG, `${CUSTOM} And the light flickers.`),
)
assert.equal(
  sceneAnimatorConfigKey(CONFIG, CUSTOM),
  sceneAnimatorConfigKey(CONFIG, `  ${CUSTOM}  `),
  'surrounding whitespace must not fork the key — a stray newline in the ' +
    'textarea would otherwise queue a whole second render',
)

/* -- 3. resolveScenePrompt is the single decision point --------------------- */

assert.deepEqual(
  resolveScenePrompt(null),
  { prompt: SCENE_ANIMATOR_PROMPT, isOverridden: false },
  'no override means the shared default',
)

assert.deepEqual(
  resolveScenePrompt({
    sourceHash: SOURCE_HASH,
    prompt: '   ',
    negativePrompt: null,
    updatedAt: new Date(),
  }),
  { prompt: SCENE_ANIMATOR_PROMPT, isOverridden: false },
  'a whitespace-only override is not an override',
)

assert.deepEqual(
  resolveScenePrompt({
    sourceHash: SOURCE_HASH,
    prompt: CUSTOM,
    negativePrompt: null,
    updatedAt: new Date(),
  }),
  { prompt: CUSTOM, isOverridden: true },
)

/* -- 4. wiring: the override must actually reach a render ------------------- */

const enqueue = read('server/api/scene-animator/enqueue.post.ts')

assert.ok(
  /resolveScenePrompt\(/.test(enqueue) && /promptString:\s*prompt/.test(enqueue),
  'enqueue.post.ts must resolve the per-source prompt and send it. Storing an ' +
    'override no render reads is worse than not having the feature.',
)

assert.ok(
  /sceneAnimatorDedupeKey\(source\.hash,\s*config,\s*promptKey\)/.test(enqueue),
  'enqueue.post.ts must key the dedupe on the resolved prompt, or an edited ' +
    'prompt is skipped as a duplicate of the old result',
)

const listing = read('server/api/scene-animator/index.get.ts')
assert.ok(
  /isPromptOverridden/.test(listing) &&
    /sceneAnimatorDedupeKey\(source\.hash,\s*config,\s*promptKey\)/.test(listing),
  'index.get.ts must report the prompt AND key on it. If the listing keys ' +
    'differently from the enqueue, a card shows the wrong job for its prompt.',
)

/* -- 5. the hash is never taken from the request ---------------------------- */

const endpoint = read('server/api/scene-animator/prompt.put.ts')

assert.ok(
  /readSceneAnimatorSource\(/.test(endpoint),
  'prompt.put.ts must derive the source hash by reading the file',
)
assert.ok(
  !/body\.(sourceHash|hash)/.test(endpoint),
  'prompt.put.ts must never accept a caller-supplied source hash — the hash ' +
    'is the override primary key, so a supplied one retargets another ' +
    "operator's prompt, and skips the path-containment checks",
)
assert.ok(
  /requireAdminApiUser\(/.test(endpoint),
  'prompt.put.ts must stay admin-gated',
)

/* -- 6. the operator can reach it, and drafts survive a refresh ------------- */

const page = read('pages/admin/scene-animator.vue')
const store = read('stores/sceneAnimatorStore.ts')

assert.ok(
  /savePrompt\(source\)/.test(page) && /promptDrafts/.test(page),
  'the card must offer a prompt editor backed by a local draft',
)
assert.ok(
  !/store\.sources\[[^\]]*\]\.prompt\s*=/.test(page),
  'drafts must not be written into store.sources — it is replaced wholesale ' +
    'on every poll, so an in-progress edit would vanish mid-sentence',
)
assert.ok(
  /savePrompt/.test(store) && /method: 'PUT'/.test(store),
  'the store must expose savePrompt against the PUT endpoint',
)

console.log(
  '✅ Scene Animator prompt override: default-prompt keys frozen, custom ' +
    'prompts dedupe independently, hash read server-side, editor wired with ' +
    'refresh-safe drafts.',
)
