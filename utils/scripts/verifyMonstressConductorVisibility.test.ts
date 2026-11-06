import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  canExposeConductorProject,
  isMatureConductorProject,
} from '../../server/utils/conductorMatureProjects'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
function source(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

assert.equal(isMatureConductorProject('monstress-convention'), true)
assert.equal(isMatureConductorProject('crystal-street'), false)

for (const showMature of [false, true]) {
  for (const isPublic of [false, true]) {
    for (const isAdmin of [false, true]) {
      const accessible = canExposeConductorProject(
        'monstress-convention',
        showMature,
        isPublic,
        isAdmin,
      )
      assert.equal(accessible, showMature && (isPublic || isAdmin))
      assert.equal(
        canExposeConductorProject('crystal-street', showMature, isPublic, isAdmin),
        true,
      )
    }
  }
}

const sync = source('server/api/conductor/sync.post.ts')
assert.match(sync, /isPublic: !isMatureConductorProject\(project\.slug\)/)
assert.match(sync, /isMature: isMatureConductorProject\(project\.slug\)/)
const projects = source('server/api/conductor/projects.get.ts')
assert.match(projects, /viewerShowsMature\(viewer\?\.user\)/)
assert.match(projects, /canExposeConductorProject\(/)
const progress = source('server/api/conductor/progress.get.ts')
assert.match(progress, /if \(isMatureConductorProject\(project\.slug\)\) continue/)

console.log('Monstress Conductor listing privacy: all opt-in/public/admin cases passed')
