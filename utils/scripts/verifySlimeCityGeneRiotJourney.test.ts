import assert from 'node:assert/strict'
import {
  FACTION_CAMPAIGNS,
  campaignEnding,
  createCampaignSave,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  GENE_RIOT_CHAPTERS,
  chooseGeneRiotScene,
  geneRiotBattleTerms,
  geneRiotEpilogue,
  geneRiotLastOutcome,
  geneRiotScene,
  geneRiotSceneText,
} from '../slimeCity/campaignGeneRiot'
import {
  campaignCardChoices,
  chooseCampaignCard,
  campaignSoloDeck,
} from '../slimeCity/campaignCardRewards'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { soloProblems, soloStarter } from '../slimeCity/alliance'

assert.equal(GENE_RIOT_CHAPTERS.length, 5)
assert.equal(GENE_RIOT_CHAPTERS.flat().length, 15)
assert.equal(
  new Set(GENE_RIOT_CHAPTERS.flat().map((scene) => scene.id)).size,
  15,
)
assert.equal(
  new Set(GENE_RIOT_CHAPTERS.flat().map((scene) => scene.title)).size,
  15,
)
assert.equal(
  new Set(
    GENE_RIOT_CHAPTERS.flat().flatMap((scene) =>
      scene.choices.map((choice) => choice.label),
    ),
  ).size,
  30,
)
for (const scenes of GENE_RIOT_CHAPTERS) {
  assert.equal(scenes.length, 3)
  for (const scene of scenes) {
    assert.equal(scene.choices.length, 2)
    assert.ok(
      scene.text.length > 130,
      'an original playable narrative, not a placeholder',
    )
    assert.ok(scene.choices.every((choice) => choice.outcome.length > 60))
  }
}

for (const tactic of ['left', 'right'] as const) {
  let save = createCampaignSave()
  const initial = JSON.stringify(save)
  assert.equal(geneRiotEpilogue(save.catgirls), '')
  for (let chapter = 0; chapter < 5; chapter++) {
    const current = FACTION_CAMPAIGNS.catgirls.chapters[chapter]!
    assert.equal(save.catgirls.wins, chapter)
    for (let beat = 0; beat < 3; beat++) {
      const scene = geneRiotScene(save.catgirls)
      assert.ok(scene)
      assert.equal(scene.id, GENE_RIOT_CHAPTERS[chapter]![beat]!.id)
      assert.ok(geneRiotSceneText(save.catgirls, scene).includes(scene.text))
      const serialized = JSON.stringify(save)
      const bad = chooseGeneRiotScene(save, 'hax' as 'left')
      assert.equal(bad, save, 'reject forged narrative choice')
      const next = chooseGeneRiotScene(save, tactic)
      assert.notEqual(next, save)
      assert.equal(
        JSON.stringify(save),
        serialized,
        'narrative choices are immutable',
      )
      save = next
      assert.equal(save.catgirls.journey?.[chapter]?.length, beat + 1)
      assert.equal(
        save.catgirls.wins,
        chapter,
        'scenes do not award combat victories',
      )
      assert.ok(geneRiotLastOutcome(save.catgirls)?.length)
      const story = newSlimeCityStory()
      story.campaigns = save
      assert.ok(validSlimeCityStory(story), 'every scene checkpoint saves')
      assert.equal(
        geneRiotScene(save.catgirls)?.id ?? null,
        GENE_RIOT_CHAPTERS[chapter]?.[beat + 1]?.id ?? null,
      )
    }
    const prepared = geneRiotBattleTerms(save.catgirls, { playerHp: 1 })
    const baseline = clashBossesFromTerms({ playerHp: 1 })
    const bosses = clashBossesFromTerms(prepared)
    assert.ok(
      bosses.player !== baseline.player || bosses.enemy !== baseline.enemy,
      'scene decisions change the actual SOLO CLASH boss conditions',
    )
    assert.equal(
      geneRiotScene(save.catgirls),
      null,
      'boss becomes available after 3 scenes',
    )
    const beforeLoss = save
    const lose = resolveCampaignBattle(
      save,
      'catgirls',
      chapter,
      current.foe,
      'conviction',
      'enemy',
    )
    assert.equal(lose.catgirls.wins, chapter)
    assert.deepEqual(
      lose.catgirls.journey,
      beforeLoss.catgirls.journey,
      'retry keeps decisions',
    )
    save = resolveCampaignBattle(
      save,
      'catgirls',
      chapter,
      current.foe,
      tactic === 'left' ? 'conviction' : 'cunning',
      'player',
    )
    assert.equal(save.catgirls.wins, chapter + 1)
    const options = campaignCardChoices(save, 'catgirls')
    assert.ok(options)
    assert.notEqual(options[0].id, options[1].id)
    save = chooseCampaignCard(
      save,
      'catgirls',
      options[tactic === 'left' ? 0 : 1]!.id,
    )
    assert.equal(save.catgirls.rewards?.length, chapter + 1)
    assert.equal(
      geneRiotScene(save.catgirls)?.id ?? null,
      GENE_RIOT_CHAPTERS[chapter + 1]?.[0]?.id ?? null,
    )
    const deck = campaignSoloDeck(save, 'catgirls', soloStarter('catgirls'))
    assert.equal(deck.length, 20)
    assert.deepEqual(soloProblems('catgirls', deck), [])
  }
  assert.ok(campaignEnding(save, 'catgirls'))
  assert.ok(geneRiotEpilogue(save.catgirls).length > 100)
  const story = newSlimeCityStory()
  story.campaigns = save
  assert.ok(
    validSlimeCityStory(story),
    'all 15 scenes, 5 fights and 5 card choices survive saving',
  )
  const skipped = structuredClone(story)
  skipped.campaigns.catgirls.journey![0] = ['left', 'right']
  assert.equal(
    validSlimeCityStory(skipped),
    false,
    'completed chapters cannot forge missing beats',
  )
  const future = structuredClone(story)
  future.campaigns.catgirls.journey!.push(['left'])
  assert.equal(validSlimeCityStory(future), false, 'no sixth chapter')
  const invalid = structuredClone(story)
  invalid.campaigns.exchange.journey = [[], ['left']]
  assert.equal(
    validSlimeCityStory(invalid),
    false,
    'journals stay faction-specific',
  )
  assert.equal(
    JSON.stringify(createCampaignSave()),
    initial,
    'no global save mutation',
  )
}
// Old in-progress and already-complete accounts may not have journey yet.
const legacy = newSlimeCityStory()
legacy.campaigns.catgirls.wins = 3
legacy.campaigns.catgirls.decisions = ['conviction', 'cunning', 'conviction']
assert.ok(validSlimeCityStory(legacy))
assert.equal(
  geneRiotScene(legacy.campaigns.catgirls)?.id,
  GENE_RIOT_CHAPTERS[3]![0]!.id,
)
console.log(
  'Gene Riot journey: 15 scenes, 30 unique choices, both complete narrative routes, five real victory/retry/reward cycles, boss modifiers, legacy saves, and anti-forgery PASS',
)
