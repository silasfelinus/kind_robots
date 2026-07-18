import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

execFileSync('git', ['fetch', 'origin', 'main'], { stdio: 'inherit' })
execFileSync('git', ['checkout', 'origin/main', '--', 'stores/serverStore.ts'], {
  stdio: 'inherit',
})

const path = 'stores/serverStore.ts'
const source = readFileSync(path, 'utf8')
const start = source.indexOf('  async function addServers(')
const end = source.indexOf('  async function updateServer(', start)

if (start < 0 || end < 0) {
  throw new Error('Could not locate serverStore.addServers boundaries.')
}

const section = source.slice(start, end)
const search = "performFetch('/api/server', {"

if (!section.includes(search)) {
  throw new Error('Could not locate addServers POST endpoint.')
}

const updatedSection = section.replace(
  search,
  "performFetch('/api/server/batch', {",
)

if (updatedSection === section) {
  throw new Error('Server store endpoint replacement did not change the file.')
}

writeFileSync(path, source.slice(0, start) + updatedSection + source.slice(end))
