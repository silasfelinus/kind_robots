// /utils/scripts/verifySceneAnimatorPrompt.test.ts
//
// The motion direction is tuned for motion, reaches the renderer, and is shown
// to the operator from one source of truth.
//
// WHAT WENT WRONG WITHOUT THIS.
//
// 1. The first prompt asked for "subtle coherent motion ... only plausible
//    ambient movement, gentle secondary motion, and stable cinematic camera
//    behavior" and got precisely that (Silas, 2026-09-11, on the first real
//    batch: "the animations are pretty lackluster ... minimal movement").
//    Every hedge was a vote against motion. A prompt that reacquires them is
//    the same bug, so the hedges are named here rather than left to review.
//
// 2. The same batch invented a miniature figure on a Segway riding across the
//    Humboldt Scoop Solutions dog logo. Subject integrity is what stops that,
//    and it is exactly what a "make it more dynamic" retune is tempted to
//    drop -- so both halves are pinned together, deliberately.
//
// 3. pages/admin/scene-animator.vue reproduced the whole prompt as literal HTML
//    in its "Automatic motion direction" panel. Nothing connected the two
//    copies, so editing the prompt would have left the operator reading the old
//    text while a different one was sent. That is the failure this file is most
//    useful against, because it is invisible: both halves keep working, they
//    just stop agreeing.
//
//   npx tsx utils/scripts/verifySceneAnimatorPrompt.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  SCENE_ANIMATOR_NEGATIVE_PROMPT,
  SCENE_ANIMATOR_PROMPT,
} from '../../utils/sceneAnimatorPrompt.js'

const PAGE = 'pages/admin/scene-animator.vue'
const ENQUEUE = 'server/api/scene-animator/enqueue.post.ts'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')

/* -- 1. the prompt asks for motion, not for restraint ----------------------- */

const prompt = SCENE_ANIMATOR_PROMPT.toLowerCase()

// The exact hedges that produced the lackluster batch. Each one told WAN to do
// less; together they told it to do almost nothing.
for (const hedge of [
  'subtle',
  'gentle',
  'only plausible',
  'ambient movement',
  'stable cinematic camera',
]) {
  assert.ok(
    !prompt.includes(hedge),
    `SCENE_ANIMATOR_PROMPT must not reacquire the hedge "${hedge}" — that ` +
      `phrasing is what produced near-frozen clips on the first batch`,
  )
}

// Silas: "if there is a figure, they should be animated, wink, smile, laugh".
for (const performance of ['blink', 'smile', 'wink', 'laugh']) {
  assert.ok(
    prompt.includes(performance),
    `SCENE_ANIMATOR_PROMPT must name "${performance}" — naming the expression ` +
      `is what gets a figure to act rather than sit still`,
  )
}

assert.ok(
  /\bdeliberate\b|\bclear\b/.test(prompt),
  'SCENE_ANIMATOR_PROMPT must ask for motion in plain terms',
)

/* -- 2. ...without loosening subject integrity ------------------------------ */

assert.ok(
  /\bpreserve\b|\bunchanged\b/.test(prompt),
  'SCENE_ANIMATOR_PROMPT must still require subjects be preserved',
)

assert.ok(
  /\badded\b|\bdo not add\b|\bno character\b/.test(prompt),
  'SCENE_ANIMATOR_PROMPT must still forbid inventing new subjects. Dropping ' +
    'this while chasing dynamism is how the Segway rider got onto the HSS logo.',
)

/* -- 3. the negative prompt covers both failure modes ----------------------- */

const negative = SCENE_ANIMATOR_NEGATIVE_PROMPT.toLowerCase()

assert.ok(
  /static|still frame|frozen|motionless/.test(negative),
  'the negative prompt must push against stillness',
)
assert.ok(
  /additional characters|extra people|new objects/.test(negative),
  'the negative prompt must push against invented subjects',
)

/* -- 4. it actually reaches the renderer ------------------------------------ */

const enqueue = read(ENQUEUE)

assert.ok(
  /negativePrompt:\s*SCENE_ANIMATOR_NEGATIVE_PROMPT/.test(enqueue),
  `${ENQUEUE} must send SCENE_ANIMATOR_NEGATIVE_PROMPT. It shipped as ` +
    `negativePrompt: '' — a tuned negative prompt no job carries is inert.`,
)

/*
 * The enqueue no longer names the constant directly: resolveScenePrompt() is
 * the single place that chooses between a source's own direction and the
 * shared default, and it returns SCENE_ANIMATOR_PROMPT for the default case.
 * What must stay true is that the prompt comes from that decision rather than
 * from a literal pasted into the route.
 */
assert.ok(
  /promptString:\s*prompt\b/.test(enqueue) && /resolveScenePrompt\(/.test(enqueue),
  `${ENQUEUE} must send the prompt resolved by resolveScenePrompt()`,
)

assert.ok(
  !new RegExp(`promptString:\\s*['"\`]`).test(enqueue),
  `${ENQUEUE} must not inline a prompt literal — that is a second copy of the ` +
    `direction, free to drift from the shared one`,
)

/* -- 5. the operator is shown the real thing, not a stale copy -------------- */

const page = read(PAGE)

assert.ok(
  /\{\{\s*SCENE_ANIMATOR_PROMPT\s*\}\}/.test(page),
  `${PAGE} must render SCENE_ANIMATOR_PROMPT by reference. It previously ` +
    `inlined the full text as HTML, which silently goes stale the first time ` +
    `the prompt is tuned — the operator reads one direction while another is ` +
    `sent.`,
)

// The specific stale copy that was there, and any re-paste of the live one.
assert.ok(
  !page.includes('Bring this still scene naturally to life'),
  `${PAGE} still contains the retired prompt text verbatim`,
)
assert.ok(
  !page.includes(SCENE_ANIMATOR_PROMPT.slice(0, 60)),
  `${PAGE} inlines the current prompt text. Interpolate the constant instead, ` +
    `or this drifts again on the next tune.`,
)

/* -- 6. the still/motion pair is shown whole, not cropped ------------------- */
//
// Silas, 2026-09-11: "I can't see the entire image on the display." The cards
// pair a square source against a square clip inside an aspect-video box, so
// object-cover ate the top and bottom of both.

assert.ok(
  !/aspect-video[^"]*"[\s\S]{0,400}?object-cover/.test(page),
  `${PAGE} must not use object-cover inside the aspect-video preview boxes — ` +
    `it crops square sources, which is most of the animate folder. Use ` +
    `object-contain so the whole frame is visible.`,
)

assert.equal(
  (page.match(/size-full object-contain/g) || []).length,
  3,
  `${PAGE} must fit all three previews (source still, video result, image ` +
    `result) — cropping any one of them breaks the comparison the card exists for`,
)

console.log(
  '✅ Scene Animator prompt: motion-forward without losing subject integrity, ' +
    'negative prompt wired, admin surface reads the live constant, previews uncropped.',
)
