// THE LAST SHIFT: the Ironjaw Chrome Lizards' strike campaign.
// Silas, 2026-11-09 PT: "we should have lizard people instead of orcs ... we
// need to lean into the world. We exchange meat, for chrissakes."
import assert from 'node:assert/strict'
import {
  FACTION_CAMPAIGNS,
  campaignEnding,
  createCampaignSave,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  IRONJAW_CHAPTERS,
  chooseIronjawBeat,
  ironjawBattleTerms,
  ironjawBeat,
  ironjawEpilogue,
  ironjawLastOutcome,
  ironjawLedger,
  ironjawSceneText,
  ironjawStoryDeck,
} from '../slimeCity/campaignIronjaw'
import {
  campaignCardChoices,
  chooseCampaignCard,
  campaignSoloDeck,
} from '../slimeCity/campaignCardRewards'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { soloProblems, soloStarter } from '../slimeCity/alliance'

// Fifteen authored scenes, thirty distinct decisions, one story per rival.
assert.equal(IRONJAW_CHAPTERS.length, 5)
assert.equal(IRONJAW_CHAPTERS.flat().length, 15)
assert.equal(new Set(IRONJAW_CHAPTERS.flat().map((s) => s.id)).size, 15)
assert.equal(
  new Set(
    IRONJAW_CHAPTERS.flat().flatMap((beat) => beat.choices.map((c) => c.label)),
  ).size,
  30,
)
for (const beats of IRONJAW_CHAPTERS) {
  assert.equal(beats.length, 3)
  for (const beat of beats) {
    assert.ok(beat.text.length > 130, beat.id + ' is a real scene')
    assert.equal(beat.choices.length, 2)
    assert.ok(beat.choices.every((choice) => choice.outcome.length > 60))
  }
}
// The world: lizard people, a meat economy, and the band crew drops in.
const prose = JSON.stringify(IRONJAW_CHAPTERS)
assert.doesNotMatch(prose, /\b(ogres?|orcs?|trolls?)\b/i)
assert.match(prose, /Meat coupons/)
assert.match(prose, /shed skin/i)
assert.match(prose, /Cold-blooded/)
assert.match(prose, /Queen Pin and the Bloodfairies/)

for (const path of ['left', 'right'] as const) {
  let save = createCampaignSave()
  const initialDeck = soloStarter('ironjaw')
  for (let chapter = 0; chapter < 5; chapter++) {
    const rival = FACTION_CAMPAIGNS.ironjaw.chapters[chapter]!
    for (let sceneIndex = 0; sceneIndex < 3; sceneIndex++) {
      const beat = ironjawBeat(save.ironjaw)
      assert.ok(beat)
      assert.equal(beat.id, IRONJAW_CHAPTERS[chapter]![sceneIndex]!.id)
      if (chapter > 0 && sceneIndex === 0)
        assert.ok(
          ironjawSceneText(save.ironjaw, beat).length > beat.text.length,
          'the last chapter decision changes this conversation',
        )
      const original = JSON.stringify(save)
      assert.equal(chooseIronjawBeat(save, 'forged' as 'left'), save)
      const next = chooseIronjawBeat(save, path)
      assert.equal(JSON.stringify(save), original, 'input save not mutated')
      save = next
      assert.equal(save.ironjaw.journey?.[chapter]?.length, sceneIndex + 1)
      assert.ok(ironjawLastOutcome(save.ironjaw))
      const snapshot = newSlimeCityStory()
      snapshot.campaigns = save
      assert.ok(validSlimeCityStory(snapshot), 'saves after every scene')
    }
    assert.equal(ironjawBeat(save.ironjaw), null)
    const { solidarity, heat, stage } = ironjawLedger(save.ironjaw)
    assert.equal(solidarity + heat, (chapter + 1) * 3)
    assert.equal(stage, chapter < 2 ? 'basking' : 'molten')
    const terms = ironjawBattleTerms(save.ironjaw, {
      playerHp: 1,
      enemyArmor: 0,
    })
    const baseline = clashBossesFromTerms({ playerHp: 1, enemyArmor: 0 })
    const bosses = clashBossesFromTerms(terms)
    assert.ok(
      bosses.player !== baseline.player || bosses.enemy !== baseline.enemy,
      'the strike changes real Clash life',
    )
    const equipped = ironjawStoryDeck(
      save.ironjaw,
      campaignSoloDeck(save, 'ironjaw', initialDeck),
    )
    assert.equal(equipped.length, 20)
    assert.equal(new Set(equipped).size, 20)
    assert.deepEqual(soloProblems('ironjaw', equipped), [])
    if (solidarity >= 3)
      assert.ok(equipped.includes('s2-ironjaw-union-bridgebearer'))
    if (heat >= 3) assert.ok(equipped.includes('s1-walking-foundry'))
    assert.deepEqual(soloStarter('ironjaw'), initialDeck, 'starter untouched')
    const lost = resolveCampaignBattle(
      save,
      'ironjaw',
      chapter,
      rival.foe,
      'cunning',
      'enemy',
    )
    assert.equal(lost.ironjaw.wins, chapter, 'losing does not skip an act')
    assert.deepEqual(lost.ironjaw.journey, save.ironjaw.journey)
    save = resolveCampaignBattle(
      save,
      'ironjaw',
      chapter,
      rival.foe,
      path === 'left' ? 'conviction' : 'cunning',
      'player',
    )
    assert.equal(save.ironjaw.wins, chapter + 1)
    const options = campaignCardChoices(save, 'ironjaw')
    assert.ok(options)
    save = chooseCampaignCard(
      save,
      'ironjaw',
      options[path === 'left' ? 0 : 1]!.id,
    )
    assert.equal(save.ironjaw.rewards?.length, chapter + 1)
  }
  const shift = ironjawLedger(save.ironjaw)
  assert.equal(shift.solidarity, path === 'left' ? 15 : 0)
  assert.equal(shift.heat, path === 'right' ? 15 : 0)
  assert.ok(campaignEnding(save, 'ironjaw'))
  const epilogue = ironjawEpilogue(save.ironjaw)
  assert.ok(epilogue.length > 100)
  assert.match(epilogue, path === 'left' ? /runs itself/ : /master switch/)
  const story = newSlimeCityStory()
  story.campaigns = save
  assert.ok(validSlimeCityStory(story), 'all five acts serialize')
  const skipped = structuredClone(story)
  skipped.campaigns.ironjaw.journey![0] = ['left']
  assert.equal(validSlimeCityStory(skipped), false, 'no truncated chapter')
  const future = structuredClone(story)
  future.campaigns.ironjaw.journey!.push(['left'])
  assert.equal(validSlimeCityStory(future), false, 'no sixth chapter')
  const crossCrew = structuredClone(story)
  crossCrew.campaigns.exchange.journey = [['left']]
  assert.equal(validSlimeCityStory(crossCrew), false, 'journals crew-scoped')
}
// A mixed strike fields both story cards and stays a legal Solo deck.
const mixed = createCampaignSave()
mixed.ironjaw.journey = [
  ['left', 'right', 'left'],
  ['right', 'left', 'right'],
]
const mixedDeck = ironjawStoryDeck(mixed.ironjaw, soloStarter('ironjaw'))
assert.ok(mixedDeck.includes('s2-ironjaw-union-bridgebearer'))
assert.ok(mixedDeck.includes('s1-walking-foundry'))
assert.deepEqual(soloProblems('ironjaw', mixedDeck), [])
// Older saves with Ironjaw wins and no journal pick up at the right scene.
const legacy = newSlimeCityStory()
legacy.campaigns.ironjaw.wins = 2
legacy.campaigns.ironjaw.decisions = ['cunning', 'conviction']
assert.ok(validSlimeCityStory(legacy))
assert.equal(
  ironjawBeat(legacy.campaigns.ironjaw)?.id,
  IRONJAW_CHAPTERS[2]![0]!.id,
)
console.log(
  'Ironjaw THE LAST SHIFT: 15 lizard-strike scenes, 30 decisions, Solidarity/Heat meter, real boss effects, story deck, save/retry, legacy saves PASS',
)
