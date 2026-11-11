import assert from 'node:assert/strict'
import {
  FACTION_CAMPAIGNS,
  campaignEnding,
  createCampaignSave,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  BLOODFAIRY_CHAPTERS,
  bloodfairyBattleTerms,
  bloodfairyBeat,
  bloodfairyEpilogue,
  bloodfairyLastOutcome,
  bloodfairyLedger,
  bloodfairySceneText,
  bloodfairyStageThreeReveal,
  bloodfairyStoryDeck,
  chooseBloodfairyBeat,
} from '../slimeCity/campaignBloodfairies'
import { clashEvolutionChoice } from '../slimeCity/clashEvolutions'
import {
  campaignCardChoices,
  chooseCampaignCard,
  campaignSoloDeck,
} from '../slimeCity/campaignCardRewards'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { soloProblems, soloStarter } from '../slimeCity/alliance'

assert.equal(BLOODFAIRY_CHAPTERS.length, 5)
assert.equal(BLOODFAIRY_CHAPTERS.flat().length, 15)
assert.equal(
  new Set(BLOODFAIRY_CHAPTERS.flat().map((scene) => scene.id)).size,
  15,
)
assert.equal(
  new Set(
    BLOODFAIRY_CHAPTERS.flat().flatMap((beat) =>
      beat.choices.map((c) => c.label),
    ),
  ).size,
  30,
)
for (const beats of BLOODFAIRY_CHAPTERS) {
  assert.equal(beats.length, 3)
  for (const beat of beats) {
    assert.ok(beat.text.length > 130)
    assert.equal(beat.choices.length, 2)
    assert.ok(beat.choices.every((choice) => choice.outcome.length > 60))
  }
}
// Real Clash Level 3 data: two distinct choices, not free power granted in Story.
const choir = clashEvolutionChoice('s1-riot-choir', 3)
assert.ok(choir)
assert.equal(choir[0].title, 'Wall of Sound')
assert.equal(choir[1].title, 'Backup Singers')
assert.equal(clashEvolutionChoice('s1-riot-choir', 1), undefined)

for (const path of ['left', 'right'] as const) {
  let save = createCampaignSave()
  const initialDeck = soloStarter('bloodfairies')
  for (let chapter = 0; chapter < 5; chapter++) {
    const rival = FACTION_CAMPAIGNS.bloodfairies.chapters[chapter]!
    for (let sceneIndex = 0; sceneIndex < 3; sceneIndex++) {
      const beat = bloodfairyBeat(save.bloodfairies)
      assert.ok(beat)
      assert.equal(beat.id, BLOODFAIRY_CHAPTERS[chapter]![sceneIndex]!.id)
      if (chapter > 0 && sceneIndex === 0) {
        assert.ok(
          bloodfairySceneText(save.bloodfairies, beat).length >
            beat.text.length,
          "previous chapter decisions change this chapter's conversation",
        )
      }
      const reveal = bloodfairyStageThreeReveal(save.bloodfairies)
      assert.equal(reveal, chapter === 2 && sceneIndex === 2)
      const original = JSON.stringify(save)
      assert.equal(chooseBloodfairyBeat(save, 'forged' as 'left'), save)
      const next = chooseBloodfairyBeat(save, path)
      assert.equal(
        JSON.stringify(save),
        original,
        'choice does not mutate save input',
      )
      save = next
      assert.ok(JSON.stringify(save) !== original)
      assert.equal(save.bloodfairies.journey?.[chapter]?.length, sceneIndex + 1)
      assert.ok(bloodfairyLastOutcome(save.bloodfairies))
      const snapshot = newSlimeCityStory()
      snapshot.campaigns = save
      assert.ok(
        validSlimeCityStory(snapshot),
        'save after every authored scene',
      )
    }
    assert.equal(bloodfairyBeat(save.bloodfairies), null)
    const { voices, volume, stage } = bloodfairyLedger(save.bloodfairies)
    assert.equal(voices + volume, (chapter + 1) * 3)
    assert.equal(stage, chapter < 2 ? 'chorus' : 'anthem')
    const terms = bloodfairyBattleTerms(save.bloodfairies, {
      playerHp: 1,
      enemyArmor: 0,
    })
    const baseline = clashBossesFromTerms({ playerHp: 1, enemyArmor: 0 })
    const bosses = clashBossesFromTerms(terms)
    assert.ok(
      bosses.player !== baseline.player || bosses.enemy !== baseline.enemy,
      'cumulative choir choices change real Clash life',
    )
    const equipped = bloodfairyStoryDeck(
      save.bloodfairies,
      campaignSoloDeck(save, 'bloodfairies', initialDeck),
    )
    assert.equal(equipped.length, 20)
    assert.equal(new Set(equipped).size, 20)
    assert.deepEqual(soloProblems('bloodfairies', equipped), [])
    if (voices >= 3) assert.ok(equipped.includes('s1-riot-choir'))
    if (volume >= 3)
      assert.ok(equipped.includes('s2-bloodfairies-bassquake-colossus'))
    assert.deepEqual(
      soloStarter('bloodfairies'),
      initialDeck,
      'account/starter is unmodified',
    )
    const defeated = resolveCampaignBattle(
      save,
      'bloodfairies',
      chapter,
      rival.foe,
      'cunning',
      'enemy',
    )
    assert.equal(
      defeated.bloodfairies.wins,
      chapter,
      'losing does not skip an act',
    )
    assert.deepEqual(defeated.bloodfairies.journey, save.bloodfairies.journey)
    save = resolveCampaignBattle(
      save,
      'bloodfairies',
      chapter,
      rival.foe,
      path === 'left' ? 'conviction' : 'cunning',
      'player',
    )
    assert.equal(save.bloodfairies.wins, chapter + 1)
    const options = campaignCardChoices(save, 'bloodfairies')
    assert.ok(options)
    assert.equal(options.length, 2)
    save = chooseCampaignCard(
      save,
      'bloodfairies',
      options[path === 'left' ? 0 : 1]!.id,
    )
    assert.equal(save.bloodfairies.rewards?.length, chapter + 1)
  }
  const chorus = bloodfairyLedger(save.bloodfairies)
  assert.equal(chorus.voices, path === 'left' ? 15 : 0)
  assert.equal(chorus.volume, path === 'right' ? 15 : 0)
  assert.ok(campaignEnding(save, 'bloodfairies'))
  assert.ok(bloodfairyEpilogue(save.bloodfairies).length > 100)
  const story = newSlimeCityStory()
  story.campaigns = save
  assert.ok(validSlimeCityStory(story), 'all five acts and rewards serialize')
  const skipped = structuredClone(story)
  skipped.campaigns.bloodfairies.journey![0] = ['left']
  assert.equal(
    validSlimeCityStory(skipped),
    false,
    'reject truncated completed chapter',
  )
  const future = structuredClone(story)
  future.campaigns.bloodfairies.journey!.push(['left'])
  assert.equal(
    validSlimeCityStory(future),
    false,
    'reject an invented sixth chapter',
  )
  const crossCrew = structuredClone(story)
  crossCrew.campaigns.exchange.journey = [['left']]
  assert.equal(
    validSlimeCityStory(crossCrew),
    false,
    'journals are crew-scoped',
  )
}
// A legal mixed setlist plays both crowd and pressure strategies together.
const mixed = createCampaignSave()
mixed.bloodfairies.journey = [
  ['left', 'right', 'left'],
  ['right', 'left', 'right'],
]
const mixedDeck = bloodfairyStoryDeck(
  mixed.bloodfairies,
  soloStarter('bloodfairies'),
)
assert.ok(mixedDeck.includes('s1-riot-choir'))
assert.ok(mixedDeck.includes('s2-bloodfairies-bassquake-colossus'))
assert.deepEqual(soloProblems('bloodfairies', mixedDeck), [])
const legacy = newSlimeCityStory()
legacy.campaigns.bloodfairies.wins = 2
legacy.campaigns.bloodfairies.decisions = ['cunning', 'conviction']
assert.ok(validSlimeCityStory(legacy))
assert.equal(
  bloodfairyBeat(legacy.campaigns.bloodfairies)?.id,
  BLOODFAIRY_CHAPTERS[2]![0]!.id,
)
console.log(
  'Bloodfairy Moshpit Republic: 15 authored scenes, 30 decisions, Stage 3 evolution reveal, two complete routes, coalition deckbuilding, real boss effects, save/retry, no free-card forging PASS',
)
