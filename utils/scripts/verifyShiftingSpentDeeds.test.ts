import assert from 'node:assert/strict'
import {
  DECK_V6,
  SPENDABLE_DEEDS,
  V6_CARDS,
  activeV6Card,
  choiceLock,
  choiceSpends,
  deedHeld,
  newJourneyV6,
  validateDeckV6,
  type JourneyStateV6,
  type V6Choice,
} from '../shiftingLands/deckV6'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import { canChooseTrial, trialForLand } from '../shiftingLands/authoredBosses'
import { canChooseTrialV7, trialForLandV7 } from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'
import { sameReplay } from '../shiftingLands/saveLedger'
import {
  newJourneyLedgerV6,
  restoreJourneyLedgerV6,
  stepJourneyLedgerV6,
  type JourneyLedgerV6,
} from '../shiftingLands/saveLedgerV6'
import {
  newJourneyLedgerV7,
  restoreJourneyLedgerV7,
  stepJourneyLedgerV7,
  type JourneyLedgerV7,
} from '../shiftingLands/saveLedgerV7'
import {
  newJourneyLedgerV8,
  restoreJourneyLedgerV8,
  stepJourneyLedgerV8,
  type JourneyLedgerV8,
} from '../shiftingLands/saveLedgerV8'
import {
  newJourneyLedgerV9,
  restoreJourneyLedgerV9,
  stepJourneyLedgerV9,
  type JourneyLedgerV9,
} from '../shiftingLands/saveLedgerV9'
import { authoredEndingV7 } from '../shiftingLands/endingsV7'

// zuzu-shifting-lands/t-049: a spent deed stays spent. Medicine and a favor
// owed open their routes once per acquisition, close after they are used, and
// reopen only when a later outcome hands you another. Saves made before t-049
// still load: they replay under the rules they were played by, then adopt
// spent deeds from their next outcome on.

const runs = Number(process.argv[2] ?? 600)
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const SPENDABLE = Object.keys(SPENDABLE_DEEDS)
const cardById = new Map(V6_CARDS.map((card) => [card.id, card]))

// The rule table, pinned. The deck file is untouched, so its fingerprint and
// schemaVersion stay at 1 and no save is turned away for a version change.
assert.deepEqual(validateDeckV6(), [], 'V6 deck content contract')
assert.equal(DECK_V6.schemaVersion, 1, 'spent deeds leave the deck version')
assert.deepEqual(SPENDABLE.sort(), ['deed-carries-medicine', 'deed-owed-favor'])
const spenders = V6_CARDS.flatMap((card) =>
  card.choices
    .filter((choice) => choiceSpends(card.id, choice).length)
    .map(
      (choice) =>
        `${card.id}/${choice.id}:${choiceSpends(card.id, choice).join(',')}`,
    ),
).sort()
assert.deepEqual(spenders, [
  'a-barge-flying-yellow/board-with-your-medicine:deed-carries-medicine',
  'no-fever-past-the-rope/brew-a-fever-draught:deed-carries-medicine',
  'the-bell-in-the-sealed-adit/call-in-what-you-are-owed:deed-owed-favor',
  'the-creditors-tally-sticks/sign-over-a-debt-owed-you:deed-owed-favor',
  'the-guest-book-on-the-lectern/ask-a-friend-to-distract:deed-owed-favor',
  'the-infirmarys-last-cot/give-your-own-medicine:deed-carries-medicine',
  'the-locked-dormitory/call-in-what-you-are-owed:deed-owed-favor',
  'the-red-vial/brew-him-a-sleeping-draught:deed-carries-medicine',
  'the-reed-music/salve-his-salt-burned-feet:deed-carries-medicine',
  'three-bottles-of-tonic/brew-a-real-chest-remedy:deed-carries-medicine',
  'two-cots-one-draught/open-your-own-medicine:deed-carries-medicine',
])
// Every route gated on medicine or a favor spends it, except comparing herbs,
// which is a trade and hands the medicine back on success.
for (const card of V6_CARDS)
  for (const choice of card.choices) {
    const gated = (choice.requires?.anyFlags ?? []).filter((flag) =>
      SPENDABLE.includes(flag),
    )
    if (!gated.length) continue
    const key = `${card.id}/${choice.id}`
    if (key === 'a-cup-offered/compare-herbs-with-her') {
      assert.deepEqual(choiceSpends(card.id, choice), [])
      assert.ok(choice.success.add_flags.includes('deed-carries-medicine'))
    } else assert.deepEqual(choiceSpends(card.id, choice), gated, key)
  }

// Prose that follows a spend never promises the deed is still in hand.
const LEFT_OVER =
  /\b(nearly empty|most of your herbs|most of what you carried|herbs to spare|still owes you|owes you still)\b/i
for (const card of V6_CARDS)
  for (const choice of card.choices)
    if (choiceSpends(card.id, choice).length)
      for (const text of [
        choice.risk,
        choice.success.text,
        choice.failure?.text ?? '',
      ])
        assert.doesNotMatch(text, LEFT_OVER, `${card.id}/${choice.id}`)

// A hand-built road: earn medicine, spend it, find the route closed, earn
// another dose, and find it open again.
type Outcome = JourneyStateV6['outcomes'][number]
const routeOf = (cardId: string, choiceId: string): V6Choice =>
  cardById.get(cardId)!.choices.find((choice) => choice.id === choiceId)!
const outcome = (cardId: string, choiceId: string, flags: string[]) =>
  ({
    locationId: cardById.get(cardId)!.locationId,
    encounterId: cardId,
    choiceId,
    turn: 1,
    roll: null,
    success: true,
    resultText: '',
    hpChange: 0,
    provisionChange: 0,
    flags,
    marks: {},
  }) as Outcome
const MEDICINE = 'deed-carries-medicine'
const giveMedicine = routeOf(
  'the-infirmarys-last-cot',
  'give-your-own-medicine',
)
const brewDraught = routeOf('no-fever-past-the-rope', 'brew-a-fever-draught')
const earned = outcome('shelter-for-the-storm', 'hold-the-lamp-for-her', [
  MEDICINE,
])
const spent = outcome('the-infirmarys-last-cot', 'give-your-own-medicine', [])
const fresh = newJourneyV6(4242)
assert.equal(fresh.spentDeedsFrom, 0, 'new runs spend deeds from the start')
const holding: JourneyStateV6 = {
  ...fresh,
  flags: [MEDICINE],
  outcomes: [earned],
}
assert.ok(deedHeld(holding, MEDICINE))
assert.equal(choiceLock(holding, brewDraught), null, 'medicine opens the route')
const used: JourneyStateV6 = { ...holding, outcomes: [earned, spent] }
assert.ok(!deedHeld(used, MEDICINE), 'medicine given away is gone')
assert.equal(
  choiceLock(used, brewDraught),
  'Already spent. Opens again only if you carry medicine.',
)
assert.ok(choiceLock(used, giveMedicine), 'every medicine route closes')
const restocked: JourneyStateV6 = {
  ...used,
  outcomes: [
    earned,
    spent,
    outcome('fever-bark-at-triple-price', 'lift-a-strip-from-the-jar', [
      MEDICINE,
    ]),
  ],
}
assert.equal(choiceLock(restocked, brewDraught), null, 'a new dose reopens it')
const traded: JourneyStateV6 = {
  ...holding,
  outcomes: [
    earned,
    outcome('a-cup-offered', 'compare-herbs-with-her', [MEDICINE]),
  ],
}
assert.ok(deedHeld(traded, MEDICINE), 'trading herbs keeps your medicine')
const offended: JourneyStateV6 = {
  ...holding,
  outcomes: [earned, outcome('a-cup-offered', 'compare-herbs-with-her', [])],
}
assert.ok(deedHeld(offended, MEDICINE), 'a failed trade spends nothing')
const spentBread: JourneyStateV6 = {
  ...used,
  flags: [MEDICINE, 'deed-shared-bread'],
}
assert.ok(deedHeld(spentBread, 'deed-shared-bread'), 'ordinary deeds stay')
// Before spent deeds applied, the old rule holds, and only for that history.
const legacy: JourneyStateV6 = { ...used, spentDeedsFrom: 3 }
assert.equal(choiceLock(legacy, brewDraught), null)
assert.ok(choiceLock({ ...used, spentDeedsFrom: 2 }, brewDraught))

// The seeded battery. Every run plays the live V9 ledger; the same seeds also
// play with the pre-t-049 rule (a save with no spentDeedsFrom) to show the
// exploit the battery would catch, and that no ending depends on it.
type Policy = 'spender' | 'random' | 'kind' | 'ruthless' | 'certain'
const POLICIES: Policy[] = ['spender', 'random', 'kind', 'ruthless', 'certain']
const TRIAL_ORDER: Record<Policy, string[]> = {
  spender: ['evidence', 'witness', 'confront', 'parley', 'scout'],
  random: [],
  kind: ['solidarity', 'witness', 'evidence', 'parley', 'confront'],
  ruthless: ['coerce', 'tribute', 'confront', 'parley', 'evidence'],
  certain: ['evidence', 'parley', 'confront', 'witness', 'scout'],
}
const rng = (seed: number) => {
  let value = (seed * 2654435761) >>> 0
  return (size: number) => {
    value = (Math.imul(value ^ (value >>> 15), 2246822519) + 1) >>> 0
    return value % size
  }
}
const markScore = (choice: V6Choice, keys: string[]) =>
  keys.reduce(
    (sum, key) =>
      sum +
      ((choice.success.marks as Record<string, number> | undefined)?.[key] ??
        0),
    0,
  )
function pickEncounter(
  cardId: string,
  open: V6Choice[],
  policy: Policy,
  roll: (size: number) => number,
): V6Choice {
  if (policy === 'spender') {
    const spend = open.filter((choice) => choiceSpends(cardId, choice).length)
    if (spend.length) return spend[roll(spend.length)]!
    const grant = open.filter((choice) =>
      choice.success.add_flags.some((flag) => SPENDABLE.includes(flag)),
    )
    if (grant.length) return grant[roll(grant.length)]!
  }
  if (policy === 'kind' || policy === 'ruthless') {
    const keys =
      policy === 'kind' ? ['mercy', 'honesty'] : ['ruthlessness', 'cunning']
    const best = Math.max(...open.map((choice) => markScore(choice, keys)))
    const top = open.filter((choice) => markScore(choice, keys) === best)
    return top[roll(top.length)]!
  }
  if (policy === 'certain') {
    const sure = open.filter((choice) => !choice.roll)
    if (sure.length) return sure[roll(sure.length)]!
  }
  return open[roll(open.length)]!
}

type AnyLedger =
  JourneyLedgerV6 | JourneyLedgerV7 | JourneyLedgerV8 | JourneyLedgerV9
type Driver<L extends AnyLedger> = {
  fresh: (seed: number) => L
  step: (ledger: L, action: Parameters<typeof stepJourneyLedgerV9>[1]) => L
  trials: (ledger: L) => string[]
}
const v6Driver: Driver<JourneyLedgerV6> = {
  fresh: newJourneyLedgerV6,
  step: (ledger, action) =>
    action.type === 'PREPARE' || action.type === 'FOLLOWER'
      ? ledger
      : stepJourneyLedgerV6(ledger, action),
  trials: (ledger) => {
    const journey = ledger.current.journey
    const trial = trialForLand(JOURNEY_WORLD.lands[journey.landIndex]!.id)!
    return trial.choices
      .filter((choice) =>
        canChooseTrial(choice, ledger.current.flags, journey.provisions),
      )
      .map((choice) => choice.id)
  },
}
const v7Trials =
  (resolve: typeof trialForLandV7) =>
  (ledger: JourneyLedgerV7 | JourneyLedgerV8 | JourneyLedgerV9) => {
    const land = JOURNEY_WORLD.lands[ledger.current.journey.landIndex]!
    return resolve(land.id)!
      .choices.filter((choice) =>
        canChooseTrialV7(choice, ledger.current, ledger.prepared),
      )
      .map((choice) => choice.id)
  }
const v7Driver: Driver<JourneyLedgerV7> = {
  fresh: newJourneyLedgerV7,
  step: (ledger, action) =>
    action.type === 'FOLLOWER' ? ledger : stepJourneyLedgerV7(ledger, action),
  trials: v7Trials(trialForLandV7),
}
const v8Driver: Driver<JourneyLedgerV8> = {
  fresh: newJourneyLedgerV8,
  step: (ledger, action) =>
    action.type === 'FOLLOWER' ? ledger : stepJourneyLedgerV8(ledger, action),
  trials: v7Trials(trialForLandV8),
}
const v9Driver: Driver<JourneyLedgerV9> = {
  fresh: newJourneyLedgerV9,
  step: stepJourneyLedgerV9,
  trials: v7Trials(trialForLandV8),
}

// What a save written before t-049 looks like: the same state with no
// spentDeedsFrom, so every gate reads the flag list as the old code did.
function preT049<L extends AnyLedger>(ledger: L): L {
  const { spentDeedsFrom: _drop, ...current } = ledger.current
  return { ...ledger, current } as L
}

type Tally = {
  spends: number
  doubleSpends: number
  closedAfterSpend: number
  reopened: number
  reopenSeen: number
  lockedRefused: number
}
const tally = (): Tally => ({
  spends: 0,
  doubleSpends: 0,
  closedAfterSpend: 0,
  reopened: 0,
  reopenSeen: 0,
  lockedRefused: 0,
})

// An independent reading of the outcome history: per spendable deed, whether
// it is in hand, how often it was spent and granted, and whether any spend
// came without an acquisition since the last one.
function audit(state: JourneyStateV6, row: Tally, enforcedFrom: number) {
  for (const flag of SPENDABLE) {
    let held = false
    let spentOnce = false
    state.outcomes.forEach((result, index) => {
      const card = cardById.get(result.encounterId)!
      const choice = card.choices.find((item) => item.id === result.choiceId)!
      if (choiceSpends(card.id, choice).includes(flag)) {
        row.spends++
        if (!held) {
          row.doubleSpends++
          assert.ok(
            index < enforcedFrom,
            `${flag} spent twice on one acquisition at outcome ${index}`,
          )
        }
        if (spentOnce && held) row.reopened++
        held = false
        spentOnce = true
      }
      if (result.flags.includes(flag)) held = true
    })
    assert.equal(deedHeld(state, flag), held && state.flags.includes(flag))
  }
}

function play<L extends AnyLedger>(
  driver: Driver<L>,
  seed: number,
  policy: Policy,
  rules: 'spent' | 'pre-t049',
  row: Tally,
  stopAfterDoubleSpend = false,
): L {
  const roll = rng(seed * 31 + POLICIES.indexOf(policy))
  let ledger =
    rules === 'spent' ? driver.fresh(seed) : preT049(driver.fresh(seed))
  for (let turn = 0; turn < 160; turn++) {
    const state = ledger.current
    const journey = state.journey
    if (['complete', 'fallen', 'retired'].includes(journey.phase)) break
    let next: L
    if (journey.phase === 'boss') {
      const open = driver.trials(ledger)
      assert.ok(open.length, `seed ${seed}: a trial route stays open`)
      const order = TRIAL_ORDER[policy]
      const preferred = order.find((id) => open.includes(id))
      const choiceId = preferred ?? open[roll(open.length)]!
      next = driver.step(ledger, { type: 'TRIAL', choiceId })
    } else if (journey.active) {
      const card = activeV6Card(state)!
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      assert.ok(open.length, `${card.id} always leaves a way through`)
      for (const choice of card.choices) {
        const deeds = choiceSpends(card.id, choice)
        if (!deeds.length || rules !== 'spent') continue
        const lock = choiceLock(state, choice)
        const spentBefore = state.outcomes.some((result) => {
          const prior = cardById.get(result.encounterId)!
          const route = prior.choices.find(
            (item) => item.id === result.choiceId,
          )!
          return choiceSpends(prior.id, route).some((flag) =>
            deeds.includes(flag),
          )
        })
        if (deeds.some((flag) => deedHeld(state, flag))) {
          if (!choice.cost) assert.equal(lock, null, `${card.id}/${choice.id}`)
          if (spentBefore) row.reopenSeen++
        } else {
          assert.ok(lock, `${card.id}/${choice.id} closes once spent`)
          if (spentBefore) {
            row.closedAfterSpend++
            assert.match(lock!, /^Already spent\. Opens again only if /)
          }
          assert.strictEqual(
            driver.step(ledger, { type: 'CHOOSE', choiceId: choice.id }),
            ledger,
            'a spent deed cannot be spent again',
          )
          row.lockedRefused++
        }
      }
      const pick = pickEncounter(card.id, open, policy, roll)
      next = driver.step(ledger, { type: 'CHOOSE', choiceId: pick.id })
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )
      assert.ok(open.length, 'a non-terminal expedition never stalls')
      next = driver.step(ledger, {
        type: 'TRAVEL',
        locationId: open[roll(open.length)]!,
      })
    }
    assert.notStrictEqual(next, ledger, `seed ${seed} ${policy} never stalls`)
    ledger = next
    if (stopAfterDoubleSpend) {
      const probe = tally()
      audit(ledger.current, probe, Infinity)
      if (probe.doubleSpends) break
    }
  }
  return ledger
}

const spentRows: Tally[] = []
const oldRows: Tally[] = []
const endingsSpent = new Set<string>()
const endingsOld = new Set<string>()
let migratedCount = 0
for (const policy of POLICIES) {
  const spentRow = tally()
  const oldRow = tally()
  for (let seed = 1; seed <= runs; seed++) {
    const ledger = play(v9Driver, seed, policy, 'spent', spentRow)
    audit(ledger.current, spentRow, 0)
    assert.equal(ledger.current.spentDeedsFrom, 0)
    const old = play(v9Driver, seed, policy, 'pre-t049', oldRow)
    audit(old.current, oldRow, Infinity)
    for (const [run, seen] of [
      [ledger, endingsSpent],
      [old, endingsOld],
    ] as const) {
      const ending = authoredEndingV7(run.current, run.trialResults)
      if (ending) seen.add(`${ending.kind}: ${ending.title}`)
    }
    if (seed <= 24) {
      // Exact replay, prose-tolerant restore, forged dice and forged
      // spending rejected, exactly as V6 promised.
      assert.deepEqual(restoreJourneyLedgerV9(clone(ledger)), ledger)
      const reworded = JSON.parse(
        JSON.stringify(ledger, (key, value) =>
          ['text', 'reason', 'resultText'].includes(key)
            ? 'older wording'
            : value,
        ),
      )
      assert.deepEqual(restoreJourneyLedgerV9(reworded), ledger)
      const rolled = ledger.current.outcomes.find((result) => result.roll)
      if (rolled) {
        const forged = clone(ledger)
        forged.current.outcomes.find((result) => result.roll)!.roll!.dice[0] = 7
        assert.equal(restoreJourneyLedgerV9(forged), null, 'forged dice')
      }
      for (const bad of [
        -1,
        0.5,
        '0',
        null,
        ledger.current.outcomes.length + 1,
      ]) {
        const forged = clone(ledger) as unknown as {
          current: { spentDeedsFrom: unknown }
        }
        forged.current.spentDeedsFrom = bad
        assert.equal(
          restoreJourneyLedgerV9(forged),
          null,
          `spentDeedsFrom ${String(bad)} is refused`,
        )
      }
      // Old saves load. The pre-t-049 run replays under its own rules,
      // keeps every recorded outcome, and adopts spent deeds from here on.
      const saved = clone(old)
      assert.ok(!('spentDeedsFrom' in saved.current))
      const restored = restoreJourneyLedgerV9(saved)
      assert.ok(restored, `seed ${seed} ${policy}: an old save still loads`)
      assert.ok(sameReplay(preT049(restored).current, old.current))
      assert.deepEqual(restored.actions, old.actions)
      assert.equal(restored.current.spentDeedsFrom, old.current.outcomes.length)
      assert.deepEqual(restoreJourneyLedgerV9(clone(restored)), restored)
      migratedCount++
    }
  }
  spentRows.push(spentRow)
  oldRows.push(oldRow)
}
const sum = (rows: Tally[], key: keyof Tally) =>
  rows.reduce((total, row) => total + row[key], 0)
assert.equal(sum(spentRows, 'doubleSpends'), 0, 'each deed spent once')
assert.ok(sum(oldRows, 'doubleSpends') > 0, 'the old rule let deeds respend')
assert.ok(sum(spentRows, 'spends') > 50, 'the battery spends deeds')
assert.ok(sum(spentRows, 'closedAfterSpend') > 10, 'spent routes close')
assert.ok(sum(spentRows, 'reopenSeen') > 0, 'a new acquisition reopens')
assert.ok(sum(spentRows, 'reopened') > 0, 'and the new one can be spent')
assert.ok(sum(spentRows, 'lockedRefused') > 10, 'closed routes are refused')
for (const ending of endingsOld)
  assert.ok(
    endingsSpent.has(ending),
    `${ending} is still reachable with spent deeds`,
  )

// Old V6, V7 and V8 saves load too: find a pre-t-049 run that spent one
// medicine or favor twice, save it, restore it with today's code, and see the
// next spend route stay shut.
function migrateOne<L extends AnyLedger>(
  name: string,
  driver: Driver<L>,
  restore: (value: unknown) => L | null,
) {
  for (let seed = 1; seed <= 400; seed++) {
    const old = play(driver, seed, 'spender', 'pre-t049', tally(), true)
    const probe = tally()
    audit(old.current, probe, Infinity)
    if (!probe.doubleSpends) continue
    const restored = restore(clone(old))
    assert.ok(restored, `${name} save from before t-049 loads`)
    assert.ok(sameReplay(preT049(restored).current, old.current))
    assert.equal(restored.current.spentDeedsFrom, old.current.outcomes.length)
    assert.deepEqual(restore(clone(restored)), restored)
    const claimed = clone(old)
    claimed.current.spentDeedsFrom = 0
    assert.equal(
      restore(claimed),
      null,
      `${name}: a double spend cannot be passed off under the new rule`,
    )
    const forgedDice = clone(old)
    const rolled = forgedDice.current.outcomes.find((result) => result.roll)
    if (rolled) {
      rolled.roll!.dice[0] = 7
      assert.equal(restore(forgedDice), null, `${name}: forged dice`)
    }
    for (const flag of SPENDABLE)
      if (!deedHeld(restored.current, flag))
        for (const card of V6_CARDS)
          for (const choice of card.choices)
            if (choiceSpends(card.id, choice).includes(flag))
              assert.ok(
                choiceLock(restored.current, choice),
                `${name}: ${flag} stays spent after migration`,
              )
    return seed
  }
  assert.fail(`${name}: no seeded pre-t-049 run spent a deed twice`)
}
const migrated = [
  migrateOne('V6', v6Driver, restoreJourneyLedgerV6),
  migrateOne('V7', v7Driver, restoreJourneyLedgerV7),
  migrateOne('V8', v8Driver, restoreJourneyLedgerV8),
  migrateOne('V9', v9Driver, restoreJourneyLedgerV9),
]

console.log(
  `Shifting Lands spent deeds passed: ${spenders.length} spending routes; ${runs * POLICIES.length} seeded V9 runs spent ${sum(spentRows, 'spends')} deeds with 0 double spends (the pre-t-049 rule allowed ${sum(oldRows, 'doubleSpends')}), ${sum(spentRows, 'closedAfterSpend')} spent routes closed, ${sum(spentRows, 'reopenSeen')} reopened by a new acquisition (${sum(spentRows, 'reopened')} spent again); ${migratedCount} old V9 saves and old V6/V7/V8/V9 double-spend saves (seeds ${migrated.join('/')}) load and adopt the rule; ${endingsSpent.size} endings reached (${endingsOld.size} under the old rule, none lost)`,
)
