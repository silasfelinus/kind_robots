import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import {
  CAMPAIGN_CREWS,
  CAMPAIGN_DOCKS,
  CAMPAIGN_SEEDS,
  flyCampaign,
  median,
  type CampaignRun,
} from './rainbowCampaignMatrix'

// Conductor rainbow t-013 (campaign QA): every crew size, two seeds and both dock policies fly from a fresh start
// to THE END in the real engine. Every run keeps the canonical Act order with each detour in its own slot, and
// together the runs cover every detour, both sides of every fork, both roads, the stand-down and all three
// choices. The measured length is recorded; the autopilot never loses a ship, so difficulty stays a human call.

const DETOUR_SLOT: Record<string, [string, string]> = {
  X1: ['S03', 'S04'],
  X2: ['S04', 'S05'],
  X3: ['S06', 'S07'],
  X4: ['S07', 'S08'],
}
const MAIN = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09']

const runs: CampaignRun[] = []
for (const crew of CAMPAIGN_CREWS)
  for (const seed of CAMPAIGN_SEEDS)
    for (const dock of CAMPAIGN_DOCKS) {
      const run = flyCampaign(crew, seed, dock)
      const label = `${crew}p seed ${seed} dock ${dock}`
      assert.ok(run.reachedEnd, `${label} reaches THE END`)
      assert.deepEqual(
        run.acts.filter((act) => act.startsWith('S')),
        MAIN,
        `${label} flies every Act once, in order`,
      )
      for (const [index, act] of run.acts.entries()) {
        const slot = DETOUR_SLOT[act]
        if (!slot) continue
        assert.deepEqual(
          [run.acts[index - 1], run.acts[index + 1]],
          slot,
          `${label}: ${act} sits between ${slot.join(' and ')}`,
        )
      }
      assert.ok(run.finalChoice, `${label} made a final choice`)
      runs.push(run)
    }

// Together the matrix covers the whole route graph.
const seen = (pick: (run: CampaignRun) => unknown) =>
  new Set(runs.map(pick).filter((value) => value !== null))
const detours = new Set(
  runs.flatMap((run) => run.acts.filter((a) => a.startsWith('X'))),
)
assert.deepEqual(
  [...detours].sort(),
  ['X1', 'X2', 'X3', 'X4'],
  'every detour flown',
)
assert.deepEqual([...seen((r) => r.trenchRoute)].sort(), ['safe', 'vault'])
assert.deepEqual([...seen((r) => r.wreckRoute)].sort(), ['armory', 'depot'])
assert.deepEqual([...seen((r) => r.reefRoute)].sort(), ['cache', 'relay'])
assert.deepEqual([...seen((r) => r.allegiance)].sort(), ['loyal', 'rebel'])
assert.deepEqual([...seen((r) => r.finalChoice)].sort(), [
  'evacuate',
  'restore',
  'sever',
])
assert.ok(
  runs.some((run) => run.stoodDown),
  'a loyal crew stands down',
)
assert.ok(
  runs.some((run) => run.freedChoir),
  'a crew frees the Coral Choir',
)
assert.ok(
  runs.some((run) => run.cadetsHome),
  'a crew brings the cadets home',
)
assert.ok(
  runs.some((run) => run.shoalFreed),
  'a crew frees the Shoal Koi',
)

// The same seed and policy fly the same campaign.
const again = flyCampaign(runs[0]!.crew, runs[0]!.seed, runs[0]!.dock)
assert.deepEqual(again, runs[0], 'a campaign replays identically')

// Length: the autopilot's clean flight time, a floor for a human run (Acts are time-scrolled).
const minutes = runs.map((run) => run.minutes)
const middle = median(minutes)
assert.ok(
  middle >= 35 && middle <= 75,
  `median clean campaign ${middle} minutes stays in its expected band`,
)
const report = {
  generated: 'verifyRainbowCampaignMatrix',
  runs: runs.length,
  medianMinutes: middle,
  minMinutes: Math.min(...minutes),
  maxMinutes: Math.max(...minutes),
  detours: [...detours].sort(),
  endings: [
    ...new Set(
      runs.map(
        (r) => `${r.stoodDown ? 'stood down' : r.allegiance} ${r.finalChoice}`,
      ),
    ),
  ].sort(),
  matrix: runs,
}
if (process.env.RAINBOW_CAMPAIGN_REPORT)
  writeFileSync(
    process.env.RAINBOW_CAMPAIGN_REPORT,
    JSON.stringify(report, null, 2),
  )
console.log(
  `rainbow campaign matrix: ok (${runs.length} fresh runs to THE END; median ${middle} min, ${report.minMinutes}-${report.maxMinutes}; endings ${report.endings.join(', ')})`,
)
