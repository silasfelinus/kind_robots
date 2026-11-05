// Art-free, full five-act campaign playthroughs with earned story prerequisites.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { POLICIES, playCampaign } from '../emperorOfDust/fortress/balance'
import { questDef } from '../emperorOfDust/fortress/content'
import { EPILOGUE } from '../emperorOfDust/fortress/epilogue'
import { questOutcomeText } from '../emperorOfDust/fortress/engine'
import { validateRun } from '../emperorOfDust/fortress/saves'
import type { SceneLine } from '../emperorOfDust/fortress/types'

type Plan = {
  id: string
  policy: string
  choices: Record<string, readonly string[]>
  targets: readonly string[]
}
const plans: Plan[] = [
  {
    id: 'joint-relief',
    policy: 'greedy',
    choices: {
      'd07-old-houses': ['ask-chair', 'seat-for-all'],
      'd10-oath': ['ask-council', 'shared-relief'],
      'd39-congress': ['reopen-relief-oath', 'honor-relief'],
      'd47-watch-writ': ['renew-relief-charter'],
    },
    targets: [
      'd07-old-houses/seat-for-all',
      'd10-oath/shared-relief',
      'd39-congress/honor-relief',
      'd47-watch-writ/renew-relief-charter',
    ],
  },
  {
    id: 'joint-accountability',
    policy: 'patron:freeholds',
    choices: {
      'd07-old-houses': ['ask-chair', 'seat-for-all'],
      'd10-oath': ['ask-council', 'shared-account'],
      'd39-congress': ['reopen-account-oath', 'publish-watch-roll'],
      'd47-watch-writ': ['bind-watch-roll'],
    },
    targets: [
      'd07-old-houses/seat-for-all',
      'd10-oath/shared-account',
      'd39-congress/publish-watch-roll',
      'd47-watch-writ/bind-watch-roll',
    ],
  },
  {
    id: 'joint-house-veto',
    policy: 'spurn-all',
    choices: {
      'd07-old-houses': ['ask-chair', 'seat-for-all'],
      'd10-oath': ['ask-council', 'house-veto'],
      'd39-congress': ['reopen-veto-oath', 'break-house-veto'],
      'd47-watch-writ': ['village-captains'],
    },
    targets: [
      'd07-old-houses/seat-for-all',
      'd10-oath/house-veto',
      'd39-congress/break-house-veto',
      'd47-watch-writ/village-captains',
    ],
  },
  {
    id: 'rations-bought',
    policy: 'greedy',
    choices: {
      'd05-flour': ['ration'],
      'd07-old-houses': ['ask-bread', 'buy-rations'],
      'd10-thistledown': ['bread-carts'],
    },
    targets: [
      'd05-flour/ration',
      'd07-old-houses/buy-rations',
      'd10-thistledown/bread-carts',
    ],
  },
  {
    id: 'rations-for-chair',
    policy: 'patron:moles',
    choices: {
      'd05-flour': ['ration'],
      'd07-old-houses': ['ask-bread', 'seat-for-grain'],
      'd10-thistledown': ['house-wagons'],
    },
    targets: [
      'd05-flour/ration',
      'd07-old-houses/seat-for-grain',
      'd10-thistledown/house-wagons',
    ],
  },
  {
    id: 'rations-continued',
    policy: 'idle',
    choices: {
      'd05-flour': ['ration'],
      'd07-old-houses': ['ask-bread', 'keep-ration'],
      'd10-thistledown': ['watch-rations'],
    },
    targets: [
      'd05-flour/ration',
      'd07-old-houses/keep-ration',
      'd10-thistledown/watch-rations',
    ],
  },
  {
    id: 'blankets-restored',
    policy: 'patron:freeholds',
    choices: {
      'd06-market-charter': ['ask-stalls', 'charter'],
      'd08-blanket-evictions': ['ask-rent', 'buy-back'],
      'd10-thistledown': ['restored-market-guides'],
    },
    targets: [
      'd06-market-charter/charter',
      'd08-blanket-evictions/buy-back',
      'd10-thistledown/restored-market-guides',
    ],
  },
  {
    id: 'blankets-leased',
    policy: 'patron:storm-crows',
    choices: {
      'd06-market-charter': ['ask-stalls', 'charter'],
      'd08-blanket-evictions': ['ask-rent', 'lease-week'],
      'd10-thistledown': ['leased-market-guides'],
    },
    targets: [
      'd06-market-charter/charter',
      'd08-blanket-evictions/lease-week',
      'd10-thistledown/leased-market-guides',
    ],
  },
  {
    id: 'blankets-evicted',
    policy: 'marshal',
    choices: {
      'd06-market-charter': ['ask-stalls', 'charter'],
      'd08-blanket-evictions': ['ask-rent', 'enforce-charter'],
      'd10-thistledown': ['evicted-market-guides'],
    },
    targets: [
      'd06-market-charter/charter',
      'd08-blanket-evictions/enforce-charter',
      'd10-thistledown/evicted-market-guides',
    ],
  },
]
const prose = (lines: readonly SceneLine[]) =>
  lines
    .map((line) =>
      typeof line === 'string' ? line : line.who + ': ' + line.text,
    )
    .join(' | ')

const thistledown = questDef('q-d10-freehold-raid')!
assert.ok(thistledown)
for (const [flag, marker] of [
  ['d10-open-council-relief', 'Dunmark'],
  ['d10-open-council-account', 'names'],
  ['d10-open-council-veto', 'Vask'],
] as const) {
  const distinct = questOutcomeText({ flags: [flag] }, thistledown, 'success')
  assert.match(distinct, new RegExp(marker))
  const combined = questOutcomeText(
    { flags: [flag, 'd09-farmers-fed'] },
    thistledown,
    'success',
  )
  assert.match(combined, /Hill farmers|hill farmers/)
  assert.match(combined, new RegExp(marker))
}
const watchEpilogue = EPILOGUE.find((subject) => subject.id === 'gate-watch')!
for (const [flag, marker] of [
  ['d47-relief-charter-renewed', /Ash|Thistledown/],
  ['d47-watch-roll-law', /public Watch roll|names/],
  ['d47-village-captains', /elected captain/],
] as const) {
  const entry = watchEpilogue.variants.find((variant) =>
    variant.when?.flags?.includes(flag),
  )
  assert.ok(entry, flag + ': the Watch epilogue remembers the earned covenant')
  assert.match(entry.text, marker)
}

const campaigns: Record<string, unknown>[] = []
const failures: string[] = []
for (const plan of plans) {
  for (const seed of [17, 41]) {
    const policy = POLICIES.find((entry) => entry.id === plan.policy)!
    assert.ok(policy, plan.id + ': unknown policy')
    const choices: {
      day: number
      audience: string
      option: string
      label: string
      response: string
      brass: number
      flags: string[]
    }[] = []
    const scenes: string[] = []
    const dispatches: {
      day: number
      quest: string
      tier: string
      text: string
    }[] = []
    const barracks: { day: number; talk: string; option: string }[] = []
    const actCounts = Array.from({ length: 5 }, (_, i) => ({
      act: i + 1,
      choices: 0,
      talks: 0,
      quests: 0,
    }))
    const snapshots: string[] = []
    let lethalDispatches = 0
    let lethalPartialOrFailure = 0
    const questAid: string[] = []
    let dawns = 0
    const result = playCampaign(
      policy,
      seed,
      (run) => {
        dawns += 1
        assert.equal(run.day, dawns, plan.id + '/' + seed + ': sequential dawn')
        assert.ok(validateRun(run), plan.id + '/' + seed + ': valid save')
        if ([1, 5, 7, 8, 10, 11, 20, 30, 40, 41, 50, 51].includes(run.day))
          snapshots.push(
            'D' +
              run.day +
              ': ' +
              run.brass +
              ' brass, ' +
              run.roster.length +
              ' recruits, ' +
              run.memorials.length +
              ' dead, ' +
              run.flags.length +
              ' flags',
          )
      },
      {
        playTalks: true,
        playChanceEvents: true,
        selectAudienceChoice: (_day, id, open) =>
          plan.choices[id]?.find((optionId) =>
            open.some((option) => option.id === optionId),
          ),
        onAudienceScene: (day, id, beat, lines) => {
          if (plan.choices[id])
            scenes.push(
              'D' +
                day +
                ' ' +
                id +
                '/' +
                (beat ?? 'opening') +
                ': ' +
                prose(lines),
            )
        },
        onAudienceChoice: (day, id, option, run) => {
          actCounts[Math.min(4, Math.floor((day - 1) / 10))]!.choices += 1
          if (!plan.choices[id]) return
          choices.push({
            day,
            audience: id,
            option: option.id,
            label: option.label,
            response: option.response,
            brass: run.brass,
            flags: [...(option.effects.flags ?? [])],
          })
          if (option.effects.questAid?.length)
            questAid.push(id + '/' + option.id)
        },
        onTalkChoice: (day, id, option) => {
          actCounts[Math.min(4, Math.floor((day - 1) / 10))]!.talks += 1
          barracks.push({ day, talk: id, option: option.id })
          assert.ok(option.response.trim(), id + ': narration required')
        },
        onQuestReport: (day, report) => {
          actCounts[Math.min(4, Math.floor((day - 1) / 10))]!.quests += 1
          dispatches.push({
            day,
            quest: report.questId,
            tier: report.tier,
            text: report.text ?? '',
          })
          if (questDef(report.questId)?.lethal) {
            lethalDispatches += 1
            if (report.tier === 'partial' || report.tier === 'failure')
              lethalPartialOrFailure += 1
          }
          assert.ok(
            report.text?.trim(),
            plan.id + '/' + seed + ': quest outcome requires prose',
          )
        },
      },
    )
    const reached = new Set(
      choices.map((option) => option.audience + '/' + option.option),
    )
    const missingTargets = plan.targets.filter((target) => !reached.has(target))
    if (plan.id.startsWith('joint-')) {
      const report = dispatches.find(
        (entry) => entry.quest === 'q-d10-freehold-raid',
      )
      assert.ok(report, plan.id + ': Thistledown dispatch must resolve')
      const marker =
        plan.id === 'joint-relief'
          ? /Dunmark/
          : plan.id === 'joint-accountability'
            ? /list|names/
            : /Vask/
      assert.match(
        report.text,
        marker,
        plan.id + ': real played outcome must remember the Watch oath',
      )
    }
    if (dawns !== 51)
      failures.push(plan.id + '/' + seed + ': only ' + dawns + ' dawns')
    if (missingTargets.length)
      failures.push(
        plan.id + '/' + seed + ': missing ' + missingTargets.join(', '),
      )
    console.log(
      'EMPEROR_GUIDED_PLAYTHROUGH ' +
        JSON.stringify({
          id: plan.id,
          seed,
          ending: result.ending,
          hideout: result.hideout,
          dawns,
          brass: result.brass,
          deaths: result.deaths,
          quests: dispatches.length,
          talks: barracks.length,
          lethalDispatches,
          lethalPartialOrFailure,
          reached: plan.targets.length - missingTargets.length,
          missingTargets,
        }),
    )
    campaigns.push({
      id: plan.id,
      seed,
      policy: policy.id,
      ending: result.ending,
      hideout: result.hideout,
      brass: result.brass,
      deaths: result.deaths,
      loans: result.loans,
      days: dawns - 1,
      choices,
      scenes,
      dispatches,
      barracks,
      actCounts,
      questAid,
      lethalDispatches,
      lethalPartialOrFailure,
      missingTargets,
      snapshots,
    })
  }
}

/**
 * Risk diagnosis uses many seeds, not the two fixed editorial seeds.
 * Observe actual dispatched lethal quests separately from unstaffed,
 * expired notices; never invent wounds or change the danger tables.
 */
const riskSweep: {
  policy: string
  runs: number
  deaths: number
  noLosses: number
  lethalDispatches: number
  dangerousResults: number
  deathsOnGuidedSeeds: number
  endings: Record<string, number>
}[] = []
for (const policyId of ['greedy', 'random', 'marshal', 'reckless']) {
  const policy = POLICIES.find((entry) => entry.id === policyId)!
  const tally = {
    policy: policyId,
    runs: 40,
    deaths: 0,
    noLosses: 0,
    lethalDispatches: 0,
    dangerousResults: 0,
    deathsOnGuidedSeeds: 0,
    endings: {} as Record<string, number>,
  }
  for (let seed = 1; seed <= 40; seed += 1) {
    let completedDays = 0
    const result = playCampaign(
      policy,
      seed,
      (run) => {
        completedDays += 1
        assert.ok(validateRun(run), policyId + '/' + seed + ': risk sweep save')
      },
      {
        playTalks: true,
        playChanceEvents: true,
        onQuestReport: (_day, report) => {
          if (!questDef(report.questId)?.lethal || report.tier === 'expired')
            return
          tally.lethalDispatches += 1
          if (report.tier === 'failure' || report.tier === 'partial')
            tally.dangerousResults += 1
        },
      },
    )
    assert.equal(completedDays, 51, policyId + '/' + seed + ': fifty days')
    tally.deaths += result.deaths
    if (!result.deaths) tally.noLosses += 1
    if ([17, 41].includes(seed)) tally.deathsOnGuidedSeeds += result.deaths
    tally.endings[result.ending] = (tally.endings[result.ending] ?? 0) + 1
  }
  riskSweep.push(tally)
}
assert.ok(riskSweep.every((entry) => entry.lethalDispatches > 0))
assert.ok(
  riskSweep.find((entry) => entry.policy === 'reckless')!.deaths > 0,
  'reckless campaigns must expose real follower death risk',
)
console.log('EMPEROR_RISK_AUDIT ' + JSON.stringify(riskSweep))

mkdirSync('artifacts/emperor', { recursive: true })
writeFileSync(
  'artifacts/emperor/editorial-guided-campaigns.json',
  JSON.stringify(
    {
      method:
        'Real five-act engine, nine guided choice families times two seeds, ' +
        'no invented flags, followers, budgets or quest results',
      campaigns,
      riskSweep,
      failures,
    },
    null,
    2,
  ) + '\n',
)
console.log(
  'EMPEROR_GUIDED_SUMMARY ' +
    JSON.stringify({
      campaigns: campaigns.length,
      days: campaigns.reduce((total, c) => total + Number(c.days), 0),
      failures,
    }),
)
assert.deepEqual(failures, [], 'all earned paths need complete campaigns')
