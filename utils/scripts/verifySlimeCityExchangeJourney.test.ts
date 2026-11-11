// THE BOOK OF FLESH: the Meat Exchange's occult story, MERCY / APPETITE.
// The sixth and last crew campaign (Silas, 2026-11-10 PT: "the meat merchants
// need a real lovecraftian vibe, a lot dark"). Follows THE CITY THAT LISTENS.
import assert from 'node:assert/strict'
import {
  FACTION_CAMPAIGNS,
  campaignEnding,
  createCampaignSave,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  EXCHANGE_CHAPTERS,
  chooseExchangeBeat,
  exchangeBattleTerms,
  exchangeBeat,
  exchangeEpilogue,
  exchangeLastOutcome,
  exchangeLedger,
  exchangeSceneText,
  exchangeStoryDeck,
} from '../slimeCity/campaignExchange'
import {
  campaignCardChoices,
  chooseCampaignCard,
  campaignSoloDeck,
} from '../slimeCity/campaignCardRewards'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { soloProblems, soloStarter } from '../slimeCity/alliance'

// Fifteen authored scenes, thirty distinct decisions, one story per rival.
assert.equal(EXCHANGE_CHAPTERS.length, 5)
assert.equal(EXCHANGE_CHAPTERS.flat().length, 15)
assert.equal(new Set(EXCHANGE_CHAPTERS.flat().map((s) => s.id)).size, 15)
assert.equal(
  new Set(
    EXCHANGE_CHAPTERS.flat().flatMap((beat) =>
      beat.choices.map((c) => c.label),
    ),
  ).size,
  30,
)
for (const beats of EXCHANGE_CHAPTERS) {
  assert.equal(beats.length, 3)
  for (const beat of beats) {
    assert.ok(beat.text.length > 130, beat.id + ' is a real scene')
    assert.equal(beat.choices.length, 2)
    assert.ok(beat.choices.every((choice) => choice.outcome.length > 60))
  }
}
// The world: a drowned butcher-priesthood, a meat economy, the other crews.
const prose = JSON.stringify(EXCHANGE_CHAPTERS)
assert.doesNotMatch(prose, /\b(ogres?|orcs?|trolls?)\b/i)
assert.doesNotMatch(prose, /\b(bros?|gangsters?)\b/i)
assert.match(prose, /payable in Meat/)
assert.match(prose, /Thing That Hungers/i)
assert.match(prose, /Book of Flesh/)
assert.match(prose, /butcher-priest/)
assert.match(prose, /cold-blooded/)
assert.match(prose, /frog troopers?/i)
assert.match(prose, /Queen Pin and the Bloodfairies/)

for (const path of ['left', 'right'] as const) {
  let save = createCampaignSave()
  const initialDeck = soloStarter('exchange')
  for (let chapter = 0; chapter < 5; chapter++) {
    const rival = FACTION_CAMPAIGNS.exchange.chapters[chapter]!
    for (let sceneIndex = 0; sceneIndex < 3; sceneIndex++) {
      const beat = exchangeBeat(save.exchange)
      assert.ok(beat)
      assert.equal(beat.id, EXCHANGE_CHAPTERS[chapter]![sceneIndex]!.id)
      if (chapter > 0 && sceneIndex === 0)
        assert.ok(
          exchangeSceneText(save.exchange, beat).length > beat.text.length,
          'the last chapter decision changes this conversation',
        )
      const original = JSON.stringify(save)
      assert.equal(chooseExchangeBeat(save, 'forged' as 'left'), save)
      const next = chooseExchangeBeat(save, path)
      assert.equal(JSON.stringify(save), original, 'input save not mutated')
      save = next
      assert.equal(save.exchange.journey?.[chapter]?.length, sceneIndex + 1)
      assert.ok(exchangeLastOutcome(save.exchange))
      const snapshot = newSlimeCityStory()
      snapshot.campaigns = save
      assert.ok(validSlimeCityStory(snapshot), 'saves after every scene')
    }
    assert.equal(exchangeBeat(save.exchange), null)
    const { mercy, appetite, rite } = exchangeLedger(save.exchange)
    assert.equal(mercy + appetite, (chapter + 1) * 3)
    assert.equal(rite, chapter < 2 ? 'tithe' : 'reckoning')
    const terms = exchangeBattleTerms(save.exchange, {
      playerHp: 1,
      enemyArmor: 0,
    })
    const baseline = clashBossesFromTerms({ playerHp: 1, enemyArmor: 0 })
    const bosses = clashBossesFromTerms(terms)
    assert.ok(
      bosses.player !== baseline.player || bosses.enemy !== baseline.enemy,
      'the Book changes real Clash life',
    )
    const equipped = exchangeStoryDeck(
      save.exchange,
      campaignSoloDeck(save, 'exchange', initialDeck),
    )
    assert.equal(equipped.length, 20)
    assert.equal(new Set(equipped).size, 20)
    assert.deepEqual(soloProblems('exchange', equipped), [])
    if (mercy >= 3)
      assert.ok(equipped.includes('s2-exchange-contract-amendment'))
    if (appetite >= 3) assert.ok(equipped.includes('s1-margin-call'))
    if (appetite >= 9)
      assert.equal(terms.enemyMana, 1, 'the Thing collects from both sides')
    if (mercy >= 6)
      assert.equal(terms.fewerRivals, 1, 'a forgiven collector quits')
    assert.deepEqual(soloStarter('exchange'), initialDeck, 'starter untouched')
    const lost = resolveCampaignBattle(
      save,
      'exchange',
      chapter,
      rival.foe,
      'cunning',
      'enemy',
    )
    assert.equal(lost.exchange.wins, chapter, 'losing does not skip an act')
    assert.deepEqual(lost.exchange.journey, save.exchange.journey)
    save = resolveCampaignBattle(
      save,
      'exchange',
      chapter,
      rival.foe,
      path === 'left' ? 'conviction' : 'cunning',
      'player',
    )
    assert.equal(save.exchange.wins, chapter + 1)
    const options = campaignCardChoices(save, 'exchange')
    assert.ok(options)
    save = chooseCampaignCard(
      save,
      'exchange',
      options[path === 'left' ? 0 : 1]!.id,
    )
    assert.equal(save.exchange.rewards?.length, chapter + 1)
  }
  const rite = exchangeLedger(save.exchange)
  assert.equal(rite.mercy, path === 'left' ? 15 : 0)
  assert.equal(rite.appetite, path === 'right' ? 15 : 0)
  assert.ok(campaignEnding(save, 'exchange'))
  const epilogue = exchangeEpilogue(save.exchange)
  assert.ok(epilogue.length > 100)
  assert.match(
    epilogue,
    path === 'left' ? /Book of Flesh is shut/ : /sleeps well fed/,
  )
  const story = newSlimeCityStory()
  story.campaigns = save
  assert.ok(validSlimeCityStory(story), 'all five acts serialize')
  const skipped = structuredClone(story)
  skipped.campaigns.exchange.journey![0] = ['left']
  assert.equal(validSlimeCityStory(skipped), false, 'no truncated chapter')
  const future = structuredClone(story)
  future.campaigns.exchange.journey!.push(['left'])
  assert.equal(validSlimeCityStory(future), false, 'no sixth chapter')
  const crossCrew = structuredClone(story)
  crossCrew.campaigns.undertow.journey = [[], ['left']]
  assert.equal(validSlimeCityStory(crossCrew), false, 'journals crew-scoped')
}
// A mixed rite fields both story cards and stays a legal Solo deck.
const mixed = createCampaignSave()
mixed.exchange.journey = [
  ['left', 'right', 'left'],
  ['right', 'left', 'right'],
]
const mixedDeck = exchangeStoryDeck(mixed.exchange, soloStarter('exchange'))
assert.ok(mixedDeck.includes('s2-exchange-contract-amendment'))
assert.ok(mixedDeck.includes('s1-margin-call'))
assert.deepEqual(soloProblems('exchange', mixedDeck), [])
// Older saves with Exchange wins and no journal pick up at the right scene.
const legacy = newSlimeCityStory()
legacy.campaigns.exchange.wins = 2
legacy.campaigns.exchange.decisions = ['cunning', 'conviction']
assert.ok(validSlimeCityStory(legacy))
assert.equal(
  exchangeBeat(legacy.campaigns.exchange)?.id,
  EXCHANGE_CHAPTERS[2]![0]!.id,
)
console.log(
  'Meat Exchange THE BOOK OF FLESH: 15 occult scenes, 30 decisions, Mercy/Appetite meter, real boss effects, story deck, save/retry, legacy saves PASS',
)
