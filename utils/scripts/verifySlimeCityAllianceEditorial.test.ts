// Adversarial narrative runs, not a claim of human fun approval.
// This exercises every directed two-crew arc from chapter 1 to an ending.
import assert from 'node:assert/strict'
import {
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  allianceStoryBattleTerms,
  allianceStoryConsequence,
  allianceStoryFinale,
  allianceStoryScene,
  chooseAllianceStory,
  type AllianceStoryPick,
} from '../slimeCity/campaignAllianceJourney'
import { ALLIANCE_LATER_ARCS } from '../slimeCity/campaignAllianceLater'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { TEAMS } from '../slimeCity/prototypes'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'

const outcomes = new Set<string>()
const crises = new Set<string>()
const endingTitles = new Set<string>()
let runs = 0
let beats = 0
let meaningfulChoicePairs = 0
let defeatedAndRetried = 0
for (const lead of TEAMS) {
  for (const ally of TEAMS) {
    if (lead.id === ally.id) continue
    const arc = ALLIANCE_LATER_ARCS[lead.id][ally.id]
    assert.ok(arc, lead.id + '/' + ally.id + ' missing arc')
    assert.equal(arc.beats.length, 4, 'chapters 2–5 must each be authored')
    endingTitles.add(arc.finale.title)
    for (const path of ['protect', 'gamble', 'alternating'] as const) {
      let save = createCampaignSave()
      const chapterTitles = new Set<string>()
      const safeLabels = new Set<string>()
      const riskLabels = new Set<string>()
      let previousConsequence = ''
      for (let chapter = 0; chapter < 5; chapter++) {
        const scene = allianceStoryScene(save, lead.id, ally.id)
        assert.ok(scene, 'chapter scene accessible after saved victory')
        assert.equal(scene.chapter, chapter)
        assert.equal(
          chapterTitles.has(scene.title),
          false,
          'same arc cannot reuse a chapter headline',
        )
        chapterTitles.add(scene.title)
        assert.equal(
          safeLabels.has(scene.choices[0].label),
          false,
          'protect choice repeated inside arc',
        )
        assert.equal(
          riskLabels.has(scene.choices[1].label),
          false,
          'gamble choice repeated inside arc',
        )
        safeLabels.add(scene.choices[0].label)
        riskLabels.add(scene.choices[1].label)
        assert.notEqual(scene.choices[0].label, scene.choices[1].label)
        assert.notEqual(scene.choices[0].outcome, scene.choices[1].outcome)
        assert.ok(scene.choices[0].outcome.length >= 45)
        assert.ok(scene.choices[1].outcome.length >= 45)
        meaningfulChoicePairs++
        beats++
        if (chapter > 0) {
          assert.ok(
            scene.text.includes(previousConsequence),
            'the callback must cite the actual preceding decision',
          )
          assert.ok(scene.text.includes(arc.beats[chapter - 1]!.crisis))
          crises.add(arc.beats[chapter - 1]!.crisis)
        }
        outcomes.add(scene.choices[0].outcome)
        outcomes.add(scene.choices[1].outcome)
        const pick: AllianceStoryPick =
          path === 'alternating'
            ? chapter % 2 === 0
              ? 'protect'
              : 'gamble'
            : path
        previousConsequence = scene.choices[pick === 'protect' ? 0 : 1].outcome
        const copy = save
        save = chooseAllianceStory(save, lead.id, ally.id, pick)
        assert.notStrictEqual(
          copy,
          save,
          'choice must not mutate the previous save',
        )
        assert.equal(allianceStoryScene(save, lead.id, ally.id), null)
        assert.equal(
          allianceStoryConsequence(save, lead.id, chapter),
          previousConsequence,
        )
        assert.equal(
          validSlimeCityStory({ ...newSlimeCityStory(), campaigns: save }),
          true,
        )
        const terms = allianceStoryBattleTerms(save, lead.id, ally.id, {})
        const bosses = clashBossesFromTerms(terms)
        assert.ok(bosses.player > 0 && bosses.enemy > 0)
        const foe = FACTION_CAMPAIGNS[lead.id].chapters[chapter]!.foe
        if (chapter === 2 && path === 'alternating') {
          const defeat = resolveCampaignBattle(
            save,
            lead.id,
            chapter,
            foe,
            'conviction',
            'enemy',
          )
          assert.equal(
            defeat[lead.id].wins,
            chapter,
            'a loss never advances the chapter',
          )
          assert.equal(
            defeat[lead.id].allianceJourney?.[chapter]?.pick,
            pick,
            'a loss preserves the story choice',
          )
          assert.equal(allianceStoryScene(defeat, lead.id, ally.id), null)
          save = defeat
          defeatedAndRetried++
        }
        save = resolveCampaignBattle(
          save,
          lead.id,
          chapter,
          foe,
          'conviction',
          'player',
        )
        assert.equal(save[lead.id].wins, chapter + 1)
      }
      assert.equal(chapterTitles.size, 5)
      assert.equal(safeLabels.size, 5)
      assert.equal(riskLabels.size, 5)
      const finale = allianceStoryFinale(save, lead.id)
      assert.ok(finale, 'five earned victories unlock an Alliance finale')
      assert.equal(finale.ally, ally.id)
      assert.equal(finale.chaptersTogether, 5)
      assert.equal(finale.title, arc.finale.title)
      assert.ok(
        finale.story.includes(
          finale.choice === 'protect' ? arc.finale.protect : arc.finale.gamble,
        ),
      )
      assert.equal(
        validSlimeCityStory({ ...newSlimeCityStory(), campaigns: save }),
        true,
      )
      assert.equal(allianceStoryScene(save, lead.id, ally.id), null)
      runs++
    }
  }
}
assert.equal(endingTitles.size, 30, 'every pairing needs its own ending title')
assert.equal(
  crises.size,
  120,
  'all 120 later chapter dilemmas must be authored and distinct',
)
assert.equal(
  outcomes.size,
  300,
  'all 300 chapter choice consequences must be distinct',
)
assert.equal(runs, 90)
assert.equal(beats, 450)
assert.equal(meaningfulChoicePairs, 450)
assert.equal(defeatedAndRetried, 30)

// Switching partners is a valid narrative choice; the final alliance cannot
// rewrite earlier choices or borrow a former ally's ending.
let swaps = 0
for (const leader of TEAMS) {
  const allies = TEAMS.filter((team) => team.id !== leader.id)
  for (const finalAlly of allies) {
    let save = createCampaignSave()
    const earlyAlly = allies.find((candidate) => candidate.id !== finalAlly.id)!
    const earlyHistory: string[] = []
    for (let chapter = 0; chapter < 5; chapter++) {
      const ally = chapter < 3 ? earlyAlly : finalAlly
      const scene = allianceStoryScene(save, leader.id, ally.id)
      assert.ok(scene)
      if (chapter === 3) {
        assert.match(
          scene.text,
          new RegExp(earlyAlly.name, 'i'),
          'new ally must know old partner departed',
        )
      }
      const pick: AllianceStoryPick = chapter % 2 ? 'gamble' : 'protect'
      save = chooseAllianceStory(save, leader.id, ally.id, pick)
      if (chapter < 3)
        earlyHistory.push(allianceStoryConsequence(save, leader.id, chapter)!)
      const foe = FACTION_CAMPAIGNS[leader.id].chapters[chapter]!.foe
      save = resolveCampaignBattle(
        save,
        leader.id,
        chapter,
        foe,
        'conviction',
        'player',
      )
    }
    const ending = allianceStoryFinale(save, leader.id)
    assert.ok(ending)
    assert.equal(ending.ally, finalAlly.id)
    assert.equal(ending.chaptersTogether, 2)
    for (let chapter = 0; chapter < 3; chapter++)
      assert.equal(
        allianceStoryConsequence(save, leader.id, chapter),
        earlyHistory[chapter],
      )
    assert.equal(
      validSlimeCityStory({ ...newSlimeCityStory(), campaigns: save }),
      true,
    )
    swaps++
  }
}
const solo = createCampaignSave()
for (let chapter = 0; chapter < 5; chapter++) {
  const foe = FACTION_CAMPAIGNS.riot.chapters[chapter]!.foe
  Object.assign(
    solo,
    resolveCampaignBattle(solo, 'riot', chapter, foe, 'conviction', 'player'),
  )
}
assert.equal(
  allianceStoryFinale(solo, 'riot'),
  null,
  'Solo endings must remain unchanged',
)
assert.equal(swaps, 30)

console.log(
  'Alliance editorial matrix: 90 complete five-chapter runs + 30 partner-switch runs; ' +
    '450 scene transitions, 300 unique outcomes, 120 unique late crises, ' +
    '30 defeat/retry paths and 30 distinct pairing finales PASS. ' +
    'Structural novelty verified; subjective fun requires human playtesting.',
)
