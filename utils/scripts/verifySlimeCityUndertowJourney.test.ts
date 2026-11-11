// THE CITY THAT LISTENS: the Undertow's spy story, TRUTH / LEVERAGE.
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
  UNDERTOW_CHAPTERS,
  chooseUndertowBeat,
  undertowBattleTerms,
  undertowBeat,
  undertowEpilogue,
  undertowLastOutcome,
  undertowLedger,
  undertowSceneText,
  undertowStoryDeck,
} from '../slimeCity/campaignUndertow'
import {
  campaignCardChoices,
  chooseCampaignCard,
  campaignSoloDeck,
} from '../slimeCity/campaignCardRewards'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { soloProblems, soloStarter } from '../slimeCity/alliance'

// Fifteen authored scenes, thirty distinct decisions, one story per rival.
assert.equal(UNDERTOW_CHAPTERS.length, 5)
assert.equal(UNDERTOW_CHAPTERS.flat().length, 15)
assert.equal(new Set(UNDERTOW_CHAPTERS.flat().map((s) => s.id)).size, 15)
assert.equal(
  new Set(
    UNDERTOW_CHAPTERS.flat().flatMap((beat) =>
      beat.choices.map((c) => c.label),
    ),
  ).size,
  30,
)
for (const beats of UNDERTOW_CHAPTERS) {
  assert.equal(beats.length, 3)
  for (const beat of beats) {
    assert.ok(beat.text.length > 130, beat.id + ' is a real scene')
    assert.equal(beat.choices.length, 2)
    assert.ok(beat.choices.every((choice) => choice.outcome.length > 60))
  }
}
// The world: a glam anarchy circus, a meat economy, and the other crews.
const prose = JSON.stringify(UNDERTOW_CHAPTERS)
assert.doesNotMatch(prose, /\b(ogres?|orcs?|trolls?)\b/i)
assert.match(prose, /payable in Meat/)
assert.match(prose, /Thing That Hungers/)
assert.match(prose, /frog troopers?/i)
assert.match(prose, /cold-blooded/)
assert.match(prose, /cannon/)
assert.match(prose, /Queen Pin and the Bloodfairies/)

for (const path of ['left', 'right'] as const) {
  let save = createCampaignSave()
  const initialDeck = soloStarter('undertow')
  for (let chapter = 0; chapter < 5; chapter++) {
    const rival = FACTION_CAMPAIGNS.undertow.chapters[chapter]!
    for (let sceneIndex = 0; sceneIndex < 3; sceneIndex++) {
      const beat = undertowBeat(save.undertow)
      assert.ok(beat)
      assert.equal(beat.id, UNDERTOW_CHAPTERS[chapter]![sceneIndex]!.id)
      if (chapter > 0 && sceneIndex === 0)
        assert.ok(
          undertowSceneText(save.undertow, beat).length > beat.text.length,
          'the last chapter decision changes this conversation',
        )
      const original = JSON.stringify(save)
      assert.equal(chooseUndertowBeat(save, 'forged' as 'left'), save)
      const next = chooseUndertowBeat(save, path)
      assert.equal(JSON.stringify(save), original, 'input save not mutated')
      save = next
      assert.equal(save.undertow.journey?.[chapter]?.length, sceneIndex + 1)
      assert.ok(undertowLastOutcome(save.undertow))
      const snapshot = newSlimeCityStory()
      snapshot.campaigns = save
      assert.ok(validSlimeCityStory(snapshot), 'saves after every scene')
    }
    assert.equal(undertowBeat(save.undertow), null)
    const { truth, leverage, signal } = undertowLedger(save.undertow)
    assert.equal(truth + leverage, (chapter + 1) * 3)
    assert.equal(signal, chapter < 2 ? 'static' : 'broadcast')
    const terms = undertowBattleTerms(save.undertow, {
      playerHp: 1,
      enemyArmor: 0,
    })
    const baseline = clashBossesFromTerms({ playerHp: 1, enemyArmor: 0 })
    const bosses = clashBossesFromTerms(terms)
    assert.ok(
      bosses.player !== baseline.player || bosses.enemy !== baseline.enemy,
      'the signal changes real Clash life',
    )
    const equipped = undertowStoryDeck(
      save.undertow,
      campaignSoloDeck(save, 'undertow', initialDeck),
    )
    assert.equal(equipped.length, 20)
    assert.equal(new Set(equipped).size, 20)
    assert.deepEqual(soloProblems('undertow', equipped), [])
    if (truth >= 3) assert.ok(equipped.includes('s1-floodlight-sweep'))
    if (leverage >= 3) assert.ok(equipped.includes('s1-wiretap-order'))
    if (leverage >= 9) assert.equal(terms.rivalTrap, true, 'a big hoard leaks')
    if (truth >= 6) assert.equal(terms.fewerRivals, 1, 'witnesses walk away')
    assert.deepEqual(soloStarter('undertow'), initialDeck, 'starter untouched')
    const lost = resolveCampaignBattle(
      save,
      'undertow',
      chapter,
      rival.foe,
      'cunning',
      'enemy',
    )
    assert.equal(lost.undertow.wins, chapter, 'losing does not skip an act')
    assert.deepEqual(lost.undertow.journey, save.undertow.journey)
    save = resolveCampaignBattle(
      save,
      'undertow',
      chapter,
      rival.foe,
      path === 'left' ? 'conviction' : 'cunning',
      'player',
    )
    assert.equal(save.undertow.wins, chapter + 1)
    const options = campaignCardChoices(save, 'undertow')
    assert.ok(options)
    save = chooseCampaignCard(
      save,
      'undertow',
      options[path === 'left' ? 0 : 1]!.id,
    )
    assert.equal(save.undertow.rewards?.length, chapter + 1)
  }
  const signal = undertowLedger(save.undertow)
  assert.equal(signal.truth, path === 'left' ? 15 : 0)
  assert.equal(signal.leverage, path === 'right' ? 15 : 0)
  assert.ok(campaignEnding(save, 'undertow'))
  const epilogue = undertowEpilogue(save.undertow)
  assert.ok(epilogue.length > 100)
  assert.match(epilogue, path === 'left' ? /off switch/ : /hears everything/)
  const story = newSlimeCityStory()
  story.campaigns = save
  assert.ok(validSlimeCityStory(story), 'all five acts serialize')
  const skipped = structuredClone(story)
  skipped.campaigns.undertow.journey![0] = ['left']
  assert.equal(validSlimeCityStory(skipped), false, 'no truncated chapter')
  const future = structuredClone(story)
  future.campaigns.undertow.journey!.push(['left'])
  assert.equal(validSlimeCityStory(future), false, 'no sixth chapter')
  const crossCrew = structuredClone(story)
  crossCrew.campaigns.exchange.journey = [[], ['left']]
  assert.equal(validSlimeCityStory(crossCrew), false, 'journals crew-scoped')
}
// A mixed signal fields both story cards and stays a legal Solo deck.
const mixed = createCampaignSave()
mixed.undertow.journey = [
  ['left', 'right', 'left'],
  ['right', 'left', 'right'],
]
const mixedDeck = undertowStoryDeck(mixed.undertow, soloStarter('undertow'))
assert.ok(mixedDeck.includes('s1-floodlight-sweep'))
assert.ok(mixedDeck.includes('s1-wiretap-order'))
assert.deepEqual(soloProblems('undertow', mixedDeck), [])
// Older saves with Undertow wins and no journal pick up at the right scene.
const legacy = newSlimeCityStory()
legacy.campaigns.undertow.wins = 2
legacy.campaigns.undertow.decisions = ['cunning', 'conviction']
assert.ok(validSlimeCityStory(legacy))
assert.equal(
  undertowBeat(legacy.campaigns.undertow)?.id,
  UNDERTOW_CHAPTERS[2]![0]!.id,
)
console.log(
  'Undertow THE CITY THAT LISTENS: 15 spy scenes, 30 decisions, Truth/Leverage meter, real boss effects, story deck, save/retry, legacy saves PASS',
)
