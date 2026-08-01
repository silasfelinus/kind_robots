import assert from 'node:assert/strict'
import fs from 'node:fs'

const content = fs.readFileSync('content/taskmaster.md', 'utf8')
const samples = fs.readFileSync(
  'components/taskmaster/taskmaster-sample-tasks.vue',
  'utf8',
)
const page = fs.readFileSync('components/pages/taskmaster-page.vue', 'utf8')

// interface-vision/t-006: content/taskmaster.md now mounts exactly one
// top-level MDC component (:taskmaster-page) to satisfy the layout
// contract's one-mdc rule. TaskmasterSampleTasks is composed inside
// taskmaster-page.vue instead of as a second sibling MDC block.
assert.match(content, /^:taskmaster-page\s*$/m)
assert.doesNotMatch(content, /:taskmaster-sample-tasks/)
assert.match(page, /<TaskmasterSampleTasks/)
assert.match(
  samples,
  /Look at my conductor repo and help me clear any current human gates\./,
)
assert.match(samples, /task\.status === 'needs-human'/)
assert.match(samples, /conductorStore\.fetchProjects\(true\)/)
assert.match(samples, /projectSlug,/)
assert.match(samples, /taskmasterStore\.prepareQuest\(/)
assert.doesNotMatch(samples, /taskmasterStore\.(?:startQuest|beginStory|applyWriteBack)\(/)
assert.doesNotMatch(samples, /approved_by_human|approvedByHuman/)

const sampleIds = [...samples.matchAll(/id: '([^']+)'/g)].map((match) => match[1])
assert.deepEqual(sampleIds, [
  'conductor-gates',
  'ship-feature',
  'reclaim-space',
  'hard-conversation',
])

console.log('Taskmaster sample-task contract passed.')
