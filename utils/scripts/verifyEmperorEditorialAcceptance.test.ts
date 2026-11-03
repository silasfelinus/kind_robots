import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { ACT_ONE_LATE_QUESTS } from '../emperorOfDust/fortress/actOneLate'
import { ACT_TWO_QUESTS } from '../emperorOfDust/fortress/actTwo'
import { ACT_THREE_QUESTS } from '../emperorOfDust/fortress/actThree'
import { ACT_FOUR_QUESTS } from '../emperorOfDust/fortress/actFour'
import { ACT_FIVE_QUESTS } from '../emperorOfDust/fortress/actFive'
import { DAYS, QUEST_TEMPLATES } from '../emperorOfDust/fortress/content'
import { EPILOGUE } from '../emperorOfDust/fortress/epilogue'
import { POLICIES, playCampaign } from '../emperorOfDust/fortress/balance'
import { validateRun } from '../emperorOfDust/fortress/saves'
import { TALKS } from '../emperorOfDust/fortress/talks'
import type {
  AudienceOption,
  AudienceDef,
  FlagGate,
  QuestDef,
  SceneLine,
} from '../emperorOfDust/fortress/types'

type Scores = {
  mood: number
  clarity: number
  originality: number
  choice: number
  consequence: number
}
type Row = {
  kind:
    | 'audience'
    | 'audience-beat'
    | 'follower'
    | 'follower-beat'
    | 'quest-outcome'
    | 'quest-outcome-variant'
    | 'quest-outcome-alt'
    | 'epilogue-variant'
  id: string
  day: number
  title: string
  scores: Scores
  issues: string[]
  evidence: string
}
type Segment = Pick<AudienceDef, 'id' | 'title' | 'lines' | 'options' | 'beats'>
const quests: readonly QuestDef[] = [
  ...ACT_ONE_QUESTS,
  ...ACT_ONE_LATE_QUESTS,
  ...ACT_TWO_QUESTS,
  ...ACT_THREE_QUESTS,
  ...ACT_FOUR_QUESTS,
  ...ACT_FIVE_QUESTS,
  ...QUEST_TEMPLATES,
]
const textOf = (lines: readonly SceneLine[]) =>
  lines.map((line) => (typeof line === 'string' ? line : line.text)).join(' ')
const full = (text: string) => text.replace(/\s+/g, ' ').trim()
const clipped = (text: string) => full(text).slice(0, 115)
const allChoices = (scene: Segment): AudienceOption[] => [
  ...scene.options,
  ...(scene.beats ?? []).flatMap((beat) => beat.options),
]
const markers = [
  'door',
  'road',
  'coat',
  'hand',
  'table',
  'bell',
  'mud',
  'bread',
  'blood',
  'rain',
  'rope',
  'fire',
  'ink',
  'dust',
  'cup',
  'shoe',
  'lantern',
  'knife',
  'letter',
  'child',
  'water',
  'wall',
  'horse',
]
const hasConcreteDetail = (text: string) =>
  markers.some((word) => new RegExp(`\\b${word}s?\\b`, 'i').test(text))
const clamp = (value: number) => Math.max(1, Math.min(5, value))
const optionsKey = (option: AudienceOption) =>
  JSON.stringify({
    cost: option.requires?.cost ?? 0,
    effects: option.effects,
    postsQuests: option.postsQuests ?? [],
  })

// Only authored, declared readers are counted; dynamic engine consumers
// require separate checks. A missing static reader is a review lead, not a
// proof that a flag is unused.
const flagConsumers = new Map<string, Set<string>>()
const readGate = (gate: FlagGate | undefined, consumer: string) => {
  if (!gate) return
  for (const flag of [
    ...(gate.flags ?? []),
    ...(gate.notFlags ?? []),
    ...(gate.anyFlags ?? []),
  ]) {
    const readers = flagConsumers.get(flag) ?? new Set<string>()
    readers.add(consumer)
    flagConsumers.set(flag, readers)
  }
}
for (const day of DAYS) {
  for (const scene of day.audiences) {
    readGate(scene.requires, scene.id)
    for (const variant of scene.variants ?? []) readGate(variant, scene.id)
    for (const option of allChoices(scene))
      readGate(option.requires, `${scene.id}:${option.id}`)
    for (const beat of scene.beats ?? [])
      for (const variant of beat.variants ?? [])
        readGate(variant, `${scene.id}:${beat.id}`)
  }
}
for (const talk of TALKS) {
  readGate(talk.requires, talk.id)
  for (const option of allChoices(talk))
    readGate(option.requires, `${talk.id}:${option.id}`)
}
for (const subject of EPILOGUE)
  for (const variant of subject.variants)
    readGate(variant.when, `epilogue:${subject.id}`)
for (const quest of quests)
  for (const group of Object.values(quest.outcomeVariants ?? {}))
    for (const variant of group ?? []) readGate(variant, `quest:${quest.id}`)

const leadCounts = new Map<string, number>()
const scenes = [
  ...DAYS.flatMap((day) =>
    day.audiences.map((scene) => ({
      scene,
      day: day.day,
      kind: 'audience' as const,
    })),
  ),
  ...TALKS.map((scene) => ({
    scene,
    day: scene.fromDay,
    kind: 'follower' as const,
  })),
]
const segments = [
  ...scenes,
  ...scenes.flatMap(({ scene, day, kind }) =>
    (scene.beats ?? []).map((beat) => ({
      scene: {
        id: `${scene.id}/${beat.id}`,
        title: `${scene.title} · ${beat.id}`,
        lines: beat.lines,
        options: beat.options,
      },
      day,
      kind:
        kind === 'audience'
          ? ('audience-beat' as const)
          : ('follower-beat' as const),
    })),
  ),
]
for (const { scene } of segments) {
  const lead = clipped(textOf(scene.lines)).toLowerCase()
  leadCounts.set(lead, (leadCounts.get(lead) ?? 0) + 1)
}

const evaluateScene = (
  scene: Segment,
  day: number,
  kind: 'audience' | 'audience-beat' | 'follower' | 'follower-beat',
): Row => {
  const opening = textOf(scene.lines)
  const options = allChoices(scene)
  const terminal = options.filter((choice) => !choice.next)
  const issues: string[] = []
  if (opening.length < 170)
    issues.push('thin opening: less than 170 characters')
  if (terminal.length < 2) issues.push('fewer than two terminal choices')
  // The game displays brass through optionStakes in the choice hand.
  // Repeating that number inside the dialogue label is not required.
  const empty = options.filter((option) => !option.response.trim())
  if (empty.length)
    issues.push(`blank aftermath: ${empty.map((o) => o.id).join(', ')}`)
  const distinct = new Set(terminal.map(optionsKey)).size
  if (distinct < terminal.length)
    issues.push('two terminal choices share the same direct mechanics')
  const long = options.filter((option) => option.response.length < 55)
  if (long.length)
    issues.push(`short after-response: ${long.map((o) => o.id).join(', ')}`)
  const setFlags = [
    ...new Set(options.flatMap((option) => option.effects.flags ?? [])),
  ]
  const usedFlags = setFlags.filter((flag) => flagConsumers.has(flag))
  const unread = setFlags.filter((flag) => !flagConsumers.has(flag))
  if (unread.length)
    issues.push(
      `no literal narrative reader for flags: ${unread.slice(0, 8).join(', ')}`,
    )
  const lead = clipped(opening).toLowerCase()
  if ((leadCounts.get(lead) ?? 0) > 1)
    issues.push('opening duplicates another authored scene')
  const meaningful = terminal.filter(
    (option) =>
      Object.keys(option.effects).length > 0 || !!option.postsQuests?.length,
  ).length
  const conflicts = options.some(
    (option) =>
      Object.values(option.effects.affinity ?? {}).some((v) => v < 0) &&
      Object.values(option.effects.affinity ?? {}).some((v) => v > 0),
  )
  const scores: Scores = {
    mood: clamp(opening.length < 120 ? 2 : hasConcreteDetail(opening) ? 4 : 3),
    clarity: clamp(options.every((o) => o.label.length >= 22) ? 4 : 3),
    originality: clamp((leadCounts.get(lead) ?? 0) > 1 ? 2 : 4),
    choice: clamp(
      terminal.length < 2
        ? 2
        : distinct < terminal.length
          ? 2
          : meaningful >= 2 && conflicts
            ? 5
            : meaningful >= 2
              ? 4
              : 3,
    ),
    consequence: clamp(
      usedFlags.length >= 2
        ? 5
        : usedFlags.length === 1
          ? 4
          : meaningful >= 2
            ? 3
            : 2,
    ),
  }
  return {
    kind,
    id: scene.id,
    day,
    title: scene.title,
    scores,
    issues,
    evidence: `${clipped(opening)} | ${terminal.length} final choices; ${usedFlags.length}/${setFlags.length} set flags have authored readers`,
  }
}

const rows: Row[] = segments.map(({ scene, day, kind }) =>
  evaluateScene(scene, day, kind),
)
for (const quest of quests) {
  for (const tier of [
    'triumph',
    'success',
    'partial',
    'failure',
    'expired',
  ] as const) {
    const prose = quest.outcomes[tier] ?? ''
    const optionalTriumph = tier === 'triumph' && !prose.trim()
    const issues: string[] = []
    if (!prose.trim() && !optionalTriumph)
      issues.push('outcome tier has no authored prose')
    if (prose.length > 0 && prose.length < 100)
      issues.push('short quest outcome: less than 100 characters')
    const variantCount = quest.outcomeVariants?.[tier]?.length ?? 0
    const effect = tier === 'expired' ? quest.expired : quest.rewards[tier]
    const hasEffect = !!effect && Object.keys(effect).length > 0
    rows.push({
      kind: 'quest-outcome',
      id: `${quest.id}:${tier}`,
      day: quest.days?.[0] ?? Number(quest.id.match(/^q-d([0-9]+)/)?.[1] ?? 0),
      title: `${quest.title} · ${tier}`,
      scores: {
        mood: clamp(
          optionalTriumph ? 3 : !prose ? 1 : hasConcreteDetail(prose) ? 4 : 3,
        ),
        clarity: clamp(
          optionalTriumph ? 3 : !prose ? 1 : quest.summary.length >= 65 ? 4 : 3,
        ),
        originality: clamp(optionalTriumph ? 3 : !prose ? 1 : 3),
        choice: clamp(quest.requirements.length >= 2 ? 4 : 3),
        consequence: clamp(
          optionalTriumph ? 3 : !hasEffect ? 2 : variantCount ? 5 : 4,
        ),
      },
      issues,
      evidence: `${optionalTriumph ? '[optional tier unused]' : clipped(prose)} | ${quest.danger} danger, ${quest.requirements.length} requirements, ${variantCount} variants`,
    })
    for (const [index, variant] of (
      quest.outcomeVariants?.[tier] ?? []
    ).entries()) {
      rows.push({
        kind: 'quest-outcome-variant',
        id: `${quest.id}:${tier}:variant:${index}`,
        day:
          quest.days?.[0] ?? Number(quest.id.match(/^q-d([0-9]+)/)?.[1] ?? 0),
        title: `${quest.title} · ${tier} · flag variant ${index}`,
        scores: {
          mood: hasConcreteDetail(variant.text) ? 4 : 3,
          clarity: variant.text.length > 75 ? 4 : 3,
          originality: 3,
          choice: 3,
          consequence: 5,
        },
        issues: variant.text.length < 70 ? ['brief flag-driven outcome'] : [],
        evidence: clipped(variant.text),
      })
    }
    for (const [index, text] of (quest.outcomeAlts?.[tier] ?? []).entries()) {
      rows.push({
        kind: 'quest-outcome-alt',
        id: `${quest.id}:${tier}:alt:${index}`,
        day:
          quest.days?.[0] ?? Number(quest.id.match(/^q-d([0-9]+)/)?.[1] ?? 0),
        title: `${quest.title} · ${tier} · repeat ${index}`,
        scores: {
          mood: hasConcreteDetail(text) ? 4 : 3,
          clarity: text.length > 75 ? 4 : 3,
          originality: 3,
          choice: 3,
          consequence: 3,
        },
        issues: text.length < 70 ? ['brief repeat-outcome variant'] : [],
        evidence: clipped(text),
      })
    }
  }
}
assert.ok(
  rows
    .filter(
      (row) => row.kind === 'quest-outcome' && row.id.endsWith(':triumph'),
    )
    .every((row) => !row.issues.includes('outcome tier has no authored prose')),
  'unused optional triumph outcomes are not missing-content defects',
)
for (const subject of EPILOGUE) {
  for (const [index, variant] of subject.variants.entries()) {
    rows.push({
      kind: 'epilogue-variant',
      id: `${subject.id}:${index}`,
      day: 51,
      title: `${subject.name} · ending state ${index}`,
      scores: {
        mood: hasConcreteDetail(variant.text) ? 4 : 3,
        clarity: variant.text.length >= 75 ? 4 : 3,
        originality: 3,
        choice: 3,
        consequence: variant.when ? 5 : 3,
      },
      issues: variant.text.length < 75 ? ['thin epilogue text'] : [],
      evidence: clipped(variant.text),
    })
  }
}

const duplicateIds = rows.filter(
  (row, index) =>
    rows.findIndex(
      (other) => other.kind === row.kind && other.id === row.id,
    ) !== index,
)
assert.equal(
  duplicateIds.length,
  0,
  'every assessed item has a unique scoped identity',
)
assert.equal(new Set(DAYS.map((day) => day.day)).size, 50)
assert.equal(
  scenes.filter((s) => s.kind === 'audience').length,
  DAYS.flatMap((d) => d.audiences).length,
)
assert.equal(scenes.filter((s) => s.kind === 'follower').length, TALKS.length)
assert.equal(
  rows.filter((r) => r.kind === 'quest-outcome').length,
  quests.length * 5,
)
for (const quest of quests) {
  for (const tier of ['success', 'partial', 'failure', 'expired'] as const)
    assert.ok(
      quest.outcomes[tier]?.trim(),
      `${quest.id} must tell the player what a ${tier} result means`,
    )
}

const personas = POLICIES.filter(
  (policy) =>
    ['greedy', 'random', 'spurn-all', 'marshal', 'reckless', 'idle'].includes(
      policy.id,
    ) || policy.id.startsWith('patron:'),
)
const campaignRows: {
  persona: string
  seed: number
  ending: string
  hideout: string
  audiences: number
  talks: number
  quests: number
  deaths: number
  brass: number
  checkpoints: string[]
  timeline: string[]
}[] = []
const seenAudiences = new Set<string>()
const seenTalks = new Set<string>()
const seenQuests = new Set<string>()
const missingQuestReportTexts: string[] = []
for (const policy of personas) {
  for (const seed of [17, 41, 99]) {
    let day = 1
    let audiences = 0
    let talks = 0
    let questReports = 0
    const checkpoints: string[] = []
    const timeline: string[] = []
    const result = playCampaign(
      policy,
      seed,
      (run) => {
        assert.equal(run.day, day, `${policy.id}/${seed}: sequential dawns`)
        assert.ok(validateRun(run), `${policy.id}/${seed}: serializable dawn`)
        timeline.push(
          `DAY ${day} dawn: ${run.brass} brass, ${run.roster.filter((f) => !f.dead && !f.departed).length} at court, ${run.memorials.length} dead, ${run.flags.length} story flags`,
        )
        if ([1, 11, 21, 31, 41, 51].includes(day))
          checkpoints.push(
            `${day}:${run.brass} brass/${run.roster.filter((f) => !f.dead && !f.departed).length} at court`,
          )
        day += 1
      },
      {
        playTalks: true,
        onAudienceChoice: (sceneDay, id, option) => {
          audiences += 1
          seenAudiences.add(id)
          timeline.push(
            `DAY ${sceneDay} court ${id} /${option.id}: ${option.label}; ${full(option.response)}`,
          )
        },
        onTalkChoice: (talkDay, id, option) => {
          talks += 1
          seenTalks.add(id)
          timeline.push(
            `DAY ${talkDay} barracks ${id} /${option.id}: ${option.label}; ${full(option.response)}`,
          )
        },
        onQuestReport: (questDay, report) => {
          questReports += 1
          seenQuests.add(`${report.questId}:${report.tier}`)
          if (!report.text?.trim())
            missingQuestReportTexts.push(
              `${policy.id}/${seed} day ${questDay}: ${report.questId} / ${report.tier}`,
            )
          timeline.push(
            `DAY ${questDay} dispatch ${report.questId} => ${report.tier}: ${full(report.text ?? '')}`,
          )
        },
      },
    )
    assert.equal(day, 52, 'a persona plays all fifty days and a final dawn')
    campaignRows.push({
      persona: policy.id,
      seed,
      ending: result.ending,
      hideout: result.hideout,
      audiences,
      talks,
      quests: questReports,
      deaths: result.deaths,
      brass: result.brass,
      checkpoints,
      timeline,
    })
  }
}
assert.equal(campaignRows.length, personas.length * 3)
assert.ok(campaignRows.every((run) => run.audiences > 0))
assert.ok(
  campaignRows.some((run) => run.talks > 0),
  'a full campaign hears follower dialogue',
)
assert.ok(seenQuests.size > 0)

const unvisitedAudiences = DAYS.flatMap((day) =>
  day.audiences
    .filter((scene) => !seenAudiences.has(scene.id))
    .map((scene) => `Day ${day.day}: ${scene.id}`),
)
const unvisitedTalks = TALKS.filter((talk) => !seenTalks.has(talk.id)).map(
  (talk) => `${talk.follower}: ${talk.id}`,
)
for (const [subjectId, flag] of [
  ['rook', 'rook-honest-answer'],
  ['gate-watch', 'd43-dunmark-absolved'],
] as const) {
  assert.ok(
    EPILOGUE.find((subject) => subject.id === subjectId)?.variants.some(
      (variant) => variant.when?.flags?.includes(flag),
    ),
    `A named ending must remember ${subjectId} / ${flag}`,
  )
}

const directory = 'artifacts/emperor'
mkdirSync(directory, { recursive: true })
const suspicious = rows.filter(
  (row) =>
    Object.values(row.scores).some((score) => score <= 2) ||
    row.issues.length > 0,
)
const priority = [...suspicious]
  .sort(
    (a, b) =>
      Math.min(...Object.values(a.scores)) -
        Math.min(...Object.values(b.scores)) ||
      b.issues.length - a.issues.length ||
      a.day - b.day ||
      a.id.localeCompare(b.id),
  )
  .slice(0, 60)
const markdown = [
  '# Emperor of Dust: complete authored-content editorial screening',
  '',
  'Generated on 2026-11-02 PT. Five numbers mean mood / clarity / originality / choice / consequence (1–5).',
  '',
  '**Status: SCREENED, NOT EDITORIALLY ACCEPTED.** Numeric scores below are deterministic structural proxies, not literary judgments. A score of 4 means a signal was detected, not that a scene is emotionally compelling. All low-scoring or flagged rows need independent close reading and edited re-review before a genuine acceptance claim.',
  '',
  `Authored coverage: ${scenes.filter((s) => s.kind === 'audience').length} throne audiences, ${TALKS.length} follower talks, ${quests.length} quest definitions x 5 result tiers = ${quests.length * 5} quest-outcome slots.`,
  `Automated red flags: ${suspicious.length}/${rows.length} assessed rows; these are leads, not defects proven in play.`,
  `Seeded policy persona campaigns with barracks choices: ${campaignRows.length}; all completed 50 days and dawn 51. Visited ${seenAudiences.size} unique audiences, ${seenTalks.size} unique talks, ${seenQuests.size} distinct quest/outcome pairs.`,
  '',
  '## Complete 50-day policy-campaign traces',
  '',
  '| Policy | Seed | Ending | Hideout | Audience choices | Talk choices | Resolved quests | Deaths | Brass |',
  '| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |',
  ...campaignRows.map(
    (c) =>
      `| ${c.persona} | ${c.seed} | ${c.ending} | ${c.hideout} | ${c.audiences} | ${c.talks} | ${c.quests} | ${c.deaths} | ${c.brass} |`,
  ),
  '',
  `## Unvisited in the ${campaignRows.length} seeded campaigns`,
  '',
  `Unvisited audiences (${unvisitedAudiences.length}): ${unvisitedAudiences.join(', ') || 'none'}`,
  '',
  `Unvisited follower talks (${unvisitedTalks.length}): ${unvisitedTalks.join(', ') || 'none'}`,
  '',
  'Not visited does not mean unreachable. Conditional gates, recruitment and random seeds require targeted reachability tests.',
  '',
  '## Top 60 structural review leads',
  '',
  'The complete row-by-row census and five-axis proxy scores are in editorial-screening.json. This short worklist omits repeated low-value tables.',
  '',
  ...priority.map(
    (row) =>
      `- ${row.kind} ${row.id} (day ${row.day}): ${row.issues.join('; ') || 'low rubric signal'}; ${row.evidence}`,
  ),
  '',
  '## Acceptance still required',
  '',
  'Read every scene and branch for *meaning*, not only rule-based signals; review each quest image and result, all follower voice and absence gates, actual art placement, line-level originality, the consequences of dominant choices, and multiple independent human-style playthroughs. A robot that always chooses mechanically favorable answers is not an independent literary editor. This document does not clear any publication or subjective human gate.',
]
writeFileSync(`${directory}/editorial-screening.md`, markdown.join('\n') + '\n')
writeFileSync(
  `${directory}/editorial-campaign-transcripts.md`,
  [
    '# Seeded policy full-campaign transcripts',
    '',
    `${campaignRows.length} real-engine 50-day simulated playthroughs. Every dawn, chosen audience answer, barracks answer and quest resolution is recorded in order with complete chosen response text. Opening scene beats, alternative options and runtime variant presentation are not captured. These are deterministic policy bots, not independent human readers.`,
    '',
    ...campaignRows.flatMap((campaign) => [
      `## ${campaign.persona} · seed ${campaign.seed} · ${campaign.ending}`,
      '',
      ...campaign.timeline,
      '',
    ]),
  ].join('\n') + '\n',
)
writeFileSync(
  `${directory}/editorial-screening.json`,
  JSON.stringify(
    {
      rubric: 'deterministic proxy; not editorial acceptance',
      counts: {
        audiences: scenes.filter((s) => s.kind === 'audience').length,
        followerTalks: TALKS.length,
        quests: quests.length,
        resultSlots: quests.length * 5,
        redFlags: suspicious.length,
        assessedRows: rows.length,
        unvisitedAudiences: unvisitedAudiences.length,
        unvisitedTalks: unvisitedTalks.length,
      },
      rows,
      priorityIds: priority.map((row) => row.id),
      unvisited: { audiences: unvisitedAudiences, talks: unvisitedTalks },
      campaigns: campaignRows,
      missingQuestReportTexts,
      seen: {
        audiences: [...seenAudiences].sort(),
        talks: [...seenTalks].sort(),
        questOutcomes: [...seenQuests].sort(),
      },
    },
    null,
    2,
  ) + '\n',
)
console.log(
  'EMPEROR_EDITORIAL_SCREENING ' +
    JSON.stringify({
      scenes: scenes.length,
      individualBeats: segments.length - scenes.length,
      epilogueStates: rows.filter((r) => r.kind === 'epilogue-variant').length,
      audiences: scenes.filter((s) => s.kind === 'audience').length,
      talks: TALKS.length,
      quests: quests.length,
      assessedRows: rows.length,
      flagged: suspicious.length,
      campaigns: campaignRows.length,
      totalAudienceChoices: campaignRows.reduce((n, r) => n + r.audiences, 0),
      totalTalkChoices: campaignRows.reduce((n, r) => n + r.talks, 0),
      uniqueAudiencesVisited: seenAudiences.size,
      uniqueTalksVisited: seenTalks.size,
      uniqueQuestOutcomes: seenQuests.size,
      unvisitedAudiences: unvisitedAudiences.length,
      unvisitedTalks: unvisitedTalks.length,
      endingFamilies: [...new Set(campaignRows.map((r) => r.ending))].sort(),
      missingQuestReportTexts: [...new Set(missingQuestReportTexts)],
    }),
)
assert.deepEqual(
  [...new Set(missingQuestReportTexts)],
  [],
  'Every played quest outcome needs an actual authored line',
)
