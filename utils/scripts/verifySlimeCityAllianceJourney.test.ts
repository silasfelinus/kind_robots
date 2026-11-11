// Directed Alliance story contract: all 30 partnerships, five chapters,
// strict account-save validation, loyalty callbacks and bounded CLASH effects.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ALLIANCE_THREADS,
  allianceStoryBattleTerms,
  allianceStoryConsequence,
  allianceStoryPlan,
  allianceStoryAftermath,
  allianceStoryScene,
  chooseAllianceStory,
  validAllianceStoryDecisions,
} from '../slimeCity/campaignAllianceJourney'
import {
  createCampaignSave,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import { clashBossesFromTerms, clashTermsLabel } from '../slimeCity/clashBouts'
import { allianceTacticEdge, allianceTacticLabel } from '../slimeCity/campaignAllianceTactics'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { TEAMS } from '../slimeCity/prototypes'

assert.match(clashTermsLabel({}), /^SOLO CLASH/)
assert.match(clashTermsLabel({}, 'alliance'), /^ALLIANCE CLASH/)
const titles = new Set<string>()
for (const general of TEAMS) {
  for (const ally of TEAMS) {
    if (ally.id === general.id) {
      assert.equal(ALLIANCE_THREADS[general.id][ally.id], undefined)
      continue
    }
    let save = createCampaignSave()
    const original = save
    const first = allianceStoryScene(save, general.id, ally.id)
    assert.ok(first, general.id + '+' + ally.id + ' has an authored story')
    titles.add(first.title)
    assert.ok(first.text.length > 160, first.id + ' has a real scene')
    assert.equal(first.chapter, 0)
    assert.equal(first.choices.length, 2)
    assert.notEqual(first.choices[0].label, first.choices[1].label)
    assert.notEqual(first.choices[0].outcome, first.choices[1].outcome)
    assert.ok(first.choices.every((choice) => choice.outcome.length >= 60))
    const base = { playerHp: 1, enemyArmor: 0 }
    assert.strictEqual(
      allianceStoryBattleTerms(save, general.id, ally.id, base),
      base,
      'no free buff before an alliance decision',
    )
    assert.strictEqual(
      chooseAllianceStory(save, general.id, general.id, 'protect'),
      save,
    )
    assert.strictEqual(
      chooseAllianceStory(save, general.id, ally.id, 'stolen' as 'protect'),
      save,
    )
    const decided = chooseAllianceStory(save, general.id, ally.id, 'protect')
    assert.notStrictEqual(decided, original)
    assert.equal(
      original[general.id].allianceJourney,
      undefined,
      'immutable save',
    )
    assert.equal(allianceStoryScene(decided, general.id, ally.id), null)
    assert.equal(
      chooseAllianceStory(decided, general.id, ally.id, 'protect'),
      decided,
      'repeated clicks do not rewrite the save',
    )
    assert.equal(
      validSlimeCityStory({ ...newSlimeCityStory(), campaigns: decided }),
      true,
    )
    assert.equal(
      allianceStoryConsequence(decided, general.id, 0),
      first.choices[0].outcome,
    )
    const planned = allianceStoryPlan(decided, general.id, 0)
    assert.ok(planned)
    assert.ok(planned.includes(first.choices[0].label))
    assert.ok(!planned.includes(first.choices[0].outcome))
    assert.equal(
      allianceStoryAftermath(decided, general.id, 0, 'player'),
      first.choices[0].outcome,
    )
    const defeat = allianceStoryAftermath(decided, general.id, 0, 'enemy')
    assert.ok(defeat && defeat.length > 60)
    assert.notEqual(defeat, first.choices[0].outcome)
    assert.match(
      allianceStoryAftermath(decided, general.id, 0, 'draw')!,
      /stalemate/,
    )
    const safe = allianceStoryBattleTerms(decided, general.id, ally.id, base)
    const safeEdge = allianceTacticEdge(ally.id, 0, 'protect')
    assert.ok(safeEdge)
    assert.equal(safe.playerHp, base.playerHp, 'the legacy fighter buff stays intact')
    assert.equal(safe.playerBossLife, safeEdge.player)
    assert.equal(safe.enemyBossLife, safeEdge.enemy)
    assert.equal(first.choices[0].terms, allianceTacticLabel(safeEdge))
    assert.equal(
      clashBossesFromTerms(safe).player,
      clashBossesFromTerms(base).player + safeEdge.player,
    )
    assert.equal(
      clashBossesFromTerms(safe).enemy,
      clashBossesFromTerms(base).enemy + safeEdge.enemy,
    )
    const risky = chooseAllianceStory(save, general.id, ally.id, 'gamble')
    const riskSetback = allianceStoryAftermath(risky, general.id, 0, 'enemy')
    assert.ok(riskSetback && riskSetback.length > 60)
    assert.notEqual(riskSetback, defeat)
    const riskTerms = allianceStoryBattleTerms(risky, general.id, ally.id, base)
    const riskEdge = allianceTacticEdge(ally.id, 0, 'gamble')
    assert.ok(riskEdge)
    assert.equal(riskTerms.playerMana, base.playerMana, 'no fake mana effect')
    assert.equal(riskTerms.fewerRivals, base.fewerRivals, 'no fake field cap effect')
    assert.equal(riskTerms.playerBossLife, riskEdge.player)
    assert.equal(riskTerms.enemyBossLife, riskEdge.enemy)
    assert.equal(first.choices[1].terms, allianceTacticLabel(riskEdge))
    assert.equal(
      clashBossesFromTerms(riskTerms).player,
      clashBossesFromTerms(base).player + riskEdge.player,
    )
    assert.equal(
      clashBossesFromTerms(riskTerms).enemy,
      clashBossesFromTerms(base).enemy + riskEdge.enemy,
    )
    const other = TEAMS.find(
      (team) => team.id !== general.id && team.id !== ally.id,
    )!
    const switched = allianceStoryScene(decided, general.id, other.id)
    assert.ok(switched, 'changing partners requires a fresh scene')
    assert.strictEqual(
      allianceStoryBattleTerms(decided, general.id, other.id, base),
      base,
      'old partner can never grant a new partner its bonus',
    )
    const redecided = chooseAllianceStory(
      decided,
      general.id,
      other.id,
      'gamble',
    )
    assert.equal(redecided[general.id].allianceJourney?.[0]?.ally, other.id)
    assert.equal(allianceStoryScene(redecided, general.id, other.id), null)
    assert.equal(
      allianceStoryScene(redecided, general.id, ally.id)?.ally,
      ally.id,
    )

    // Five consecutive victories unlock five separate decisions without
    // leaking the next chapter's scene before it is earned.
    save = createCampaignSave()
    for (let chapter = 0; chapter < 5; chapter++) {
      const beat = allianceStoryScene(save, general.id, ally.id)
      assert.ok(beat)
      assert.equal(beat.chapter, chapter)
      if (chapter > 0) assert.match(beat.text, /Last chapter/)
      const pick = chapter % 2 ? 'gamble' : 'protect'
      save = chooseAllianceStory(save, general.id, ally.id, pick)
      assert.equal(
        validSlimeCityStory({ ...newSlimeCityStory(), campaigns: save }),
        true,
      )
      const terms = allianceStoryBattleTerms(save, general.id, ally.id, {})
      if (chapter > 0) {
        if (pick === 'gamble')
          assert.equal(terms.playerHp, 1, 'prior protected crew remembers')
        else
          assert.equal(terms.fewerRivals, 1, 'prior risky attack is remembered')
      }
      const rival = FACTION_CAMPAIGNS[general.id].chapters[chapter]!
      save = resolveCampaignBattle(
        save,
        general.id,
        chapter,
        rival.foe,
        'conviction',
        'player',
      )
      assert.equal(save[general.id].wins, chapter + 1)
      assert.equal(
        validSlimeCityStory({ ...newSlimeCityStory(), campaigns: save }),
        true,
      )
    }
    assert.equal(allianceStoryScene(save, general.id, ally.id), null)
    assert.equal(Object.keys(save[general.id].allianceJourney ?? {}).length, 5)
  }
}
assert.equal(
  titles.size,
  30,
  'all thirty directed ally relationships are authored',
)

// Legacy solo saves are valid; malformed/foreign/future alliance decisions are not.
const base = newSlimeCityStory()
assert.ok(validSlimeCityStory(base))
assert.ok(validAllianceStoryDecisions(undefined, 'riot', 0))
for (const bad of [
  { '0': { ally: 'riot', pick: 'protect' } },
  { '0': { ally: 'fake', pick: 'protect' } },
  { '0': { ally: 'bloodfairies', pick: 'both' } },
  { '0': { ally: 'bloodfairies', pick: 'protect', extra: true } },
  { '1': { ally: 'bloodfairies', pick: 'protect' } },
  { '00': { ally: 'bloodfairies', pick: 'protect' } },
  { '5': { ally: 'bloodfairies', pick: 'protect' } },
  [],
]) {
  assert.equal(validAllianceStoryDecisions(bad, 'riot', 0), false)
  assert.equal(
    validSlimeCityStory({
      ...base,
      campaigns: {
        ...base.campaigns,
        riot: { ...base.campaigns.riot, allianceJourney: bad },
      },
    }),
    false,
  )
}

// Store integration: the ally scene appears only after the normal three
// authored Riot beats, prevents an early battle and produces a legal Alliance
// CLASH with the recorded opening-life effects.
const { createPinia, setActivePinia } = await import('pinia')
const { useSlimeCityStore } = await import('../../stores/slimeCity')
setActivePinia(createPinia())
const lab = useSlimeCityStore()
lab.chooseTeam('riot')
lab.showCampaign()
lab.setJourneyFormat('alliance')
assert.ok(lab.campaignJourneyCurrent)
assert.equal(Boolean(lab.campaignAllianceCurrent), false)
for (let scene = 0; scene < 3; scene++) lab.chooseCampaignJourneyBeat('left')
assert.equal(lab.campaignJourneyCurrent, null)
const allianceBeat = lab.campaignAllianceCurrent
assert.ok(allianceBeat, 'crew chapter hands off to the alliance interlude')
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'campaign', 'cannot skip the ally decision')
lab.chooseCampaignAlliance('protect')
assert.equal(lab.campaignAllianceCurrent, null)
assert.equal(
  lab.campaignSave.riot.allianceJourney?.[0]?.ally,
  allianceBeat.ally,
)
assert.ok(lab.campaignAllianceConsequence)
const expectedBosses = clashBossesFromTerms(
  lab.campaignPreviewTerms(lab.activeChapter!.choices[0]!.terms),
)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'clash')
assert.equal(lab.clashLaunch.kind, 'campaign')
assert.equal(lab.clashLaunch.format, 'alliance')
assert.equal(lab.clashLaunch.alliance?.ally, allianceBeat.ally)
assert.deepEqual(lab.clashLaunch.bosses, expectedBosses)
lab.showCampaign()
lab.setJourneyFormat('solo')
assert.equal(
  lab.campaignAllianceCurrent,
  null,
  'Solo shares the journey but skips ally scenes',
)

// Contract: the same campaign page and city mission must both reach the
// interlude before battle, while all the actual bout terms are computed
// from the partner and the persisted choice.
const store = readFileSync('stores/slimeCity.ts', 'utf8')
const page = readFileSync('components/slime-city-campaign.vue', 'utf8')
const city = readFileSync('components/slime-city-scene.vue', 'utf8')
assert.match(store, /campaignAllianceCurrent\.value/)
assert.match(store, /allianceStoryBattleTerms\(/)
assert.match(store, /persistStory\(\)/)
assert.match(page, /data-testid="slime-alliance-story-scene"/)
assert.match(page, /data-testid="slime-alliance-earned-ending"/)
assert.match(store, /campaignAllianceFinale/)
assert.match(page, /testid-prefix="slime-alliance-story-choice"/)
assert.match(
  city,
  /lab\.campaignJourneyCurrent \|\| lab\.campaignAllianceCurrent/,
)
console.log(
  'Slime City Alliance Journey: 30 directed partnerships, 150 scenes, dual outcomes, save validation, partner switching, one-beat loyalty callbacks and CLASH boss effects PASS',
)
