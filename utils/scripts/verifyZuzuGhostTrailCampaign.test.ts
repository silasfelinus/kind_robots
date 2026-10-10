// Ghost Trail's campaign contract (conductor kr-arcade t-015): the book of acts is well formed, every
// relic is reachable, encounters are finite (a defeated squad member never returns, through deaths
// and checkpoint retries), and the last act ends in the credits, not a death.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import { create, readSave } from '../arcade/games/zuzuGhostTrail'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { ACTS, RELIC_COUNT, STAGES } from '../arcade/ghostTrail/campaign'
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
  assert.ok(groundAt(act, act.length), `${act.id}: the exit is on ground`)
  for (const c of act.checkpoints)
    assert.ok(
      groundAt(act, c + 4),
      `${act.id}: checkpoint ${c} stands on ground`,
    )
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
assert.equal(lost.over, true)
assert.equal(lost.won, false, 'defeat never grants a victory')

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
  // A game over keeps the trail but marks the save so the score starts again.
  resumed.card = null
  resumed.lives = 0
  resumed.dead = 1
  resumed.update(emptyInput())
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
