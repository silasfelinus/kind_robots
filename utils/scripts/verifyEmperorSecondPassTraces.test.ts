import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { POLICIES, playCampaign } from '../emperorOfDust/fortress/balance'
import { dayBriefings, dayLines } from '../emperorOfDust/fortress/briefings'
import { dayDef } from '../emperorOfDust/fortress/content'
import { ENDINGS } from '../emperorOfDust/fortress/endings'
import {
  decodeBook,
  encodeBook,
  newBook,
  recordDawn,
  rewindTo,
  validateRun,
} from '../emperorOfDust/fortress/saves'
import type { SceneLine } from '../emperorOfDust/fortress/types'

type TraceEvent = {
  sequence: number
  day: number
  kind: string
  detail: Record<string, unknown>
}

const policyIds = [
  'greedy',
  'random',
  'spurn-all',
  'marshal',
  'reckless',
  'idle',
  'patron:freeholds',
  'patron:mire-mothers',
] as const
const seeds = [17, 41] as const
const saveDays = [1, 11, 21, 31, 41, 51]
const linesOf = (lines: readonly SceneLine[]) =>
  lines
    .map((line) =>
      typeof line === 'string' ? line : `${line.who}: ${line.text}`,
    )
    .join('\n\n')

mkdirSync('artifacts/emperor', { recursive: true })
const manifest: {
  method: string
  kind_robots_sha: string | null
  campaigns: {
    policy: string
    seed: number
    trace_path: string
    transcript_path: string
    ending_id: string
    events: number
    scenes: number
  }[]
  ending_coverage: {
    observed: string[]
    unobserved: string[]
    counts: Record<string, number>
  } | null
} = {
  method:
    'Deterministic engine-driven model simulations, not human playtests or ' +
    'independent editorial reviews. No rubric scores are inferred.',
  kind_robots_sha: process.env.KIND_ROBOTS_SHA ?? null,
  campaigns: [],
  ending_coverage: null,
}

for (const policyId of policyIds) {
  const policy = POLICIES.find((candidate) => candidate.id === policyId)
  assert.ok(policy, `Missing policy ${policyId}`)
  for (const seed of seeds) {
    const events: TraceEvent[] = []
    const transcript: string[] = [
      `# Emperor of Dust: ${policyId}, seed ${seed}`,
      '',
      'Model-simulated playthrough. Not human feedback or a scored review.',
      '',
    ]
    const dawns: {
      day: number
      state: unknown
    }[] = []
    const roundTrips: number[] = []
    let book: ReturnType<typeof newBook> | undefined
    let scenes = 0
    const append = (
      day: number,
      kind: string,
      detail: Record<string, unknown>,
    ) => {
      events.push({ sequence: events.length + 1, day, kind, detail })
    }
    const result = playCampaign(
      policy,
      seed,
      (run) => {
        assert.ok(validateRun(run), `${policyId}/${seed}: invalid dawn`)
        assert.equal(
          run.day,
          dawns.length + 1,
          `${policyId}/${seed}: expected sequential dawns`,
        )
        book = book ? recordDawn(book, run) : newBook(run)
        dawns.push({
          day: run.day,
          state: JSON.parse(JSON.stringify(run)) as unknown,
        })
        append(run.day, 'dawn', {
          brass: run.brass,
          loans: run.loans,
          roster: run.roster.length,
          deaths: run.memorials.length,
          flags: [...run.flags],
          board: run.board.map((entry) => entry.questId),
        })
        transcript.push(
          `\n## Day ${run.day} | ${run.brass} brass | ${run.roster.length} followers | ${run.memorials.length} memorials\n`,
        )
        const briefings = dayBriefings(run) ?? []
        const advisor = dayLines(run, dayDef(run.day))
        append(run.day, 'intelligence', {
          advisor,
          reports: briefings,
          played_rumour_challenge: false,
        })
        if (advisor.komodo)
          transcript.push(`**Young Komodo:** ${advisor.komodo}\n`)
        if (advisor.whisper)
          transcript.push(
            `**${advisor.whisper.source}:** ${advisor.whisper.text}\n`,
          )
        for (const briefing of briefings)
          transcript.push(
            `**Dispatch, ${briefing.source}:** ${briefing.text}\n`,
          )
        if (saveDays.includes(run.day)) {
          const restored = decodeBook(encodeBook(book))
          assert.ok(restored, `Day ${run.day}: save must decode`)
          assert.deepEqual(restored.current, run)
          assert.deepEqual(restored.dawns, book.dawns)
          roundTrips.push(run.day)
          append(run.day, 'save-roundtrip', {
            day: run.day,
            success: true,
          })
          if (run.day === 51) {
            const rewind = rewindTo(restored, 31)
            assert.equal(rewind.current.day, 31)
            assert.equal(rewind.dawns.length, 31)
            assert.ok(validateRun(rewind.current))
            append(run.day, 'rewind-check', {
              target: 31,
              success: true,
              preserved_original_run: true,
            })
          }
        }
      },
      {
        playTalks: true,
        playChanceEvents: true,
        onAudienceScene: (day, id, beatId, lines) => {
          const prose = linesOf(lines)
          scenes += 1
          append(day, 'audience-scene', { id, beatId, prose })
          transcript.push(
            `### Court: ${id} / ${beatId ?? 'opening'}\n\n${prose}\n`,
          )
        },
        onAudienceChoice: (day, id, option, run) => {
          append(day, 'audience-choice', {
            id,
            option_id: option.id,
            label: option.label,
            response: option.response,
            effects: option.effects,
            requires: option.requires ?? null,
            cost: option.requires?.cost ?? 0,
            posts_quests: option.postsQuests ?? [],
            next_beat: option.next ?? null,
            brass_after: run.brass,
          })
          transcript.push(
            `**Choice:** ${option.label} (${option.id})\n\n**Eligibility:** ${JSON.stringify(option.requires ?? {})}; cost ${option.requires?.cost ?? 0} brass; posts quests: ${(option.postsQuests ?? []).join(', ') || 'none'}\n\n${option.response}\n`,
          )
        },
        onTalkScene: (day, id, beatId, lines) => {
          const prose = linesOf(lines)
          scenes += 1
          append(day, 'barracks-scene', { id, beatId, prose })
          transcript.push(
            `### Barracks: ${id} / ${beatId ?? 'opening'}\n\n${prose}\n`,
          )
        },
        onTalkChoice: (day, id, option) => {
          append(day, 'barracks-choice', {
            id,
            option_id: option.id,
            label: option.label,
            response: option.response,
            effects: option.effects,
            requires: option.requires ?? null,
            cost: option.requires?.cost ?? 0,
            next_beat: option.next ?? null,
          })
          transcript.push(
            `**Reply:** ${option.label} (${option.id})\n\n**Eligibility:** ${JSON.stringify(option.requires ?? {})}; cost ${option.requires?.cost ?? 0} brass\n\n${option.response}\n`,
          )
        },
        onChanceChoice: (day, id, choiceId) => {
          append(day, 'chance-choice', { id, choice_id: choiceId })
          transcript.push(`**Chance event:** ${id} / ${choiceId}\n`)
        },
        onQuestAssigned: (day, id, party, run) => {
          append(day, 'quest-assigned', {
            id,
            party: [...party],
            brass_after: run.brass,
          })
          transcript.push(`**Dispatch:** ${id}, party: ${party.join(', ')}\n`)
        },
        onQuestReport: (day, report) => {
          append(day, 'quest-result', { report })
          transcript.push(
            `**Quest ${report.questId}, ${report.tier}:**\n\n${report.text ?? '[no report text]'}\n`,
          )
        },
      },
    )
    assert.equal(dawns.length, 51, `${policyId}/${seed}: full fifty days`)
    assert.deepEqual(roundTrips, saveDays)
    assert.ok(scenes > 0, `${policyId}/${seed}: scene capture is empty`)
    const slug = policyId.replace(/[^a-z0-9-]/g, '-')
    const prefix = `artifacts/emperor/second-pass-${slug}-${seed}`
    const tracePath = `${prefix}.trace.json`
    const transcriptPath = `${prefix}.transcript.md`
    transcript.push(
      `\n## Ending: ${result.ending}\n\nHideout: ${result.hideout}; ${result.brass} brass; ${result.deaths} deaths.\n`,
    )
    writeFileSync(
      tracePath,
      JSON.stringify(
        {
          kind: 'model-simulation',
          kind_robots_sha: manifest.kind_robots_sha,
          seed,
          policy: policyId,
          start_state: 'fortress createRun(seed)',
          end: result,
          round_trips: roundTrips,
          events,
          dawns,
        },
        null,
        2,
      ) + '\n',
    )
    writeFileSync(transcriptPath, transcript.join('\n'))
    manifest.campaigns.push({
      policy: policyId,
      seed,
      trace_path: tracePath,
      transcript_path: transcriptPath,
      ending_id: result.ending,
      events: events.length,
      scenes,
    })
    console.log(
      'EMPEROR_SECOND_PASS_TRACE ' +
        JSON.stringify({
          policy: policyId,
          seed,
          ending: result.ending,
          events: events.length,
          scenes,
          dawns: dawns.length,
        }),
    )
  }
}
assert.equal(manifest.campaigns.length, policyIds.length * seeds.length)
const counts: Record<string, number> = {}
for (const campaign of manifest.campaigns)
  counts[campaign.ending_id] = (counts[campaign.ending_id] ?? 0) + 1
const allEndings = Object.keys(ENDINGS).sort()
manifest.ending_coverage = {
  observed: allEndings.filter((id) => (counts[id] ?? 0) > 0),
  unobserved: allEndings.filter((id) => (counts[id] ?? 0) === 0),
  counts,
}
assert.equal(
  manifest.ending_coverage.observed.length +
    manifest.ending_coverage.unobserved.length,
  allEndings.length,
)
console.log(
  'EMPEROR_SECOND_PASS_ENDING_COVERAGE ' +
    JSON.stringify(manifest.ending_coverage),
)
writeFileSync(
  'artifacts/emperor/second-pass-manifest.json',
  JSON.stringify(manifest, null, 2) + '\n',
)
