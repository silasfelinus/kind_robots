import assert from 'node:assert/strict'
import {
  CLUE_CHAINS,
  CLUE_RECEIPTS,
  DEPARTMENTS,
  ENDINGS,
  JOB_TITLES,
  advance,
  choose,
  currentCard,
  descend,
  clueChainFor,
  endingLines,
  lockReason,
  newRun,
} from '../shiftingDesks/rules'

const visited = new Set<string>()
for (const clue of CLUE_CHAINS) {
  const key = clue.department + '/' + clue.card + '/' + clue.choice
  assert.ok(!visited.has(key), key + ' appears twice')
  visited.add(key)
  assert.equal(clue.on, 'success')
  assert.ok(clue.message.length > 50 && clue.hint.length > 20)
  const source = DEPARTMENTS.find((d) => d.department.id === clue.department)
  const card = source?.encounters.find((c) => c.id === clue.card)
  const choice = card?.choices.find((c) => c.id === clue.choice)
  assert.ok(choice, key + ': source choice exists')
  assert.equal(
    choice.requires?.flag,
    undefined,
    key + ': source is not itself flag-gated',
  )
  assert.ok(
    choice.cost.suspicion || Object.values(choice.cost).some((v) => v < 0),
  )
  const [targetId, targetChoiceId] = clue.target.split('/')
  const destination = DEPARTMENTS.find((d) =>
    d.encounters.some((c) => c.id === targetId),
  )
  const target = destination?.encounters.find((c) => c.id === targetId)
  const gated = target?.choices.find((c) => c.id === targetChoiceId)
  assert.ok(gated, key + ': target exists')
  assert.equal(
    gated.requires?.flag,
    clue.grants,
    key + ': unlock matches the original gate',
  )
  assert.ok(
    (destination?.department.order ?? 0) >= (source?.department.order ?? 0),
    key + ': target must not be on an earlier floor',
  )

  if (destination?.department.id === source?.department.id) {
    const originSlot = source!.locations.findIndex((loc) =>
      loc.encounter_ids.includes(clue.card),
    )
    const targetSlot = destination!.locations.findIndex((loc) =>
      loc.encounter_ids.includes(targetId!),
    )
    assert.ok(
      originSlot >= 0 && targetSlot > originSlot,
      key + ': same-floor source must be drawn before its gated payoff',
    )
  }

  const fresh = newRun('clue-path-' + key, JOB_TITLES[0]!.id)
  const prepared = {
    ...fresh,
    department: clue.department,
    deck: [clue.card],
    position: 0,
    flags: clue.requires_flag ? [clue.requires_flag] : [],
    meters: { ...fresh.meters, forms: 8 },
  }
  assert.equal(clueChainFor(prepared, choice!)?.target, clue.target)
  if (clue.requires_flag) {
    assert.equal(
      clueChainFor({ ...prepared, flags: [] }, choice!),
      null,
      key + ': optional prerequisite must be genuinely required',
    )
  }
  assert.equal(
    clueChainFor(
      { ...prepared, flags: [...prepared.flags, clue.grants] },
      choice!,
    ),
    null,
    key + ': no duplicate award',
  )
  const beforeTarget = {
    ...prepared,
    department: destination!.department.id,
    deck: [targetId!],
    position: 0,
  }
  assert.ok(lockReason(beforeTarget, gated!), key + ': target starts locked')

  let success = false
  let failure = !choice!.roll
  for (let seed = 1; seed <= 350 && (!success || !failure); seed++) {
    const after = choose({ ...prepared, rng: seed * 7919 }, choice!.id)
    assert.ok(after.pending, key + ': legal source choice resolves')
    if (after.pending.success) {
      success = true
      assert.ok(after.flags.includes(clue.grants), key + ': grants earned clue')
      assert.ok(
        after.pending.events.includes(clue.message),
        key + ': narrated clue',
      )
      if (clue.replace_success_text)
        assert.equal(after.pending.text, clue.replace_success_text)
      const unlocked = {
        ...after,
        pending: null,
        status: 'playing' as const,
        department: destination!.department.id,
        deck: [targetId!],
        position: 0,
        meters: { ...after.meters, forms: 8 },
      }
      assert.equal(lockReason(unlocked, gated!), null, key + ': target unlocks')
    } else {
      failure = true
      assert.ok(
        !after.flags.includes(clue.grants),
        key + ': failure cannot unlock',
      )
      assert.ok(!after.pending.events.includes(clue.message))
    }
  }
  assert.ok(success && failure, key + ': success and failure both verified')

  const receipt = CLUE_RECEIPTS.find(
    (r) => r.flag === gated?.success.add_flags[0],
  )
  assert.ok(receipt, key + ': final decision has a callback')
  const epilogue = endingLines(
    {
      ...fresh,
      flags: [receipt!.flag],
      department: DEPARTMENTS.at(-1)!.department.id,
      status: 'complete',
    },
    ENDINGS.find((e) => e.kind === 'board')!,
  )
  assert.ok(
    epilogue.includes(receipt!.text) ||
      ENDINGS.some((e) =>
        e.variants.some((v) => v.when_flag === receipt!.flag),
      ),
    key + ': verdict remembers the choice without inventing it',
  )
}

// A real dealt Orientation board must allow the receipt to be signed before
// the opt-out can be stapled. Do not "prove" reachability by injecting a flag.
let naturalPolicyPayoff = false
for (let i = 0; i < 3000 && !naturalPolicyPayoff; i++) {
  let run = newRun('policy-replay-' + i, JOB_TITLES[0]!.id)
  if (
    run.deck[0] !== 'exit-interview-first' ||
    run.deck[2] !== 'the-red-stapler'
  )
    continue
  run = advance(choose(run, 'sign-the-exit-form'))
  assert.ok(run.flags.includes('read-the-policy'))
  const mid = currentCard(run)!
  const midChoice = mid.card.choices.find((c) => !lockReason(run, c))!
  run = advance(choose(run, midChoice.id))
  assert.equal(currentCard(run)?.card.id, 'the-red-stapler')
  const optOut = currentCard(run)!.card.choices.find(
    (c) => c.id === 'cite-the-policy',
  )!
  assert.equal(lockReason(run, optOut), null)
  const filed = choose(run, optOut.id)
  assert.ok(filed.pending)
  assert.ok(filed.flags.includes('opted-out-of-leaving'))
  assert.ok(filed.pending.text.includes('PAL changes your status'))
  naturalPolicyPayoff = true
}
assert.ok(
  naturalPolicyPayoff,
  'a natural seed permits the earned policy opt-out',
)

// A player who moves Dale to Toy Division deserves a reunion rather than
// another independent one-in-eight draw. The pardon then buys a later
// nonviolent option in Wellness. Location closure still takes precedence.
for (let i = 0; i < 24; i++) {
  const fresh = newRun('dale-replay-' + i, JOB_TITLES[0]!.id)
  const toys = descend({
    ...fresh,
    department: 'records',
    status: 'department-complete',
    flags: ['sent-dale-to-toys'],
  })
  assert.equal(toys.department, 'toy-division')
  assert.ok(
    toys.deck.includes('the-squeak-tester'),
    'a promised Toy Division encounter reaches the actual deck',
  )
  const wellness = descend({
    ...toys,
    department: 'toy-division',
    status: 'department-complete',
    flags: ['sent-dale-to-toys', 'dale-forgave-the-transfer'],
  })
  assert.equal(wellness.department, 'wellness')
  assert.ok(
    wellness.deck.includes('the-two-quiet-rooms'),
    'Dale can appear in the Wellness trust dilemma',
  )
  const room = DEPARTMENTS.find(
    (d) => d.department.id === 'wellness',
  )!.encounters.find((e) => e.id === 'the-two-quiet-rooms')!
  const reconciliation = room.choices.find(
    (c) => c.id === 'tap-the-squeak-rhythm',
  )!
  assert.equal(
    lockReason(wellness, reconciliation),
    null,
    'Dale trust route is actionable after the pardon',
  )
}

assert.equal(CLUE_CHAINS.length, 9)
assert.equal(CLUE_RECEIPTS.length, 9)
console.log(
  'Shifting Desks: nine earned alternative secret routes verified, including original gate, failures and ending callbacks',
)
