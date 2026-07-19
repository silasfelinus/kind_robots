import { readFileSync, writeFileSync } from 'node:fs'

const path = 'stores/serverStore.ts'
const source = readFileSync(path, 'utf8')
const newline = source.includes('\r\n') ? '\r\n' : '\n'
let updated = source.replace(/\r\n/g, '\n')

function replaceExact(target, replacement, label) {
  if (!updated.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  updated = updated.replace(target, replacement)
}

replaceExact(
  `import {
  getModelStatusEngine,
  type ServerRuntimeReport,
} from './helpers/serverHelper'`,
  `import {
  getModelStatusEngine,
  type ServerRuntimeReport,
} from './helpers/serverHelper'
import {
  mergeServerRecord,
  mergeServerRows,
  type SafeServerRow,
} from './helpers/serverMerge'`,
  'Server merge helper import',
)

replaceExact(
  `  function upsertServer(server: Server): void {
    const index = servers.value.findIndex(
      (entry: Server): boolean => entry.id === server.id,
    )

    if (index >= 0) {
      servers.value.splice(index, 1, server)
    } else {
      servers.value.push(server)
    }

    servers.value.sort(sortServers)
  }

  function mergeServers(incoming: Server[]): void {
    const incomingIds = new Set<number>(
      incoming.map((server: Server): number => server.id),
    )

    servers.value = [
      ...servers.value.filter(
        (server: Server): boolean => !incomingIds.has(server.id),
      ),
      ...incoming,
    ].sort(sortServers)
  }`,
  `  function upsertServer(server: SafeServerRow): void {
    const index = servers.value.findIndex(
      (entry: Server): boolean => entry.id === server.id,
    )
    const merged = mergeServerRecord(
      index >= 0 ? servers.value[index] : undefined,
      server,
    )

    if (index >= 0) {
      servers.value.splice(index, 1, merged)
    } else {
      servers.value.push(merged)
    }

    servers.value.sort(sortServers)
  }

  function mergeServers(incoming: SafeServerRow[]): void {
    servers.value = mergeServerRows(servers.value, incoming).sort(sortServers)
  }`,
  'Server upsert and merge implementation',
)

replaceExact(
  `        if (wantsRemote && (!hasLoaded.value || options.force)) {
          const fetchedServers = await fetchAllServers(Boolean(options.force))
          mergeServers(fetchedServers)
        }`,
  `        if (wantsRemote && (!hasLoaded.value || options.force)) {
          await fetchAllServers(Boolean(options.force))
        }`,
  'Server initialize redundant merge',
)

replaceExact(
  `        if (res.success && isServerArray(res.data)) {
          servers.value = res.data.slice().sort(sortServers)
          hasLoaded.value = true
          syncToLocalStorage()
          return servers.value
        }`,
  `        if (res.success && isServerArray(res.data)) {
          mergeServers(res.data)
          hasLoaded.value = true
          syncToLocalStorage()
          return servers.value
        }`,
  'Server remote list merge',
)

writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
