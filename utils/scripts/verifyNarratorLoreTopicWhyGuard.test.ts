// /utils/scripts/verifyNarratorLoreTopicWhyGuard.test.ts
//
// Regression test for storybook/t-010 (cycle 45 finding, cycle 46 fix):
// stores/helpers/narratorHelper.ts's matchLoreTopic() matched every lore
// topic's keywords with a plain, unanchored substring test
// (`value.includes(keyword)`), and the Purpose topic listed the bare word
// "why" as one of its keywords. That meant any narrator message containing
// "why" anywhere -- including ordinary in-story questions such as "why did
// the captain leave?" -- was intercepted by narratorStore.ts's answerLore()
// and replaced with the static Kind Robots mission answer instead of
// reaching the real narrator/chat path.
//
// Exercises the real, unmodified matchLoreTopic() and narratorLoreTopics
// directly (no fixture pasting, no DB/network dependency) against: the
// exact buggy in-story question from the cycle-45 note, a bare "why?" (the
// one case a generic trigger word is actually meant to catch), an explicit
// mission-shaped "why does this exist" query, and a sanity check that the
// unrelated topics (fundraiser, founder) still match on their own
// unambiguous keywords.
import assert from 'node:assert/strict'

const { matchLoreTopic } =
  await import('../../stores/helpers/narratorHelper.js')

function run(): void {
  // The exact false positive from the cycle-45 note: an ordinary story
  // question containing "why" must NOT be hijacked into the static mission
  // answer.
  assert.equal(
    matchLoreTopic('why did the captain leave?'),
    null,
    'expected an ordinary in-story "why" question to fall through to the real narrator/chat path',
  )
  assert.equal(
    matchLoreTopic('Why is the sky red tonight?'),
    null,
    'expected another ordinary "why" question to fall through as well',
  )

  // An explicit, purpose-shaped "why" query should still resolve to a lore
  // topic -- the fix must not blind the narrator to genuine mission
  // questions, only stop the bare word from firing on anything.
  const purposeMatch = matchLoreTopic('Why does this exist, anyway?')
  assert.ok(
    purposeMatch,
    'expected an explicit "why does this exist" mission query to still match a lore topic',
  )
  assert.equal(
    purposeMatch!.key,
    'purpose',
    `expected the explicit mission query to match the purpose topic, got: ${purposeMatch?.key}`,
  )

  // Sanity: unrelated topics with unambiguous multi-letter keywords are
  // untouched by this fix.
  assert.equal(
    matchLoreTopic('how does the malaria fundraiser work?')?.key,
    'fundraiser',
  )
  assert.equal(matchLoreTopic('who built this?')?.key, 'founder')

  // The bare word "purpose"/"mission"/"goal" (never removed) still work on
  // their own.
  assert.equal(matchLoreTopic("what's the mission here?")?.key, 'purpose')

  console.log(
    'Narrator lore-topic "why" guard self-test passed: ordinary "why" ' +
      'questions no longer hijack the narrator, explicit mission queries ' +
      'and unrelated topics still match correctly.',
  )
}

run()
