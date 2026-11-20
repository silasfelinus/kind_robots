import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import {
  POLICIES,
  playCampaign,
  type CampaignResult,
  type Policy,
} from '../emperorOfDust/fortress/balance'
import { ENDINGS, type EndingId } from '../emperorOfDust/fortress/endings'
import {
  decodeBook,
  encodeBook,
  newBook,
  recordDawn,
  rewindTo,
  validateRun,
} from '../emperorOfDust/fortress/saves'
import type { SceneLine } from '../emperorOfDust/fortress/types'

/**
 * Supplemental witnesses for endings missed by the 16-persona trace matrix.
 * The fixed ten-seed search matches the seeded balance contract. Every
 * witness is replayed from a fresh, unmodified createRun(seed), with normal
 * costs, option gates, quests and injuries; no flags or endings are injected.
 * This is model-simulation evidence, not independent editorial acceptance.
 */
const endingIds = Object.keys(ENDINGS).sort() as EndingId[]
const witnessSeeds = new Map<
  EndingId,
  { policy: Policy; seed: number }
>()

for (const policy of POLICIES) {
  for (let seed = 1; seed <= 10; seed += 1) {
    const outcome = playCampaign(policy, seed)
    if (!witnessSeeds.has(outcome.ending))
      witnessSeeds.set(outcome.ending, { policy, seed })
    if (witnessSeeds.size === endingIds.length) break
  }
  if (witnessSeeds.size === endingIds.length) break
}

assert.deepEqual(
  [...witnessSeeds.keys()].sort(),
  endingIds,
  'all eight ending families need legal, seeded campaign witnesses',
)

const saveDays = [1, 11, 21, 31, 41, 51]
const output = 'artifacts/emperor'
mkdirSync(output, { recursive: true })

type WitnessEvent = {
  day: number
  kind: string
  detail: Record<string, unknown>
}

type WitnessRecord = {
  ending_id: EndingId
  title: string
  policy: string
  seed: number
  result: CampaignResult
  dawns: number
  court_scenes: number
  court_choices: number
  quest_results: number
  save_round_trips: number[]
  trace_path: string
  transcript_path: string
}

const manifest: {
  method: string
  kind_robots_sha: string | null
  witness_count: number
  ending_ids: EndingId[]
  witnesses: WitnessRecord[]
} = {
  method:
    'Additional deterministic full-engine witnesses with earned gates, ' +
    'not human playtests, independent editorial scores or art acceptance.',
  kind_robots_sha: process.env.KIND_ROBOTS_SHA ?? null,
  witness_count: endingIds.length,
  ending_ids: endingIds,
  witnesses: [],
}

const linesOf = (lines: readonly SceneLine[]): string =>
  lines
    .map((line) =>
      typeof line === 'string' ? line : line.who + ': ' + line.text,
    )
    .join('\n\n')

for (const endingId of endingIds) {
  const witness = witnessSeeds.get(endingId)
  assert.ok(witness, 'missing witness for ' + endingId)
  const { policy, seed } = witness
  const events: WitnessEvent[] = []
  const dawns: { day: number; state: unknown }[] = []
  const roundTrips: number[] = []
  const transcript: string[] = [
    '# Emperor of Dust: ' + ENDINGS[endingId].title,
    '',
    'Legal engine-simulated fifty-day campaign, not human feedback.',
    'Policy: ' + policy.id + '; seed: ' + seed,
    '',
  ]
  let book: ReturnType<typeof newBook> | undefined
  let courtScenes = 0
  let courtChoices = 0
  let questResults = 0

  const append = (
    day: number,
    kind: string,
    detail: Record<string, unknown>,
  ) => {
    events.push({ day, kind, detail })
  }

  const replay = playCampaign(
    policy,
    seed,
    (run) => {
      assert.ok(validateRun(run), endingId + ': invalid dawn')
      assert.equal(run.day, dawns.length + 1)
      book = book ? recordDawn(book, run) : newBook(run)
      dawns.push({
        day: run.day,
        state: JSON.parse(JSON.stringify(run)) as unknown,
      })
      transcript.push(
        '\n## Day ' +
          run.day +
          ' | ' +
          run.brass +
          ' brass | ' +
          run.roster.length +
          ' followers | ' +
          run.memorials.length +
          ' memorials\n',
      )
      append(run.day, 'dawn', {
        brass: run.brass,
        loans: run.loans,
        memorials: [...run.memorials],
        flags: [...run.flags],
        hideout: run.hideout ?? null,
      })
      if (saveDays.includes(run.day)) {
        const restored = decodeBook(encodeBook(book))
        assert.ok(restored, endingId + ': save must decode at day ' + run.day)
        assert.deepEqual(restored.current, run)
        assert.deepEqual(restored.dawns, book.dawns)
        roundTrips.push(run.day)
        append(run.day, 'save-roundtrip', { valid: true })
        if (run.day === 51) {
          const rewind = rewindTo(restored, 31)
          assert.equal(rewind.current.day, 31)
          assert.equal(rewind.dawns.length, 31)
          assert.ok(validateRun(rewind.current))
          append(run.day, 'rewind-check', { day: 31, valid: true })
        }
      }
    },
    {
      onAudienceScene: (day, audienceId, beatId, lines) => {
        courtScenes += 1
        const prose = linesOf(lines)
        append(day, 'court-scene', { audience_id: audienceId, beat_id: beatId ?? null, prose })
        transcript.push(
          '### ' + audienceId + ' / ' + (beatId ?? 'opening') + '\n\n' + prose + '\n',
        )
      },
      onAudienceChoice: (day, audienceId, option, run) => {
        courtChoices += 1
        append(day, 'court-choice', {
          audience_id: audienceId,
          option_id: option.id,
          label: option.label,
          response: option.response,
          requires: option.requires ?? null,
          effects: option.effects,
          brass_after: run.brass,
        })
        transcript.push(
          '**Choice ' +
            option.id +
            ':** ' +
            option.label +
            '\n\n' +
            option.response +
            '\n',
        )
      },
      onQuestAssigned: (day, questId, party) => {
        append(day, 'quest-assigned', { quest_id: questId, party: [...party] })
      },
      onQuestReport: (day, report) => {
        questResults += 1
        append(day, 'quest-result', { report })
        transcript.push(
          '**Quest ' +
            report.questId +
            ', ' +
            report.tier +
            ':** ' +
            (report.text ?? '[no report]') +
            '\n',
        )
      },
    },
  )

  assert.equal(replay.ending, endingId, 'replay must earn ' + endingId)
  assert.equal(dawns.length, 51, endingId + ': all fifty days')
  assert.deepEqual(roundTrips, saveDays, endingId + ': save checkpoints')
  assert.ok(courtScenes > 0 && courtChoices > 0)
  const prefix = output + '/second-pass-ending-witness-' + endingId
  const tracePath = prefix + '.trace.json'
  const transcriptPath = prefix + '.transcript.md'
  transcript.push(
    '\n## Earned ending: ' +
      ENDINGS[endingId].title +
      '\n\n' +
      ENDINGS[endingId].text +
      '\n',
  )
  writeFileSync(
    tracePath,
    JSON.stringify(
      {
        kind: 'model-simulation',
        kind_robots_sha: manifest.kind_robots_sha,
        ending_id: endingId,
        policy: policy.id,
        seed,
        result: replay,
        round_trips: roundTrips,
        dawns,
        events,
      },
      null,
      2,
    ) + '\n',
  )
  writeFileSync(transcriptPath, transcript.join('\n'))
  manifest.witnesses.push({
    ending_id: endingId,
    title: ENDINGS[endingId].title,
    policy: policy.id,
    seed,
    result: replay,
    dawns: dawns.length,
    court_scenes: courtScenes,
    court_choices: courtChoices,
    quest_results: questResults,
    save_round_trips: roundTrips,
    trace_path: tracePath,
    transcript_path: transcriptPath,
  })
  console.log(
    'EMPEROR_ENDING_WITNESS ' +
      JSON.stringify({
        ending: endingId,
        policy: policy.id,
        seed,
        dawns: dawns.length,
        choices: courtChoices,
        deaths: replay.deaths,
        loans: replay.loans,
      }),
  )
}
assert.equal(manifest.witnesses.length, endingIds.length)
writeFileSync(
  output + '/second-pass-ending-witnesses-manifest.json',
  JSON.stringify(manifest, null, 2) + '\n',
)
