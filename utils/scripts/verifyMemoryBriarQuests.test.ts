import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  BRIAR_QUESTS,
  briarQuestLog,
  briarQuestProgress,
  validateBriarQuests,
} from '../memoryDungeon/briarQuests'
import { HOUSE_ROOMS } from '../memoryDungeon/house'
import {
  houseEpilogueScores,
  HOUSE_EPILOGUE_LENSES,
  HOUSE_EPILOGUE_SIGNALS,
} from '../memoryDungeon/houseEpilogues'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
import { newBriarSave, restoreBriarSave } from '../memoryDungeonWorld'
import { buildMemoryDungeonPlaybook } from '../playbook/memoryDungeon'

// World One's eight side quests (kind_robots #4136: eight side quests per
// realm). Each thread is taken by real Briar and House choices, can be closed
// by a different choice, and is read from decisions the save already keeps.

assert.deepEqual(validateBriarQuests(), [])
assert.equal(BRIAR_QUESTS.length, 8)
assert.equal(new Set(BRIAR_QUESTS.map((q) => q.title)).size, 8)
assert.equal(new Set(BRIAR_QUESTS.map((q) => q.artPath)).size, 8)
for (const lens of HOUSE_EPILOGUE_LENSES)
  assert.ok(
    BRIAR_QUESTS.some((q) => q.lens === lens),
    `a thread is walked for ${lens}`,
  )
for (const q of BRIAR_QUESTS) {
  assert.deepEqual(
    checkArtPromptContract({ prompt: q.artPrompt, engine: 'krea2' }),
    [],
    `${q.id} art prompt passes the enqueue contract`,
  )
  assert.ok(
    !/\b(?:no|not|without|story|symbol\w*|readable|composition)\b/i.test(
      q.artPrompt,
    ),
    `${q.id} art prompt is literal`,
  )
}

const split = (q: (typeof BRIAR_QUESTS)[number], upTo = q.steps.length) => {
  const briar: Record<string, string> = {}
  const house: Record<string, string> = {}
  for (const step of q.steps.slice(0, upTo))
    (step.scope === 'briar' ? briar : house)[step.key] = step.advance[0]!
  return { briar, house }
}

for (const q of BRIAR_QUESTS) {
  // Untouched, under way, finished.
  assert.equal(briarQuestProgress(q, {}, {}).state, 'unstarted')
  const half = split(q, 1)
  assert.equal(briarQuestProgress(q, half.briar, half.house).state, 'active')
  const full = split(q)
  const finished = briarQuestProgress(q, full.briar, full.house)
  assert.equal(finished.state, 'complete', `${q.id} can be finished`)
  assert.equal(finished.done, q.steps.length)

  // Any step taken the other way closes the thread with its own ending.
  const closing = q.steps.find((step) => {
    const ids =
      step.scope === 'house'
        ? HOUSE_ROOMS[step.key]!.choices.map((c) => c.id)
        : (
            BRIAR_SCENES as Record<
              string,
              { choices: readonly { id: string }[] }
            >
          )[step.key]!.choices.map((c) => c.id)
    return ids.some((id) => !step.advance.includes(id))
  })!
  const other = (
    closing.scope === 'house'
      ? HOUSE_ROOMS[closing.key]!.choices
      : (
          BRIAR_SCENES as Record<string, { choices: readonly { id: string }[] }>
        )[closing.key]!.choices
  ).find((c) => !closing.advance.includes(c.id))!.id
  const closed = {
    briar: { ...full.briar },
    house: { ...full.house },
  }
  ;(closing.scope === 'briar' ? closed.briar : closed.house)[closing.key] =
    other
  assert.equal(
    briarQuestProgress(q, closed.briar, closed.house).state,
    'closed',
    `${q.id} closes when ${closing.key} goes the other way`,
  )

  // A finished thread weighs on the House epilogue it was walked for: one
  // point beyond the choice signals it shares with the epilogue lenses.
  const scores = houseEpilogueScores({ decisions: full.house }, full.briar)
  for (const lens of HOUSE_EPILOGUE_LENSES) {
    const signals = HOUSE_EPILOGUE_SIGNALS[lens].filter(
      ([scope, key, choice]) =>
        (scope === 'house' ? full.house[key] : full.briar[key]) === choice,
    ).length
    const threads = briarQuestLog(full.briar, full.house).filter(
      (t) => t.state === 'complete' && t.quest.lens === lens,
    ).length
    assert.equal(scores[lens], signals + threads, `${q.id}: ${lens} weight`)
  }
  assert.ok(scores[q.lens] >= 1)
}

// The three legitimate alternatives in the courier thread are different
// ethical choices, not interchangeable accusations of opened letters.
const courier = BRIAR_QUESTS.find((q) => q.id === 'every-letter-delivered')!
const courierClosures = [
  ['2,4', 'copy', /kept your lantern and copied the impossible address/],
  ['1,4', 'knock', /made Grandmother name the children excluded/],
  ['6,4', 'read', /broke the destruction order’s seal and warned the House/],
] as const
const courierEndings = new Set<string>()
for (const [key, choice, expected] of courierClosures) {
  const decisions = split(courier)
  decisions.briar[key] = choice
  const result = briarQuestProgress(courier, decisions.briar, decisions.house)
  assert.equal(result.state, 'closed', `${key} ${choice} closes the thread`)
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, courier.closed)
  courierEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(JSON.stringify({ ...newBriarSave(), sceneChoices: decisions.briar })),
  )
  assert.equal(
    briarQuestProgress(courier, restored.sceneChoices, decisions.house).quest
      .closed,
    result.quest.closed,
    'The specific closure survives a save round trip',
  )
}
assert.equal(courierEndings.size, 3, 'three different courier endings')
const invalidCourier = split(courier)
invalidCourier.briar['1,4'] = 'forged'
assert.equal(
  briarQuestProgress(courier, invalidCourier.briar, invalidCourier.house).state,
  'active',
  'Unknown scene choices cannot manufacture a quest closure',
)
const twoClosures = split(courier)
twoClosures.briar['2,4'] = 'copy'
twoClosures.briar['6,4'] = 'read'
assert.match(
  briarQuestProgress(courier, twoClosures.briar, twoClosures.house).quest.closed,
  /kept your lantern/,
  'When multiple choices close the quest, its earliest authored step determines the ending',
)

// Every quest step can be completed together: no two threads demand
// opposite choices at the same place, so a single run can tie off all eight.
const all = {
  briar: {} as Record<string, string>,
  house: {} as Record<string, string>,
}
for (const q of BRIAR_QUESTS)
  for (const step of q.steps) {
    const bag = step.scope === 'briar' ? all.briar : all.house
    const already = bag[step.key]
    if (already)
      assert.ok(
        step.advance.includes(already),
        `${q.id} and another thread agree at ${step.key}`,
      )
    else bag[step.key] = step.advance[0]!
  }
assert.ok(
  briarQuestLog(all.briar, all.house).every((t) => t.state === 'complete'),
  'one run can tie off all eight threads',
)

// Saves: threads read existing decisions, and a reload keeps them.
const save = restoreBriarSave(
  JSON.parse(
    JSON.stringify({
      ...newBriarSave(),
      sceneChoices: all.briar,
    }),
  ),
)
assert.deepEqual(save.sceneChoices, all.briar)
assert.ok(!('quests' in save), 'threads add no save field')

// The Forge counts the eight threads as quests.
const book = buildMemoryDungeonPlaybook()
const beats = Object.values(book.nodes).filter((n) =>
  n.key.startsWith('briar-quest:'),
)
assert.equal(beats.length, 8)
assert.ok(beats.every((n) => n.kind === 'quest' && n.needsArt && n.artPrompt))

// The overworld opens the Threads log, and the store owns it.
const overworld = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
assert.match(overworld, /data-testid="memory-quest-log-open"/)
assert.match(overworld, /<memory-dungeon-quest-log/)
assert.match(
  overworld,
  /import MemoryDungeonQuestLog from '~\/components\/memory-dungeon\/quest-log\.vue'/,
  'the log is imported where it mounts',
)
const log = readFileSync('components/memory-dungeon/quest-log.vue', 'utf8')
assert.match(log, /data-testid="memory-quest-log"/)
assert.match(log, /world\.briarQuests/)
assert.doesNotMatch(log, /\$fetch|localStorage/)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(store, /briarQuestLog\(state\.value\.sceneChoices/)

console.log(
  'Memory Briar quests: 8 side quests over real Briar and House choices, each finishable and closable, all eight in one run, epilogue weight and saves verified',
)
