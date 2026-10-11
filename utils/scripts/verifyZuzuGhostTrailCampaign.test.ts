// Ghost Trail's campaign contract (conductor kr-arcade t-015): the book of acts is well formed, every
// relic is reachable, encounters are finite (a defeated squad member never returns, through deaths
// and checkpoint retries), and the last act ends in the credits, not a death. The River Croc ferries
// only once his squad is down, and the abbey's caged novice can be freed, saved and remembered.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import { create, readSave } from '../arcade/games/zuzuGhostTrail'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { parseLoop } from '../arcade/sound'
import {
  ALL_MUSIC,
  BOSS_MUSIC,
  ENDING_MUSIC,
  STAGE_MUSIC,
} from '../arcade/ghostTrail/music'
import {
  ACTS,
  RELIC_COUNT,
  RESCUE_ENDING,
  STAGES,
} from '../arcade/ghostTrail/campaign'
import { FOES } from '../arcade/ghostTrail/foes'
import { BOSSES } from '../arcade/ghostTrail/bosses'
import { groundAt, memberId } from '../arcade/ghostTrail/world'

const FONT = /^[A-Z0-9 .,!?\-+=:/()<>#%_*]*$/

// --- the book is well formed ---------------------------------------------------------------
const ids = new Set<string>()
for (const [i, act] of ACTS.entries()) {
  assert.ok(!ids.has(act.id), `${act.id}: act ids are unique`)
  ids.add(act.id)
  if (i > 0) {
    const prev = ACTS[i - 1]!
    assert.ok(
      act.stage === prev.stage
        ? act.act === prev.act + 1
        : act.stage === prev.stage + 1 && act.act === 1,
      `${act.id}: acts run in order`,
    )
  }
  assert.ok(
    STAGES.some((s) => s.stage === act.stage),
    `${act.id}: its stage has a page`,
  )
  assert.ok(groundAt(act, 40), `${act.id}: Zuzu starts on ground`)
  // A tower act's exit and checkpoints stand on floating stone over the void.
  const floorAt = (x: number) =>
    groundAt(act, x) ||
    act.blocks.some((b) => b.y !== undefined && x >= b.x && x <= b.x + b.w)
  assert.ok(floorAt(act.length), `${act.id}: the exit stands on a floor`)
  for (const c of act.checkpoints)
    assert.ok(floorAt(c + 4), `${act.id}: checkpoint ${c} stands on ground`)
  if (act.boss) {
    assert.ok(BOSSES[act.boss], `${act.id}: boss ${act.boss} has a definition`)
    const arenaL = act.length - 320 + 60
    for (let x = arenaL; x <= act.length; x += 4)
      assert.ok(
        groundAt(act, x),
        `${act.id}: the boss arena has no pits (${x})`,
      )
  }
  const encIds = new Set<string>()
  for (const e of act.encounters) {
    assert.ok(!encIds.has(e.id), `${act.id}/${e.id}: encounter ids are unique`)
    encIds.add(e.id)
    assert.ok(e.squad.length > 0, `${act.id}/${e.id}: squads are not empty`)
    for (const m of e.squad) assert.ok(FOES[m.kind], `${m.kind} is a foe`)
    if (e.title)
      assert.match(e.title, FONT, `${act.id}/${e.id}: title fits the font`)
  }
  for (const line of [act.stageName, act.actName, ...act.intro])
    assert.match(line, FONT, `${act.id}: card text fits the font: ${line}`)
  for (const line of act.intro)
    assert.ok(line.length <= 34, `${act.id}: "${line}" fits the card`)
}
for (const s of STAGES)
  for (const line of [s.name, ...s.outro]) {
    assert.match(line, FONT, `stage ${s.stage}: page text fits the font`)
    assert.ok(line.length <= 34, `stage ${s.stage}: "${line}" fits the page`)
  }

type Run = Omit<ReturnType<typeof create>, 'lives'> & {
  camX: number
  lives: number
  x: number
  y: number
  vy: number
  won: boolean
  invuln: number
  clear: number
  dead: number
  act: (typeof ACTS)[number]
  actIndex: number
  foundSecrets: Set<string>
  defeated: Set<string>
  foes: Array<{
    id: string | null
    hp: number
    x: number
    y: number
    kind: string
  }>
  card: { kind: string } | null
  startAct: (index: number) => void
  respawn: () => void
  checkpoint: number
  banner: { text: string; sub?: string } | null
}

const newRun = (seed = 20261010) =>
  create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as Run

const skipCard = (run: Run) => {
  const press = emptyInput()
  press.pressed.a = true
  for (let i = 0; i < 40 && run.card; i++) run.update(press)
  assert.equal(run.card, null, 'cards can be skipped')
}

// --- every relic is reachable, and only ever pays once -------------------------------------------
const run = newRun()
assert.equal(run.card?.kind, 'title', 'the game opens on the act title card')
for (const [index, act] of ACTS.entries()) {
  run.startAct(index)
  skipCard(run)
  for (const secret of act.secrets) {
    run.invuln = 99999
    run.x = secret.x
    run.y = secret.y + 14
    run.vy = 0
    run.update(emptyInput())
    assert.ok(
      run.foundSecrets.has(secret.id),
      `${act.id}: relic ${secret.id} can be reached`,
    )
    const score = run.score
    run.respawn()
    run.x = secret.x
    run.y = secret.y + 14
    run.update(emptyInput())
    assert.equal(
      run.score,
      score,
      'checkpoint replay never awards a relic twice',
    )
  }
}
assert.equal(run.foundSecrets.size, RELIC_COUNT)

// --- the last gate is the ending, not a death -------------------------------------------------------
run.clear = 1
run.update(emptyInput())
assert.equal(run.won, true, 'the last gate is a victory')
assert.equal(run.over, false, 'the player sees the ending')
assert.equal(run.card?.kind, 'credits', 'the credits roll')
assert.equal(
  (run.card as { heading?: string } | null)?.heading,
  'THE TRUE ENDING',
  'every relic found earns the true ending',
)
const finalScore = run.score
for (let i = 0; i < 60 * 60 && !run.over; i++) run.update(emptyInput())
assert.equal(run.over, true, 'the score screen follows the credits')
assert.equal(run.score, finalScore, 'the ending never re-awards bonuses')

// --- encounters are finite -------------------------------------------------------------------------
const withSquad = ACTS.findIndex((a) => a.encounters.length > 0)
if (withSquad >= 0) {
  const act = ACTS[withSquad]!
  const enc = act.encounters[0]!
  const r = newRun(7)
  r.startAct(withSquad)
  skipCard(r)
  r.invuln = 99999
  r.x = enc.at + 1
  for (let i = 0; i < 200; i++) {
    r.invuln = 99999
    r.update(emptyInput())
  }
  const id = memberId(act, enc, 0)
  assert.ok(
    r.foes.some((f) => f.id === id),
    'the squad appears when Zuzu reaches it',
  )
  // Put the first member down by hand, then die and come back.
  r.defeated.add(id)
  r.foes = r.foes.filter((f) => f.id !== id)
  r.dead = 1
  r.lives = 3
  r.update(emptyInput())
  r.x = enc.at + 1
  for (let i = 0; i < 200; i++) {
    r.invuln = 99999
    r.update(emptyInput())
  }
  assert.ok(
    !r.foes.some((f) => f.id === id),
    'a defeated squad member never returns',
  )
}

// --- defeat is never a victory ----------------------------------------------------------------------
const lost = newRun(1)
skipCard(lost)
lost.lives = 0
lost.dead = 1
lost.update(emptyInput())
assert.equal(lost.over, false, 'a game over offers a continue first')
assert.equal((lost.card as { then?: string } | null)?.then, 'revive')
const rest = emptyInput()
rest.pressed.b = true
for (let i = 0; i < 40 && !lost.over; i++) lost.update(rest)
assert.equal(lost.over, true, 'declining the continue ends the game')
assert.equal(lost.won, false, 'defeat never grants a victory')

// --- a continue gets up again at the last checkpoint, with the trail as it was -----------------------
{
  const r = newRun(12)
  skipCard(r)
  const act = r.act
  const cp = act.checkpoints.filter((c) => c > 40)[1]!
  r.x = cp + 2
  r.update(emptyInput())
  assert.equal(r.checkpoint, cp, 'walking past a checkpoint lights it')
  const score = r.score
  r.lives = 0
  r.dead = 1
  r.update(emptyInput())
  const up = emptyInput()
  up.pressed.a = true
  for (let i = 0; i < 40 && r.card; i++) r.update(up)
  assert.equal(r.card, null)
  assert.equal(r.over, false, 'continuing keeps the run going')
  assert.equal(r.lives, 3, 'with fresh lives')
  assert.equal(r.x, cp, 'from the last checkpoint, not the start of the act')
  assert.equal(
    r.score,
    score,
    'the score stands (the dead it earned stay down)',
  )
  // Ignoring the prompt ends the game after its countdown.
  r.lives = 0
  r.dead = 1
  r.update(emptyInput())
  for (let i = 0; i < 60 * 11 && !r.over; i++) r.update(emptyInput())
  assert.equal(r.over, true, 'an ignored continue runs out')
}

// --- a reload resumes at the last checkpoint, with what was done there still done ----------------------
{
  const r = newRun(14) as Run & { save: unknown }
  skipCard(r)
  const act = r.act
  const enc = act.encounters[0]!
  const gone = memberId(act, enc, 0)
  r.defeated.add(gone)
  const cp = act.checkpoints.filter((c) => c > 40)[1]!
  r.x = cp + 2
  r.update(emptyInput())
  const saved = readSave(r.save)
  assert.equal(saved?.checkpoint, cp, 'reaching a checkpoint saves it')
  assert.ok(saved?.down?.includes(gone), 'and the squad members already down')
  const back = create({
    rng: mulberry32(15),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: JSON.parse(JSON.stringify(r.save)),
  }) as Run
  const yes = emptyInput()
  yes.pressed.a = true
  for (let i = 0; i < 30 && back.card?.kind === 'title' && back.x !== cp; i++)
    back.update(yes)
  assert.equal(back.x, cp, 'continue picks up at the checkpoint')
  assert.ok(back.defeated.has(gone), 'the dead stay down after a reload')
}

// --- the iai cut: a lunge, a great crescent that hits everything in it, and cuts shots ------------------
{
  const r = newRun(16) as Run & {
    weapon: string
    poncho: boolean
    bolts: Array<Record<string, unknown>>
    foes: Array<Record<string, unknown>>
  }
  skipCard(r)
  r.weapon = 'katana'
  r.invuln = 0
  const x0 = 300
  r.x = x0
  r.camX = 180
  r.foes = []
  const ghost = (x: number, y: number) => ({
    kind: 'spirit',
    id: null,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: 3,
    t: 0,
    phase: 'walk',
    baseY: y,
    carrying: null,
    timer: 0,
    face: -1,
  })
  r.foes.push(ghost(x0 + 34, 208), ghost(x0 + 50, 208))
  r.bolts = [
    {
      kind: 'bullet',
      x: x0 + 30,
      y: 194,
      vx: -2.6,
      vy: 0,
      grav: 0,
      life: 80,
      arm: 0,
      hw: 4,
      hh: 2,
      t: 0,
    },
  ]
  const cut = emptyInput()
  cut.pressed.a = true
  r.update(cut)
  for (let i = 0; i < 8; i++) r.update(emptyInput())
  assert.equal(
    r.foes.length,
    0,
    'one cut fells two foes (3 damage each) across its whole crescent',
  )
  assert.equal(
    r.bolts.length,
    0,
    'the edge cuts an incoming bullet out of the air',
  )
  assert.ok(r.x > x0 + 8, 'the quick-draw lunges him forward')
  assert.equal(r.poncho, true, 'and he takes no hit through the stroke')
}

// --- the River Croc: a conditional ally who ferries Zuzu over the croc pool ---------------------------
{
  type Ferry = Run & {
    riding: number | null
    onGround: boolean
    poncho: boolean
    camX: number
    actTick: number
    pending: unknown[]
    bolts: unknown[]
    risen: Map<number, number>
    ferries: Array<{ side: 0 | 1; left: number | null }>
    pickups: Array<{ kind: string }>
    moverPos: (i: number, tick: number) => { x: number; y: number } | null
  }
  const index = ACTS.findIndex((a) => a.movers?.some((m) => m.look === 'croc'))
  assert.ok(index >= 0, 'the River Croc swims somewhere in the book')
  const act = ACTS[index]!
  assert.equal(act.stage, 3, 'in the Drowned Watering Hole')
  const ci = act.movers!.findIndex((m) => m.look === 'croc')
  const croc = act.movers![ci]!
  assert.ok(croc.ferry && croc.needs, 'he is a ferry with a condition')
  const squad = act.encounters.find((e) => e.id === croc.needs)!
  assert.ok(squad, 'the squad he waits on is in his act')
  assert.ok(
    !groundAt(act, croc.x + croc.w / 2) &&
      !groundAt(act, croc.x + croc.dx + croc.w / 2),
    'he swims a channel',
  )
  const r = newRun(31) as Ferry
  r.startAct(index)
  skipCard(r)
  // Up on the bank by the pool: the squad that bothers him springs, and he stays under.
  const calm = () => {
    r.invuln = 99999
    r.bolts = []
  }
  // From the last checkpoint before the pool (the squads behind it are forgiven).
  r.checkpoint = Math.max(...act.checkpoints.filter((c) => c < squad.at))
  r.respawn()
  r.x = croc.x - 4
  r.y = 208
  r.camX = r.x - 120
  for (let i = 0; i < 90; i++) {
    calm()
    r.update(emptyInput())
  }
  r.x = croc.x - 4
  r.y = 208
  assert.ok(
    r.foes.some((f) => f.id?.startsWith(`${act.id}/${squad.id}/`)),
    'the squad on the bank is up',
  )
  assert.equal(r.moverPos(ci, r.actTick), null, 'and the croc stays under')
  // Put the squad down (not all of it yet): still under.
  const down = (n: number) => {
    for (let k = 0; k < n; k++) {
      const id = memberId(act, squad, k)
      r.defeated.add(id)
      r.foes = r.foes.filter((f) => f.id !== id)
    }
  }
  down(squad.squad.length - 1)
  calm()
  r.update(emptyInput())
  assert.equal(r.risen.has(ci), false, 'one left standing keeps him under')
  down(squad.squad.length)
  r.pending = []
  calm()
  r.update(emptyInput())
  assert.ok(r.risen.has(ci), 'with the squad down, he surfaces')
  assert.equal(r.banner?.text, croc.hello, 'with a banner')
  // Walk onto his back: he waits a beat, then carries Zuzu across.
  r.x = croc.x - 4
  r.y = 208
  r.vy = 0
  const right = emptyInput()
  right.held.right = true
  for (let i = 0; i < 20 && r.riding !== ci; i++) {
    calm()
    r.update(right)
  }
  assert.equal(r.riding, ci, 'Zuzu boards the croc')
  assert.notEqual(r.ferries[ci]!.left, null, 'and he pushes off')
  const lives = r.lives
  for (let i = 0; i < croc.period + 60; i++) {
    calm()
    r.foes = []
    r.update(emptyInput())
    assert.equal(r.riding, ci, 'he carries Zuzu the whole way')
    assert.ok(r.y <= 208.5, 'above the water')
  }
  assert.equal(r.ferries[ci]!.side, 1, 'and docks at the far bank')
  assert.ok(r.x > croc.x + croc.dx, 'with Zuzu across the pool')
  assert.ok(
    r.pickups.some((p) => p.kind === croc.gift),
    'leaving him a gift from the riverbed',
  )
  for (let i = 0; i < 60; i++) {
    calm()
    r.foes = []
    r.update(right)
  }
  assert.ok(
    groundAt(act, r.x) && r.y === 208 && r.onGround,
    'Zuzu steps off onto the far bank',
  )
  assert.equal(r.lives, lives, 'the croc never hurts him')
  assert.equal(r.dead, 0)
}

// --- the abbey cage: break the lock, survive the ambush, and the novice walks out with Zuzu ----------
{
  type Cage = Run & {
    weapon: string
    facing: number
    onGround: boolean
    save: unknown
    pending: Array<{ id: string }>
    rescued: Set<string>
    unlocked: Set<string>
    triggered: Set<string>
  }
  const index = ACTS.findIndex((a) => a.captive)
  assert.ok(index >= 0, 'a captive waits somewhere in the book')
  const act = ACTS[index]!
  assert.equal(act.stage, 6, 'in the abbey')
  const cage = act.captive!
  const ambush = act.encounters.find((e) => e.id === cage.ambush)!
  assert.ok(ambush, 'the ambush is in the same act')
  for (const line of [cage.name, ...RESCUE_ENDING]) {
    assert.match(line, FONT, `rescue text fits the font: ${line}`)
    assert.ok(line.length <= 34, `"${line}" fits the page`)
  }
  assert.ok(!groundAt(act, cage.x) || cage.y < 150, 'the cage hangs high')
  const prefix = `${act.id}/${ambush.id}/`
  const hitLock = (weapon: string, seed: number) => {
    const r = newRun(seed) as Cage
    r.startAct(index)
    skipCard(r)
    // The held rooms on the way are cleared already.
    for (const e of act.encounters)
      if (e.lock && e.at < ambush.at)
        e.squad.forEach((_, k) => r.defeated.add(memberId(act, e, k)))
    // On the road below, the ambush never springs while the cage is locked.
    r.x = ambush.at + 30
    r.camX = r.x - 120
    for (let i = 0; i < 30; i++) {
      r.invuln = 99999
      r.update(emptyInput())
    }
    assert.ok(
      !r.triggered.has(ambush.id) &&
        !r.foes.some((f) => f.id?.startsWith(prefix)),
      'a locked cage springs nothing',
    )
    // Up on the loft beside it: any weapon breaks the lock.
    const loft = act.blocks.find(
      (b) => b.y !== undefined && b.x + b.w < cage.x && b.x + b.w > cage.x - 40,
    )!
    assert.ok(loft, 'a loft stands beside the cage')
    r.x = loft.x + loft.w - 6
    r.y = loft.y!
    r.vy = 0
    r.facing = 1
    r.weapon = weapon
    const a = emptyInput()
    a.pressed.a = true
    r.update(a)
    for (let i = 0; i < 20 && !r.unlocked.has(cage.id); i++) {
      r.invuln = 99999
      r.update(emptyInput())
    }
    assert.ok(r.unlocked.has(cage.id), `the ${weapon} breaks the lock`)
    return r
  }
  hitLock('katana', 41)
  const r = hitLock('kunai', 42)
  r.invuln = 99999
  r.update(emptyInput())
  assert.ok(r.triggered.has(ambush.id), 'the broken lock springs the ambush')
  assert.equal(r.banner?.text, ambush.title)
  assert.equal(r.rescued.has(cage.id), false, 'not free while it stands')
  for (let i = 0; i < 200; i++) {
    r.invuln = 99999
    r.update(emptyInput())
  }
  ambush.squad.forEach((_, k) => r.defeated.add(memberId(act, ambush, k)))
  r.foes = r.foes.filter((f) => !f.id?.startsWith(prefix))
  r.pending = r.pending.filter((p) => !p.id.startsWith(prefix))
  r.update(emptyInput())
  assert.ok(r.rescued.has(cage.id), 'with the ambush down, the novice is free')
  assert.equal(r.banner?.text, cage.name)
  assert.ok(!r.foundSecrets.has(cage.id), 'a rescue is not a relic')
  const saved = readSave(r.save)
  assert.ok(saved?.relics.includes(cage.id), 'the rescue is saved')
  // It survives a reload.
  const back = create({
    rng: mulberry32(43),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: JSON.parse(JSON.stringify(r.save)),
  }) as Cage
  const yes = emptyInput()
  yes.pressed.a = true
  for (let i = 0; i < 30 && back.act.id !== act.id; i++) back.update(yes)
  assert.equal(back.act.id, act.id)
  assert.ok(back.rescued.has(cage.id), 'the novice stays free after a reload')
  assert.equal(back.foundSecrets.size, 0, 'and is not counted as a relic')
  // The ending page remembers the novice; without the rescue it does not.
  const ending = (x: Cage) => {
    x.startAct(ACTS.length - 1)
    skipCard(x)
    x.clear = 1
    x.update(emptyInput())
    return (x.card as { lines?: string[] } | null)?.lines ?? []
  }
  const lines = ending(back)
  assert.ok(lines.includes(RESCUE_ENDING[0]!), 'the novice walks out with him')
  const outro = STAGES.find((s) => s.stage === 6)!.outro
  assert.ok(
    lines.indexOf(RESCUE_ENDING[0]!) > lines.indexOf(outro.at(-1)!),
    'after the stage page',
  )
  assert.ok(
    !ending(newRun(44) as Cage).includes(RESCUE_ENDING[0]!),
    'no novice without the rescue',
  )
}

// --- the score: every loop parses with its voices in step; the music follows the game ---------------
for (const loop of ALL_MUSIC) {
  const parsed = parseLoop(loop)
  assert.equal(parsed.length, 64, 'every loop is eight bars of eight steps')
  for (const track of loop.tracks)
    assert.equal(
      track.steps.trim().split(/\s+/).length,
      64,
      'every voice runs the whole loop',
    )
}
{
  const notes: unknown[] = []
  const r = create({
    rng: mulberry32(21),
    sound: { play: () => {}, playNotes: (n) => void notes.push(n) },
    demo: false,
    hiScore: 0,
  }) as Run & { music: unknown; weapon: string }
  skipCard(r)
  assert.equal(r.music, STAGE_MUSIC[r.act.theme], "the world's theme plays")
  const bossAct = ACTS.findIndex((a) => a.boss)
  r.startAct(bossAct)
  skipCard(r)
  r.invuln = 99999
  r.x = r.act.length - 190
  r.camX = r.act.length - 260
  r.update(emptyInput())
  assert.equal(r.music, BOSS_MUSIC, 'a boss brings its theme')
  assert.ok(notes.length > 0, 'the bell tolls through playNotes')
  r.weapon = 'katana'
  const before = notes.length
  const a = emptyInput()
  a.pressed.a = true
  r.update(a)
  assert.ok(notes.length > before, 'the iai cut has its own sound')
  r.clear = 0
  const last = newRun(22) as Run & { music: unknown }
  last.startAct(ACTS.length - 1)
  skipCard(last)
  last.clear = 1
  last.update(emptyInput())
  assert.equal(last.music, ENDING_MUSIC, 'the credits roll to the ending theme')
  const demo = create({
    rng: mulberry32(23),
    sound: { play: () => {} },
    demo: true,
    hiScore: 0,
  }) as Run & { music: unknown }
  assert.equal(demo.music, null, 'the attract demo plays silent')
}

// --- checkpoints are close together and every boss fight restarts at its gate ----------------------
for (const act of ACTS) {
  const end = act.boss ? act.length - 260 : act.length
  const cps = [40, ...act.checkpoints.filter((c) => c > 40)].sort(
    (a, b) => a - b,
  )
  cps.forEach((c, i) => {
    const gap = (cps[i + 1] ?? end) - c
    assert.ok(
      gap <= 1400,
      `${act.id}: checkpoint ${c} is ${gap} px from the next (max 1400)`,
    )
  })
}
{
  const bossAct = ACTS.findIndex((a) => a.boss)
  const r = newRun(13)
  r.startAct(bossAct)
  skipCard(r)
  r.x = r.act.length - 190
  r.camX = r.act.length - 260
  r.update(emptyInput())
  assert.ok(
    r.checkpoint >= r.act.length - 260,
    'reaching the arena lights its gate',
  )
}

// --- save and resume ------------------------------------------------------------------------------
{
  const fresh = newRun(3) as Run & { save: unknown }
  const first = readSave(fresh.save)
  assert.ok(
    first && first.act === ACTS[0]!.id,
    'a new run saves at its first act',
  )
  // A suspended run resumes at the start of its act with the score it began with.
  const later = ACTS[Math.min(2, ACTS.length - 1)]!
  const stored = {
    v: 1,
    act: later.id,
    score: 12_345,
    lives: 2,
    weapon: 'kasa',
    relics: [ACTS[0]!.secrets[0]?.id, 'not-a-relic'],
    continued: false,
  }
  const resumed = create({
    rng: mulberry32(5),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: JSON.parse(JSON.stringify(stored)),
  }) as Run & { save: unknown; weapon: string }
  assert.equal(resumed.card?.kind, 'title', 'a saved run is offered first')
  assert.deepEqual(
    resumed.save,
    readSave(stored),
    'the offer leaves the save alone',
  )
  const press = emptyInput()
  press.pressed.a = true
  for (let i = 0; i < 30 && resumed.actIndex === 0; i++) resumed.update(press)
  assert.equal(resumed.act.id, later.id, 'continue picks up at the saved act')
  assert.equal(resumed.score, 12_345)
  assert.equal(resumed.lives, 2)
  assert.equal(resumed.weapon, 'kasa')
  assert.equal(
    resumed.foundSecrets.size,
    ACTS[0]!.secrets.length ? 1 : 0,
    'unknown relics are dropped',
  )
  // A game over the player declines keeps the trail but marks the save so the score starts again.
  resumed.card = null
  resumed.lives = 0
  resumed.dead = 1
  resumed.update(emptyInput())
  for (let i = 0; i < 40 && !resumed.over; i++) resumed.update(rest)
  const after = readSave(resumed.save)
  assert.ok(after?.continued, 'a game over leaves a continue')
  const cont = create({
    rng: mulberry32(6),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: after,
  }) as Run
  for (let i = 0; i < 30 && cont.actIndex === 0; i++) cont.update(press)
  assert.equal(cont.act.id, later.id)
  assert.equal(cont.score, 0, 'a continue never carries the score')
  assert.equal(cont.lives, 3)
  // A new run instead.
  const declined = create({
    rng: mulberry32(7),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: stored,
  }) as Run & { save: unknown }
  const no = emptyInput()
  no.pressed.b = true
  for (let i = 0; i < 30 && declined.card?.kind === 'title'; i++) {
    declined.update(no)
    if (readSave(declined.save)?.act === ACTS[0]!.id) break
  }
  assert.equal(declined.actIndex, 0, 'B starts a new run')
  assert.equal(
    readSave(declined.save)?.act,
    ACTS[0]!.id,
    'and replaces the save',
  )
  // Junk is ignored; demos never save; the ending unlocks New Game+.
  for (const junk of [
    null,
    7,
    'x',
    { v: 2 },
    { ...stored, act: 'nope' },
    { ...stored, score: -1 },
  ])
    assert.equal(readSave(junk), null)
  const demo = create({
    rng: mulberry32(1),
    sound: { play: () => {} },
    demo: true,
    hiScore: 0,
    resume: stored,
  }) as Run & { save: unknown }
  assert.equal(demo.save, null, 'the attract demo never saves')
  // The clear unlocks New Game+: a fresh, harder run offered next time.
  const plus = readSave((run as Run & { save: unknown }).save)
  assert.equal(plus?.tier, 2, 'the ending unlocks New Game+')
  assert.equal(plus?.act, ACTS[0]!.id)
  assert.equal(plus?.score, 0)
  const ng = create({
    rng: mulberry32(9),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: plus,
  }) as Run & { tier: number }
  assert.equal(ng.card?.kind, 'title', 'New Game+ is offered')
  for (let i = 0; i < 30 && ng.tier === 1; i++) ng.update(press)
  assert.equal(ng.tier, 2, 'accepting starts the harder tier')
  assert.equal(ng.actIndex, 0)
  // The store helpers keep small JSON per slug.
  const rec = withSave({}, 'zuzu-ghost-trail', stored)
  assert.deepEqual(sanitizeSaves(JSON.parse(JSON.stringify(rec))), rec)
  assert.deepEqual(withSave(rec, 'zuzu-ghost-trail', null), {})
  assert.deepEqual(
    withSave({}, 'zuzu-ghost-trail', { big: 'x'.repeat(9000) }),
    {},
  )
}

console.log(
  `Ghost Trail campaign passed: ${ACTS.length} acts, ${RELIC_COUNT} relics`,
)
