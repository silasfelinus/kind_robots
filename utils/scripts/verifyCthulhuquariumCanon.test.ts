// utils/scripts/verifyCthulhuquariumCanon.test.ts
//
// The synced Cthulhuquarium canon (utils/cthulhuquariumCanon.generated.ts,
// written by scripts/sync_cthulhuquarium_canon.mjs) agrees with the economy
// that fires it: every milestone the server can fire has a scene where
// Charlotte appears and a background she hands over, every scene speaks in a
// pose that exists, and every species moves in a motion the renderer knows.

import assert from 'node:assert/strict'
import {
  BESTIARY_MILESTONES,
  FIRST_EVOLUTION_MILESTONE,
  FIRST_FULL_TANK_MILESTONE,
  FIRST_SPOTLESS_TANK_MILESTONE,
  unlockedBackgroundKeys,
} from '../../server/utils/aquariumEconomy'
import { FIRST_RIVALRY_RESOLVED_MILESTONE_ID } from '../../server/utils/aquariumRivalryMilestone'
import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_BARKS,
  CTHULHUQUARIUM_MASS_SPRITES,
  CTHULHUQUARIUM_SCENES,
  CTHULHUQUARIUM_SPECIES,
  CTHULHUQUARIUM_SPRITE_MOTIONS,
} from '../cthulhuquariumCanon.generated'
import { CTHULHUQUARIUM_SCENE_CHOICES } from '../../server/utils/cthulhuquariumBackgrounds.generated'
import { CTHULHUQUARIUM_FLOORS } from '../cthulhuquariumFloors'
import { everyBeat } from '../cthulhuquariumScript'
import { CTHULHUQUARIUM_ART_PROMPTS } from '../cthulhuquariumArtPrompts.generated'
import { isMassSprite, spawnSwimState } from '../cthulhuquariumMotion'
import { buildCthulhuquariumPlaybook } from '../playbook/cthulhuquarium'

const firable = [
  ...BESTIARY_MILESTONES.map((milestone) => milestone.id),
  FIRST_EVOLUTION_MILESTONE.id,
  FIRST_FULL_TANK_MILESTONE.id,
  FIRST_SPOTLESS_TANK_MILESTONE.id,
  FIRST_RIVALRY_RESOLVED_MILESTONE_ID,
]

for (const id of firable) {
  const scene = CTHULHUQUARIUM_SCENES[`milestone_${id}`]
  assert.ok(scene, `milestone ${id} has no Charlotte scene`)
  assert.ok(
    scene.background,
    `milestone ${id}'s scene hands over no background`,
  )
  const background = CTHULHUQUARIUM_BACKGROUNDS.find(
    (entry) => entry.key === scene.background,
  )
  assert.equal(
    background?.unlock,
    id,
    `${scene.background} is not unlocked by ${id}`,
  )
}
console.log(
  `✅ all ${firable.length} firable milestones have a scene and a background`,
)

assert.deepEqual(unlockedBackgroundKeys(new Set()), ['parlour'])
assert.deepEqual(
  unlockedBackgroundKeys(new Set(['bestiary_5', 'first_full_tank'])).sort(),
  ['kelp-stair', 'parlour', 'public-baths'],
)
assert.equal(
  unlockedBackgroundKeys(new Set(firable)).length,
  CTHULHUQUARIUM_BACKGROUNDS.length,
)
console.log(
  '✅ unlockedBackgroundKeys: default always, one more per fired milestone',
)

const POSES: Record<string, string[]> = {
  charlotte: ['welcome', 'delighted', 'presenting', 'confiding', 'lorgnette'],
  wilbur: ['greeting', 'explaining', 'wince', 'hopeful', 'alarmed'],
}
const AWAITS = new Set(['unlock', 'feed', 'clean'])
for (const scene of Object.values(CTHULHUQUARIUM_SCENES)) {
  assert.ok(scene.beats.length > 0, `${scene.id} has no beats`)
  for (const beat of scene.beats) {
    assert.ok(
      POSES[beat.speaker]?.includes(beat.pose),
      `${scene.id}: ${beat.speaker} has no pose ${beat.pose}`,
    )
    if (beat.await)
      assert.ok(
        AWAITS.has(beat.await),
        `${scene.id}: unknown await ${beat.await}`,
      )
  }
}
assert.ok(CTHULHUQUARIUM_SCENES.intro, 'the intro scene exists')
console.log('✅ every beat speaks in a real pose and awaits a real action')

// A beat's own plate only shows before the scene's first focus beat (plates
// stop once the dialogue points at the game), so one placed later is dead.
for (const scene of Object.values(CTHULHUQUARIUM_SCENES)) {
  const firstFocus = scene.beats.findIndex((beat) => beat.focus)
  scene.beats.forEach((beat, index) => {
    if (beat.plate && firstFocus !== -1)
      assert.ok(
        index < firstFocus,
        `${scene.id}: beat ${index} plate ${beat.plate} comes after the first focus beat and would never show`,
      )
  })
}
const introPlates = CTHULHUQUARIUM_SCENES.intro.beats
  .map((beat) => beat.plate)
  .filter(Boolean)
assert.deepEqual(
  introPlates,
  ['charlotte-fishmonger-hero', 'wilbur-stint-hero'],
  'the intro shows each character full-length as they are introduced',
)
console.log(
  '✅ beat plates show before the first focus beat; the intro introduces both characters',
)

const MOTIONS = new Set([
  'tailbeat',
  'undulate',
  'ripple',
  'pulse',
  'sway',
  'breathe',
  'rigid',
])
const slugs = Object.keys(CTHULHUQUARIUM_SPRITE_MOTIONS)
assert.equal(slugs.length, 151, 'every species in the bible declares a motion')
for (const slug of slugs) {
  assert.ok(
    MOTIONS.has(CTHULHUQUARIUM_SPRITE_MOTIONS[slug]!),
    `${slug}: unknown motion`,
  )
}
console.log('✅ all 151 species move in a motion the renderer implements')

// A sprite that already draws the whole group (sprite.mass) swims alone: a
// schooling one would otherwise get packmates, each a copy of the crowd.
assert.ok(
  CTHULHUQUARIUM_MASS_SPRITES.length > 0,
  'the bible marks its mass sprites',
)
for (const slug of CTHULHUQUARIUM_MASS_SPRITES) {
  assert.ok(
    slug in CTHULHUQUARIUM_SPRITE_MOTIONS,
    `${slug}: mass sprite is not a species`,
  )
  assert.ok(isMassSprite(slug), `${slug}: isMassSprite misses it`)
}
assert.ok(
  !isMassSprite('guppy-common'),
  'an ordinary fish is not a mass sprite',
)
assert.ok(
  spawnSwimState('school', 800, 450).packmates.length > 0,
  'a school has packmates',
)
assert.equal(
  spawnSwimState('school', 800, 450, Math.random, { solo: true }).packmates
    .length,
  0,
  'a mass sprite that schools gets no packmates',
)
console.log('✅ mass sprites swim alone, with no copies of the crowd')
// Every tank carries the shop's placard (canon backgrounds.yaml field_note),
// shown in play under the background picker and on Charlotte's handover.
for (const background of CTHULHUQUARIUM_BACKGROUNDS) {
  const note = background.fieldNote
  assert.ok(note?.trim(), `${background.key} has no field note`)
  assert.ok(!note.includes('!'), `${background.key}: field note exclaims`)
  assert.ok(
    (note.match(/[.?]/g) ?? []).length <= 2,
    `${background.key}: field note runs past two sentences`,
  )
}
console.log(
  `✅ all ${CTHULHUQUARIUM_BACKGROUNDS.length} backgrounds carry a field note`,
)

// The canon's Krea 2 prompt for every picture the Playbook Forge lists.
const prompts = CTHULHUQUARIUM_ART_PROMPTS
assert.deepEqual(
  Object.keys(prompts.species).sort(),
  slugs.slice().sort(),
  'every species has its plate prompt',
)
assert.deepEqual(
  Object.keys(prompts.backgrounds).sort(),
  CTHULHUQUARIUM_BACKGROUNDS.map((bg) => bg.key).sort(),
)
assert.deepEqual(
  Object.keys(prompts.scenes).sort(),
  Object.keys(CTHULHUQUARIUM_SCENES).sort(),
)
assert.deepEqual(Object.keys(prompts.characters).sort(), [
  'charlotte-fishmonger',
  'wilbur-stint',
])
const book = buildCthulhuquariumPlaybook()
for (const node of Object.values(book.nodes)) {
  assert.ok(node.artPrompt?.trim(), `${node.key} has no art prompt`)
  assert.ok(node.body.length > 0, `${node.key} has no body text`)
}
assert.equal(book.artPromptsComplete, true)
console.log(
  `✅ all ${Object.keys(book.nodes).length} Forge beats carry body text and a canon prompt`,
)
// --- The descent (cthulhuquarium/t-102/t-103) ------------------------------

for (const scene of Object.values(CTHULHUQUARIUM_SCENES)) {
  assert.ok(scene.title.trim(), `${scene.id} has a Memory Book title`)
  assert.ok(
    scene.floor === null || (scene.floor >= 1 && scene.floor <= 5),
    `${scene.id}: floor is 1-5`,
  )
  assert.ok(
    !/^(first_hatch|first_breed)$/.test(scene.trigger),
    `${scene.id}: breeding and eggs are gone (t-082)`,
  )
}
console.log('✅ every scene has a title and a real floor; no breeding scenes')

for (const floor of CTHULHUQUARIUM_FLOORS) {
  if (!floor.milestoneId) continue
  const scene = CTHULHUQUARIUM_SCENES[`milestone_${floor.milestoneId}`]
  assert.ok(scene, `floor ${floor.floor} has an opening scene`)
  assert.equal(scene!.floor, floor.floor, `${scene!.id} belongs to its floor`)
  const replies = scene!.beats.filter((beat) => beat.choices?.length)
  assert.equal(replies.length, 1, `${scene!.id}: exactly one reply beat`)
  const choices = replies[0]!.choices!
  assert.ok(choices.length >= 2 && choices.length <= 3)
  for (const choice of choices) {
    assert.ok(choice.label.length <= 60, `${choice.id}: a short reply`)
    assert.ok(choice.reply.length >= 1 && choice.reply.length <= 2)
  }
  assert.deepEqual(
    CTHULHUQUARIUM_SCENE_CHOICES[scene!.id],
    choices.map((choice) => choice.id),
    `${scene!.id}: the server knows its reply ids`,
  )
  assert.ok(
    scene!.beats.indexOf(replies[0]!) < scene!.beats.length - 1,
    `${scene!.id}: the scene carries on after the reply`,
  )
  const first = CTHULHUQUARIUM_SCENES[`floor_first_${floor.floor}`]
  assert.ok(first, `floor ${floor.floor} has a first-of-floor scene`)
  assert.equal(first!.trigger, `floor_first:${floor.floor}`)
}
for (const scene of Object.values(CTHULHUQUARIUM_SCENES)) {
  if (scene.floor === null || !scene.id.startsWith('milestone_bestiary_')) {
    assert.ok(
      !scene.beats.some((beat) => beat.choices?.length),
      `${scene.id}: only floor-opening scenes offer a reply`,
    )
  }
}
assert.ok(
  Object.values(CTHULHUQUARIUM_SCENES).some(
    (scene) => scene.trigger === 'finale',
  ),
  'the finale has its scene',
)
console.log('✅ floors II-V open with a reply scene and a first-of-floor scene')

// Every floor can open: enough species live above each threshold.
const tierCounts = [0, 0, 0, 0, 0, 0]
for (const species of Object.values(CTHULHUQUARIUM_SPECIES)) {
  tierCounts[species.tier] = (tierCounts[species.tier] ?? 0) + 1
}
for (const floor of CTHULHUQUARIUM_FLOORS) {
  const above = tierCounts.slice(1, floor.floor).reduce((a, b) => a + b, 0)
  assert.ok(
    floor.floor === 1 || above >= floor.opensAt,
    `floor ${floor.floor} opens at ${floor.opensAt} but only ${above} species live above it`,
  )
}
console.log(
  `✅ every floor is reachable (tiers ${tierCounts.slice(1).join('/')})`,
)

// DESIGN-BRIEF decision 5: nobody mentions Wilbur's injuries, ever. The
// pictures carry them (characters/wilbur-stint.yaml art.floor_variants); the
// words never do.
const INJURY =
  /\b(injur\w*|bandag\w*|plaster(s|ed)?|sling|wound\w*|stitch\w*|bitten|bruis\w*|cast)\b/i
const spoken = [
  ...Object.values(CTHULHUQUARIUM_SCENES).flatMap((scene) =>
    everyBeat(scene).map((beat) => `${scene.id}: ${beat.text}`),
  ),
  ...Object.values(CTHULHUQUARIUM_SCENES).flatMap((scene) =>
    scene.beats.flatMap((beat) =>
      (beat.choices ?? []).map((choice) => `${scene.id}: ${choice.label}`),
    ),
  ),
  ...Object.entries(CTHULHUQUARIUM_BARKS).flatMap(([context, bark]) =>
    bark.lines.map((line) => `${context}: ${line}`),
  ),
]
for (const line of spoken) {
  assert.ok(!INJURY.test(line), `a line mentions an injury: ${line}`)
}
console.log(`✅ ${spoken.length} spoken lines never mention an injury`)

console.log('✅ verifyCthulhuquariumCanon: all assertions passed')
