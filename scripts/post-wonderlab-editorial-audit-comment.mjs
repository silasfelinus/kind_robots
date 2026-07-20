import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import process from 'node:process'

const reportPath =
  process.env.WONDERLAB_EDITORIAL_AUDIT_REPORT ||
  'wonderlab-editorial-audit-artifacts/editorial-coverage-audit.json'
const commentPath =
  process.env.WONDERLAB_EDITORIAL_AUDIT_COMMENT ||
  'wonderlab-editorial-audit-artifacts/editorial-coverage-comment.md'
const issueNumber = Number(process.env.WONDERLAB_EDITORIAL_AUDIT_ISSUE || 582)
const jobStatus = String(process.env.WONDERLAB_EDITORIAL_AUDIT_STATUS || 'unknown')
const runId = String(process.env.GITHUB_RUN_ID || 'unknown')
const serverUrl = String(process.env.GITHUB_SERVER_URL || 'https://github.com').replace(/\/$/, '')
const repository = String(process.env.GITHUB_REPOSITORY || 'silasfelinus/kind_robots')
const runUrl = `${serverUrl}/${repository}/actions/runs/${runId}`

async function optionalReport() {
  try {
    return JSON.parse(await readFile(reportPath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function reportLines(report) {
  const lines = [
    '## WonderLab editorial portfolio audit',
    '',
    `- **Workflow:** [run ${runId}](${runUrl})`,
    `- **Result:** ${jobStatus}`,
  ]

  if (!report) {
    lines.push(
      '- **Evidence:** no report was produced; inspect the workflow logs and partial artifact.',
    )
    return lines
  }

  const coverage = report.coverage || {}
  const diversity = report.diversity || {}
  const representation = report.representation || {}
  lines.push(
    `- **Production:** commit \`${report.production?.commit || 'unknown'}\`; deployment \`${report.production?.deploymentId || 'unknown'}\``,
    `- **Assignment mode:** ${report.scope?.assignmentMode || 'unknown'}; repeat-use penalty ${report.scope?.diversityPenalty ?? 'unknown'}`,
    `- **Discovered exhibits:** ${report.scope?.discoveredComponents || 0}`,
    `- **Planned reviewer slots:** ${coverage.reviewerSlots || 0}/${coverage.targetReviewerSlots || 0} (${coverage.assignmentShortfall || 0} short)`,
    `- **Published planned slots:** ${coverage.publishedSlots || 0} (${coverage.publishedSlotRate || 0}%)`,
    `- **Drafted planned slots:** ${coverage.draftedSlots || 0}`,
    `- **Missing planned slots:** ${coverage.missingSlots || 0}`,
    `- **Exhibits with any published planned review:** ${coverage.exhibitsWithPublishedReview || 0} (${coverage.exhibitsWithPublishedReviewRate || 0}%)`,
    `- **Eligible cast representation:** ${representation.representedReviewers || 0}/${representation.eligibleReviewers || 0} represented; ${representation.meetingTargetReviewers || 0}/${representation.eligibleReviewers || 0} meet the target of ${representation.targetPerReviewer || 0}`,
    `- **Underrepresented eligible reviewers:** ${representation.underrepresentedReviewerCount || 0}`,
    `- **Published reviewer diversity:** ${diversity.publishedBots || 0} Bot(s), ${diversity.publishedCharacters || 0} Character(s)`,
    `- **Assigned reviewer diversity:** ${diversity.assignedBots || 0}/${diversity.eligibleBots || 0} Bot(s), ${diversity.assignedCharacters || 0}/${diversity.eligibleCharacters || 0} Character(s)`,
    `- **Largest reviewer allocation:** ${diversity.largestAssignmentCount || 0} slots (${diversity.largestAssignmentShare || 0}%)`,
    `- **Incomplete assignments:** ${coverage.exhibitsWithIncompleteAssignment || 0} exhibit(s)`,
  )

  const top = Array.isArray(report.reviewerUsage)
    ? report.reviewerUsage.filter((reviewer) => reviewer.assigned > 0).slice(0, 10)
    : []
  if (top.length) {
    lines.push('', '### Most-used planned reviewers', '')
    for (const reviewer of top) {
      lines.push(
        `- **${reviewer.name}** (${reviewer.kind} #${reviewer.id}): ${reviewer.assigned} assignments; ${reviewer.published} published, ${reviewer.drafted} drafted, ${reviewer.missing} missing`,
      )
    }
  }

  const underrepresented = Array.isArray(report.underrepresentedReviewers)
    ? report.underrepresentedReviewers.slice(0, 10)
    : []
  if (underrepresented.length) {
    lines.push('', '### Cast members needing responsible placements', '')
    for (const reviewer of underrepresented) {
      lines.push(
        `- **${reviewer.name}** (${reviewer.kind} #${reviewer.id}): ${reviewer.count}/${reviewer.target}; ${reviewer.reason}; best score ${reviewer.bestScore ?? 'none'} across ${reviewer.responsibleExhibitCount || 0} responsible exhibit(s)`,
      )
    }
  }

  lines.push(
    '',
    `> ${report.scope?.note || 'Coverage reflects portfolio-selected reviewer slots.'}`,
    '',
    'The uploaded JSON artifact contains the complete eligible-cast usage table, all representation gaps, the top 50 missing high-affinity assignments, and every exhibit without a complete reviewer assignment. This workflow is read-only and performs no generation, approval, editing, or publication.',
  )
  return lines
}

async function postComment(body) {
  if (process.env.WONDERLAB_EDITORIAL_AUDIT_POST !== 'true') {
    console.log('Dry run: editorial audit comment was rendered but not posted.')
    return
  }

  const token = String(process.env.GITHUB_TOKEN || '').trim()
  if (!token) throw new Error('GITHUB_TOKEN is required to post the editorial audit comment.')
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error('WONDERLAB_EDITORIAL_AUDIT_ISSUE must be a positive integer.')
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'kind-robots-wonderlab-editorial-audit',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ body }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub comment POST failed with ${response.status}: ${text.slice(0, 1000)}`)
  }

  const result = await response.json()
  console.log(`Posted WonderLab editorial audit evidence: ${result.html_url || 'comment created'}`)
}

const report = await optionalReport()
const body = `${reportLines(report).join('\n')}\n`
await mkdir(dirname(commentPath), { recursive: true })
await writeFile(commentPath, body)
console.log(body)
await postComment(body)
