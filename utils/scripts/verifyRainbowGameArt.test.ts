import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import {
  RAINBOW_ACT_FIVE_ENEMY_SPRITES,
  RAINBOW_ACT_FOUR_ENEMY_SPRITES,
  RAINBOW_ACT_THREE_ENEMY_SPRITES,
  RAINBOW_BOSS_SPRITES,
  RAINBOW_COMMS_SPEAKERS,
  RAINBOW_CUTIN_PILOTS,
  RAINBOW_ENEMY_SPRITES,
  RAINBOW_GUARDIAN_SPRITES,
  RAINBOW_PICKUP_SPRITES,
  RAINBOW_SHIP_SPRITES,
  RAINBOW_STAGE_STRIPS,
  drawRainbowBossSprite,
  drawRainbowCommsPortrait,
  drawRainbowEnemySprite,
  drawRainbowPickupSprite,
  drawRainbowShipSprite,
  drawRainbowStageCard,
  drawRainbowStageStrip,
  drawRainbowSuperCutin,
  rainbowBossSprite,
  rainbowEnemySprite,
  rainbowGuardianSprite,
  rainbowPickupSprite,
  rainbowCommsKey,
  rainbowCommsPortrait,
  rainbowShipSprite,
  rainbowStageCard,
  rainbowStageStrip,
  rainbowSuperCutin,
} from '../arcade/games/rainbowGameArt'
import { PINKWAKE } from '../arcade/games/rainbowPinkwake'
import { MOONJELLY } from '../arcade/games/rainbowMoonjelly'

// Silas, 2026-10-14 PT: "upgrade ship art, and get the pilot portraits for the interstitial talking
// moments." Painted ships and comms portraits are optional decoration: the vector hull stands in until a
// sprite loads, and the fair 6px core marker always draws on top of whichever picture is showing.

const publicFile = (src: string) =>
  new URL(`../../public${src}`, import.meta.url)

assert.equal(
  rainbowShipSprite(0),
  '/rainbow-princess-art/ships/petal-wing.webp',
)
assert.equal(
  rainbowShipSprite(3),
  '/rainbow-princess-art/ships/comet-crown.webp',
)
assert.equal(rainbowShipSprite(4), rainbowShipSprite(0), 'seats wrap')

assert.equal(rainbowCommsKey('Lilt-7'), 'lilt')
assert.equal(rainbowCommsKey('Maribel'), 'maribel')
assert.equal(rainbowCommsKey('Opal (reef radio)'), 'opal', 'first word matches')
assert.equal(rainbowCommsKey('Aurelia'), null)
assert.equal(
  rainbowCommsPortrait('Aurelia'),
  null,
  'unknown speakers keep the text-only box',
)

for (const key of Object.values(RAINBOW_COMMS_SPEAKERS)) {
  const file = publicFile(`/rainbow-princess-art/comms/${key}.webp`)
  assert.ok(existsSync(file), `comms portrait for ${key} is committed`)
  assert.ok(statSync(file).size < 32_000, `${key} portrait stays small`)
}
let painted = 0
for (const key of RAINBOW_SHIP_SPRITES) {
  const file = publicFile(`/rainbow-princess-art/ships/${key}.webp`)
  if (!existsSync(file)) continue
  painted++
  assert.ok(statSync(file).size < 32_000, `${key} sprite stays small`)
}
assert.equal(painted, 4, 'every pilot has a painted ship')

// Headless (no Image): nothing draws and the engine falls back to its vector art.
const g = {} as CanvasRenderingContext2D
assert.equal(drawRainbowShipSprite(g, 0), false)
assert.equal(drawRainbowCommsPortrait(g, 'Maribel', 0, 0, 40), false)

const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
const sprite = engine.indexOf('if (!drawRainbowShipSprite(g, seat))')
const core = engine.indexOf('g.fillRect(-3, -3, 6, 6)', sprite)
assert.ok(
  sprite > 0 && core > sprite,
  'the core marker draws over the ship sprite',
)
assert.match(engine, /drawRainbowCommsPortrait\(\s*g,\s*dialogue\.speaker/)

// Enemies: every kind the engine spawns (the Pinkwake and Moonjelly type unions) has a painted sprite.
const engineKinds = ['rainbowPinkwake', 'rainbowMoonjelly'].flatMap((name) => {
  const source = readFileSync(
    new URL(`../arcade/games/${name}.ts`, import.meta.url),
    'utf8',
  )
  const union = /export type \w+Enemy =([^\n]+)/.exec(source)?.[1] ?? ''
  return [...union.matchAll(/'(\w+)'/g)].map((m) => m[1]!)
})
assert.deepEqual(
  [...engineKinds].sort(),
  [...RAINBOW_ENEMY_SPRITES].sort(),
  'every enemy kind the engine spawns has a sprite',
)
for (const kind of RAINBOW_ENEMY_SPRITES) {
  const src = rainbowEnemySprite(kind)!
  assert.equal(src, `/rainbow-princess-art/enemies/${kind}.webp`)
  assert.ok(existsSync(publicFile(src)), `${kind} sprite is committed`)
  assert.ok(statSync(publicFile(src)).size < 32_000, `${kind} stays small`)
}
// Acts III-V's craft are painted ahead of the stages that spawn them.
for (const kind of [
  ...RAINBOW_ACT_THREE_ENEMY_SPRITES,
  ...RAINBOW_ACT_FOUR_ENEMY_SPRITES,
  ...RAINBOW_ACT_FIVE_ENEMY_SPRITES,
]) {
  const src = rainbowEnemySprite(kind)!
  assert.equal(src, `/rainbow-princess-art/enemies/${kind}.webp`)
  assert.ok(existsSync(publicFile(src)), `${kind} sprite is committed`)
  assert.ok(statSync(publicFile(src)).size < 32_000, `${kind} stays small`)
}
assert.equal(rainbowEnemySprite('kraken'), null)
// Each mid-Act guardian has its own painted sprite, keyed larger than the scouts.
for (const kind of RAINBOW_GUARDIAN_SPRITES) {
  const src = rainbowGuardianSprite(kind)!
  assert.equal(src, `/rainbow-princess-art/enemies/guardian-${kind}.webp`)
  assert.ok(existsSync(publicFile(src)), `${kind} guardian sprite is committed`)
  assert.ok(
    statSync(publicFile(src)).size < 48_000,
    `${kind} guardian stays small`,
  )
}
assert.equal(rainbowGuardianSprite('picket'), null)
assert.match(
  engine,
  /if \(!drawRainbowGuardianSprite\(g, guardian\.kind\)\) \{/,
  'guardians fall back to the scaled scout sprite while their own loads',
)
assert.equal(drawRainbowEnemySprite(g, 'picket'), false)
assert.match(
  engine,
  /if \(!drawRainbowEnemySprite\(g, reef\.kind\)\) \{\s+g\.beginPath\(\)/,
  'enemies keep their primitive body until the sprite loads',
)

// Pickups: the engine's Pickup kind union, each with a committed sprite.
const pickupUnion =
  /type Pickup = \{[^}]*kind: ([^}\n]+)/.exec(engine)?.[1] ?? ''
assert.deepEqual(
  [...pickupUnion.matchAll(/'(\w+)'/g)].map((m) => m[1]!).sort(),
  [...RAINBOW_PICKUP_SPRITES].sort(),
  'every pickup kind has a sprite',
)
for (const kind of RAINBOW_PICKUP_SPRITES) {
  const src = rainbowPickupSprite(kind)!
  assert.ok(existsSync(publicFile(src)), `${kind} pickup is committed`)
  assert.ok(
    statSync(publicFile(src)).size < 16_000,
    `${kind} pickup stays small`,
  )
}
assert.equal(rainbowPickupSprite('extra-life'), null)
assert.equal(drawRainbowPickupSprite(g, 'power', 0, 0), false)
assert.match(
  engine,
  /if \(drawRainbowPickupSprite\(g, pickup\.kind, pickup\.x, pickup\.y\)\)\s+continue/,
  'pickups keep the lettered circle until the sprite loads',
)

// Bosses: calm, damaged and enraged pictures for B01, B02, Act III's B03 and, ahead of their Acts, B04 and B05. The fair hit circles and the 36-frame
// telegraph are unchanged; a painted boss still glows and gains a pulsing ring while it warns, and the
// Pearl Seahorse still visibly carries the escape pod the story asks players to rescue.
for (const boss of RAINBOW_BOSS_SPRITES) {
  for (const phase of [1, 2, 3]) {
    const src = rainbowBossSprite(boss, phase)
    assert.equal(src, `/rainbow-princess-art/bosses/${boss}-phase${phase}.webp`)
    assert.ok(
      existsSync(publicFile(src)),
      `${boss} phase ${phase} is committed`,
    )
    assert.ok(
      statSync(publicFile(src)).size < 48_000,
      `${boss} phase ${phase} stays small`,
    )
  }
  assert.equal(rainbowBossSprite(boss, 7), rainbowBossSprite(boss, 3))
}
assert.equal(drawRainbowBossSprite(g, 'b01', 1, 0, 0, 100), false)
assert.match(engine, /drawRainbowBossSprite\(g, 'b01', boss\.phase/)
assert.match(engine, /drawRainbowBossSprite\(\s*g,\s*'b02',\s*moonBoss\.phase/)
assert.match(
  engine,
  /if \(glow\) \{\s+g\.strokeStyle = '#fffbb6'/,
  'B01 telegraph ring',
)
assert.match(
  engine,
  /if \(warn\) \{\s+g\.strokeStyle = '#fff3a2'/,
  'B02 warning ring',
)
assert.match(
  engine,
  /g\.fillText\('POD', podX/,
  'the escape pod is always drawn',
)

// Super cut-ins: a banner for each pilot slides in at the comms position for the length of the burst.
// It may cover the top band only because the super has just cleared every enemy shot.
for (const [seat, key] of RAINBOW_CUTIN_PILOTS.entries()) {
  const src = rainbowSuperCutin(seat)
  assert.equal(src, `/rainbow-princess-art/cutins/${key}.webp`)
  assert.ok(existsSync(publicFile(src)), `${key} cut-in is committed`)
  assert.ok(
    statSync(publicFile(src)).size < 20_000,
    `${key} cut-in stays small`,
  )
}
assert.equal(drawRainbowSuperCutin(g, 0, 0, 0, 48), 0)
assert.match(
  engine,
  /bursts\.push\(\{ seat, x: ship\.x, y: ship\.y, age: 0 \}\)\s+enemyShots\.length = 0/,
  'a super clears every enemy shot before its cut-in covers the comms band',
)
assert.match(engine, /const cut = bursts\[bursts\.length - 1\]/)
assert.match(
  engine,
  /g\.fillRect\(x, commsTop, 270, 52\)/,
  'cut-in sits in the comms band',
)
assert.match(
  engine,
  /\(covers \? 0\.55 : 1\)/,
  'a ship under the cut-in shows through it',
)

// Stage strips: a keyed foreground floor for every stage, drawn before (behind) enemies, shots and ships.
for (const stage of RAINBOW_STAGE_STRIPS) {
  const src = rainbowStageStrip(stage)
  assert.ok(existsSync(publicFile(src)), `${stage} strip is committed`)
  assert.ok(
    statSync(publicFile(src)).size < 120_000,
    `${stage} strip stays small`,
  )
}
assert.equal(drawRainbowStageStrip(g, 's01', 0, 220, 50), false)
const stripAt = engine.indexOf('drawRainbowStageStrip(')
assert.ok(
  stripAt > 0 &&
    stripAt < engine.indexOf('g.translate(reef.x, reef.y)') &&
    stripAt <
      engine.indexOf(
        "for (const bullet of enemyShots) {\n        if (bullet.burst === 'cross'",
      ) &&
    stripAt < engine.indexOf('drawRainbowShipSprite(g, seat)'),
  'the coral strip sits behind enemies, enemy shots and ships',
)

// Act intro splash: each playable Act's painted title card fades in under the opening comms and is
// gone before the first craft can enter, so it never hides a threat.
for (const stage of RAINBOW_STAGE_STRIPS) {
  const src = rainbowStageCard(stage)
  assert.ok(existsSync(publicFile(src)), `${stage} title card is committed`)
}
assert.equal(drawRainbowStageCard(g, 's01', 0, 0, 200), 0)
const introFrames = Number(/const INTRO_FRAMES = (\d+)/.exec(engine)?.[1])
assert.ok(
  introFrames > 0 &&
    introFrames <= PINKWAKE.openingEnds &&
    introFrames <= MOONJELLY.openingEnds,
  'the intro card ends before either Act spawns a craft',
)
assert.match(engine, /drawRainbowStageCard\(g, stage, W \/ 2 - 100, top, 200\)/)

console.log(
  `rainbow game art: ok (${painted}/4 painted ships, ${RAINBOW_ENEMY_SPRITES.length} enemies, ${RAINBOW_PICKUP_SPRITES.length} pickups, ${RAINBOW_BOSS_SPRITES.length} bosses x 3 phases, ${RAINBOW_CUTIN_PILOTS.length} cut-ins, ${RAINBOW_STAGE_STRIPS.length} stage strips and intro cards)`,
)
