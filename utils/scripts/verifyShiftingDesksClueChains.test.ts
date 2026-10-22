import assert from 'node:assert/strict'
import {
  CLUE_CHAINS,
  CLUE_RECEIPTS,
  DEPARTMENTS,
  ENDINGS,
  JOB_TITLES,
  choose,
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
  assert.equal(choice.requires?.flag, undefined, key + ': source is not itself flag-gated')
  assert.ok(choice.cost.suspicion || Object.values(choice.cost).some((v) => v < 0))
  const [targetId, targetChoiceId] = clue.target.split('/')
  const destination = DEPARTMENTS.find((d) =>
    d.encounters.some((c) => c.id === targetId),
  )
  const target = destination?.encounters.find((c) => c.id === targetId)
  const gated = target?.choices.find((c) => c.id === targetChoiceId)
  assert.ok(gated, key + ': target exists')
  assert.equal(gated.requires?.flag, clue.grants, key + ': unlock matches the original gate')
  assert.ok(
    (destination?.department.order ?? 0) >= (source?.department.order ?? 0),
    key + ': target must not be on an earlier floor',
  )

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
    clueChainFor({ ...prepared, flags: [...prepared.flags, clue.grants] }, choice!),
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
      assert.ok(after.pending.events.includes(clue.message), key + ': narrated clue')
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
      assert.ok(!after.flags.includes(clue.grants), key + ': failure cannot unlock')
      assert.ok(!after.pending.events.includes(clue.message))
    }
  }
  assert.ok(success && failure, key + ': success and failure both verified')

  const receipt = CLUE_RECEIPTS.find((r) => r.flag === gated?.success.add_flags[0])
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
      ENDINGS.some((e) => e.variants.some((v) => v.when_flag === receipt!.flag)),
    key + ': verdict remembers the choice without inventing it',
  )
}

assert.equal(CLUE_CHAINS.length, 9)
assert.equal(CLUE_RECEIPTS.length, 9)
console.log('Shifting Desks: nine earned alternative secret routes verified, including original gate, failures and ending callbacks')
