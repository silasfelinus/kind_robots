// Seed Lander depth pass, slice 2 (conductor kr-arcade/t-070, depth-pass CABINETS.md section 9):
// Meadow Isle and Windmill Downs. Living gardens (sunflower, beanstalk, mushroom, vine), the Plant,
// Deliver and Ring Race missions, gust lanes, windmills, dandelion drift and crow-bots, Old
// Scarecrow and the Gale Mill, the island map, the Pod Shed, golden acorns and medals, and
// progress saved as it is earned (a real keepSave -> withSave -> JSON -> sanitizeSaves -> resume
// round trip). A pilot probe flies the islands' missions and shows runs still end.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderIslands.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { START_PODS, create } from '../arcade/games/seedLander'
import {
  GALE_MILL,
  GaleMill,
  OldScarecrow,
  SCARECROW,
  makeBoss,
} from '../arcade/seedLander/bosses'
import type { Boss } from '../arcade/seedLander/bosses'
import {
  MEDAL,
  UPGRADE_EFFECT,
  freshSave,
  readLanderSave,
  upgradeCost,
} from '../arcade/seedLander/campaign'
import type { LanderSave, Shed } from '../arcade/seedLander/campaign'
import { BUMPY, POD_FEET, newPod } from '../arcade/seedLander/flight'
import type { Pod } from '../arcade/seedLander/flight'
import {
  BEANSTALK,
  BOUNCE,
  bounceSpeed,
  grow,
} from '../arcade/seedLander/gardens'
import {
  CROW,
  FLUFF,
  flyCrow,
  hitsWindmill,
  lanePush,
  newCrow,
  newWindmill,
  spawnFluff,
} from '../arcade/seedLander/hazards'
import {
  ALL_ACORNS,
  ISLANDS,
  MISSIONS_PER_ISLAND,
} from '../arcade/seedLander/islands'
import { freeHazards, freeHill } from '../arcade/seedLander/missions'
import type { MissionSpec } from '../arcade/seedLander/missions'
import type { newCargo } from '../arcade/seedLander/tether'
import { Terrain } from '../arcade/seedLander/terrain'
import type { Pad } from '../arcade/seedLander/terrain'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  save: LanderSave | null | undefined
  menu: { pick: number } | null
  mode: 'free' | 'campaign'
  screen: 'map' | 'shed' | 'soon' | null
  tier: string
  mission: MissionSpec
  terrain: Terrain
  pods: Pod[]
  pod: Pod
  cargo: ReturnType<typeof newCargo>[]
  crows: ReturnType<typeof newCrow>[]
  boss: Boss | null
  phase: 'fly' | 'bonk' | 'dry' | 'clear'
  card: number
  planted: number
  delivered: number
  ring: number
  ringTicks: number
  sunMax: number
  wind: number
  windTarget: number
  island: number
  missionIndex: number
  nectar: number
  shed: Shed
  acorns: Set<string>
  medals: Record<string, number>
  bestHill: number
  shedPick: number
  winchLine: number
  legs: number
  update(input: InputFrame): void
  demoInput(): InputFrame
  startMission(spec: MissionSpec): void
  startHill(hill: number): void
  startCampaignMission(): void
  clearMission(): void
}

const quiet = { play: () => {} }
function game(seed = 1, resume?: unknown): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as unknown as Inner
}
const press = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const hold = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}
const idle = () => emptyInput()
/** A campaign game standing on the map before island `i`, mission `m`. */
function campaign(i = 0, m = 0, seed = 1): Inner {
  const g = game(seed)
  g.update(press('a'))
  assert.equal(g.mode, 'campaign')
  g.island = i
  g.missionIndex = m
  return g
}
/** Fly the next mission from the map, past its card. */
function launch(g: Inner) {
  assert.equal(g.screen, 'map')
  g.update(press('a'))
  assert.equal(g.screen, null)
  g.card = 0
}
/** Set the pod just over a pad and let it touch down at (vx, vy). */
function dropOnto(g: Inner, pad: Pad, vy = 0.1, vx = 0) {
  const pod = g.pod
  pod.restOn = null
  pod.x = (pad.x0 + pad.x1) / 2
  pod.y = pad.y - POD_FEET - 0.05
  pod.vx = vx + pad.vx
  pod.vy = vy + pad.vy
  pod.tilt = 0
  g.update(idle())
}
/** The cabinet's save path: keepSave -> withSave -> JSON -> sanitizeSaves -> resume. */
function roundTrip(save: unknown): unknown {
  const stored = JSON.parse(JSON.stringify(withSave({}, 'seed-lander', save)))
  return sanitizeSaves(stored)['seed-lander']
}
const terrainFor = (pads: MissionSpec['map']['pads']) =>
  new Terrain({
    w: 640,
    h: 260,
    ground: [
      [0, 200],
      [640, 200],
    ],
    pads,
  })

// --- living gardens ----------------------------------------------------------------------------------
{
  const t = terrainFor([
    { id: 'sun', x: 100, w: 30, grows: 'sunflower' },
    { id: 'bean', x: 220, w: 30, grows: 'beanstalk' },
    { id: 'mush', x: 340, w: 30, grows: 'mushroom' },
    {
      id: 'vine',
      x: 460,
      w: 30,
      grows: 'vine',
      reach: [
        [24, -40],
        [-24, -80],
      ],
    },
  ])
  const v0 = t.version
  assert.equal(grow(t, t.pad('sun')!).kind, 'sunflower')
  assert.equal(
    t.pad('sun')!.kind,
    'sun',
    'a sunflower bed becomes a refuelling pad',
  )
  const bean = grow(t, t.pad('bean')!)
  const top = t.pad(bean.made[0]!)!
  assert.equal(top.kind, 'perch')
  assert.equal(top.y, 200 - BEANSTALK.rise, 'a beanstalk raises a tall perch')
  assert.equal(t.floorAt(220, top.y - 10), top.y, 'and it can be stood on')
  grow(t, t.pad('mush')!)
  assert.equal(t.pad('mush')!.kind, 'bounce', 'a mushroom becomes a bouncer')
  const vine = grow(t, t.pad('vine')!)
  assert.equal(vine.made.length, 2, 'a vine climbs as a ladder of perches')
  assert.deepEqual(
    vine.made.map((id) => t.pad(id)!.y),
    [160, 120],
  )
  assert.ok(t.version > v0, 'the island art repaints')
  assert.equal(bounceSpeed(0.3), -BOUNCE.lift)
  assert.ok(bounceSpeed(2) < -2, 'a hard fall bounces harder')

  // In play: a mushroom boings the pod back up, no bonk.
  const g = campaign(1, 2)
  launch(g)
  const mush = g.terrain.pad('mush')!
  dropOnto(g, mush)
  assert.ok(mush.planted && mush.kind === 'bounce')
  g.pod.restOn = null
  g.pod.x = (mush.x0 + mush.x1) / 2
  g.pod.y = mush.y - POD_FEET - 0.05
  g.pod.vy = 1.2
  g.update(idle())
  assert.equal(g.phase, 'fly', 'no bonk on a mushroom, however hard')
  assert.ok(g.pod.vy <= -BOUNCE.lift + 0.02, 'boing')
  // First Bloom: the gold bed grows a sunflower that refuels the pod resting on it.
  const b = campaign(0, 1)
  launch(b)
  const gold = b.terrain.pad('gold')!
  assert.equal(gold.grows, 'sunflower')
  b.pod.sun = 50
  dropOnto(b, gold)
  assert.equal(gold.kind, 'sun')
  for (let i = 0; i < 60; i++) b.update(idle())
  assert.ok(b.pod.sun > 300, 'your own sunflower refuels you')
}

// --- hazards -----------------------------------------------------------------------------------------
{
  const lanes = [{ x0: 0, x1: 100, y0: 50, y1: 80, push: 0.007 }]
  assert.equal(lanePush(lanes, 50, 60), 0.007)
  assert.equal(lanePush(lanes, 50, 90), 0, 'only inside the lane')
  const m = newWindmill({ x: 100, y: 100, r: 50, speed: 0.02 })
  assert.ok(hitsWindmill(m, 140, 100), 'on a sail')
  assert.ok(!hitsWindmill(m, 135, 135), 'between the sails')
  m.angle = Math.PI / 4
  assert.ok(hitsWindmill(m, 135, 135), 'the sail has come round')
  assert.ok(hitsWindmill(m, 100, 100), 'the hub')

  // Dandelion fluff: blows on its beat, sticks, weighs the pod, shakes off with puffing or a hop.
  const field = { x0: 0, x1: 400, y0: 50, y1: 100, every: 10, drift: 0.5 }
  assert.equal(spawnFluff(field, 3, mulberry32(1)), null)
  const f = spawnFluff(field, 10, mulberry32(1))!
  assert.ok(f && f.x === 0 && f.vx > 0)
  const g = campaign(1, 1)
  launch(g)
  g.pod.x = 300
  g.pod.y = 100
  g.pod.vy = 0
  const clean = campaign(1, 1)
  launch(clean)
  clean.pod.x = 300
  clean.pod.y = 100
  clean.pod.vy = 0
  g.mission = { ...g.mission, fluff: [] }
  clean.mission = { ...clean.mission, fluff: [] }
  g.pod.fluff = 4
  for (let i = 0; i < 30; i++) {
    g.update(idle())
    clean.update(idle())
  }
  assert.ok(g.pod.vy > clean.pod.vy + 0.05, 'fluff weighs the pod down')
  for (let i = 0; i < FLUFF.shake * 2 + 1; i++) g.update(hold('up'))
  assert.equal(g.pod.fluff, 2, 'steady puffing shakes it off')
  g.pod.hopCool = 0
  g.update(press('b'))
  assert.equal(g.pod.fluff, 0, 'a hop shakes it all off')

  // Crow-bots: circle, caw (the tell), dive at the quarry's shadow, then rise home.
  const c = newCrow({ x: 100, y: 50 })
  c.cool = 0
  assert.equal(flyCrow(c, { x: 400, y: 150 }), null, 'too far to notice')
  assert.equal(flyCrow(c, { x: 120, y: 150 }), 'caw')
  assert.equal(c.state, 'tell')
  for (let i = 0; i < CROW.tell; i++) flyCrow(c, { x: 120, y: 150 })
  assert.equal(c.state, 'dive')
  assert.ok(c.vy > 0, 'it dives down at the shadow')
  // In play: a dive knocks the pod's lean; at a towed crate it steals a seedling.
  const k = campaign(1, 4)
  launch(k)
  const crow = k.crows[0]!
  k.pod.x = 300
  k.pod.y = 120
  k.pod.vx = 0
  k.pod.vy = 0
  k.pod.tilt = 0
  Object.assign(crow, { state: 'dive', x: 296, y: 120, vx: 1, vy: 0, t: 0 })
  k.update(idle())
  assert.ok(k.pod.tilt > 0.4, 'a crow-bot bumps the lean')
  assert.equal(k.phase, 'fly', 'a bump, not a bonk')
  const crate = k.cargo[0]!
  crate.hookedBy = 0
  crate.x = 300
  crate.y = 160
  Object.assign(crow, { state: 'dive', x: 300, y: 160, vx: 0, vy: 1, t: 0 })
  k.update(idle())
  assert.equal(crate.seedlings, 2, 'it takes a seedling from the towed crate')
  // A resting pod is left alone.
  const r = newCrow({ x: 100, y: 50 })
  r.cool = 0
  assert.equal(flyCrow(r, null), null)
  assert.equal(r.state, 'circle')
}

// --- the bosses ---------------------------------------------------------------------------------------
{
  // Old Scarecrow: his hands wave as pads; both planted is a phase; the last has crows.
  const t = terrainFor([])
  const s = makeBoss('scarecrow', t, 320) as OldScarecrow
  assert.ok(s instanceof OldScarecrow)
  assert.equal(s.pads.length, 2)
  const before = s.pads.map((p) => p.y)
  for (let i = 0; i < 60; i++) s.update()
  assert.notDeepEqual(
    s.pads.map((p) => p.y),
    before,
    'his hands wave',
  )
  assert.ok(
    s.pads.every((p) => p.live),
    'moving pads',
  )
  s.pads[0]!.planted = true
  assert.equal(s.planted(), false, 'one hand is not a phase')
  s.pads[1]!.planted = true
  assert.equal(s.planted(), true)
  assert.equal(s.phase, 1)
  assert.ok(
    s.pads.every((p) => !p.planted),
    'a new phase, both hands bare again',
  )
  assert.ok(SCARECROW.wave[1]! > SCARECROW.wave[0]!, 'he waves faster')
  s.pads.forEach((p) => (p.planted = true))
  s.planted()
  assert.equal(s.phase, 2)
  let blocked = 0
  for (let i = 0; i < 400; i++) {
    s.update()
    if (s.pads.some((p) => p.blocked)) blocked++
  }
  assert.ok(blocked > 100 && blocked < 400, 'crows come and go on his hands')
  assert.ok(s.hits(320, SCARECROW.shoulderY - 26), 'his head bonks')

  // In play: landing on a hand with a crow on it bonks; planting both hands moves him on.
  const g = campaign(0, 5)
  launch(g)
  const boss = g.boss as OldScarecrow
  assert.ok(boss instanceof OldScarecrow)
  g.update(idle())
  const [left, right] = boss.pads
  dropOnto(g, left!)
  assert.equal(g.pod.restOn, left!.id, 'landed on his moving hand')
  for (let i = 0; i < 30; i++) {
    g.update(idle())
    assert.equal(g.pod.y, left!.y - POD_FEET, 'riding the hand')
  }
  dropOnto(g, right!)
  assert.equal(boss.phase, 1, 'both hands: phase 2')
  assert.equal(g.pod.restOn, null, 'he tosses the pod off as he waves faster')
  boss.phase = 2
  for (let i = 0; i < 400 && !right!.blocked; i++) g.update(idle())
  for (let i = 0; i < 5; i++) g.update(idle())
  assert.ok(right!.blocked, 'a crow perches')
  dropOnto(g, right!)
  assert.equal(g.phase, 'bonk', 'a crow was sitting there')

  // The Gale Mill: platforms on the sail tips, slowest at the top; the wind turns each phase.
  const m = makeBoss('galemill', terrainFor([]), 400) as GaleMill
  assert.ok(m instanceof GaleMill)
  m.angle = -Math.PI / 2
  const atTop = m.turnSpeed()
  m.angle = -Math.PI / 2 + Math.PI / 4
  assert.ok(
    m.turnSpeed() > atTop * 5,
    'the sails crawl over the top of the turn',
  )
  m.angle = -Math.PI / 2
  m.update()
  const topPad = [...m.pads].sort((a, b) => a.y - b.y)[0]!
  assert.ok(
    topPad.y < GALE_MILL.hubY - GALE_MILL.sail + 1,
    'a platform rides the top',
  )
  const wind0 = m.wind!
  m.pads[0]!.planted = true
  assert.equal(m.planted(), false)
  m.pads[1]!.planted = true
  assert.equal(m.planted(), true)
  assert.ok(Math.sign(m.wind!) !== Math.sign(wind0), 'the wind reverses')
  m.planted()
  m.planted()
  assert.equal(m.phase, 2)
  assert.ok(GALE_MILL.turn[2]! < 0, 'the last phase spins the other way')
  m.planted()
  m.planted()
  assert.ok(m.done)
  assert.ok(m.hits(400, GALE_MILL.hubY), 'the hub bonks')
  const arm = GALE_MILL.sail / 2
  m.angle = 0
  assert.ok(m.hits(400 + arm, GALE_MILL.hubY), 'an arm bonks')
}

// --- the islands' data ---------------------------------------------------------------------------------
{
  assert.ok(ISLANDS.length >= 2)
  for (const isle of ISLANDS) {
    assert.equal(isle.missions.length, MISSIONS_PER_ISLAND)
    assert.equal(
      isle.missions.at(-1)!.kind,
      'boss',
      `${isle.id} ends with a boss`,
    )
    for (const m of isle.missions) {
      const t = new Terrain(m.map)
      for (const c of m.cargo ?? [])
        assert.ok(
          t.pad(c.to)?.kind === 'drop',
          `${m.id}: cargo goes to a drop pad`,
        )
      if (m.kind === 'plant')
        assert.ok(
          t.pads.filter((p) => p.kind === 'seed').length >= m.seeds,
          `${m.id}: enough beds`,
        )
      for (const r of m.rings ?? [])
        assert.ok(r.x > 0 && r.x < m.map.w && r.y > 0 && r.y < t.groundAt(r.x))
      for (const a of m.acorns ?? [])
        assert.ok(
          a.y < t.groundAt(a.x) - 8,
          `${m.id}: acorn ${a.id} in the air`,
        )
    }
  }
  const kinds = new Set(ISLANDS.flatMap((i) => i.missions.map((m) => m.kind)))
  for (const k of ['plant', 'deliver', 'rings', 'boss'])
    assert.ok(kinds.has(k as never))
  const names = ISLANDS.flatMap((i) => i.missions.map((m) => m.name))
  assert.ok(names.includes('FIRST BLOOM') && names.includes('POLLEN POST'))
  assert.equal(new Set(ALL_ACORNS).size, ALL_ACORNS.length)
  assert.equal(
    ALL_ACORNS.length,
    3 * ISLANDS.length,
    'three golden acorns an island',
  )
  const grows = new Set(
    ISLANDS.flatMap((i) =>
      i.missions.flatMap((m) => m.map.pads.map((p) => p.grows)),
    ),
  )
  for (const k of ['sunflower', 'beanstalk', 'mushroom', 'vine'])
    assert.ok(grows.has(k as never), `some bed grows a ${k}`)
  // Free Flight fields the new hazards on the 4-hill ladder.
  assert.deepEqual(freeHazards(9).slice(2), ['windmill'])
  assert.ok((freeHill(9, mulberry32(3)).windmills?.length ?? 0) >= 1)
  assert.ok((freeHill(13, mulberry32(3)).fluff?.length ?? 0) === 1)
  assert.ok((freeHill(17, mulberry32(3)).crows?.length ?? 0) >= 1)
  assert.equal(freeHill(8, mulberry32(3)).windmills?.length, 0)
}

// --- missions: deliver, rings ------------------------------------------------------------------------
{
  // Hay Run: two crates delivered clear it.
  const g = campaign(0, 3)
  launch(g)
  assert.equal(g.mission.kind, 'deliver')
  const barn = g.terrain.pad('barn')!
  for (const c of g.cargo) {
    c.x = (barn.x0 + barn.x1) / 2
    c.y = barn.y - c.r - 2
    c.vy = 0.2
    c.resting = false
  }
  for (let i = 0; i < 60 && g.delivered < 2; i++) g.update(idle())
  assert.equal(g.delivered, 2)
  assert.equal(g.phase, 'clear', 'both crates in: the mission is done')
  // Petal Rings: through each in order; the clock runs out otherwise.
  const r = campaign(0, 4)
  launch(r)
  const rings = r.mission.rings!
  for (const ring of rings.slice(0, 2)) {
    r.pod.x = ring.x
    r.pod.y = ring.y
    r.pod.vy = -0.011
    r.update(idle())
  }
  assert.equal(r.ring, 2)
  r.pod.x = rings[4]!.x
  r.pod.y = rings[4]!.y
  r.update(idle())
  assert.equal(r.ring, 2, 'out of order does not count')
  r.ringTicks = 1
  r.pod.x = 100
  r.pod.y = 60
  r.update(idle())
  assert.equal(r.phase, 'dry', 'time up')
  for (let i = 0; i < 200 && r.phase === 'dry'; i++) r.update(idle())
  assert.equal(r.ring, 0, 'the rings are back')
  assert.equal(r.lives, START_PODS - 1)
}

// --- initial checkpoint recovery --------------------------------------------------------------------
{
  for (const earned of ['acorn', 'plant'] as const) {
    const g = campaign()
    launch(g)
    if (earned === 'acorn') {
      const a = g.mission.acorns!.find((a) => a.id === 'meadow-a1')!
      assert.ok(a, 'the real first mission carries the authored acorn')
      Object.assign(g.pod, { x: a.x, y: a.y, vx: 0, vy: 0, tilt: 0 })
      g.update(idle())
      assert.ok(g.acorns.has(a.id))
    } else {
      dropOnto(
        g,
        g.terrain.pads.find((p) => p.kind === 'seed')!,
      )
      assert.equal(g.planted, 1)
      assert.equal(
        g.phase,
        'fly',
        'partial planting has not cleared the mission',
      )
    }
    const saved = g.save!
    assert.ok(saved.nectar > 0)
    assert.equal(saved.island, 0)
    assert.equal(saved.mission, 0)
    for (const button of ['a', 'start'] as const) {
      const resumed = game(7, roundTrip(saved))
      resumed.update(press(button))
      assert.equal(
        resumed.nectar,
        saved.nectar,
        `${earned}: first-checkpoint Continue retains nectar`,
      )
      assert.deepEqual([...resumed.acorns], saved.acorns)
      assert.equal(resumed.screen, 'map')
      launch(resumed)
      assert.equal(resumed.mission.id, 'meadow-1')
      assert.equal(
        resumed.score,
        saved.score,
        'resume uses the mission-start score',
      )
      const again = game(8, roundTrip(resumed.save))
      again.update(press(button))
      assert.equal(
        again.nectar,
        saved.nectar,
        'repeated Continue retains earnings',
      )
    }
    const free = game(9, roundTrip(saved))
    free.update(press('down')) // New Replanting is the second row.
    free.update(press('down')) // Free Flight is the third row.
    free.update(press('a'))
    assert.equal(free.mode, 'free')
    free.startHill(6)
    const afterFree = game(10, roundTrip(free.save))
    afterFree.update(press('a'))
    assert.equal(afterFree.mode, 'campaign')
    assert.equal(
      afterFree.nectar,
      saved.nectar,
      'Free Flight leaves the campaign checkpoint intact',
    )
    assert.equal(afterFree.bestHill, 6)
    assert.deepEqual([...afterFree.acorns], saved.acorns)
    const fresh = game(11, roundTrip(saved))
    fresh.update(press('down'))
    fresh.update(press('a'))
    assert.equal(
      fresh.nectar,
      0,
      'explicit New Replanting still resets campaign resources',
    )
    assert.deepEqual(
      [...fresh.acorns],
      saved.acorns,
      'new campaign retains permanent acorns',
    )
  }
}

// The marker covers even an empty first checkpoint; legacy resources recover old saves.
{
  const started = campaign()
  assert.equal(started.save?.campaignStarted, true)
  const again = game(1, roundTrip(started.save))
  again.update(press('start'))
  assert.equal(again.screen, 'map')
  assert.equal(again.save?.campaignStarted, true)
  const legacy: Record<string, unknown> = {
    ...freshSave(),
    nectar: 5,
    acorns: ['meadow-a1'],
  }
  delete legacy.campaignStarted
  const old = game(2, roundTrip(legacy))
  old.update(press('a'))
  assert.equal(old.nectar, 5, 'legacy first-mission nectar is not reset')
  assert.ok(old.acorns.has('meadow-a1'))
  for (const marker of [undefined, false]) {
    const profile = {
      ...freshSave(),
      campaignStarted: marker,
      bestHill: 6,
      acorns: ['meadow-a1'],
      medals: { 'meadow-1': 7 },
    }
    const free = game(3, roundTrip(profile))
    free.update(press('down'))
    free.update(press('a'))
    assert.equal(
      free.mode,
      'free',
      'profile-only history does not insert Continue',
    )
    assert.equal(free.save?.campaignStarted, false)
    assert.equal(free.save?.bestHill, 6)
  }
  for (const campaignStarted of ['true', 1, null, {}, []])
    assert.equal(
      readLanderSave({ ...freshSave(), campaignStarted }, 2, 6),
      null,
      'untrusted checkpoint marker must be a boolean',
    )
}

// --- the campaign, the shed, saves --------------------------------------------------------------------
{
  // A new replanting: the map, then mission 1; each clear saves the next mission.
  const g = game(1)
  assert.equal(g.menu?.pick, 0)
  g.update(press('a'))
  assert.equal(g.screen, 'map', 'the island map first')
  assert.equal(g.save?.island, 0)
  launch(g)
  assert.equal(g.mission.id, 'meadow-1')
  const beds = g.terrain.pads.filter((p) => p.kind === 'seed')
  dropOnto(g, beds[0]!)
  const nectar = g.nectar
  assert.ok(nectar >= 1, 'a planting earns nectar')
  assert.equal(g.save?.nectar, nectar, 'and it is saved at once')
  dropOnto(g, beds[1]!)
  assert.equal(g.phase, 'clear')
  assert.equal(g.save?.mission, 1, 'the next mission is the resume point')
  const medals = g.save!.medals['meadow-1']!
  assert.ok(medals & MEDAL.feather, 'all Feathers: the Feather medal, saved')
  for (let i = 0; i < 300 && !g.screen; i++) g.update(idle())
  assert.equal(g.screen, 'map')
  assert.equal(g.missionIndex, 1)

  // Quit mid-mission with an acorn just found: it is kept.
  launch(g)
  g.mission = { ...g.mission, acorns: [{ id: 'meadow-a1', x: 300, y: 80 }] }
  g.pod.x = 300
  g.pod.y = 80
  g.update(idle())
  assert.ok(g.acorns.has('meadow-a1'))
  const resumed = game(2, roundTrip(g.save))
  assert.equal(resumed.menu?.pick, 0)
  resumed.update(press('a'))
  assert.equal(resumed.mode, 'campaign', 'continue')
  assert.equal(resumed.screen, 'map')
  assert.equal(resumed.island, 0)
  assert.equal(resumed.missionIndex, 1)
  assert.ok(resumed.acorns.has('meadow-a1'), 'the acorn survived the quit')
  assert.equal(resumed.nectar, g.nectar)
  assert.equal(resumed.medals['meadow-1'], medals)

  // Beat the boss: the island is cleared, saved, and the Pod Shed opens.
  const b = campaign(0, 5)
  b.nectar = 40
  launch(b)
  b.boss!.done = true
  b.clearMission()
  assert.equal(b.save?.island, 1, 'saved past the island the moment it is won')
  assert.equal(b.save?.mission, 0)
  assert.ok(b.save?.cleared.includes(0))
  const quitAtTally = game(3, roundTrip(b.save))
  quitAtTally.update(press('a'))
  assert.equal(
    quitAtTally.island,
    1,
    'quit during the tally: resumes at the next island',
  )
  for (let i = 0; i < 300 && !b.screen; i++) b.update(idle())
  assert.equal(b.screen, 'shed')
  // Buy the sun tank: nectar spent and the upgrade saved.
  const cost = upgradeCost(0)
  const had = b.nectar
  b.update(press('a'))
  assert.equal(b.shed.tank, 1)
  assert.equal(b.nectar, had - cost)
  assert.equal(b.save?.shed.tank, 1)
  assert.equal(b.save?.nectar, had - cost)
  b.update(press('b'))
  assert.equal(b.screen, 'map')
  assert.equal(b.island, 1)
  launch(b)
  assert.equal(b.mission.id, 'downs-1')
  assert.equal(
    b.sunMax,
    Math.round(b.mission.sun * (1 + UPGRADE_EFFECT.tank)),
    'a bigger sun tank',
  )

  // Past the last island this build has: the replanting continues soon.
  const end = campaign(ISLANDS.length - 1, 5)
  launch(end)
  end.boss!.done = true
  end.clearMission()
  for (let i = 0; i < 300 && end.screen !== 'shed'; i++) end.update(idle())
  end.update(press('b'))
  assert.equal(end.screen, 'soon')
  end.update(press('a'))
  assert.ok(end.over)
  const later = readLanderSave(
    roundTrip(end.save),
    ISLANDS.length,
    MISSIONS_PER_ISLAND,
  )
  assert.equal(later?.island, ISLANDS.length, 'saved, waiting for more islands')

  // Game over keeps the place; a run from it starts the score afresh.
  const lost = campaign(0, 2)
  launch(lost)
  lost.score = 5000
  lost.lives = 1
  lost.pod.x = 100
  lost.pod.y = lost.terrain.groundAt(100) - POD_FEET - 0.05
  lost.pod.vy = 2
  for (let i = 0; i < 200 && !lost.over; i++) lost.update(idle())
  assert.ok(lost.over)
  assert.equal(lost.save?.mission, 2)
  assert.equal(lost.save?.score, 0)
  assert.equal(lost.save?.lives, START_PODS)

  // Free Flight's best hill is kept too, and new replanting keeps acorns and medals.
  const f = game(4)
  f.update(press('down'))
  f.update(press('a'))
  assert.equal(f.mode, 'free')
  f.startHill(6)
  assert.equal(f.save?.bestHill, 6)
  const back = game(
    5,
    roundTrip({ ...f.save, acorns: ['meadow-a2'], medals: { 'meadow-1': 7 } }),
  )
  assert.equal(back.bestHill, 6)
  back.update(press('a'))
  assert.equal(back.mode, 'campaign')
  assert.ok(back.acorns.has('meadow-a2') && back.medals['meadow-1'] === 7)

  // Junk saves are refused.
  assert.equal(readLanderSave(null, 2, 6), null)
  assert.equal(readLanderSave({ ...freshSave(), v: 2 }, 2, 6), null)
  assert.equal(readLanderSave({ ...freshSave(), island: 9 }, 2, 6), null)
  assert.equal(readLanderSave({ ...freshSave(), lives: 0 }, 2, 6), null)
  assert.equal(readLanderSave({ ...freshSave(), tier: 'turbo' }, 2, 6), null)
  const odd = readLanderSave(
    { ...freshSave(), shed: { tank: 9, legs: 1 }, acorns: ['ok', 'BAD!', 5] },
    2,
    6,
  )!
  assert.equal(odd.shed.tank, 0)
  assert.equal(odd.shed.legs, 1)
  assert.deepEqual(odd.acorns, ['ok'])
}

// --- the Pod Shed's effects ----------------------------------------------------------------------------
{
  const g = campaign(0, 0)
  g.shed = { tank: 0, legs: 2, gyros: 0, lamp: 0, winch: 3 }
  launch(g)
  assert.equal(g.legs, BUMPY + 2 * UPGRADE_EFFECT.legs, 'springier legs')
  assert.ok(g.winchLine > 30, 'a longer line')
  const f = game(1)
  f.update(press('down'))
  f.update(press('a'))
  f.shed = { tank: 3, legs: 3, gyros: 3, lamp: 3, winch: 3 }
  assert.equal(f.legs, BUMPY, 'Free Flight flies the pod as built')
  // Gyros: lean faster.
  const gy = campaign(0, 0)
  gy.shed = { tank: 0, legs: 0, gyros: 3, lamp: 0, winch: 0 }
  launch(gy)
  const plain = campaign(0, 0)
  launch(plain)
  for (const x of [gy, plain]) {
    x.pod.y = 60
    x.update(hold('right'))
    x.update(hold('right'))
  }
  assert.ok(gy.pod.tilt > plain.pod.tilt, 'steadier gyros lean faster')
}

// --- the pilot probe ----------------------------------------------------------------------------------
{
  // The pilot flies every Meadow Isle mission before the boss (pods topped up) ...
  const cleared: string[] = []
  for (let m = 0; m < 5; m++) {
    const g = campaign(0, m, 3)
    launch(g)
    for (let t = 0; t < 60 * 60 * 12 && !g.screen; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    if (g.screen) cleared.push(g.mission.id)
  }
  assert.ok(
    cleared.length >= 4,
    `the pilot clears Meadow Isle (${cleared.join(' ')})`,
  )
  // ... and, flying the campaign on real pods, its runs end.
  const run = game(9)
  run.update(press('a'))
  let t = 0
  for (; t < 60 * 60 * 40 && !run.over; t++) run.update(run.demoInput())
  assert.ok(run.over, 'a real campaign run ends')
  assert.ok(
    run.save && run.save.island + run.save.mission > 0,
    'and its progress is kept',
  )
  void newPod
}

console.log('seed lander slice 2 ok')
