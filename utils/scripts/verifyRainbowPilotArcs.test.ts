import assert from 'node:assert/strict'
import {
  RAINBOW_PILOT_ARCS,
  rainbowArcSeat,
  rainbowPilotArcBeat,
} from '../arcade/games/rainbowPilotArcs'
import { RAINBOW_PILOTS } from '../arcade/games/rainbowPilots'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-066, independent story critic S8 (the princesses were interchangeable in the Acts) and S9
// (middle seats barely spoke): after each Act's aftermath, one pilot speaks her own arc beat, and in a crew the beat
// moves through the seats Act by Act.

// Every pilot has a beat for each of the eight Acts, all distinct, each readable at the 96-frame line pace.
const all = new Set<string>()
for (const pilot of RAINBOW_PILOTS) {
  const arc = RAINBOW_PILOT_ARCS[pilot.key]
  assert.equal(arc.length, 8, `${pilot.key} has a beat for each Act`)
  for (const line of arc) {
    assert.ok(line.length <= 92, `${pilot.key}: "${line}" reads in 96 frames`)
    all.add(line)
  }
}
assert.equal(all.size, 32, 'no two beats are the same line')
assert.equal(rainbowPilotArcBeat(9, 'vivi'), null, 'the finale has none')
assert.deepEqual(
  [1, 2, 3, 4, 5].map((act) => rainbowArcSeat(act, 3)),
  [0, 1, 2, 0, 1],
  'the beat moves through a three-pilot crew',
)
assert.deepEqual(
  [1, 2, 3].map((act) => rainbowArcSeat(act, 1)),
  [0, 0, 0],
)

function seeded(seed = 5) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const g = new Proxy({} as Record<string | symbol, unknown>, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'measureText')
      return (text: string) => ({ width: String(text).length * 6 })
    return () => ({ addColorStop() {} })
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D

/** Fly a demo crew through `acts` Acts and record who spoke each Act's arc beat. */
function heardArcs(players: number, acts: number) {
  const game = createRainbowPrincessPreview({
    players,
    demo: true,
    rng: seeded(players),
    sound: { play() {} },
    hiScore: 0,
  })
  const heard = new Map<number, { speaker: string; text: string }>()
  for (let frame = 0; frame < 400000 && heard.size < acts; frame++) {
    game.update(emptyInput())
    if (frame % 8) continue
    game.render(g)
    const shown = game.snapshot.comms
    const act = /^A0([1-8])\.AFTER$/.exec(shown?.id ?? '')?.[1]
    if (!act || !shown) continue
    if (
      Object.values(RAINBOW_PILOT_ARCS).some((arc) => arc.includes(shown.text))
    )
      heard.set(Number(act), { speaker: shown.speaker, text: shown.text })
  }
  return { heard, pilots: game.snapshot.pilots }
}

// Solo: the lead pilot hears her own arc, Act after Act.
{
  const { heard, pilots } = heardArcs(1, 3)
  const lead = RAINBOW_PILOTS[pilots[0]!]!
  for (const act of [1, 2, 3]) {
    const beat = heard.get(act)
    assert.ok(beat, `Act ${act} plays its arc beat`)
    assert.equal(beat.speaker, lead.name.split(' ')[0])
    assert.equal(beat.text, rainbowPilotArcBeat(act, lead.key))
  }
}
// Two pilots: the second seat speaks Act II's beat, so a middle seat is heard.
{
  const { heard, pilots } = heardArcs(2, 2)
  for (const act of [1, 2]) {
    const pilot = RAINBOW_PILOTS[pilots[rainbowArcSeat(act, 2)]!]!
    assert.equal(heard.get(act)?.speaker, pilot.name.split(' ')[0])
    assert.equal(heard.get(act)?.text, rainbowPilotArcBeat(act, pilot.key))
  }
}

console.log(
  'rainbow pilot arcs: ok (32 beats; solo hears her own arc in Acts I-III; the beat moves through a crew)',
)
