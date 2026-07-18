// /utils/scripts/verifyWonderLabSelection.ts
import assert from 'node:assert/strict'
import {
  findWonderLabComponentForQuery,
  normalizeWonderLabComponentName,
  normalizeWonderLabComponentQuery,
  wonderLabComponentQueryValue,
} from '@/utils/wonderlab/componentSelection'

const components = [
  { id: 12, componentName: 'ComponentCard' },
  { id: 25, componentName: 'narrator-chat' },
  { id: 41, componentName: 'WorkspaceNarrator' },
]

assert.equal(normalizeWonderLabComponentQuery(['25', '41']), '25')
assert.equal(normalizeWonderLabComponentQuery(null), '')
assert.equal(normalizeWonderLabComponentName('WorkspaceNarrator'), 'workspace-narrator')

assert.equal(findWonderLabComponentForQuery(components, '12')?.id, 12)
assert.equal(
  findWonderLabComponentForQuery(components, 'narrator-chat')?.id,
  25,
)
assert.equal(
  findWonderLabComponentForQuery(components, 'workspace-narrator')?.id,
  41,
)
assert.equal(findWonderLabComponentForQuery(components, '999'), null)
assert.equal(findWonderLabComponentForQuery(components, ''), null)
assert.equal(wonderLabComponentQueryValue(components[0]!), '12')

console.log('WonderLab component selection verification passed.')
