import assert from 'node:assert/strict'
import fs from 'node:fs'

const content = fs.readFileSync('content/taskmaster.md', 'utf8')
const samples = fs.readFileSync(
  'components/taskmaster/taskmaster-sample-tasks.vue',
  'utf8',
)

assert.match(content, /:taskmaster-sample-tasks\s+\n:taskmaster-page/)
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
