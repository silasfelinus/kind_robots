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
  TalkDef,
} from '../emperorOfDust/fortress/types'

type Scores = {
  mood: number
  clarity: number
  originality: number
  choice: number
  consequence: number
}
type Row = {
  kind: 'audience' | 'follower' | 'quest-outcome'
  id: string
  day: number
  title: string
  scores: Scores
  issues: string[]
  evidence: string
}
type Scene = AudienceDef | TalkDef
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
const clipped = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 115)
const allChoices = (scene: Scene): AudienceOption[] => [
  ...scene.options,
  ...(scene.beats ?? []).flatMap((beat) => beat.options),
]
const markers = [
  'door', 'road', 'coat', 'hand', 'table', 'bell', 'mud', 'bread',
  'blood', 'rain', 'rope', 'fire', 'ink', 'dust', 'cup', 'shoe',
  'lantern', 'knife', 'letter', 'child', 'water', 'wall', 'horse',
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
    for (const variant of group ?? [])
      readGate(variant, `quest:${quest.id}`)

const leadCounts = new Map<string, number>()
const scenes = [
  ...DAYS.flatMap((day) =>
    day.audiences.map((scene) => ({ scene, day: day.day, kind: 'audience' as const })),
  ),
  ...TALKS.map((scene) => ({
    scene,
    day: scene.fromDay,
    kind: 'follower' as const,
  })),
]
for (const { scene } of scenes) {
  const lead = clipped(textOf(scene.lines)).toLowerCase()
  leadCounts.set(lead, (leadCounts.get(lead) ?? 0) + 1)
}

const evaluateScene = (
  scene: Scene,
  day: number,
  kind: 'audience' | 'follower',
): Row => {
  const opening = textOf(scene.lines)
  const options = allChoices(scene)
  const terminal = options.filter((choice) => !choice.next)
  const issues: string[] = []
  if (opening.length < 170) issues.push('thin opening: less than 170 characters')
  if (terminal.length < 2) issues.push('fewer than two terminal choices')
  const undisclosed = options.filter(
    (option) =>
      (option.requires?.cost ?? 0) > 0 &&
      !new RegExp(`\\b${option.requires?.cost}\\b`).test(option.label),
  )
  if (undisclosed.length)
    issues.push(`cost not stated numerically: ${undisclosed.map((o) => o.id).join(', ')}`)
  const empty = options.filter((option) => !option.response.trim())
  if (empty.length)
    issues.push(`blank aftermath: ${empty.map((o) => o.id).join(', ')}`)
  const distinct = new Set(terminal.map(optionsKey)).size
  if (distinct < terminal.length)
    issues.push('two terminal choices share the same direct mechanics')
  const long = options.filter((option) => option.response.length < 55)
  if (long.length)
    issues.push(`short after-response: ${long.map((o) => o.id).join(', ')}`)
  const setFlags = [...new Set(options.flatMap((option) => option.effects.flags ?? []))]
  const usedFlags = setFlags.filter((flag) => flagConsumers.has(flag))
  const unread = setFlags.filter((flag) => !flagConsumers.has(flag))
  if (unread.length)
    issues.push(`no literal narrative reader for flags: ${unread.slice(0, 8).join(', ')}`)
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
    clarity: clamp(undisclosed.length ? 2 : options.every((o) => o.label.length >= 22) ? 4 : 3),
    originality: clamp((leadCounts.get(lead) ?? 0) > 1 ? 2 : 4),
    choice: clamp(terminal.length < 2 ? 2 : distinct < terminal.length ? 2 : meaningful >= 2 && conflicts ? 5 : meaningful >= 2 ? 4 : 3),
    consequence: clamp(usedFlags.length >= 2 ? 5 : usedFlags.length === 1 ? 4 : meaningful >= 2 ? 3 : 2),
  }
  return {
    kind, id: scene.id, day,
    title: scene.title,
    scores, issues,
    evidence: `${clipped(opening)} | ${terminal.length} final choices; ${usedFlags.length}/${setFlags.length} set flags have authored readers`,
  }
}

const rows: Row[] = scenes.map(({ scene, day, kind }) =>
  evaluateScene(scene, day, kind),
)
for (const quest of quests) {
  for (const tier of ['triumph', 'success', 'partial', 'failure', 'expired'] as const) {
    const prose = quest.outcomes[tier] ?? ''
    const issues: string[] = []
    if (!prose.trim()) issues.push('outcome tier has no authored prose')
    if (prose.length > 0 && prose.length < 100)
      issues.push('short quest outcome: less than 100 characters')
    const variantCount = quest.outcomeVariants?.[tier]?.length ?? 0
    const effect = tier === 'expired' ? quest.expired : quest.rewards[tier]
    const hasEffect = !!effect && Object.keys(effect).length > 0
    rows.push({
      kind: 'quest-outcome',
      id: `${quest.id}:${tier}`,
      day: quest.days?.[0] ?? Number(quest.id.match(/^q-d(\\d+)/)?.[1] ?? 0),
      title: `${quest.title} · ${tier}`,
      scores: {
        mood: clamp(!prose ? 1 : hasConcreteDetail(prose) ? 4 : 3),
        clarity: clamp(!prose ? 1 : quest.summary.length >= 65 ? 4 : 3),
        originality: clamp(!prose ? 1 : 3),
        choice: clamp(quest.requirements.length >= 2 ? 4 : 3),
        consequence: clamp(!hasEffect ? 2 : variantCount ? 5 : 4),
      },
      issues,
      evidence: `${clipped(prose)} | ${quest.danger} danger, ${quest.requirements.length} requirements, ${variantCount} variants`,
    })
  }
}

const duplicateIds = rows.filter(
  (row, index) => rows.findIndex((other) => other.kind === row.kind && other.id === row.id) !== index,
)
assert.equal(duplicateIds.length, 0, 'every assessed item has a unique scoped identity')
assert.equal(new Set(DAYS.map((day) => day.day)).size, 50)
assert.equal(scenes.filter((s) => s.kind === 'audience').length, DAYS.flatMap((d) => d.audiences).length)
assert.equal(scenes.filter((s) => s.kind === 'follower').length, TALKS.length)
assert.equal(rows.filter((r) => r.kind === 'quest-outcome').length, quests.length * 5)

const personas = POLICIES.filter((policy) =>
  [
    'greedy', 'random', 'spurn-all', 'marshal', 'reckless',
    'idle', 'patron:moles', 'patron:storm-crows', 'patron:freeholds',
  ].includes(policy.id),
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
}[] = []
const seenAudiences = new Set<string>()
const seenTalks = new Set<string>()
const seenQuests = new Set<string>()
for (const policy of personas) {
  for (const seed of [17, 41, 99]) {
    let day = 1
    let audiences = 0
    let talks = 0
    let questReports = 0
    const checkpoints: string[] = []
    const result = playCampaign(
      policy, seed,
      (run) => {
        assert.equal(run.day, day, `${policy.id}/${seed}: sequential dawns`)
        assert.ok(validateRun(run), `${policy.id}/${seed}: serializable dawn`)
        if ([1, 11, 21, 31, 41, 51].includes(day))
          checkpoints.push(`${day}:${run.brass} brass/${run.roster.filter((f) => !f.dead && !f.departed).length} at court`)
        day += 1
      },
      {
        playTalks: true,
        onAudienceChoice: (_day, id) => {
          audiences += 1
          seenAudiences.add(id)
        },
        onTalkChoice: (_day, id) => {
          talks += 1
          seenTalks.add(id)
        },
        onQuestReport: (_day, report) => {
          questReports += 1
          seenQuests.add(`${report.questId}:${report.tier}`)
          assert.ok(report.text?.length, `${policy.id}/${seed}: quest report has prose`)
        },
      },
    )
    assert.equal(day, 52, 'a persona plays all fifty days and a final dawn')
    campaignRows.push({
      persona: policy.id, seed, ending: result.ending,
      hideout: result.hideout, audiences, talks, quests: questReports,
      deaths: result.deaths, brass: result.brass, checkpoints,
    })
  }
}
assert.equal(campaignRows.length, personas.length * 3)
assert.ok(campaignRows.every((run) => run.audiences > 0))
assert.ok(campaignRows.some((run) => run.talks > 0), 'a full campaign hears follower dialogue')
assert.ok(seenQuests.size > 0)

const directory = 'artifacts/emperor'
mkdirSync(directory, { recursive: true })
const axisOrder = ['mood', 'clarity', 'originality', 'choice', 'consequence'] as const
const small = (row: Row) => axisOrder.map((axis) => row.scores[axis]).join('/')
const section = (kind: Row['kind']) =>
  rows.filter((r) => r.kind === kind)
    .map((r) => `| ${r.id} | ${r.day || 'varies'} | ${small(r)} | ${r.issues.length ? r.issues.join('; ').replace(/\\|/g, '/') : 'No automated alert'} |`)
    .join('\n')
const suspicious = rows.filter((row) =>
  Object.values(row.scores).some((score) => score <= 2) || row.issues.length > 0,
)
const markdown = [
  '# Emperor of Dust: complete authored-content editorial screening',
  '',
  'Generated on 2026-11-02 PT. Five numbers mean mood / clarity / originality / choice / consequence (1–5).',
  '',
  '**Status: SCREENED, NOT EDITORIALLY ACCEPTED.** Numeric scores below are deterministic structural proxies, not literary judgments. A score of 4 means a signal was detected, not that a scene is emotionally compelling. All low-scoring or flagged rows need independent close reading and edited re-review before a genuine acceptance claim.',
  '',
  `Authored coverage: ${scenes.filter((s) => s.kind === 'audience').length} throne audiences, ${TALKS.length} follower talks, ${quests.length} quest definitions x 5 result tiers = ${quests.length * 5} quest-outcome slots.`,
  `Automated red flags: ${suspicious.length}/${rows.length} assessed rows; these are leads, not defects proven in play.`,
  `Independent policy persona campaigns with barracks choices: ${campaignRows.length}; all completed 50 days and dawn 51. Visited ${seenAudiences.size} unique audiences, ${seenTalks.size} unique talks, ${seenQuests.size} distinct quest/outcome pairs.`,
  '',
  '## Complete 50-day policy-campaign traces',
  '',
  '| Policy | Seed | Ending | Hideout | Audience choices | Talk choices | Resolved quests | Deaths | Brass |',
  '| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |',
  ...campaignRows.map((c) =>
    `| ${c.persona} | ${c.seed} | ${c.ending} | ${c.hideout} | ${c.audiences} | ${c.talks} | ${c.quests} | ${c.deaths} | ${c.brass} |`),
  '',
  '## Each throne audience (all opening and beat options screened)',
  '',
  '| ID | Day | M/C/O/Ch/Co | Automatic findings |',
  '| --- | ---: | --- | --- |',
  section('audience'),
  '',
  '## Each follower talk (all opening and beat options screened)',
  '',
  '| ID | From day | M/C/O/Ch/Co | Automatic findings |',
  '| --- | ---: | --- | --- |',
  section('follower'),
  '',
  '## Every defined quest result tier (missing tiers explicitly surfaced)',
  '',
  '| Quest outcome | Day | M/C/O/Ch/Co | Automatic findings |',
  '| --- | ---: | --- | --- |',
  section('quest-outcome'),
  '',
  '## Acceptance still required',
  '',
  'Read every scene and branch for *meaning*, not only rule-based signals; review each quest image and result, all follower voice and absence gates, actual art placement, line-level originality, the consequences of dominant choices, and multiple independent human-style playthroughs. A robot that always chooses mechanically favorable answers is not an independent literary editor. This document does not clear any publication or subjective human gate.',
]
writeFileSync(`${directory}/editorial-screening.md`, markdown.join('\n') + '\n')
writeFileSync(`${directory}/editorial-screening.json`, JSON.stringify({
  rubric: 'deterministic proxy; not editorial acceptance',
  counts: {
    audiences: scenes.filter((s) => s.kind === 'audience').length,
    followerTalks: TALKS.length,
    quests: quests.length,
    resultSlots: quests.length * 5,
    redFlags: suspicious.length,
    assessedRows: rows.length,
  },
  rows,
  campaigns: campaignRows,
  seen: {
    audiences: [...seenAudiences].sort(),
    talks: [...seenTalks].sort(),
    questOutcomes: [...seenQuests].sort(),
  },
}, null, 2) + '\n')
console.log('EMPEROR_EDITORIAL_SCREENING ' + JSON.stringify({
  scenes: scenes.length,
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
  endingFamilies: [...new Set(campaignRows.map((r) => r.ending))].sort(),
}))
