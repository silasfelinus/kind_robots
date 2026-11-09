import assert from 'node:assert/strict'
import { TEAMS } from '../slimeCity/prototypes'
import { rarityOf } from '../slimeCity/progression'
import { createCampaignSave } from '../slimeCity/campaign'
import {
  campaignCardChoices,
  campaignSoloDeck,
  chooseCampaignCard,
} from '../slimeCity/campaignCardRewards'
import { soloStarter, soloProblems } from '../slimeCity/alliance'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'

for (const { id: team } of TEAMS) {
  let save = createCampaignSave()
  const founder = soloStarter(team)
  for (let chapter = 1; chapter <= 5; chapter++) {
    save = {
      ...save,
      [team]: {
        ...save[team],
        wins: chapter,
        decisions: Array.from({ length: chapter }, () => 'conviction' as const),
        lastResult: 'player',
      },
    }
    const options = campaignCardChoices(save, team)
    assert.ok(options, team + ' chapter ' + chapter + ' offers two cards')
    assert.equal(new Set(options.map((card) => card.id)).size, 2)
    if (chapter >= 3) {
      assert.ok(
        options.some((card) => rarityOf(card) === 'rare'),
        'later story victories include a rare option',
      )
    }
    assert.deepEqual(campaignCardChoices(save, team), options, 'stable options')
    const snapshot = JSON.stringify(save)
    assert.equal(chooseCampaignCard(save, team, 'forged-id'), save)
    assert.equal(JSON.stringify(save), snapshot, 'no mutation on rejection')
    save = chooseCampaignCard(save, team, options[chapter % 2]!.id)
    assert.equal(save[team].rewards?.length, chapter)
    assert.equal(campaignCardChoices(save, team), null, 'exactly once per win')
    const deck = campaignSoloDeck(save, team, founder)
    assert.equal(deck.length, 20)
    assert.equal(new Set(deck).size, 20)
    assert.deepEqual(soloProblems(team, deck), [])
    assert.ok(deck.includes(save[team].rewards![chapter - 1]!))
    assert.deepEqual(
      founder,
      soloStarter(team),
      'campaign drafting cannot mutate the default or account loadout',
    )
    const story = newSlimeCityStory()
    story.campaigns = save
    assert.ok(validSlimeCityStory(story), 'chosen reward saves to story')
    const tampered = structuredClone(story)
    tampered.campaigns[team].rewards![chapter - 1] = 'pounce'
    assert.ok(!validSlimeCityStory(tampered), 'reject forged reward choice')
  }
}
console.log(
  'Slime City story rewards: six distinct deterministic five-chapter drafts, rare options, saved eligibility and legal Solo decks PASS',
)
