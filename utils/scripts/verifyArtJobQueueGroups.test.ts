// Contract test for utils/artJobQueueGroups.ts: the PENDING backlog grouped by
// the name the queue card shows, so a whole group ("hybridizer") can be moved
// to the front or back in one action.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { artJobTitle } from '../artJobFields'
import {
  UNTITLED_ART_JOB_GROUP,
  artJobGroupName,
  artJobIdsInGroup,
  decodeJsonFragment,
  formatArtJobPriorityRange,
  parseArtJobGroupName,
  summarizeArtJobQueueGroups,
  type ArtJobGroupSourceRow,
} from '../artJobQueueGroups'

const failures: string[] = []

function check(name: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    failures.push(
      `${name}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

const rows: ArtJobGroupSourceRow[] = [
  { id: 10, priority: -15, projectSlug: 'hybridizer' },
  { id: 11, priority: 1, projectSlug: 'hybridizer', title: null },
  { id: 12, priority: -20, projectSlug: 'hybridizer', title: '""' },
  { id: 20, priority: 100, projectSlug: 'facet', title: '"Butterfly wing"' },
  { id: 21, priority: 0, projectSlug: null, label: '"Butterfly wing"' },
  { id: 30, priority: 0, projectSlug: null },
  { id: 31, priority: 5, projectSlug: '  ', name: 'null' },
  { id: 40, priority: BigInt(7), projectSlug: 'x', title: 'raw text' },
]

check('group name matches the card title for titled and slug-only jobs', () => {
  for (const row of [rows[0]!, rows[3]!]) {
    const title = decodeJsonFragment(row.title)
    assert.equal(
      artJobGroupName(row),
      artJobTitle({
        id: Number(row.id),
        projectSlug: row.projectSlug,
        payload: title === undefined ? {} : { title },
      }),
    )
  }
})

check('payload title beats projectSlug, label is a fallback key', () => {
  assert.equal(artJobGroupName(rows[3]!), 'Butterfly wing')
  assert.equal(artJobGroupName(rows[4]!), 'Butterfly wing')
})

check('empty or null titles fall back to the projectSlug', () => {
  assert.equal(artJobGroupName(rows[1]!), 'hybridizer')
  assert.equal(artJobGroupName(rows[2]!), 'hybridizer')
})

check('untitled jobs share one group instead of one each', () => {
  assert.equal(artJobGroupName(rows[5]!), UNTITLED_ART_JOB_GROUP)
  assert.equal(artJobGroupName(rows[6]!), UNTITLED_ART_JOB_GROUP)
})

check('an already-decoded fragment is accepted as-is', () => {
  assert.equal(artJobGroupName(rows[7]!), 'raw text')
})

check('summary counts groups, jobs and priority ranges', () => {
  const summary = summarizeArtJobQueueGroups(rows)
  assert.equal(summary.totalJobs, rows.length)
  assert.equal(summary.groups.length, 4)
  assert.equal(summary.minPriority, -20)
  assert.equal(summary.maxPriority, 100)

  const hybridizer = summary.groups.find((g) => g.name === 'hybridizer')
  assert.deepEqual(hybridizer, {
    name: 'hybridizer',
    count: 3,
    minPriority: -20,
    maxPriority: 1,
    oldestJobId: 10,
    newestJobId: 12,
  })
})

check('groups are ordered the way the relay claims them', () => {
  const names = summarizeArtJobQueueGroups(rows).groups.map((g) => g.name)
  assert.deepEqual(names, [
    'Butterfly wing',
    'raw text',
    UNTITLED_ART_JOB_GROUP,
    'hybridizer',
  ])
})

check('bulk selection takes exactly the group members', () => {
  assert.deepEqual(artJobIdsInGroup(rows, 'hybridizer'), [10, 11, 12])
  assert.deepEqual(artJobIdsInGroup(rows, 'nope'), [])
})

check('group name parse rejects blank and oversized input', () => {
  assert.deepEqual(parseArtJobGroupName(' hybridizer '), {
    ok: true,
    name: 'hybridizer',
  })
  for (const bad of ['', '   ', null, 5, 'x'.repeat(256)]) {
    assert.equal(parseArtJobGroupName(bad).ok, false, String(bad))
  }
})

check('priority range reads as one value when flat', () => {
  assert.equal(formatArtJobPriorityRange(-15, -15), '-15')
  assert.equal(formatArtJobPriorityRange(-20, 1), '-20 to 1')
  assert.equal(formatArtJobPriorityRange(null, null), '—')
})

check(
  'bulk endpoint reuses the shared priority parse and PENDING guard',
  () => {
    const source = readFileSync(
      'server/api/art/queue/groups/priority.post.ts',
      'utf8',
    )
    assert.match(source, /parseArtJobPriority\(/)
    assert.match(source, /status: 'PENDING'/)
    assert.match(source, /auth\.isAdmin/)
  },
)

check('group rows never select the whole payload', () => {
  const source = readFileSync('server/utils/artJobQueueGroupRows.ts', 'utf8')
  assert.doesNotMatch(source, /SELECT\s+\*/i)
  assert.match(source, /WHERE status = 'PENDING'/)
})

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('ArtJob queue groups contract: ok')
