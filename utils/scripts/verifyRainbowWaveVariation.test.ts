import assert from 'node:assert/strict'
import { RAINBOW_LANES } from '../arcade/games/rainbowFormations'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import {
  RAINBOW_WAVE_MIRROR_Y,
  rainbowVariationSeed,
  rainbowVariedY,
  rainbowWaveMirrored,
} from '../arcade/games/rainbowWaveVariation'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-065, round-1 gameplay critic D9 ("the seed changes nothing"). A run's seed now mirrors
// whole authored waves across the lane band. Same seed, same run; another seed, another run; every wave
// keeps its kinds, count, timing and spacing; the attract demo and scripted scenarios keep authored lanes.

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

// 1. The rule itself: pure, about half the waves, and a mirror stays inside the band.
{
  const band = [RAINBOW_LANES.top, RAINBOW_LANES.top + RAINBOW_LANES.span]
  let mirrored = 0
  let total = 0
  for (let seed = 1; seed <= 40; seed++)
    for (let act = 1; act <= 9; act++)
      for (let wave = 0; wave < 40; wave++) {
        const once = rainbowWaveMirrored(seed * 7919, act, wave)
        assert.equal(once, rainbowWaveMirrored(seed * 7919, act, wave))
        if (once) mirrored++
        total++
      }
  const share = mirrored / total
  assert.ok(share > 0.4 && share < 0.6, `mirror share ${share.toFixed(3)}`)
  for (let lane = 0; lane <= 1; lane += 0.05) {
    const y = RAINBOW_LANES.top + lane * RAINBOW_LANES.span
    const flipped = 2 * RAINBOW_WAVE_MIRROR_Y - y
    assert.ok(flipped >= band[0]! - 1e-9 && flipped <= band[1]! + 1e-9)
  }
  // Two members of one wave flip together, so the gap between them is kept.
  for (let wave = 0; wave < 30; wave++) {
    const a = rainbowVariedY(70, 99, 3, wave)
    const b = rainbowVariedY(130, 99, 3, wave)
    assert.equal(Math.abs(a - b), 60)
  }
  assert.equal(
    rainbowVariationSeed(() => 0),
    0,
  )
  assert.equal(
    rainbowVariationSeed(() => 0.5),
    0x80000000,
  )
}

// 2. In the engine: record every wave member as it enters Act I.
type Entry = { frame: number; kind: string; y: number; wave: number }
function entries(
  seed: number,
  extra: { demo?: boolean; authored?: boolean } = {},
) {
  const game = createRainbowPrincessPreview({
    players: 1,
    demo: extra.demo ?? false,
    rng: seeded(seed),
    sound: { play() {} },
    hiScore: 0,
    ...(extra.authored ? { rainbowAuthoredWaves: true } : {}),
  })
  const out: Entry[] = []
  let prev = game.snapshot.enemies
  let firstHit = Infinity
  const ship0 = () => game.snapshot.ships[0]!
  for (let frame = 0; frame < 2400; frame++) {
    const input = emptyInput()
    // Hold the ship in the far top-left corner so the flight is the same whatever the lanes.
    input.held.up = true
    input.held.left = true
    if (game.snapshot.continueLeft > 0) input.pressed.a = true
    const before = ship0()
    game.update(input, [input])
    const snap = game.snapshot
    if (firstHit === Infinity && ship0().lives < before.lives) firstHit = frame
    for (const enemy of snap.enemies) {
      if (enemy.wave === null || enemy.x < 470) continue
      // Already flying last frame: the same wave and kind, near this lane and further right.
      const old = prev.some(
        (before) =>
          before.wave === enemy.wave &&
          before.kind === enemy.kind &&
          Math.abs(before.y - enemy.y) < 4 &&
          before.x > enemy.x,
      )
      if (!old)
        out.push({ frame, kind: enemy.kind, y: enemy.y, wave: enemy.wave })
    }
    prev = snap.enemies
  }
  return Object.assign(out, { firstHit })
}
const authored = entries(1234, { authored: true })
assert.ok(
  authored.length >= 20,
  `Act I spawned ${authored.length} wave members`,
)
const again = entries(1234)
assert.deepEqual(again, entries(1234), 'the same seed flies the same waves')
// The demo's autopilot flies differently from the parked test ship, so compare lanes wave by wave.
{
  const lanes = (list: Entry[]) => {
    const byWave = new Map<number, number[]>()
    for (const entry of list)
      byWave.set(entry.wave, [
        ...(byWave.get(entry.wave) ?? []),
        Math.round(entry.y),
      ])
    return byWave
  }
  const demo = lanes(entries(1234, { demo: true }))
  const base = lanes(authored)
  let compared = 0
  for (const [wave, ys] of demo) {
    const want = base.get(wave)
    // A continue rewinds to the checkpoint and replays its waves, so compare each wave's first flight.
    if (!want || want.length < ys.length) continue
    // A swimmer drifts with the ship it watches, so allow a few pixels; a mirror moves it much further.
    ys.forEach((y, i) =>
      assert.ok(
        Math.abs(y - want[i]!) <= 3,
        `the attract demo flies wave ${wave} in its authored lanes (${y} vs ${want[i]})`,
      ),
    )
    compared++
  }
  assert.ok(compared >= 5, `compared ${compared} demo waves`)
}

const layouts = new Set<string>()
for (const seed of [1234, 7, 42, 2026, 31337]) {
  // Compare the flights up to the parked ship's first lost life; a continue rewinds and replays waves.
  const fullVaried = entries(seed)
  const fullReference = entries(seed, { authored: true })
  const cut = Math.min(fullVaried.firstHit, fullReference.firstHit)
  const group = (list: Entry[]) => {
    const groups = new Map<string, number[]>()
    for (const entry of list)
      if (entry.frame < cut) {
        const key = `${entry.frame}:${entry.wave}:${entry.kind}`
        groups.set(key, [...(groups.get(key) ?? []), entry.y])
      }
    return groups
  }
  const varied = group(fullVaried)
  const reference = group(fullReference)
  assert.ok(
    reference.size >= 10,
    `seed ${seed}: ${reference.size} spawn groups before the first lost life`,
  )
  assert.deepEqual(
    [...varied.keys()],
    [...reference.keys()],
    'every wave member enters on its authored frame',
  )
  const close = (a: number[], b: number[]) =>
    a.length === b.length &&
    [...a]
      .sort((x, y) => x - y)
      .every((y, i) => Math.abs(y - [...b].sort((x, y) => x - y)[i]!) <= 3)
  const flips = new Map<number, boolean>()
  for (const [key, ys] of reference) {
    const wave = Number(key.split(':')[1])
    const got = varied.get(key)!
    const mirror = ys.map((y) => 2 * RAINBOW_WAVE_MIRROR_Y - y)
    const kept = close(got, ys)
    const flipped = close(got, mirror)
    assert.ok(kept || flipped, `wave ${wave} at ${got} vs authored ${ys}`)
    if (kept !== flipped) {
      const known = flips.get(wave)
      if (known !== undefined)
        assert.equal(flipped, known, `wave ${wave} flips as one`)
      flips.set(wave, flipped)
    }
  }
  layouts.add(
    [...varied.values()].map((ys) => ys.map(Math.round).join('/')).join(','),
  )
}
assert.ok(
  layouts.size >= 4,
  `five seeds fly ${layouts.size} different Act I layouts`,
)

console.log(
  `rainbow wave variation: ok (Act I ${authored.length} wave members; 5 seeds, ${layouts.size} layouts; same-seed replay exact; demo authored)`,
)
