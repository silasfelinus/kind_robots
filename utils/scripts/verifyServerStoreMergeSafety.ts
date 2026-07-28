import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { Server } from '../../prisma/generated/prisma/client'
import {
  mergeServerRecord,
  mergeServerRows,
  type SafeServerRow,
} from '../../stores/helpers/serverMerge'
import { reconcileServerRows } from '../../stores/helpers/serverReconcile'

const cached = {
  id: 1,
  title: 'Cached server',
  serverType: 'OPENAI',
  apiKey: 'local-secret',
  notes: 'local detail',
} as unknown as Server
const maskedRemote = {
  id: 1,
  title: 'Fresh server title',
  serverType: 'OPENAI',
  apiKey: '••••••••',
  hasApiKey: true,
  notes: undefined,
} as unknown as SafeServerRow

const merged = mergeServerRecord(cached, maskedRemote)
assert.equal(merged.title, 'Fresh server title')
assert.equal(merged.apiKey, 'local-secret')
assert.equal(merged.notes, 'local detail')

const removedSecret = mergeServerRecord(cached, {
  ...maskedRemote,
  apiKey: null,
  hasApiKey: false,
})
assert.equal(removedSecret.apiKey, null)

const localOnly = { ...cached, id: 2, title: 'Local-only server' }
const newRemote = { ...maskedRemote, id: 3, title: 'New remote server' }
const rows = mergeServerRows([cached, localOnly], [maskedRemote, newRemote])
assert.equal(rows.length, 3)
assert.equal(rows.find((server) => server.id === 2)?.title, 'Local-only server')
assert.equal(rows.find((server) => server.id === 3)?.title, 'New remote server')

const reconciled = reconcileServerRows(
  [cached, localOnly],
  [maskedRemote, newRemote],
)
assert.equal(reconciled.length, 2)
assert.equal(reconciled.some((server) => server.id === 2), false)
assert.equal(reconciled.find((server) => server.id === 1)?.apiKey, 'local-secret')
assert.equal(reconciled.find((server) => server.id === 3)?.title, 'New remote server')

const source = readFileSync('stores/serverStore.ts', 'utf8')
assert.ok(
  source.includes('servers.value = mergeServerRows(servers.value, incoming)'),
  'serverStore must merge partial remote rows into cached rows.',
)
assert.ok(
  source.includes('mergeServers(res.data)') &&
    !source.includes('servers.value = res.data.slice().sort(sortServers)'),
  'fetchAllServers must preserve locally cached safe fields.',
)
assert.ok(
  !source.includes('const fetchedServers = await fetchAllServers'),
  'initialize must not perform a redundant second merge.',
)

const reconciliationPlugin = readFileSync(
  'plugins/reconcile-server-cache.client.ts',
  'utf8',
)
assert.ok(
  reconciliationPlugin.includes(
    'reconcileServerRows(serverStore.servers, response.data)',
  ),
  'client bootstrap must reconcile the complete API list authoritatively.',
)
assert.ok(
  reconciliationPlugin.includes('serverStore.syncToLocalStorage()'),
  'the pruned server list must replace the stale localStorage cache.',
)

const deleteEndpoint = readFileSync('server/api/server/[id].delete.ts', 'utf8')
assert.ok(
  deleteEndpoint.includes('Server was already removed.'),
  'DELETE must succeed when a stale cached server no longer exists.',
)

console.log('Server store merge and reconciliation safety contract passed.')
