import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  applyPrivateDraftCommand,
  newPrivateDraftArchive,
  parsePrivateDraftLibrary,
  PRIVATE_DRAFT_SLUG,
} from '../everyVillainTactics/privateDrafts'
import { exportStage } from '../everyVillainTactics/stageShare'
import {
  STAGE_PRESETS,
  clonePreset,
  paintStage,
  stageProblems,
} from '../everyVillainTactics/studio'
import {
  availableMove,
  endTurn,
  fireSelected,
  moveSelected,
  rescueSelected,
  aliasFor,
  previewShot,
  trainingState,
} from '../everyVillainTactics/training'
import { lineOfSight, tileAt } from '../everyVillainTactics/combat'
import {
  finishScene,
  latchScenes,
  pendingScriptScene,
  sceneTriggerId,
  walkScene,
} from '../everyVillainTactics/sceneGraph'

assert.equal(STAGE_PRESETS.length, 61)
assert.ok(STAGE_PRESETS.some((stage) => stage.id === 'hydrant-blue'))
assert.ok(
  STAGE_PRESETS.some((stage) => stage.id === 'song-that-stopped'),
  "Chorus's broadcast origin is a distinct traversable battle",
)
assert.ok(
  STAGE_PRESETS.some((stage) => stage.id === 'sunken-street'),
  "Cornerstone's origin rescue is a distinct playable preset",
)
for (const preset of STAGE_PRESETS) {
  assert.deepEqual(
    stageProblems(preset),
    [],
    preset.id + ' must be traversable',
  )
  assert.equal(preset.spawns.length, 6)
  assert.equal(new Set(preset.spawns.map((u) => u.id)).size, 6)
}
// The vigil's allegiance-specific introductions and irreversible narrative
// decision have real, one-time effects and distinct closing branches.
for (const perspective of ['hero', 'villain'] as const) {
  for (const choice of [0, 1]) {
    const vigil = clonePreset('candle-that-wouldnt-die')
    const vigilScript = vigil.script!
    const battle = trainingState(41, vigil, { lead: 'magic-fire' })
    assert.deepEqual(latchScenes(battle, vigilScript, vigil), [
      'candle-vigil-opening',
    ])
    const intro = pendingScriptScene(battle, vigilScript)!
    assert.ok(
      walkScene(intro, [], { state: battle, perspective })!.nodes.some(
        (node) => node.id === (perspective === 'hero' ? 'oh' : 'ov'),
      ),
    )
    assert.ok(finishScene(battle, intro, [], perspective))
    battle.turn = 2
    assert.ok(
      latchScenes(battle, vigilScript, vigil).includes('candle-vigil-choice'),
    )
    const decision = pendingScriptScene(battle, vigilScript)!
    const lead = battle.units[0]!
    lead.hp = lead.maxHp - 1
    assert.ok(finishScene(battle, decision, [choice], perspective))
    assert.equal(
      finishScene(battle, decision, [1 - choice], perspective),
      false,
    )
    assert.ok(
      battle.flags?.includes(
        choice === 0 ? 'vigil-memories' : 'vigil-extinguish',
      ),
    )
    if (choice === 0) assert.equal(lead.hp, lead.maxHp)
    else
      assert.ok(
        battle.units.some(
          (unit) =>
            unit.team === 'rival' && unit.statuses.includes('suppressed'),
        ),
      )
    battle.phase = 'victory'
    latchScenes(battle, vigilScript, vigil)
    const finale = pendingScriptScene(battle, vigilScript)!
    assert.equal(finale.id, 'candle-vigil-victory')
    assert.ok(
      walkScene(finale, [], { state: battle, perspective })!.nodes.some(
        (node) => node.id === (choice === 0 ? 'va' : 'vb'),
      ),
    )
  }
}

for (const [stageId, lead, prefix, flagA, flagB] of [
  [
    'orchard-under-asphalt',
    'magic-earth',
    'orchard',
    'orchard-preserve',
    'orchard-remove',
  ],
  [
    'future-in-the-glass',
    'magic-water',
    'glass',
    'glass-withhold',
    'glass-reveal',
  ],
  ['overdue-thunder', 'magic-air', 'thunder', 'thunder-sealed', 'thunder-cure'],
  ['bell-and-the-door', 'magic-discipline', 'bell', 'bell-obey', 'bell-defy'],
  [
    'when-two-plus-two-screamed',
    'magic-genius',
    'proof',
    'proof-close',
    'proof-shape',
  ],
  [
    'heir-who-said-no',
    'magic-birthright',
    'hearth',
    'hearth-title',
    'hearth-renounce',
  ],
  [
    'empty-applause',
    'magic-social',
    'applause',
    'applause-cancel',
    'applause-expose',
  ],
  ['ashes-of-the-ledger', 'mutant-fire', 'ash', 'ash-choice-a', 'ash-choice-b'],
  [
    'balcony-witness',
    'mutant-air',
    'balcony',
    'balcony-choice-a',
    'balcony-choice-b',
  ],
  [
    'bridge-of-last-chances',
    'mutant-earth',
    'bridge',
    'bridge-choice-a',
    'bridge-choice-b',
  ],
  [
    'ship-with-no-port',
    'mutant-water',
    'ferry',
    'ferry-choice-a',
    'ferry-choice-b',
  ],
  [
    'four-hands-and-a-promise',
    'mutant-discipline',
    'rig',
    'rig-choice-a',
    'rig-choice-b',
  ],
  [
    'probability-of-panic',
    'mutant-genius',
    'forecast',
    'forecast-choice-a',
    'forecast-choice-b',
  ],
  [
    'keys-to-the-shelter',
    'mutant-birthright',
    'keys',
    'keys-choice-a',
    'keys-choice-b',
  ],
  [
    'friend-nobody-remembers',
    'mutant-social',
    'slate',
    'slate-choice-a',
    'slate-choice-b',
  ],
  [
    'furnace-lift',
    'tech-fire',
    'furnace',
    'furnace-choice-a',
    'furnace-choice-b',
  ],
  ['last-skyway', 'tech-air', 'skyway', 'skyway-choice-a', 'skyway-choice-b'],
  [
    'foundation-day',
    'tech-earth',
    'foundation',
    'foundation-choice-a',
    'foundation-choice-b',
  ],
  [
    'flooded-platform',
    'tech-water',
    'platform',
    'platform-choice-a',
    'platform-choice-b',
  ],
  [
    'parade-that-couldnt-stop',
    'tech-discipline',
    'parade',
    'parade-choice-a',
    'parade-choice-b',
  ],
  [
    'grandmas-password',
    'tech-genius',
    'bakery',
    'bakery-choice-a',
    'bakery-choice-b',
  ],
  [
    'museum-of-tomorrow',
    'tech-birthright',
    'museum',
    'museum-choice-a',
    'museum-choice-b',
  ],
  [
    'refuge-in-orbit',
    'alien-fire',
    'orbit',
    'orbit-choice-a',
    'orbit-choice-b',
  ],
  [
    'treaty-in-the-clouds',
    'alien-air',
    'treaty',
    'treaty-choice-a',
    'treaty-choice-b',
  ],
  [
    'museum-that-moved',
    'alien-earth',
    'fossil',
    'fossil-choice-a',
    'fossil-choice-b',
  ],
  [
    'song-for-the-drowned',
    'alien-water',
    'tide',
    'tide-choice-a',
    'tide-choice-b',
  ],
  [
    'orders-from-home',
    'alien-discipline',
    'warrant',
    'warrant-choice-a',
    'warrant-choice-b',
  ],
  [
    'small-future',
    'alien-genius',
    'future',
    'future-choice-a',
    'future-choice-b',
  ],
  [
    'missing-coronation',
    'alien-birthright',
    'crown',
    'crown-choice-a',
    'crown-choice-b',
  ],
  ['everyone-inside', 'alien-social', 'hive', 'hive-choice-a', 'hive-choice-b'],
  [
    'match-under-the-bed',
    'psychic-fire',
    'nightmare',
    'nightmare-choice-a',
    'nightmare-choice-b',
  ],
  [
    'elevator-that-floated',
    'psychic-air',
    'lift',
    'lift-choice-a',
    'lift-choice-b',
  ],
  [
    'stone-that-testified',
    'psychic-earth',
    'testimony',
    'testimony-choice-a',
    'testimony-choice-b',
  ],
  [
    'letter-no-one-sent',
    'psychic-water',
    'letter',
    'letter-choice-a',
    'letter-choice-b',
  ],
  [
    'book-that-walked-away',
    'psychic-discipline',
    'archive',
    'archive-choice-a',
    'archive-choice-b',
  ],
  [
    'thought-that-wasnt-yours',
    'psychic-genius',
    'thought',
    'thought-choice-a',
    'thought-choice-b',
  ],
  [
    'prophecy-auction',
    'psychic-birthright',
    'prophecy',
    'prophecy-choice-a',
    'prophecy-choice-b',
  ],
  [
    'rumor-after-midnight',
    'psychic-social',
    'rumor',
    'rumor-choice-a',
    'rumor-choice-b',
  ],
  ['edited-rescue', 'tech-social', 'edit', 'edit-choice-a', 'edit-choice-b'],
] as const) {
  for (const perspective of ['hero', 'villain'] as const) {
    for (const choice of [0, 1]) {
      const stage = clonePreset(stageId)
      const script = stage.script!
      const battle = trainingState(41, stage, { lead })
      assert.deepEqual(latchScenes(battle, script, stage), [
        prefix + '-origin-opening',
      ])
      const intro = pendingScriptScene(battle, script)!
      assert.ok(
        walkScene(intro, [], { state: battle, perspective })!.nodes.some(
          (node) => node.id === (perspective === 'hero' ? 'oh' : 'ov'),
        ),
      )
      assert.ok(finishScene(battle, intro, [], perspective))
      battle.turn = 2
      assert.ok(
        latchScenes(battle, script, stage).includes(prefix + '-origin-choice'),
      )
      const decision = pendingScriptScene(battle, script)!
      const actor = battle.units[0]!
      actor.hp = actor.maxHp - 1
      assert.ok(finishScene(battle, decision, [choice], perspective))
      assert.equal(
        finishScene(battle, decision, [1 - choice], perspective),
        false,
      )
      assert.ok(battle.flags?.includes(choice === 0 ? flagA : flagB))
      if (choice === 0) assert.equal(actor.hp, actor.maxHp)
      else
        assert.ok(
          battle.units.some(
            (unit) =>
              unit.team === 'rival' && unit.statuses.includes('suppressed'),
          ),
        )
      battle.phase = 'victory'
      latchScenes(battle, script, stage)
      const finale = pendingScriptScene(battle, script)!
      assert.equal(finale.id, prefix + '-origin-victory')
      assert.ok(
        walkScene(finale, [], { state: battle, perspective })!.nodes.some(
          (node) => node.id === (choice === 0 ? 'va' : 'vb'),
        ),
      )
    }
  }
}

const quad = clonePreset('college-quad')
assert.equal(tileAt(quad.map, { x: 4, y: 2 }).wall, true)
assert.equal(tileAt(quad.map, { x: 5, y: 3 }).wall, true)
assert.equal(lineOfSight(quad.map, { x: 2, y: 2 }, { x: 7, y: 2 }), false)

const lab = clonePreset('science-lab')
assert.equal(tileAt(lab.map, { x: 3, y: 0 }).wall, true)
assert.equal(tileAt(lab.map, { x: 4, y: 2 }).cover?.west, 'full')
// Science Wing is a scripted tactical stage rather than an unlabeled arena.
// Its real cover breaks, coolant is live on alternate turns, and both choice
// outcomes alter the next skirmish as well as the closing comic.
assert.equal(lab.turnLimit, 8)
assert.equal(lab.props?.length, 2)
assert.ok(lab.props!.every((prop) => prop.hp === 2))
assert.equal(lab.activeHazards?.[0]?.kind, 'water')
assert.ok(lab.script)
const script = lab.script!
assert.equal(script.scenes.length, 7)
const science = trainingState(78, lab)
assert.deepEqual(latchScenes(science, script, lab), ['science-entry'])
const opening = pendingScriptScene(science, script)!
assert.equal(opening.id, 'science-entry')
const heroView = walkScene(opening, [], {
  state: science,
  perspective: 'hero',
})!
const villainView = walkScene(opening, [], {
  state: science,
  perspective: 'villain',
})!
assert.ok(heroView.done && villainView.done)
assert.ok(heroView.nodes.some((node) => node.id === 'sh'))
assert.ok(villainView.nodes.some((node) => node.id === 'sv'))
assert.ok(!heroView.nodes.some((node) => node.id === 'sv'))
assert.ok(finishScene(science, opening, [], 'hero'))
assert.equal(finishScene(science, opening, [], 'hero'), false)
science.turn = 2
assert.ok(latchScenes(science, script, lab).includes('science-decision'))
const decision = pendingScriptScene(science, script)!
assert.equal(decision.id, 'science-decision')
assert.equal(walkScene(decision, [], { state: science })?.done, false)
const wounds = science.units[0]!
wounds.hp = wounds.maxHp - 1
const rescuePath = walkScene(decision, [0], { state: science })!
const evidencePath = walkScene(decision, [1], { state: science })!
assert.ok(rescuePath.done && evidencePath.done)
assert.ok(rescuePath.nodes.some((node) => node.id === 'dr'))
assert.ok(evidencePath.nodes.some((node) => node.id === 'de'))
assert.ok(finishScene(science, decision, [0], 'hero'))
assert.ok(science.flags?.includes('lab-rescued'))
assert.equal(wounds.hp, wounds.maxHp)
assert.ok(latchScenes(science, script, lab).includes('science-rescue'))
assert.equal(finishScene(science, decision, [1], 'hero'), false)
science.phase = 'victory'
assert.ok(latchScenes(science, script, lab).includes('science-victory'))
const victory = script.scenes.find((scene) => scene.id === 'science-victory')!
assert.ok(
  walkScene(victory, [], { state: science, perspective: 'hero' })!.nodes.some(
    (node) => node.id === 'vr',
  ),
)
const evidenceState = trainingState(78, lab)
evidenceState.turn = 2
latchScenes(evidenceState, script, lab)
const labDecision = script.scenes.find(
  (scene) => scene.id === 'science-decision',
)!
assert.ok(finishScene(evidenceState, labDecision, [1], 'villain'))
assert.ok(evidenceState.flags?.includes('lab-evidence'))
assert.ok(
  evidenceState.units.some(
    (unit) => unit.team === 'rival' && unit.statuses.includes('suppressed'),
  ),
)
assert.ok(latchScenes(evidenceState, script, lab).includes('science-recording'))
evidenceState.phase = 'victory'
latchScenes(evidenceState, script, lab)
assert.ok(
  walkScene(victory, [], {
    state: evidenceState,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 've'),
)
assert.ok(science.fired?.includes(sceneTriggerId('science-decision')))
assert.ok(evidenceState.fired?.includes(sceneTriggerId('science-recording')))

// Crosswalk Crisis requires an evacuation, not a cosmetic second battle.
// Civilians begin in two pockets, and eliminating the rivals alone is not a
// win. The authored turning-point choice has save-grounded one-time effects.
const crosswalk = clonePreset('crosswalk-crisis')
assert.equal(crosswalk.title, 'Crosswalk Crisis')
assert.equal(crosswalk.turnLimit, 8)
assert.equal(crosswalk.victory?.kind, 'rescue')
assert.equal(crosswalk.victory?.kind === 'rescue' && crosswalk.victory.count, 3)
assert.equal(crosswalk.civilians?.length, 3)
assert.equal(crosswalk.props?.length, 3)
assert.equal(crosswalk.waves?.[0]?.crew, 'licensed-legends')
assert.equal(crosswalk.waves?.[0]?.round, 4)
assert.equal(crosswalk.activeHazards?.[0]?.kind, 'water')
assert.ok(crosswalk.script)
const crosswalkScript = crosswalk.script!
assert.equal(crosswalkScript.scenes.length, 7)
const crossing = trainingState(67, crosswalk)
assert.equal(crossing.stageId, 'crosswalk-crisis')
assert.equal(crossing.rules?.victory.kind, 'rescue')
assert.deepEqual(latchScenes(crossing, crosswalkScript, crosswalk), [
  'crosswalk-opening',
])
const crossingOpening = pendingScriptScene(crossing, crosswalkScript)!
assert.ok(
  walkScene(crossingOpening, [], {
    state: crossing,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'ah'),
)
assert.ok(
  walkScene(crossingOpening, [], {
    state: crossing,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'av'),
)
assert.ok(finishScene(crossing, crossingOpening, [], 'hero'))
crossing.turn = 2
assert.ok(
  latchScenes(crossing, crosswalkScript, crosswalk).includes(
    'crosswalk-switch',
  ),
)
const crossingSwitch = pendingScriptScene(crossing, crosswalkScript)!
assert.equal(crossingSwitch.id, 'crosswalk-switch')
assert.equal(walkScene(crossingSwitch, [], { state: crossing })?.done, false)
const crossingLead = crossing.units.find((unit) => unit.id === 'backdraft')!
crossingLead.hp = crossingLead.maxHp - 1
assert.ok(finishScene(crossing, crossingSwitch, [0], 'hero'))
assert.ok(crossing.flags?.includes('crosswalk-medics'))
assert.equal(crossingLead.hp, crossingLead.maxHp)
assert.equal(finishScene(crossing, crossingSwitch, [1], 'hero'), false)
const jamming = trainingState(67, crosswalk)
jamming.turn = 2
latchScenes(jamming, crosswalkScript, crosswalk)
assert.ok(
  finishScene(
    jamming,
    crosswalkScript.scenes.find((scene) => scene.id === 'crosswalk-switch')!,
    [1],
    'villain',
  ),
)
assert.ok(jamming.flags?.includes('crosswalk-jammed'))
assert.ok(
  jamming.units.some(
    (unit) => unit.team === 'rival' && unit.statuses.includes('suppressed'),
  ),
)
const crossingWin = crosswalkScript.scenes.find(
  (scene) => scene.id === 'crosswalk-win',
)!
assert.ok(
  walkScene(crossingWin, [], {
    state: crossing,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'wm'),
)
assert.ok(
  walkScene(crossingWin, [], {
    state: jamming,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'wj'),
)
for (const rival of crossing.units.filter((unit) => unit.team === 'rival'))
  rival.hp = 0
const crossingCivilians = crossing.civilians!
for (const [index, civilian] of crossingCivilians.entries()) {
  crossingLead.x = civilian.x - 1
  crossingLead.y = civilian.y
  crossingLead.ap = 2
  crossing.selected = crossingLead.id
  assert.ok(rescueSelected(crossing), civilian.name)
  assert.equal(
    crossing.phase,
    index === crossingCivilians.length - 1 ? 'victory' : 'active',
    'Rival knockout does not replace the rescue requirement',
  )
  if (index === 0)
    assert.ok(
      latchScenes(crossing, crosswalkScript, crosswalk).includes(
        'crosswalk-first-rescue',
      ),
    )
}
assert.ok(
  latchScenes(crossing, crosswalkScript, crosswalk).includes('crosswalk-win'),
)
assert.equal(
  crossingCivilians.filter((civilian) => civilian.status === 'rescued').length,
  3,
)
assert.ok(crossing.fired?.includes(sceneTriggerId('crosswalk-first-rescue')))
assert.ok(crossing.fired?.includes(sceneTriggerId('crosswalk-win')))
assert.ok(stageProblems(crosswalk).length === 0)

// Rooftop Broadcast chapter: real 2-elevation transmitter hold, cover,
// delayed catwalk collapse and licensed-legends reinforcement round four.
// The hero/villain openings, combat decision and earned outcome have distinct
// authored scripts. This slice is a selectable one-shot, not yet a chained
// six-mission campaign with persisted chapter transitions.
const rooftop = clonePreset('rooftop-broadcast')
assert.deepEqual(stageProblems(rooftop), [])
assert.equal(rooftop.turnLimit, 8)
assert.equal(rooftop.map.tiles['4,2']?.elevation, 2)
assert.equal(rooftop.map.tiles['4,3']?.elevation, 2)
assert.equal(rooftop.victory?.kind, 'hold-zone')
assert.equal(rooftop.victory?.kind === 'hold-zone' && rooftop.victory.rounds, 2)
assert.equal(rooftop.waves?.[0]?.round, 4)
assert.equal(rooftop.waves?.[0]?.crew, 'licensed-legends')
assert.equal(
  rooftop.activeHazards?.find((item) => item.id === 'catwalk-collapse')?.round,
  4,
)
const roofScript = rooftop.script!
assert.equal(roofScript.scenes.length, 9)
const roofHero = trainingState(0x17, rooftop, { lead: 'accident-fire' })
assert.deepEqual(latchScenes(roofHero, roofScript, rooftop), ['roof-opening'])
const roofStart = pendingScriptScene(roofHero, roofScript)!
assert.ok(
  walkScene(roofStart, [], {
    state: roofHero,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'oh'),
)
assert.ok(
  walkScene(roofStart, [], {
    state: roofHero,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'ov'),
)
assert.ok(finishScene(roofHero, roofStart, [], 'hero'))
roofHero.turn = 2
assert.ok(latchScenes(roofHero, roofScript, rooftop).includes('roof-choice'))
const roofChoice = roofScript.scenes.find(
  (scene) => scene.id === 'roof-choice',
)!
assert.equal(walkScene(roofChoice, [], { state: roofHero })?.done, false)
const roofLead = roofHero.units[0]!
roofLead.hp = roofLead.maxHp - 1
assert.ok(finishScene(roofHero, roofChoice, [0], 'hero'))
assert.ok(roofHero.flags?.includes('roof-warning'))
assert.equal(roofLead.hp, roofLead.maxHp)
assert.ok(
  latchScenes(roofHero, roofScript, rooftop).includes('roof-warning-on-air'),
)
assert.equal(finishScene(roofHero, roofChoice, [1], 'hero'), false)
const roofVillain = trainingState(0x17, rooftop, { lead: 'accident-air' })
roofVillain.turn = 2
latchScenes(roofVillain, roofScript, rooftop)
assert.ok(finishScene(roofVillain, roofChoice, [1], 'villain'))
assert.ok(roofVillain.flags?.includes('roof-jammed'))
assert.ok(
  roofVillain.units.some(
    (unit) => unit.team === 'rival' && unit.statuses.includes('suppressed'),
  ),
)
const roofWin = roofScript.scenes.find((scene) => scene.id === 'roof-victory')!
assert.ok(
  walkScene(roofWin, [], { state: roofHero, perspective: 'hero' })!.nodes.some(
    (node) => node.id === 'vw',
  ),
)
assert.ok(
  walkScene(roofWin, [], {
    state: roofVillain,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'vj'),
)
const roofHold = trainingState(0x17, rooftop)
for (const enemy of roofHold.units.filter((unit) => unit.team === 'rival'))
  enemy.hp = 0
roofHold.units[0]!.x = 4
roofHold.units[0]!.y = 2
assert.equal(
  roofHold.phase,
  'active',
  'removing rivals alone cannot win the roof',
)
endTurn(roofHold)
assert.equal(roofHold.field?.held, 1)
assert.equal(roofHold.phase, 'active', 'one round is insufficient')
endTurn(roofHold)
assert.equal(roofHold.field?.held, 2)
assert.equal(roofHold.phase, 'victory')

// Under-Comet Breach: the fifth authored Crossfire battle has two squad
// entry lanes, a timed seal-keeper objective, alternating electrified coolant,
// a falling bridge and two different reinforcement waves. Rival knockouts
// without the seal-keeper cannot accidentally satisfy the victory condition.
const breach = clonePreset('under-comet-breach')
assert.deepEqual(stageProblems(breach), [])
assert.equal(breach.turnLimit, 7)
assert.equal(breach.victory?.kind, 'defeat-boss')
assert.equal(
  breach.victory?.kind === 'defeat-boss' && breach.victory.unit,
  'pip',
)
assert.equal(breach.spawns.find((spawn) => spawn.id === 'backdraft')?.y, 1)
assert.equal(breach.spawns.find((spawn) => spawn.id === 'priya')?.y, 4)
assert.equal(breach.map.tiles['4,2']?.elevation, 2)
assert.equal(breach.props?.length, 3)
assert.equal(breach.activeHazards?.length, 3)
assert.equal(
  breach.activeHazards?.find((h) => h.id === 'bridge-collapse')?.round,
  4,
)
assert.deepEqual(
  breach.waves?.map((wave) => wave.round),
  [3, 5],
)
assert.deepEqual(
  breach.waves?.map((wave) => wave.crew),
  ['wombat-ronin', 'licensed-legends'],
)
const breachScript = breach.script!
assert.equal(breachScript.scenes.length, 9)
const breachRun = trainingState(0x51, breach, { lead: 'accident-fire' })
assert.deepEqual(latchScenes(breachRun, breachScript, breach), [
  'breach-opening',
])
const breachOpening = pendingScriptScene(breachRun, breachScript)!
assert.ok(
  walkScene(breachOpening, [], {
    state: breachRun,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'oh'),
)
assert.ok(
  walkScene(breachOpening, [], {
    state: breachRun,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'ov'),
)
assert.ok(finishScene(breachRun, breachOpening, [], 'hero'))
breachRun.turn = 2
assert.ok(latchScenes(breachRun, breachScript, breach).includes('breach-fork'))
const fork = breachScript.scenes.find((scene) => scene.id === 'breach-fork')!
assert.equal(walkScene(fork, [], { state: breachRun })?.done, false)
const injured = breachRun.units[0]!
injured.hp = injured.maxHp - 1
assert.ok(finishScene(breachRun, fork, [0], 'hero'))
assert.ok(breachRun.flags?.includes('breach-vented'))
assert.equal(injured.hp, injured.maxHp)
assert.ok(
  latchScenes(breachRun, breachScript, breach).includes('breach-vent-result'),
)
assert.equal(finishScene(breachRun, fork, [1], 'hero'), false)
const sabotage = trainingState(0x51, breach, { lead: 'alien-air' })
sabotage.turn = 2
latchScenes(sabotage, breachScript, breach)
assert.ok(finishScene(sabotage, fork, [1], 'villain'))
assert.ok(sabotage.flags?.includes('breach-evidence'))
assert.ok(
  sabotage.units.some(
    (unit) => unit.team === 'rival' && unit.statuses.includes('suppressed'),
  ),
)
assert.ok(
  latchScenes(sabotage, breachScript, breach).includes(
    'breach-evidence-result',
  ),
)
const breachEnding = breachScript.scenes.find(
  (scene) => scene.id === 'breach-victory',
)!
assert.ok(
  walkScene(breachEnding, [], {
    state: breachRun,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'wv'),
)
assert.ok(
  walkScene(breachEnding, [], {
    state: sabotage,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'we'),
)
const seal = trainingState(0x51, breach)
for (const enemy of seal.units.filter(
  (unit) => unit.team === 'rival' && unit.id !== 'pip',
))
  enemy.hp = 0
endTurn(seal)
assert.equal(
  seal.phase,
  'active',
  'defeating minor rivals must not replace the seal-keeper objective',
)
const bossDown = trainingState(0x51, breach)
bossDown.units.find((unit) => unit.id === 'pip')!.hp = 0
endTurn(bossDown)
assert.equal(
  bossDown.phase,
  'victory',
  'defeating the seal-keeper must end the mission even with rivals standing',
)
const doomed = trainingState(0x51, breach)
for (const enemy of doomed.units.filter(
  (unit) => unit.team === 'rival' && unit.id !== 'pip',
))
  enemy.hp = 0
doomed.turn = 7
endTurn(doomed)
assert.equal(
  doomed.phase,
  'defeat',
  'the breach must time out if the seal-keeper is still standing',
)

// Prom Night: Everybody's Villain is the sixth authored Crossfire battle.
// Surviving all six rounds is mandatory, even if the opening rivals fall:
// later faction waves and the collapse are part of the actual finale.
const gala = clonePreset('prom-night-finale')
assert.deepEqual(stageProblems(gala), [])
assert.equal(gala.turnLimit, null)
assert.equal(gala.victory?.kind, 'survive')
assert.equal(gala.victory?.kind === 'survive' && gala.victory.rounds, 6)
assert.deepEqual(
  gala.waves?.map((wave) => wave.round),
  [3, 5],
)
assert.deepEqual(
  gala.waves?.map((wave) => wave.crew),
  ['warren-wreckers', 'licensed-legends'],
)
assert.equal(gala.props?.length, 4)
assert.equal(gala.activeHazards?.length, 3)
assert.equal(
  gala.activeHazards?.find((h) => h.id === 'dance-floor-fracture')?.round,
  4,
)
const galaScript = gala.script!
assert.equal(galaScript.scenes.length, 11)
const promRun = trainingState(0x67, gala, { lead: 'accident-fire' })
assert.deepEqual(latchScenes(promRun, galaScript, gala), ['prom-final-opening'])
const promOpening = pendingScriptScene(promRun, galaScript)!
assert.ok(
  walkScene(promOpening, [], {
    state: promRun,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'oh'),
)
assert.ok(
  walkScene(promOpening, [], {
    state: promRun,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'ov'),
)
assert.ok(finishScene(promRun, promOpening, [], 'hero'))
promRun.turn = 2
assert.ok(latchScenes(promRun, galaScript, gala).includes('prom-final-choice'))
const promChoice = galaScript.scenes.find(
  (scene) => scene.id === 'prom-final-choice',
)!
assert.equal(walkScene(promChoice, [], { state: promRun })?.done, false)
const promLead = promRun.units[0]!
promLead.hp = promLead.maxHp - 1
assert.ok(finishScene(promRun, promChoice, [0], 'hero'))
assert.ok(promRun.flags?.includes('prom-shelter'))
assert.equal(promLead.hp, promLead.maxHp)
assert.ok(latchScenes(promRun, galaScript, gala).includes('prom-final-shelter'))
assert.equal(finishScene(promRun, promChoice, [1], 'hero'), false)
const promVillain = trainingState(0x67, gala, { lead: 'alien-air' })
promVillain.turn = 2
latchScenes(promVillain, galaScript, gala)
assert.ok(finishScene(promVillain, promChoice, [1], 'villain'))
assert.ok(promVillain.flags?.includes('prom-command'))
assert.ok(
  promVillain.units.some(
    (unit) => unit.team === 'rival' && unit.statuses.includes('suppressed'),
  ),
)
assert.ok(
  latchScenes(promVillain, galaScript, gala).includes('prom-final-command'),
)
const promEnding = galaScript.scenes.find(
  (scene) => scene.id === 'prom-final-victory',
)!
assert.ok(
  walkScene(promEnding, [], {
    state: promRun,
    perspective: 'hero',
  })!.nodes.some((node) => node.id === 'vs'),
)
assert.ok(
  walkScene(promEnding, [], {
    state: promVillain,
    perspective: 'villain',
  })!.nodes.some((node) => node.id === 'vc'),
)
const earlyClear = trainingState(0x67, gala)
for (const enemy of earlyClear.units.filter((unit) => unit.team === 'rival'))
  enemy.hp = 0
earlyClear.turn = 5
endTurn(earlyClear)
assert.equal(
  earlyClear.phase,
  'active',
  'knocking out every rival before the sixth round must not skip the finale',
)
const lastDance = trainingState(0x67, gala)
for (const enemy of lastDance.units.filter((unit) => unit.team === 'rival'))
  enemy.hp = 0
lastDance.turn = 6
endTurn(lastDance)
assert.equal(
  lastDance.phase,
  'victory',
  'the actual sixth completed round should unlock the ballroom exits',
)

const picnic = clonePreset('picnic-plaza')
assert.ok(picnic.title.includes('Picnic'))

assert.equal(picnic.encounter, 'warren-wreckers')
const picnicFight = trainingState(99, picnic)
const bunnyUnits = picnicFight.units.filter((u) => u.team === 'rival')
assert.equal(bunnyUnits.length, 3)
assert.ok(
  bunnyUnits.every(
    (u) => u.hp === 1 && u.maxHp === 1 && u.henchmanType === 'burrow',
  ),
)
assert.equal(bunnyUnits[0]!.henchmanName, 'Foreman Thumpkin')
endTurn(picnicFight)
const targets = bunnyUnits.map((u) => u.burrowTarget)
assert.ok(
  targets.every(Boolean),
  'Each one-hit burrower must telegraph the next tile',
)
assert.equal(new Set(targets.map((p) => p!.x + ',' + p!.y)).size, 3)
const replay = trainingState(99, picnic)
endTurn(replay)
assert.deepEqual(
  replay.units.filter((u) => u.team === 'rival').map((u) => u.burrowTarget),
  targets,
)
assert.ok(
  picnicFight.log.includes('dust rings'),
  'Turn summary explains the warning',
)

const emergence = trainingState(99, picnic)
endTurn(emergence)
const planned = { ...emergence.units[3]!.burrowTarget! }
endTurn(emergence)
assert.deepEqual(
  { x: emergence.units[3]!.x, y: emergence.units[3]!.y },
  planned,
)
assert.equal(
  emergence.units[3]!.burrowTarget,
  null,
  'The warning resolves after a full player turn',
)

const sealed = trainingState(99, picnic)
endTurn(sealed)
const tunnel = sealed.units[3]!.burrowTarget!
sealed.units[2]!.x = tunnel.x
sealed.units[2]!.y = tunnel.y
const first = { x: sealed.units[3]!.x, y: sealed.units[3]!.y }
endTurn(sealed)
assert.deepEqual(
  { x: sealed.units[3]!.x, y: sealed.units[3]!.y },
  first,
  'Occupying a marked tile must stop a burrow without overlapping fighters',
)
assert.equal(sealed.units[3]!.burrowTarget, null)
assert.ok(sealed.units[3]!.hp === 1, 'Blocked burrowers remain one-hit enemies')

// The powered lieutenant is separate from the minor one-hit species captain.
// This is one executable lair vignette, NOT 48 delivered boss encounters.
const quarry = clonePreset('quarry-lieutenant')
assert.equal(quarry.encounter, 'quarry-lieutenant')
assert.equal(quarry.spawns.find((spawn) => spawn.id === 'pip')?.x, 5)
const quarryFight = trainingState(99, quarry)
const boss = quarryFight.units.find((unit) => unit.lieutenantName)!
const minions = quarryFight.units.filter(
  (unit) => unit.henchmanType === 'burrow',
)
assert.equal(aliasFor(boss), 'Mags Hardpan')
assert.equal(boss.identity, 'accident-earth')
assert.equal(boss.hp, 4)
assert.equal(boss.maxHp, 4)
assert.equal(boss.henchmanType, undefined)
assert.equal(minions.length, 2)
assert.equal(minions[0]!.henchmanName, 'Foreman Thumpkin')
assert.ok(minions.every((unit) => unit.hp === 1 && unit.maxHp === 1))
endTurn(quarryFight)
assert.deepEqual(boss.seismicTarget, { x: 0, y: 2 })
assert.equal(boss.seismicChargeHp, 4)
assert.ok(minions.every((unit) => unit.burrowTarget))
const quarryReplay = trainingState(99, quarry)
endTurn(quarryReplay)
assert.deepEqual(
  quarryReplay.units.find((unit) => unit.lieutenantName)?.seismicTarget,
  boss.seismicTarget,
  'lieutenant target must replay deterministically',
)

const quake = trainingState(99, quarry)
quake.units
  .filter((unit) => unit.henchmanType)
  .forEach((unit) => {
    unit.hp = 0
  })
endTurn(quake)
const quakeBoss = quake.units.find((unit) => unit.lieutenantName)!
const victim = quake.units.find(
  (unit) =>
    unit.team === 'squad' &&
    unit.x === quakeBoss.seismicTarget?.x &&
    unit.y === quakeBoss.seismicTarget?.y,
)!
const victimHp = victim.hp
endTurn(quake)
assert.equal(victim.hp, victimHp - 1, 'warning resolves as a real one-HP quake')
assert.equal(
  quakeBoss.seismicTarget,
  null,
  'seismic warning clears after release',
)

const dodge = trainingState(99, quarry)
dodge.units
  .filter((unit) => unit.henchmanType)
  .forEach((unit) => {
    unit.hp = 0
  })
endTurn(dodge)
const dodged = dodge.units.find((unit) => unit.id === 'hattie')!
dodge.selected = dodged.id
assert.equal(availableMove(dodge, { x: 2, y: 2 }), true)
assert.ok(
  moveSelected(dodge, { x: 2, y: 2 }),
  'player can dodge the marked area',
)
const safeHp = dodged.hp
endTurn(dodge)
assert.equal(
  dodged.hp,
  safeHp,
  'relocating outside the marked area prevents quake damage',
)

let interrupted = false
for (let seed = 1; seed < 96 && !interrupted; seed++) {
  const counter = trainingState(seed, quarry)
  counter.units
    .filter((unit) => unit.henchmanType)
    .forEach((unit) => {
      unit.hp = 0
    })
  endTurn(counter)
  const lieutenant = counter.units.find((unit) => unit.lieutenantName)!
  // Hattie is a short-range tank now, so the squad's best-placed shooter
  // takes the drumhead shot (roles change range, never the counter rule).
  const marksman = counter.units
    .filter((unit) => unit.team === 'squad' && unit.hp > 0)
    .sort(
      (a, b) =>
        previewShot(b, lieutenant, counter.map).hit -
          previewShot(a, lieutenant, counter.map).hit ||
        a.id.localeCompare(b.id),
    )[0]!
  assert.ok(previewShot(marksman, lieutenant, counter.map).hit > 0)
  counter.selected = marksman.id
  const fired = fireSelected(counter, lieutenant)
  assert.ok(fired, 'normal attack remains legal during drumhead counterplay')
  if (lieutenant.hp === 4) continue
  const hp = marksman.hp
  endTurn(counter)
  assert.equal(lieutenant.seismicTarget, null)
  assert.equal(marksman.hp, hp, 'hit on a marked drum cancels the queued quake')
  assert.ok(
    counter.events.some((event) => event.includes('loses the downbeat')),
  )
  interrupted = true
}
assert.ok(
  interrupted,
  'at least one reproducible seed hits the boss during charge',
)

const modified = paintStage(quad, { x: 2, y: 1 }, 'wall')
assert.equal(tileAt(modified.map, { x: 2, y: 1 }).wall, true)
assert.equal(
  tileAt(quad.map, { x: 2, y: 1 }).wall,
  undefined,
  'presets are immutable',
)
assert.equal(
  paintStage(modified, { x: 2, y: 1 }, 'erase').map.tiles['2,1'],
  undefined,
)
assert.equal(
  paintStage(quad, { x: 0, y: 4 }, 'wall'),
  quad,
  'spawns cannot be buried',
)
const secret = paintStage(quad, { x: 2, y: 0 }, 'secret')
assert.ok(secret.secrets.some((p) => p.x === 2 && p.y === 0))
assert.ok(
  !paintStage(secret, { x: 2, y: 0 }, 'secret').secrets.some(
    (p) => p.x === 2 && p.y === 0,
  ),
)

const state = trainingState(223, quad)
assert.equal(state.map.tiles['4,2']?.wall, true)
assert.equal(state.stageId, 'college-quad')
assert.equal(state.turnLimit, 9)
assert.equal(
  availableMove(state, { x: 4, y: 2 }),
  false,
  'fountain blocks movement',
)
const source = state.units[0]!
const target = state.units.find((u) => u.id === 'remy')!
const expected = previewShot(source, target, quad.map)
assert.equal(previewShot(source, target, state.map).hit, expected.hit)
assert.equal(previewShot(source, target, state.map).clear, expected.clear)

const veryShort = clonePreset('science-lab')
veryShort.turnLimit = 2
const timer = trainingState(223, veryShort)
for (let round = 0; round < 3 && timer.phase === 'active'; round++)
  endTurn(timer)
assert.equal(
  timer.phase,
  'defeat',
  'expired studio timer is enforced in combat',
)

const invalid = clonePreset('college-quad')
invalid.spawns[0]!.x = 4
invalid.spawns[0]!.y = 2
assert.ok(
  stageProblems(invalid).some((problem) => problem.includes('traversable')),
)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/everyVillainTacticsStore.ts', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-stage-studio"/)
assert.match(page, /data-testid="studio-playtest"/)
assert.match(page, /store\.paintCell\(cell\)/)
assert.match(store, /trainingState\(\s*0x53a1b7,\s*isPlaytest\.value/)
assert.match(page, /data-testid="tactics-burrow-warning"/)
assert.match(page, /data-testid="studio-encounter"/)
assert.match(store, /isBurrowWarning/)
assert.match(store, /isSeismicWarning/)
assert.match(page, /data-testid="tactics-seismic-warning"/)
assert.match(page, /Quarry lieutenant/)
console.log(
  'Every Villain Studio: preset maps, paint, spawns, LOS, timer and real-rules playtest verified.',
)

const shelfTime = '2026-11-28T11:43:00.000Z'
const shelf = newPrivateDraftArchive()
assert.equal(shelf.revision, null)
const shelfStage = clonePreset('college-quad')
const firstDraft = applyPrivateDraftCommand(
  shelf.library,
  { operation: 'save', name: 'Arena', code: exportStage(shelfStage) },
  shelfTime,
)
assert.ok(firstDraft.ok)
assert.equal(shelf.library.drafts.length, 0)
const editedStage = { ...shelfStage, title: 'Second arena' }
const secondDraft = applyPrivateDraftCommand(
  firstDraft.library,
  {
    operation: 'save',
    name: 'Arena',
    code: exportStage(editedStage),
    history: [],
    userId: 999,
  },
  shelfTime,
)
assert.ok(secondDraft.ok)
assert.equal(secondDraft.library.drafts[0]!.version, 2)
assert.equal(secondDraft.library.drafts[0]!.history?.[0]?.stage.title, shelfStage.title)
const forked = applyPrivateDraftCommand(
  secondDraft.library,
  { operation: 'fork', source: 'Arena', name: 'Independent' },
  shelfTime,
)
assert.ok(forked.ok)
assert.deepEqual(forked.library.drafts[0]!.forkedFrom, { name: 'Arena', version: 2 })
const restored = applyPrivateDraftCommand(
  forked.library,
  { operation: 'restore', name: 'Arena', version: 1 },
  shelfTime,
)
assert.ok(restored.ok)
assert.equal(restored.library.drafts[0]!.version, 3)
assert.equal(restored.library.drafts[0]!.stage.title, shelfStage.title)
assert.equal(restored.library.drafts[1]!.stage.title, editedStage.title)
assert.deepEqual(parsePrivateDraftLibrary(JSON.stringify(restored.library)), restored.library)
assert.equal(applyPrivateDraftCommand(shelf.library, { operation: 'fork', source: 'Arena', name: 'Stolen' }, shelfTime).ok, false)
assert.equal(applyPrivateDraftCommand(shelf.library, { operation: 'save', name: 'Bad', code: 'not a stage' }, shelfTime).ok, false)
assert.throws(() => parsePrivateDraftLibrary('{"version":1,"drafts":[{}]}'))
assert.equal(PRIVATE_DRAFT_SLUG, 'every-villain-tactics-drafts')
for (const method of ['get', 'put']) {
  const route = readFileSync(
    new URL('../../server/api/every-villain-tactics/private-drafts.' + method + '.ts', import.meta.url),
    'utf8',
  )
  assert.match(route, /requireHumanApiUser\(event\)/)
  assert.match(route, /userId: user\.id/)
  assert.match(route, /private, no-store/)
  if (method === 'put') {
    assert.match(route, /revision: row\.revision/)
    assert.match(route, /updated\.count !== 1/)
    assert.match(route, /applyPrivateDraftCommand/)
  }
}
assert.match(page, /data-testid="studio-private-account-shelf"/)

assert.match(store, /isPlaytest\.value && accountDraftLoaded/)
assert.match(store, /if \(isPlaytest\.value\) exitPlaytest\(\)/)
