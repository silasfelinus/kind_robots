// /utils/scripts/verifyCthulhuquariumScript.test.ts
//
// cthulhuquarium/t-103: walking a scene with a reply. Pure checks of
// utils/cthulhuquariumScript.ts against a hand-built scene and the real canon.
import assert from 'node:assert/strict'

import type { CanonScene } from '../cthulhuquariumCanon.generated.js'
import { CTHULHUQUARIUM_SCENES } from '../cthulhuquariumCanon.generated.js'
import {
  scriptAwaitingChoice,
  scriptChoose,
  scriptCurrentBeat,
  scriptEveryBeat,
  scriptIsFinalBeat,
  SCRIPT_START,
  scriptStep,
  type ScriptCursor,
} from '../cthulhuquariumScript.js'

const beat = (
  text: string,
  extra: Partial<CanonScene['beats'][number]> = {},
) => ({
  speaker: 'wilbur' as const,
  pose: 'hopeful',
  text,
  focus: null,
  await: null,
  plate: null,
  choices: null,
  ...extra,
})

const scene: CanonScene = {
  id: 'test',
  title: 'Test',
  trigger: 'milestone:test',
  floor: 2,
  plate: null,
  background: null,
  covers: [],
  beats: [
    beat('one'),
    beat('two', {
      choices: [
        { id: 'a', label: 'A', reply: [beat('a1'), beat('a2')] },
        { id: 'b', label: 'B', reply: [beat('b1')] },
      ],
    }),
    beat('three'),
  ],
}

function walk(choiceId: string): string[] {
  const seen: string[] = []
  let cursor: ScriptCursor = { ...SCRIPT_START }
  for (let guard = 0; guard < 20; guard++) {
    seen.push(scriptCurrentBeat(scene, cursor)!.text)
    if (scriptAwaitingChoice(scene, cursor)) {
      const stuck = scriptStep(scene, cursor)
      assert.deepEqual(stuck, cursor, 'a reply beat waits for the player')
      cursor = scriptChoose(scene, cursor, choiceId)
      continue
    }
    const next = scriptStep(scene, cursor)
    if (next === 'done') {
      assert.equal(scriptIsFinalBeat(scene, cursor), true)
      return seen
    }
    assert.equal(scriptIsFinalBeat(scene, cursor), false)
    cursor = next
  }
  throw new Error('scene never ended')
}

// The choice beat shows once; picking puts the reply on screen next.
assert.deepEqual(walk('a'), ['one', 'two', 'a1', 'a2', 'three'])
assert.deepEqual(walk('b'), ['one', 'two', 'b1', 'three'])
console.log('✅ a reply plays its beats, then the scene carries on')

const onChoice: ScriptCursor = { beat: 1, choice: null, reply: 0 }
assert.equal(scriptAwaitingChoice(scene, onChoice), true)
assert.deepEqual(
  scriptChoose(scene, onChoice, 'nope'),
  onChoice,
  'an unknown reply is ignored',
)
assert.deepEqual(
  scriptChoose(scene, SCRIPT_START, 'a'),
  SCRIPT_START,
  'a beat without choices ignores a pick',
)
assert.equal(
  scriptIsFinalBeat(scene, onChoice),
  false,
  'never final while waiting',
)
console.log('✅ choose ignores unknown replies and beats without a choice')

assert.equal(scriptCurrentBeat(null, SCRIPT_START), null)
assert.equal(
  scriptEveryBeat(scene).length,
  6,
  'main beats plus every reply beat',
)
console.log('✅ currentBeat / everyBeat')

// Every real floor scene can be walked to its end with each of its replies.
let walked = 0
for (const real of Object.values(CTHULHUQUARIUM_SCENES)) {
  const choiceBeats = real.beats.filter((b) => b.choices?.length)
  assert.ok(choiceBeats.length <= 1, `${real.id}: at most one reply per scene`)
  const ids = choiceBeats[0]?.choices?.map((choice) => choice.id) ?? [null]
  for (const id of ids) {
    let cursor: ScriptCursor = { ...SCRIPT_START }
    let steps = 0
    for (;;) {
      if (scriptAwaitingChoice(real, cursor))
        cursor = scriptChoose(real, cursor, id!)
      assert.ok(
        scriptCurrentBeat(real, cursor),
        `${real.id}: a beat is on screen`,
      )
      const next = scriptStep(real, cursor)
      if (next === 'done') break
      cursor = next
      assert.ok(++steps < 50, `${real.id} ends`)
    }
    walked++
  }
}
console.log(`✅ ${walked} real scene paths walk from start to end`)
