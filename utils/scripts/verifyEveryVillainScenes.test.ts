import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createStory } from '../everyVillainTactics/firstBellStory'
import {
  createSave,
  loadSave,
  saveChecksum,
} from '../everyVillainTactics/saves'
import {
  finishScene,
  latchScenes,
  pendingScriptScene,
  scriptProblems,
  speakerArt,
  speakerName,
  triggerHolds,
  walkScene,
  type Scene,
  type SceneScript,
} from '../everyVillainTactics/sceneGraph'
import {
  addLine,
  addScene,
  choiceEffect,
  emptyScript,
  removeLine,
  setBranch,
  setChoiceTarget,
  setChoices,
  setNext,
  updateLine,
} from '../everyVillainTactics/sceneEditor'
import { exportStage, importStage } from '../everyVillainTactics/stageShare'
import {
  clonePreset,
  stageProblems,
  type StageDraft,
} from '../everyVillainTactics/studio'
import {
  endTurn,
  trainingState,
  type TrainingState,
} from '../everyVillainTactics/training'

const boiler = clonePreset('boiler-room')
const script = boiler.script!
assert.equal(script.scenes.length, 7)
assert.deepEqual(scriptProblems(script, boiler), [])
assert.deepEqual(stageProblems(boiler), [])
const kinds = script.scenes.map((s) => s.trigger.kind)
for (const kind of ['opening', 'turn', 'flag', 'kill', 'faction', 'closing'])
  assert.ok(kinds.includes(kind as never), kind)

// ---- Graph validator ------------------------------------------------------
const base: Scene = structuredClone(script.scenes[0]!)
const one = (scene: Scene, extra: Scene[] = []): SceneScript => ({
  version: 1,
  scenes: [scene, ...extra],
})
const problems = (s: SceneScript) => scriptProblems(s, boiler).join(' | ')
assert.match(
  problems(
    one({
      ...base,
      nodes: base.nodes.map((n) => (n.id === 'l1' ? { ...n, next: 'zz' } : n)),
    }),
  ),
  /missing line zz/,
)
assert.match(
  problems(
    one({
      ...base,
      nodes: [...base.nodes, { ...base.nodes[0]!, id: 'orphan', next: null }],
    }),
  ),
  /line orphan is unreachable/,
)
assert.match(
  problems(
    one({
      ...base,
      nodes: base.nodes.map((n) => (n.id === 'l3' ? { ...n, next: 'l2' } : n)),
    }),
  ),
  /loops forever \(softlock\)/,
)
assert.match(
  problems(
    one({
      ...base,
      nodes: base.nodes.map((n) =>
        n.id === 'l1' ? { ...n, speaker: 'mystery-guest' } : n,
      ),
    }),
  ),
  /unknown speaker mystery-guest/,
)
assert.match(
  problems(one({ ...base, trigger: { kind: 'flag', flag: 'never-set' } })),
  /flag never-set that no choice sets/,
)
assert.match(
  problems(one(base, [{ ...base, id: 'second' }])),
  /Only one opening/,
)
assert.match(
  problems(one({ ...base, trigger: { kind: 'secret' } })),
  /secret marker/,
)
assert.match(
  problems(
    one({ ...base, id: 'a', trigger: { kind: 'after', scene: 'b' } }, [
      { ...base, id: 'b', trigger: { kind: 'after', scene: 'a' } },
    ]),
  ),
  /loops and never starts/,
)
assert.match(
  problems(
    one({
      ...base,
      nodes: base.nodes.map((n) =>
        n.id === 'l3'
          ? { ...n, choices: [{ label: 'Only', next: null, effects: [] }] }
          : n,
      ),
    }),
  ),
  /two or three options/,
)
assert.match(
  problems(
    one({ ...base, trigger: { kind: 'sight', unit: 'pip', target: 'pip' } }),
  ),
  /two different stage units/,
)

// ---- Runtime: latch, play, choose, chain ----------------------------------
const s = trainingState(0x51, boiler)
assert.deepEqual(latchScenes(s, script, boiler), ['boiler-opening'])
assert.deepEqual(latchScenes(s, script, boiler), [], 'latching is idempotent')
let pending = pendingScriptScene(s, script)!
assert.equal(pending.id, 'boiler-opening')
const opening = walkScene(pending, [])!
assert.equal(opening.done, true)
assert.deepEqual(
  opening.nodes.map((n) => n.id),
  ['l1', 'l2', 'l3'],
)
assert.equal(finishScene(s, pending, []), true)
assert.equal(finishScene(s, pending, []), false, 'a scene finishes once')
assert.equal(pendingScriptScene(s, script), null)
endTurn(s)
latchScenes(s, script, boiler)
pending = pendingScriptScene(s, script)!
assert.equal(pending.id, 'boiler-hatches')
assert.equal(walkScene(pending, [])!.done, false, 'waits at the choice')
assert.equal(walkScene(pending, [7]), null, 'an illegal choice is refused')
assert.equal(
  finishScene(s, pending, []),
  false,
  'an unfinished path is refused',
)
const plug = walkScene(pending, [0])!
assert.equal(plug.done, true)
assert.deepEqual(plug.effects, [{ kind: 'flag', flag: 'plug-hatches' }])
assert.equal(plug.nodes.at(-1)!.id, 'h3')
assert.ok(finishScene(s, pending, [0]))
assert.deepEqual(s.flags, ['plug-hatches'])
assert.deepEqual(latchScenes(s, script, boiler), ['boiler-plugged'])
assert.equal(pendingScriptScene(s, script)!.id, 'boiler-plugged')

// The other branch heals the most-hurt squadmate instead.
const healed = trainingState(0x51, boiler)
latchScenes(healed, script, boiler)
finishScene(healed, pendingScriptScene(healed, script)!, [])
healed.turn = 2
const hurt = healed.units.find((u) => u.id === 'hattie')!
hurt.hp = 2
latchScenes(healed, script, boiler)
assert.ok(finishScene(healed, pendingScriptScene(healed, script)!, [1]))
assert.equal(hurt.hp, 3)
assert.equal(healed.flags, undefined)

// Saves keep fired scenes and flags, and refuse forged ones.
function saveOf(state: TrainingState, stage: StageDraft = boiler) {
  return createSave({
    slot: 'slot-2',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage,
    state,
    story: { ...createStory(), current: null },
    savedAt: '2026-10-30T17:00:00.000Z',
  })
}
const saved = saveOf(s)
const loaded = loadSave(JSON.stringify(saved))
assert.ok(loaded.ok, loaded.ok ? '' : loaded.reason)
assert.deepEqual(loaded.save.state.flags, ['plug-hatches'])
const forge = (edit: (state: TrainingState) => void) => {
  const copy = structuredClone(saved)
  edit(copy.state)
  const { checksum: _old, ...payload } = copy
  return loadSave(
    JSON.stringify({ ...payload, checksum: saveChecksum(payload) }),
  )
}
assert.equal(forge((st) => st.flags!.push('free-win')).ok, false)
assert.equal(
  forge((st) => st.fired!.push('seen:scene:boiler-win')).ok,
  false,
  'a scene cannot be seen before it fired',
)
assert.equal(
  forge((st) => st.fired!.push('scene:somebody-elses-scene')).ok,
  false,
)
const plainStage = clonePreset('college-quad')
const plain = trainingState(1, plainStage)
plain.flags = ['plug-hatches']
assert.equal(
  loadSave(JSON.stringify(saveOf(plain, plainStage))).ok,
  false,
  'flags need a script that sets them',
)

// Closing scenes wait for the ending and match its outcome.
s.phase = 'victory'
const closing = latchScenes(s, script, boiler)
assert.ok(closing.includes('boiler-win'))
assert.ok(!closing.includes('boiler-loss'))

// Trigger conditions use the real battle state.
const t = trainingState(0x51, boiler)
const backdraft = t.units.find((u) => u.id === 'backdraft')!
assert.equal(
  triggerHolds({ kind: 'tile', x: 0, y: 4, team: 'squad' }, t, boiler),
  true,
)
assert.equal(
  triggerHolds({ kind: 'tile', x: 0, y: 4, team: 'rival' }, t, boiler),
  false,
)
backdraft.hp = 1
assert.equal(
  triggerHolds({ kind: 'health', unit: 'backdraft', atMost: 1 }, t, boiler),
  true,
)
assert.equal(
  triggerHolds({ kind: 'kill', team: 'rival', count: 1 }, t, boiler),
  false,
)
t.units.find((u) => u.id === 'vee')!.hp = 0
assert.equal(
  triggerHolds({ kind: 'kill', team: 'rival', count: 1 }, t, boiler),
  true,
)
assert.equal(triggerHolds({ kind: 'objective', progress: 1 }, t, boiler), false)
t.turn = 2
assert.equal(triggerHolds({ kind: 'objective', progress: 1 }, t, boiler), true)
assert.equal(
  typeof triggerHolds(
    { kind: 'sight', unit: 'backdraft', target: 'pip' },
    t,
    boiler,
  ),
  'boolean',
)
assert.equal(speakerName('narrator'), 'NARRATOR')
assert.equal(speakerName('backdraft', t), 'BACKDRAFT')
assert.ok(speakerArt('backdraft', 'determined', t))

// ---- Editor helpers produce valid graphs ------------------------------------
let authored = addScene(emptyScript(), 'opening')
const id = authored.scenes[0]!.id
authored = addLine(authored, id)
authored = addLine(authored, id)
assert.deepEqual(
  authored.scenes[0]!.nodes.map((n) => [n.id, n.next]),
  [
    ['line-1', 'line-2'],
    ['line-2', 'line-3'],
    ['line-3', null],
  ],
)
authored = updateLine(authored, id, 'line-2', {
  speaker: 'pip',
  emotion: 'angry',
  text: 'Get off my roof.',
})
authored = removeLine(authored, id, 'line-2')
assert.equal(authored.scenes[0]!.nodes[0]!.next, 'line-3', 'removal relinks')
authored = setChoices(authored, id, 'line-3', [
  {
    label: 'Stand firm',
    next: null,
    effects: choiceEffect('flag', 'Stood Firm!'),
  },
  { label: 'Back off', next: null, effects: choiceEffect('suppress') },
])
assert.deepEqual(authored.scenes[0]!.nodes[1]!.choices![0]!.effects, [
  { kind: 'flag', flag: 'stood-firm-' },
])
authored = addScene(authored, 'flag')
assert.equal(authored.scenes[1]!.trigger.kind, 'flag')
assert.deepEqual(scriptProblems(authored, boiler), [])

// ---- Scripts travel with share codes, through the strict importer ---------
const shared = importStage(exportStage(boiler))
assert.ok(shared.ok)
assert.deepEqual(shared.stage.script, boiler.script)
const code = JSON.parse(exportStage(boiler))
const badSpeaker = structuredClone(code)
badSpeaker.stage.script.scenes[0].nodes[0].speaker = 'Robert'
assert.equal(importStage(JSON.stringify(badSpeaker)).ok, false)
const badTrigger = structuredClone(code)
badTrigger.stage.script.scenes[0].trigger = { kind: 'eval', code: 'alert(1)' }
assert.equal(importStage(JSON.stringify(badTrigger)).ok, false)
const tooMany = structuredClone(code)
tooMany.stage.script.scenes = Array.from({ length: 13 }, (_, i) => ({
  ...code.stage.script.scenes[3],
  id: 'copy-' + i,
}))
assert.equal(importStage(JSON.stringify(tooMany)).ok, false)

// ---- Conditional branches, roles and the faction trigger -------------------
const open = script.scenes.find((x) => x.id === 'boiler-opening')!
assert.deepEqual(
  walkScene(open, [], { perspective: 'hero' })!.nodes.map((n) => n.id),
  ['l1', 'l2', 'l3'],
)
assert.deepEqual(
  walkScene(open, [], { perspective: 'villain' })!.nodes.map((n) => n.id),
  ['l1', 'l2', 'l2v', 'l3'],
  'the villain viewpoint hears a different line',
)
assert.equal(open.nodes.find((n) => n.id === 'l2')!.role, 'villain')
const win = script.scenes.find((x) => x.id === 'boiler-win')!
const flagged = trainingState(0x51, boiler)
assert.deepEqual(
  walkScene(win, [], { state: flagged })!.nodes.map((n) => n.id),
  ['w1', 'w2'],
)
flagged.flags = ['plug-hatches']
assert.deepEqual(
  walkScene(win, [], { state: flagged })!.nodes.map((n) => n.id),
  ['w1', 'w3', 'w2'],
  'the earlier choice changes the closing',
)
const crowd = trainingState(0x51, boiler)
const factionTrigger = { kind: 'faction', team: 'rival', lead: 2 } as const
assert.equal(triggerHolds(factionTrigger, crowd, boiler), false)
crowd.units.find((u) => u.id === 'priya')!.hp = 0
crowd.units.find((u) => u.id === 'hattie')!.hp = 0
assert.equal(triggerHolds(factionTrigger, crowd, boiler), true)
assert.match(
  problems(
    one({
      ...base,
      nodes: base.nodes.map((n) =>
        n.id === 'l3'
          ? {
              ...n,
              branch: {
                when: { kind: 'flag', flag: 'nobody-sets-this' },
                then: null,
                else: null,
              },
            }
          : n,
      ),
    }),
  ),
  /checks flag nobody-sets-this/,
)
assert.match(
  problems(
    one({
      ...base,
      nodes: base.nodes.map((n) =>
        n.id === 'l3'
          ? {
              ...n,
              branch: {
                when: { kind: 'perspective', perspective: 'hero' },
                then: 'ghost',
                else: null,
              },
            }
          : n,
      ),
    }),
  ),
  /missing line ghost/,
)
// Editor: retarget lines and choices, add and remove a branch.
let graph = addScene(emptyScript(), 'turn')
const gid = graph.scenes[0]!.id
graph = addLine(addLine(graph, gid), gid)
graph = setNext(graph, gid, 'line-1', 'line-3')
assert.match(scriptProblems(graph, boiler).join(), /line-2 is unreachable/)
graph = setBranch(graph, gid, 'line-1', {
  when: { kind: 'alive', unit: 'pip' },
  then: 'line-2',
  else: 'line-3',
})
assert.deepEqual(scriptProblems(graph, boiler), [])
const branched = trainingState(1, boiler)
assert.deepEqual(
  walkScene(graph.scenes[0]!, [], { state: branched })!.nodes.map((n) => n.id),
  ['line-1', 'line-2', 'line-3'],
)
branched.units.find((u) => u.id === 'pip')!.hp = 0
assert.deepEqual(
  walkScene(graph.scenes[0]!, [], { state: branched })!.nodes.map((n) => n.id),
  ['line-1', 'line-3'],
)
graph = setBranch(graph, gid, 'line-1', null)
assert.equal(graph.scenes[0]!.nodes[0]!.next, 'line-2')
graph = setChoices(graph, gid, 'line-3', [
  { label: 'Again', next: null, effects: [] },
  { label: 'Done', next: null, effects: [] },
])
graph = setChoiceTarget(graph, gid, 'line-3', 0, 'line-1')
assert.match(
  scriptProblems(graph, boiler).join(),
  /^$/,
  'a loop with an exit is fine',
)
graph = setChoiceTarget(graph, gid, 'line-3', 1, 'line-1')
assert.match(scriptProblems(graph, boiler).join(), /softlock/)
const badCondition = structuredClone(JSON.parse(exportStage(boiler)))
badCondition.stage.script.scenes[0].nodes[1].branch.when = {
  kind: 'javascript',
  body: 'x',
}
assert.equal(importStage(JSON.stringify(badCondition)).ok, false)

// ---- UI contracts ------------------------------------------------------------
const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
const editor = readFileSync(
  new URL(
    '../../components/every-villain-tactics/every-villain-scene-editor.vue',
    import.meta.url,
  ),
  'utf8',
)
for (const id of [
  'tactics-script-scene',
  'tactics-script-continue',
  'studio-pane-scenes',
])
  assert.match(page, new RegExp('data-testid="' + id + '"'))
assert.match(page, /<EveryVillainSceneEditor \/>/)
for (const id of [
  'studio-add-opening',
  'studio-add-triggered',
  'studio-add-closing',
  'studio-scene-trigger',
  'studio-scene-preview',
  'studio-add-line',
])
  assert.match(editor, new RegExp('data-testid="' + id + '"'))
assert.doesNotMatch(editor, /localStorage/)

console.log(
  'Every Villain scenes: graph validator (links, reachability, softlocks, actors, flags, chains), conditional branches, roles, faction trigger, latched triggers, choices with flags/heal, chained scenes, closing outcomes, saves, editor helpers and share codes verified.',
)
