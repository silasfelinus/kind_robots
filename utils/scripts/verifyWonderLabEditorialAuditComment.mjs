import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = await mkdtemp(join(tmpdir(), 'wonderlab-audit-comment-'))
const reportPath = join(directory, 'editorial-coverage-audit.json')
const commentPath = join(directory, 'editorial-coverage-comment.md')

try {
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        production: { commit: 'abc123', deploymentId: 'dpl_test' },
        scope: {
          assignmentMode: 'PORTFOLIO_DIVERSE',
          diversityPenalty: 4,
          discoveredComponents: 2,
          note: 'Fixture portfolio coverage.',
        },
        coverage: {
          reviewerSlots: 4,
          targetReviewerSlots: 4,
          assignmentShortfall: 0,
          publishedSlots: 1,
          publishedSlotRate: 25,
          draftedSlots: 1,
          missingSlots: 2,
          exhibitsWithPublishedReview: 1,
          exhibitsWithPublishedReviewRate: 50,
          exhibitsWithIncompleteAssignment: 0,
        },
        diversity: {
          eligibleBots: 2,
          eligibleCharacters: 2,
          publishedBots: 1,
          publishedCharacters: 0,
          assignedBots: 2,
          assignedCharacters: 2,
          largestAssignmentCount: 1,
          largestAssignmentShare: 25,
        },
        representation: {
          targetPerReviewer: 2,
          minimumScore: 1,
          eligibleReviewers: 4,
          representedReviewers: 4,
          meetingTargetReviewers: 3,
          underrepresentedReviewerCount: 1,
        },
        reviewerUsage: [
          {
            name: 'Fixture Bot',
            kind: 'BOT',
            id: 1,
            assigned: 1,
            published: 1,
            drafted: 0,
            missing: 0,
          },
        ],
        underrepresentedReviewers: [
          {
            name: 'Fixture Character',
            kind: 'CHARACTER',
            id: 2,
            count: 1,
            target: 2,
            reason: 'INSUFFICIENT_RESPONSIBLE_MATCHES',
            bestScore: 5,
            responsibleExhibitCount: 1,
          },
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  const result = spawnSync(
    process.execPath,
    ['scripts/post-wonderlab-editorial-audit-comment.mjs'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        WONDERLAB_EDITORIAL_AUDIT_REPORT: reportPath,
        WONDERLAB_EDITORIAL_AUDIT_COMMENT: commentPath,
        WONDERLAB_EDITORIAL_AUDIT_STATUS: 'success',
        GITHUB_RUN_ID: '12345',
        WONDERLAB_EDITORIAL_AUDIT_POST: 'false',
      },
    },
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
  const comment = await readFile(commentPath, 'utf8')
  assert.match(comment, /PORTFOLIO_DIVERSE/)
  assert.match(comment, /Fixture Bot/)
  assert.match(comment, /Fixture Character/)
  assert.match(comment, /4\/4 \(0 short\)/)
  assert.match(comment, /3\/4 meet the target of 2/)
  assert.match(comment, /INSUFFICIENT_RESPONSIBLE_MATCHES/)
  assert.match(comment, /run 12345/)
  assert.doesNotMatch(comment, /undefined|null/)

  console.log('WonderLab editorial audit comment rendering contract passed.')
} finally {
  await rm(directory, { recursive: true, force: true })
}
