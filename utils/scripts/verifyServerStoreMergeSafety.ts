import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { Server } from '../../prisma/generated/prisma/client'
import {
  mergeServerRecord,
  mergeServerRows,
  type SafeServerRow,
} from '../../stores/helpers/serverMerge'

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

const rows = mergeServerRows(
  [cached, { ...cached, id: 2, title: 'Local-only server' }],
  [maskedRemote, { ...maskedRemote, id: 3, title: 'New remote server' }],
)
assert.equal(rows.length, 3)
assert.equal(rows.find((server) => server.id === 2)?.title, 'Local-only server')
assert.equal(rows.find((server) => server.id === 3)?.title, 'New remote server')

const source = readFileSync('stores/serverStore.ts', 'utf8')
assert.ok(
  source.includes('servers.value = mergeServerRows(servers.value, incoming)'),
  'serverStore must merge remote rows into cached rows.',
)
assert.ok(
  source.includes('mergeServers(res.data)') &&
    !source.includes('servers.value = res.data.slice().sort(sortServers)'),
  'fetchAllServers must not replace locally loaded servers.',
)
assert.ok(
  !source.includes('const fetchedServers = await fetchAllServers'),
  'initialize must not perform a redundant second merge.',
)

console.log('Server store merge safety contract passed.')
