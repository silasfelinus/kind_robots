import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

// Shared harness for the adversarial Memory World playtests: bundle the real
// Pinia store with esbuild, stub the user store and gallery deck, and fake a
// browser tab whose timers queue (so a persona can reload mid-animation) and
// whose localStorage survives reloads.
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

const DECK_STUB =
  'export async function resolveMemoryDungeonDeck(_deck, count, usedPrior = 0, seen = []) { const out = []; for (let i = 0; out.length < count; i++) { const p = "/playtest-" + (usedPrior + i) + ".webp"; if (!seen.includes(p)) out.push(p) } return out }'

/** Bundle `lines` (re-exports from the app) and import the result. */
export async function importMemoryWorld(lines) {
  const bundle = await build({
    stdin: { contents: lines.join('\n'), resolveDir: root, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    define: {
      'import.meta.client': 'true',
      'import.meta.server': 'false',
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [
      {
        name: 'memory-world-playtest',
        setup(builder) {
          builder.onResolve(
            { filter: /^\.\/(userStore|helpers\/memoryDungeonDeckSource)$/ },
            ({ path: name, importer }) => {
              if (!importer.endsWith('/stores/memoryWorldStore.ts')) return
              return { path: name, namespace: 'memory-stub' }
            },
          )
          builder.onLoad(
            { filter: /.*/, namespace: 'memory-stub' },
            ({ path: name }) => ({
              contents:
                name === './userStore'
                  ? 'export function useUserStore() { return { isLoggedIn: false, isChild: false, showMature: false } }'
                  : DECK_STUB,
              loader: 'ts',
              resolveDir: root,
            }),
          )
          builder.onResolve(
            { filter: /^[@~]\// },
            ({ path: name, kind, importer }) =>
              builder.resolve('./' + name.slice(2), {
                resolveDir: root,
                kind,
                importer,
              }),
          )
        },
      },
    ],
    logLevel: 'error',
  })
  const bundleDir = mkdtempSync(path.join(tmpdir(), 'memory-world-playtest-'))
  const bundlePath = path.join(bundleDir, 'store.mjs')
  writeFileSync(bundlePath, bundle.outputFiles[0].text)
  return import(pathToFileURL(bundlePath).href)
}

/** A fake tab: queued timers and reload-surviving storage. */
export function installBrowser() {
  const tab = { pendingTimers: [], storage: new Map() }
  globalThis.window = {
    setTimeout(callback, delay) {
      tab.pendingTimers.push({ callback, delay })
      return tab.pendingTimers.length
    },
    clearTimeout() {},
    localStorage: {
      getItem: (key) => (tab.storage.has(key) ? tab.storage.get(key) : null),
      setItem: (key, value) => tab.storage.set(key, String(value)),
      removeItem: (key) => tab.storage.delete(key),
    },
  }
  globalThis.fetch = async () => ({ ok: false, headers: new Map() })
  return tab
}

export function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export async function settle() {
  for (let i = 0; i < 6; i++) await Promise.resolve()
  await new Promise((resolve) => setImmediate(resolve))
}

export async function flushTimers(tab) {
  for (let guard = 0; tab.pendingTimers.length && guard < 50; guard++) {
    const queue = tab.pendingTimers
    tab.pendingTimers = []
    for (const timer of queue) timer.callback()
    await settle()
  }
}

/** Mount the page again: a fresh Pinia hydrated from the tab's storage. */
export async function openPage(M, tab) {
  tab.pendingTimers = []
  M.setActivePinia(M.createPinia())
  const world = M.useMemoryWorldStore()
  // Mirrors memory-dungeon-overworld.vue onMounted.
  world.hydrate()
  await world.syncActiveMapDeck()
  await settle()
  return world
}
