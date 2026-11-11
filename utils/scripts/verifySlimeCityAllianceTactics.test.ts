// Targeted Clash smoke: lead is primarily Riot, opponent primarily Ironjaw.
// These 36 results verify mechanics, NOT faction win rates or subjective fun.
import assert from 'node:assert/strict'
import {
  allianceTacticEdge,
  allianceTacticLabel,
  type AllianceTacticalEdge,
  ALLIANCE_TACTICS,
  ALLIANCE_CHAPTER_PULSES,
} from '../slimeCity/campaignAllianceTactics'
import {
  allianceStoryBattleTerms,
  allianceStoryScene,
  chooseAllianceStory,
} from '../slimeCity/campaignAllianceJourney'
import {
  createCampaignSave,
  resolveCampaignBattle,
  FACTION_CAMPAIGNS,
} from '../slimeCity/campaign'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import {
  applyClashCommand,
  chooseClashCpu,
  createClash,
  CLASH_BOSS_HP,
} from '../slimeCity/clash'
import { allianceStarter, cpuAlliance } from '../slimeCity/alliance'
import { TEAMS } from '../slimeCity/prototypes'

assert.equal(ALLIANCE_CHAPTER_PULSES.length, 5)
assert.equal(
  new Set(Object.values(ALLIANCE_TACTICS).map((profile) => profile.name)).size,
  6,
  'each partner has a different tactical signature',
)
const signatures = new Set<string>()
for (const team of TEAMS) {
  const profile = ALLIANCE_TACTICS[team.id]
  signatures.add(JSON.stringify([profile.protect, profile.gamble]))
}
assert.equal(signatures.size, 6)

let variants = 0
for (const lead of TEAMS) {
  for (const ally of TEAMS) {
    if (lead.id === ally.id) continue
    let save = createCampaignSave()
    const profiles = new Set<string>()
    for (let chapter = 0; chapter < 5; chapter++) {
      const scene = allianceStoryScene(save, lead.id, ally.id)
      assert.ok(scene)
      const previous = save[lead.id].allianceJourney?.[chapter - 1]
      const left = allianceTacticEdge(ally.id, chapter, 'protect', previous)
      const right = allianceTacticEdge(ally.id, chapter, 'gamble', previous)
      assert.ok(left && right)
      assert.equal(scene.choices[0].terms, allianceTacticLabel(left))
      assert.equal(scene.choices[1].terms, allianceTacticLabel(right))
      assert.ok(
        left.player > right.player,
        'protection always saves more boss life',
      )
      assert.ok(
        right.enemy < left.enemy,
        'gambling always hits the opposing boss harder',
      )
      assert.ok(left.player >= 0 && left.player <= 10)
      assert.ok(left.enemy >= -2 && left.enemy <= 8)
      assert.ok(right.player < 0 && right.player >= -9)
      assert.ok(right.enemy <= -4 && right.enemy >= -14)
      profiles.add(JSON.stringify([left, right]))
      for (const pick of ['protect', 'gamble'] as const) {
        const chosen = chooseAllianceStory(save, lead.id, ally.id, pick)
        const terms = allianceStoryBattleTerms(chosen, lead.id, ally.id, {
          playerHp: 1,
          enemyArmor: -1,
        })
        const chosenEdge: AllianceTacticalEdge =
          pick === 'protect' ? left : right
        assert.equal(terms.playerBossLife, chosenEdge.player)
        assert.equal(terms.enemyBossLife, chosenEdge.enemy)
        assert.equal(terms.playerHp, 1, 'legacy stats remain unchanged')
        assert.equal(terms.enemyArmor, -1, 'old armor terms stay intact')
        const bosses = clashBossesFromTerms(terms)
        assert.equal(bosses.player, CLASH_BOSS_HP + 3 + chosenEdge.player)
        assert.equal(bosses.enemy, CLASH_BOSS_HP - 3 + chosenEdge.enemy)
        variants++
      }
      save = chooseAllianceStory(save, lead.id, ally.id, 'protect')
      const chapterData = FACTION_CAMPAIGNS[lead.id].chapters[chapter]!
      save = resolveCampaignBattle(
        save,
        lead.id,
        chapter,
        chapterData.foe,
        'conviction',
        'player',
      )
    }
    assert.equal(
      profiles.size,
      5,
      'the same ally cannot repeat the same numeric stakes in later chapters',
    )
  }
}
assert.equal(variants, 300)

let bouts = 0
const results: string[] = []
for (const ally of TEAMS) {
  const lead = ally.id === 'riot' ? 'catgirls' : 'riot'
  const enemy = ally.id === 'ironjaw' ? 'undertow' : 'ironjaw'
  for (const pick of ['protect', 'gamble'] as const) {
    for (const seed of [11, 29, 53]) {
      const save = chooseAllianceStory(
        createCampaignSave(),
        lead,
        ally.id,
        pick,
      )
      const terms = allianceStoryBattleTerms(save, lead, ally.id, {})
      const bosses = clashBossesFromTerms(terms)
      const setup = {
        bosses,
        alliance: {
          player: allianceStarter(lead, ally.id),
          enemy: cpuAlliance(enemy, seed),
        },
      }
      let game = createClash(lead, enemy, seed, setup)
      assert.equal(game.format, 'alliance')
      assert.deepEqual(game.boss, bosses)
      for (let step = 0; !game.victor && step < 2500; step++)
        game = applyClashCommand(game, chooseClashCpu(game, game.active))
      assert.ok(
        game.victor,
        'every seeded Alliance choice finishes a real Clash',
      )
      results.push(ally.id + ':' + pick + ':' + game.victor)
      bouts++
    }
  }
}
assert.equal(bouts, 36)
console.log(
  'Targeted 36-game smoke is not a faction balance sample: mostly Riot versus Ironjaw.'
)
console.log(
  'Alliance tactics: 300 partner/chapter/choice terms and 36 real Alliance ' +
    'CPU-versus-CPU Clash completions PASS; outcomes: ' +
    JSON.stringify(
      results.reduce<Record<string, number>>((counts, result) => {
        const key =
          result.split(':').slice(0, 2).join(':') + ':' + result.split(':')[2]
        counts[key] = (counts[key] ?? 0) + 1
        return counts
      }, {}),
    ),
)
