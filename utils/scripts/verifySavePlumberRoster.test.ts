import assert from 'node:assert/strict'
import {
  DEFAULT_HEROINE_SEED,
  HEROINE_HITBOX,
} from '../arcade/games/savePlumberHeroine'
import {
  PLUMBER_ROSTER,
  actionPoses,
  rosterFor,
  rosterHeroine,
  rosterIndex,
  rosterPortrait,
  seedForRoster,
} from '../arcade/games/savePlumberRoster'

assert.equal(PLUMBER_ROSTER.length, 8)
assert.equal(new Set(PLUMBER_ROSTER.map((m) => m.key)).size, 8)
assert.equal(new Set(PLUMBER_ROSTER.map((m) => m.name)).size, 8)
assert.equal(new Set(PLUMBER_ROSTER.map((m) => m.build)).size, 8)
assert.ok(
  Math.max(...PLUMBER_ROSTER.map((m) => m.scale)) -
    Math.min(...PLUMBER_ROSTER.map((m) => m.scale)) >=
    0.2,
  'the roster spans clearly different heights',
)

for (const member of PLUMBER_ROSTER) {
  assert.match(
    member.run,
    /^\/images\/arcade\/save-the-plumber\/anim\/heroine-[a-z0-9-]+-run(-v\d+)?\.webp$/,
  )
  assert.match(
    member.actions,
    /^\/images\/arcade\/save-the-plumber\/anim\/heroine-[a-z0-9-]+-actions\.webp$/,
  )
  assert.equal(
    rosterPortrait(member),
    `/images/arcade/save-the-plumber/cast/heroine-${member.key}.webp`,
  )
  for (const frame of Object.values(actionPoses(member)))
    assert.ok(frame >= 0 && frame < 6)
  for (const colour of Object.values(member.look))
    if (colour.startsWith('#')) assert.match(colour, /^#[0-9a-f]{6}$/)
}

assert.equal(rosterHeroine(DEFAULT_HEROINE_SEED).roster, 'pip')
assert.equal(rosterHeroine(DEFAULT_HEROINE_SEED).name, 'Pip')

for (let seed = 0; seed < 64; seed++) {
  const heroine = rosterHeroine(seed * 2654435761)
  assert.equal(rosterFor(heroine).key, heroine.roster)
  assert.equal(heroine.seed, (seed * 2654435761) >>> 0)
}

let draws = 0
const random = () => (draws = (draws * 9301 + 49297) % 233280) / 233280
for (let index = -9; index < 17; index++) {
  const seed = seedForRoster(index, random)
  assert.equal(rosterIndex(seed), ((index % 8) + 8) % 8)
  assert.ok(seed >= 0 && seed <= 0xffffffff)
}
assert.equal(
  seedForRoster(3, () => 0.999999999),
  0xfffffffb,
)

assert.equal(rosterFor({ seed: 0, roster: 'odette' }).name, 'Odette')
assert.deepEqual(HEROINE_HITBOX, { width: 22, height: 27 })

console.log('save the plumber roster: ok')
