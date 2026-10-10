// /utils/scripts/verifyArtJobQueueDefaultStatus.ts
import { readFileSync } from 'node:fs'

const componentPath = 'components/art/artjob-queue-browser.vue'
const component = readFileSync(componentPath, 'utf8')

function requireMatch(pattern: RegExp, message: string): void {
  if (!pattern.test(component)) {
    throw new Error(message)
  }
}

requireMatch(
  /const concreteStatusFilters: ArtJobStatus\[\] = \[\s*'PENDING',\s*'RUNNING',\s*'FAILED',\s*'DONE',\s*'CANCELLED',\s*\]/,
  `${componentPath} must keep the startup status order PENDING -> RUNNING -> FAILED -> DONE -> CANCELLED.`,
)

requireMatch(
  /function firstNonEmptyStatus\(\): ArtJobStatus \| null \{[\s\S]*concreteStatusFilters\.find\(\(status\) => statusCount\(status\) > 0\)/,
  `${componentPath} must derive its initial section from the first non-empty concrete status.`,
)

requireMatch(
  /async function loadInitialJobs\(\): Promise<void> \{[\s\S]*await artJobStore\.fetchStats\(\)[\s\S]*const initialStatus = firstNonEmptyStatus\(\)[\s\S]*await artJobStore\.fetchJobs\([\s\S]*initialStatus \?\? artJobStore\.jobStatusFilter,[\s\S]*1,?[\s\S]*\)/,
  `${componentPath} must load fresh queue counts before choosing and fetching the initial status.`,
)

requireMatch(
  /if \(artJobStore\.jobs\.length \|\| !initialStatus\) return[\s\S]*await artJobStore\.fetchStats\(\)[\s\S]*const refreshedStatus = firstNonEmptyStatus\(\)[\s\S]*await artJobStore\.fetchJobs\(refreshedStatus, 1\)/,
  `${componentPath} must retry startup selection from fresh stats when the chosen section empties during a queue race.`,
)

// Revisits re-pick too. The queue/trainer tabs are v-show, so this component
// only remounts on a real revisit or reload -- and the store outlives the page,
// so an early return on cached jobs reopened whatever tab was last open, often
// an emptied FAILED with hundreds pending next door. Silas, 2026-10-10: "it
// should start me at the selection with the first content".
const onMountedBody =
  /onMounted\(async \(\) => \{([\s\S]*?)\n\}\)/.exec(component)?.[1] ?? ''
if (!/await loadInitialJobs\(\)/.test(onMountedBody)) {
  throw new Error(
    `${componentPath} must choose its section via loadInitialJobs on mount.`,
  )
}
if (/artJobStore\.jobs\.length[\s\S]*?return/.test(onMountedBody)) {
  throw new Error(
    `${componentPath} must not skip the first-non-empty selection on a revisit with cached jobs.`,
  )
}

requireMatch(
  /async function changeStatus\(status: ArtJobStatus \| 'ALL'\): Promise<void> \{[\s\S]*await artJobStore\.fetchJobs\(status, 1\)/,
  `${componentPath} must keep explicit status clicks authoritative after startup.`,
)

console.log(
  'ArtJob queue default status verified: startup chooses the first non-empty section, retries one queue race, re-picks on every revisit, and keeps explicit clicks authoritative.',
)
