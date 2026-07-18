import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

execFileSync('git', ['fetch', 'origin', 'main'], { stdio: 'inherit' })
execFileSync('git', ['checkout', 'origin/main', '--', 'stores/resourceStore.ts'], {
  stdio: 'inherit',
})

const path = 'stores/resourceStore.ts'
const source = readFileSync(path, 'utf8')
const start = source.indexOf('  async function addResources(')
const end = source.indexOf('  async function updateResource(', start)

if (start < 0 || end < 0) {
  throw new Error('Could not locate resourceStore.addResources boundaries.')
}

const replacement = `  async function addResources(data: Partial<Resource>[]): Promise<Resource[]> {
    try {
      const res = await performFetch<{
        created: Resource[]
        skipped: Array<{ name: string; reason: string }>
        failed: Array<{ name: string; message: string }>
      }>('/api/resources/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to add resources')
      }

      const created = res.data.created
      const createdIds = new Set(created.map((resource) => resource.id))

      resources.value = [
        ...resources.value.filter((resource) => !createdIds.has(resource.id)),
        ...created,
      ]

      hasLoaded.value = true
      return created
    } catch (error) {
      handleError(error, 'adding resources')
      return []
    }
  }

`

writeFileSync(path, source.slice(0, start) + replacement + source.slice(end))
