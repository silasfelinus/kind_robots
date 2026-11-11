// THE BEAUTIFUL CATASTROPHE: the Anarkissed's midnight festival.
// Follows the Ironjaw THE LAST SHIFT pattern (Silas, 2026-11-09 PT: "we need
// to lean into the world. We exchange meat, for chrissakes.")
import assert from 'node:assert/strict'
import {
  FACTION_CAMPAIGNS,
  campaignEnding,
  createCampaignSave,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  RIOT_CHAPTERS,
  chooseRiotBeat,
  riotBattleTerms,
  riotBeat,
  riotEpilogue,
  riotLastOutcome,
  riotLedger,
  riotSceneText,
  riotStoryDeck,
} from '../slimeCity/campaignRiot'
import {
  campaignCardChoices,
  chooseCampaignCard,
  campaignSoloDeck,
} from '../slimeCity/campaignCardRewards'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { soloProblems, soloStarter } from '../slimeCity/alliance'

// Fifteen authored scenes, thirty distinct decisions, one story per rival.
assert.equal(RIOT_CHAPTERS.length, 5)
assert.equal(RIOT_CHAPTERS.flat().length, 15)
assert.equal(new Set(RIOT_CHAPTERS.flat().map((s) => s.id)).size, 15)
assert.equal(
  new Set(
    RIOT_CHAPTERS.flat().flatMap((beat) => beat.choices.map((c) => c.label)),
  ).size,
  30,
)
for (const beats of RIOT_CHAPTERS) {
  assert.equal(beats.length, 3)
  for (const beat of beats) {
    assert.ok(beat.text.length > 130, beat.id + ' is a real scene')
    assert.equal(beat.choices.length, 2)
    assert.ok(beat.choices.every((choice) => choice.outcome.length > 60))
  }
}
// The world: a glam anarchy circus, a meat economy, and the other crews.
const prose = JSON.stringify(RIOT_CHAPTERS)
assert.doesNotMatch(prose, /\b(ogres?|orcs?|trolls?)\b/i)
assert.match(prose, /payable in Meat/)
assert.match(prose, /human cannonball/i)
assert.match(prose, /fishnets/)
assert.match(prose, /cold-blooded/)
assert.match(prose, /Queen Pin and the Bloodfairies/)

for (const path of ['left', 'right'] as const) {
  let save = createCampaignSave()
  const initialDeck = soloStarter('riot')
  for (let chapter = 0; chapter < 5; chapter++) {
    const rival = FACTION_CAMPAIGNS.riot.chapters[chapter]!
    for (let sceneIndex = 0; sceneIndex < 3; sceneIndex++) {
      const beat = riotBeat(save.riot)
      assert.ok(beat)
      assert.equal(beat.id, RIOT_CHAPTERS[chapter]![sceneIndex]!.id)
      if (chapter > 0 && sceneIndex === 0)
        assert.ok(
          riotSceneText(save.riot, beat).length > beat.text.length,
          'the last chapter decision changes this conversation',
        )
      const original = JSON.stringify(save)
      assert.equal(chooseRiotBeat(save, 'forged' as 'left'), save)
      const next = chooseRiotBeat(save, path)
      assert.equal(JSON.stringify(save), original, 'input save not mutated')
      save = next
      assert.equal(save.riot.journey?.[chapter]?.length, sceneIndex + 1)
      assert.ok(riotLastOutcome(save.riot))
      const snapshot = newSlimeCityStory()
      snapshot.campaigns = save
      assert.ok(validSlimeCityStory(snapshot), 'saves after every scene')
    }
    assert.equal(riotBeat(save.riot), null)
    const { safety, spectacle, stage } = riotLedger(save.riot)
    assert.equal(safety + spectacle, (chapter + 1) * 3)
    assert.equal(stage, chapter < 2 ? 'opening-night' : 'grand-finale')
    const terms = riotBattleTerms(save.riot, {
      playerHp: 1,
      enemyArmor: 0,
    })
    const baseline = clashBossesFromTerms({ playerHp: 1, enemyArmor: 0 })
    const bosses = clashBossesFromTerms(terms)
    assert.ok(
      bosses.player !== baseline.player || bosses.enemy !== baseline.enemy,
      'the show changes real Clash life',
    )
    const equipped = riotStoryDeck(
      save.riot,
      campaignSoloDeck(save, 'riot', initialDeck),
    )
    assert.equal(equipped.length, 20)
    assert.equal(new Set(equipped).size, 20)
    assert.deepEqual(soloProblems('riot', equipped), [])
    if (safety >= 3) assert.ok(equipped.includes('s1-volunteer-vest'))
    if (spectacle >= 3) assert.ok(equipped.includes('s1-blast-radius'))
    assert.deepEqual(soloStarter('riot'), initialDeck, 'starter untouched')
    const lost = resolveCampaignBattle(
      save,
      'riot',
      chapter,
      rival.foe,
      'cunning',
      'enemy',
    )
    assert.equal(lost.riot.wins, chapter, 'losing does not skip an act')
    assert.deepEqual(lost.riot.journey, save.riot.journey)
    save = resolveCampaignBattle(
      save,
      'riot',
      chapter,
      rival.foe,
      path === 'left' ? 'conviction' : 'cunning',
      'player',
    )
    assert.equal(save.riot.wins, chapter + 1)
    const options = campaignCardChoices(save, 'riot')
    assert.ok(options)
    save = chooseCampaignCard(
      save,
      'riot',
      options[path === 'left' ? 0 : 1]!.id,
    )
    assert.equal(save.riot.rewards?.length, chapter + 1)
  }
  const show = riotLedger(save.riot)
  assert.equal(show.safety, path === 'left' ? 15 : 0)
  assert.equal(show.spectacle, path === 'right' ? 15 : 0)
  assert.ok(campaignEnding(save, 'riot'))
  const epilogue = riotEpilogue(save.riot)
  assert.ok(epilogue.length > 100)
  assert.match(epilogue, path === 'left' ? /free festival/ : /licensed stage/)
  const story = newSlimeCityStory()
  story.campaigns = save
  assert.ok(validSlimeCityStory(story), 'all five acts serialize')
  const skipped = structuredClone(story)
  skipped.campaigns.riot.journey![0] = ['left']
  assert.equal(validSlimeCityStory(skipped), false, 'no truncated chapter')
  const future = structuredClone(story)
  future.campaigns.riot.journey!.push(['left'])
  assert.equal(validSlimeCityStory(future), false, 'no sixth chapter')
  const crossCrew = structuredClone(story)
  crossCrew.campaigns.exchange.journey = [[], ['left']]
  assert.equal(validSlimeCityStory(crossCrew), false, 'journals crew-scoped')
}
// A mixed show fields both story cards and stays a legal Solo deck.
const mixed = createCampaignSave()
mixed.riot.journey = [
  ['left', 'right', 'left'],
  ['right', 'left', 'right'],
]
const mixedDeck = riotStoryDeck(mixed.riot, soloStarter('riot'))
assert.ok(mixedDeck.includes('s1-volunteer-vest'))
assert.ok(mixedDeck.includes('s1-blast-radius'))
assert.deepEqual(soloProblems('riot', mixedDeck), [])
// Older saves with Anarkiss wins and no journal pick up at the right scene.
const legacy = newSlimeCityStory()
legacy.campaigns.riot.wins = 2
legacy.campaigns.riot.decisions = ['cunning', 'conviction']
assert.ok(validSlimeCityStory(legacy))
assert.equal(riotBeat(legacy.campaigns.riot)?.id, RIOT_CHAPTERS[2]![0]!.id)
console.log(
  'Anarkiss THE BEAUTIFUL CATASTROPHE: 15 festival scenes, 30 decisions, Safety/Spectacle meter, real boss effects, story deck, save/retry, legacy saves PASS',
)
