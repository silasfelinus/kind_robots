import assert from 'node:assert/strict'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-033, Silas 2026-10-23 PT: "enemies should move and attack in different ways." The plain
// craft of Acts I-III each swim and fire their own way (WORLD-BIBLE fleet) instead of one leftward drift with a
// sine and an aimed pellet. Flown through the attract demo, which cannot be hit, so every craft gets to act.

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const game = createRainbowPrincessPreview({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
})

type Craft = { kind: string; x: number; y: number }
const seen = {
  loops: 0,
  urchinTurns: 0,
  skimmerRails: 0,
  coralFloor: 0,
  lanternSurges: 0,
}
/** Volleys by the look of their pellets: how many pellets each craft fired on one tick. */
const volleys = new Map<string, number[]>()
let before = game.snapshot
for (let frame = 0; frame < 120000 && before.act !== 'S04'; frame++) {
  game.update(emptyInput())
  const after = game.snapshot
  // Match each craft to itself a frame ago: same kind, nearest, within a few pixels.
  for (const craft of after.enemies as readonly Craft[]) {
    const was = (before.enemies as readonly Craft[])
      .filter((e) => e.kind === craft.kind)
      .sort(
        (a, b) =>
          Math.hypot(a.x - craft.x, a.y - craft.y) -
          Math.hypot(b.x - craft.x, b.y - craft.y),
      )[0]
    if (!was || Math.hypot(was.x - craft.x, was.y - craft.y) > 6) continue
    if (craft.x > 470) continue
    // A spiral scout loops the loop: some frames it drifts back to the right.
    if (craft.kind === 'spiral' && craft.x > was.x) seen.loops++
    // A lantern pulse-swims: surges of well over its base pace.
    if (craft.kind === 'lantern' && was.x - craft.x > 1.6) seen.lanternSurges++
    if (craft.kind === 'skimmer' && craft.x < 300) {
      assert.ok(
        Math.abs(craft.y - 58) < 14 || Math.abs(craft.y - 214) < 14,
        `a skimmer rides the ceiling or the floor (${craft.y.toFixed(1)})`,
      )
      seen.skimmerRails++
    }
    if (craft.kind === 'coral' && craft.x < 280) {
      assert.ok(craft.y > 205, 'a coral drifter settles to the floor')
      seen.coralFloor++
    }
    if (craft.kind === 'urchin') {
      assert.ok(craft.y >= 44 && craft.y <= 226, 'an urchin stays in bounds')
      const turned = before.enemies.some(
        (e) => e.kind === 'urchin' && Math.abs(e.y - craft.y) < 1e-9,
      )
      if (!turned && (craft.y <= 52.0001 || craft.y >= 217.9999))
        seen.urchinTurns++
    }
  }
  const fresh = after.enemyShots.filter(
    (shot) => shot.born === after.tick && shot.look && !shot.ghost,
  )
  const byOrigin = new Map<string, number>()
  for (const shot of fresh) {
    const key = `${shot.look}@${Math.round(shot.x - shot.vx)},${Math.round(shot.y - shot.vy)}`
    byOrigin.set(key, (byOrigin.get(key) ?? 0) + 1)
  }
  for (const [key, count] of byOrigin) {
    const look = key.split('@')[0]!
    volleys.set(look, [...(volleys.get(look) ?? []), count])
  }
  before = after
}
assert.equal(before.act, 'S04', 'the demo flies Acts I-III')

const most = (look: string) => Math.max(0, ...(volleys.get(look) ?? []))
/** Some craft fired exactly `count` pellets of this look on one tick (a boss in the same look may fire more). */
const fired = (look: string, count: number) =>
  (volleys.get(look) ?? []).includes(count)
// Attacks: an urchin fans eight spines, a lantern rings out seven, a spiral scout turns three spokes, a relay
// throws a three-pellet link, a skimmer drops a column of three beads, a picket two, a coral two lobbed shells.
assert.ok(fired('spine', 8), 'an urchin fans eight spines')
assert.equal(most('spine'), 8, 'and never more')
assert.ok(fired('bell', 7), 'a lantern rings out seven')
assert.ok(fired('swirl', 3), 'a spiral scout turns three spokes')
assert.ok(fired('volt', 3), 'a relay or skimmer fires a chain of three')
assert.ok(fired('pearl', 2), 'a picket leads its sidestep')
assert.ok(fired('coral', 2), 'a coral drifter lobs two shells')
// Movement.
assert.ok(seen.loops > 20, `spiral scouts loop the loop (${seen.loops})`)
assert.ok(seen.urchinTurns > 0, 'urchins roll wall to wall')
assert.ok(seen.skimmerRails > 50, 'skimmers ride their rails')
assert.ok(seen.coralFloor > 50, 'coral drifters keep to the floor')
assert.ok(seen.lanternSurges > 20, 'lanterns pulse-swim')

console.log(
  `rainbow craft variety: ok (spine ${most('spine')}, bell ${most('bell')}, swirl ${most('swirl')}, volt ${most('volt')}, pearl ${most('pearl')}, coral ${most('coral')}; ${seen.loops} loop frames, ${seen.urchinTurns} urchin turns, ${seen.lanternSurges} surges)`,
)
