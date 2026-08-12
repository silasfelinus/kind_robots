import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

const root = process.cwd()
const abs = (path) => resolve(root, path)
const read = (path) => readFileSync(abs(path), 'utf8')
const write = (path, content) => {
  mkdirSync(dirname(abs(path)), { recursive: true })
  writeFileSync(abs(path), content)
}
const remove = (path) => {
  if (existsSync(abs(path))) rmSync(abs(path), { force: true, recursive: true })
}
const rewrite = (path, transform) => write(path, transform(read(path)))
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`Missing migration anchor: ${label}`)
}

const textExtensions = new Set(['.ts', '.vue', '.mjs', '.js', '.md', '.yml', '.yaml', '.json', '.txt'])
const skippedDirs = new Set(['.git', 'node_modules', '.nuxt', '.output', 'dist', 'public', 'prisma/generated'])

function walkText(dir = root, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(root, full).replace(/\\/g, '/')
    if ([...skippedDirs].some((skip) => rel === skip || rel.startsWith(`${skip}/`))) continue
    const stat = statSync(full)
    if (stat.isDirectory()) walkText(full, out)
    else if (textExtensions.has(extname(entry))) out.push(rel)
  }
  return out
}

function replaceEverywhere(from, to) {
  for (const file of walkText()) {
    const source = read(file)
    if (!source.includes(from)) continue
    write(file, source.split(from).join(to))
  }
}

mkdirSync(abs('stores/helpers'), { recursive: true })

// Audio analysis is implementation machinery owned by musicMentorStore.
renameSync(abs('stores/helpers/audioAnalysisHelper.ts'), abs('stores/helpers/audioAnalysisHelper.ts'))
rewrite('stores/helpers/audioAnalysisHelper.ts', (source) =>
  source.replace('// /stores/helpers/audioAnalysisHelper.ts', '// /stores/helpers/audioAnalysisHelper.ts'),
)
replaceEverywhere('@/stores/helpers/audioAnalysisHelper', '@/stores/helpers/audioAnalysisHelper')
replaceEverywhere('stores/helpers/audioAnalysisHelper.ts', 'stores/helpers/audioAnalysisHelper.ts')

// Narrative art is shared store orchestration, not component lifecycle state.
renameSync(abs('stores/helpers/narrativeArtJobsHelper.ts'), abs('stores/helpers/narrativeArtJobsHelper.ts'))
rewrite('stores/helpers/narrativeArtJobsHelper.ts', (source) =>
  source
    .replace('// /stores/helpers/narrativeArtJobsHelper.ts', '// /stores/helpers/narrativeArtJobsHelper.ts')
    .replace('export function createNarrativeArtJobsController()', 'export function createNarrativeArtJobsController()'),
)
replaceEverywhere('@/stores/helpers/narrativeArtJobsHelper', '@/stores/helpers/narrativeArtJobsHelper')
replaceEverywhere('stores/helpers/narrativeArtJobsHelper.ts', 'stores/helpers/narrativeArtJobsHelper.ts')
replaceEverywhere('createNarrativeArtJobsController', 'createNarrativeArtJobsController')

// Artwork request dedupe belongs to artStore. The helper only owns the low-level
// in-flight Promise cache; callers enter through the store.
write(
  'stores/helpers/artworkLoadHelper.ts',
  `// /stores/helpers/artworkLoadHelper.ts\nconst inFlight = new Map<string, Promise<void>>()\n\nexport function preloadArtwork(url: string): Promise<void> {\n  let settle = inFlight.get(url)\n  if (!settle) {\n    settle = new Promise<void>((resolve) => {\n      const probe = new Image()\n      probe.onload = () => resolve()\n      probe.onerror = () => resolve()\n      probe.src = url\n    })\n    inFlight.set(url, settle)\n  }\n  return settle\n}\n`,
)
remove('stores/helpers/artworkLoadHelper.ts')
rewrite('stores/artStore.ts', (source) => {
  const importAnchor = "import { resolveArtImageSrc } from '@/utils/artImageSrc'\n"
  requireText(source, importAnchor, 'artStore resolveArtImageSrc import')
  if (!source.includes("@/stores/helpers/artworkLoadHelper")) {
    source = source.replace(
      importAnchor,
      `${importAnchor}import { preloadArtwork } from '@/stores/helpers/artworkLoadHelper'\n`,
    )
  }
  const returnAnchor = '    fetchArtImageForDisplay,\n'
  requireText(source, returnAnchor, 'artStore display return')
  if (!source.includes('    preloadArtwork,\n')) {
    source = source.replace(returnAnchor, `    preloadArtwork,\n${returnAnchor}`)
  }
  return source
})
rewrite('components/navigation/navigation-artwork.vue', (source) => {
  source = source.replace(
    "import { useDedupedArtwork } from '@/stores/helpers/useDedupedArtwork'\n",
    "import { useArtStore } from '@/stores/artStore'\n",
  )
  const old = 'const root = ref<HTMLElement>()\nconst { resolvedSrc, request } = useDedupedArtwork()\n'
  requireText(source, old, 'navigation artwork composable setup')
  return source.replace(
    old,
    `const root = ref<HTMLElement>()\nconst artStore = useArtStore()\nconst resolvedSrc = ref<string>()\n\nasync function request(url: string): Promise<void> {\n  await artStore.preloadArtwork(url)\n  resolvedSrc.value = url\n}\n`,
  )
})
replaceEverywhere('stores/helpers/artworkLoadHelper.ts', 'stores/helpers/artworkLoadHelper.ts')

// Earned-karma display tracking is entered through userStore. The helper is
// deliberately API-agnostic: userStore remains the only client owner of the
// endpoint while the helper handles visible-id normalization + Vue watching.
write(
  'stores/helpers/earnedKarmaHelper.ts',
  `// /stores/helpers/earnedKarmaHelper.ts\nimport { computed, ref, watch, type Ref } from 'vue'\nimport { KARMA_EARNED_BATCH_LIMIT, type KarmaRefType } from '@/utils/karmaRefTypes'\n\nexport type KarmaEarnedRow = {\n  refType: string\n  refId: string\n  earnedKarma: number\n}\n\nexport type EarnedKarmaLoader = (\n  refType: KarmaRefType,\n  ids: number[],\n) => Promise<KarmaEarnedRow[] | null>\n\nexport function createEarnedKarmaTracker(\n  refType: KarmaRefType,\n  visibleIds: () => ReadonlyArray<number | string | null | undefined>,\n  load: EarnedKarmaLoader,\n): { earnedKarma: Ref<Record<number, number>>; refresh: () => Promise<void> } {\n  const earnedKarma = ref<Record<number, number>>({})\n\n  function batchIds(): number[] {\n    const ids = new Set<number>()\n    for (const raw of visibleIds()) {\n      const id = Number(raw)\n      if (!Number.isFinite(id)) continue\n      ids.add(id)\n      if (ids.size >= KARMA_EARNED_BATCH_LIMIT) break\n    }\n    return Array.from(ids)\n  }\n\n  const batchKey = computed(() => batchIds().join(','))\n\n  async function refresh(): Promise<void> {\n    const ids = batchIds()\n    if (!ids.length) {\n      earnedKarma.value = {}\n      return\n    }\n\n    const rows = await load(refType, ids)\n    if (!rows) return\n\n    const next: Record<number, number> = {}\n    for (const row of rows) {\n      const id = Number(row.refId)\n      if (Number.isFinite(id)) next[id] = row.earnedKarma\n    }\n    earnedKarma.value = next\n  }\n\n  watch(batchKey, () => void refresh(), { immediate: true })\n  return { earnedKarma, refresh }\n}\n`,
)
remove('stores/userStore.ts')
rewrite('stores/userStore.ts', (source) => {
  const importAnchor = "import { performFetch, handleError } from './utils'\n"
  requireText(source, importAnchor, 'userStore utils import')
  if (!source.includes('createEarnedKarmaTracker')) {
    source = source.replace(
      importAnchor,
      `${importAnchor}import { createEarnedKarmaTracker, type KarmaEarnedRow } from './helpers/earnedKarmaHelper'\nimport type { KarmaRefType } from '@/utils/karmaRefTypes'\n`,
    )
  }

  const returnIndex = source.lastIndexOf('\n  return {\n')
  if (returnIndex < 0) throw new Error('Missing userStore final return')
  if (!source.includes('function trackEarnedKarma(')) {
    const functionText = `\n  function trackEarnedKarma(\n    refType: KarmaRefType,\n    visibleIds: () => ReadonlyArray<number | string | null | undefined>,\n  ) {\n    return createEarnedKarmaTracker(refType, visibleIds, async (type, ids) => {\n      const res = await performFetch<KarmaEarnedRow[]>(\n        '/api/economy/karma-earned',\n        {\n          method: 'POST',\n          body: JSON.stringify({\n            items: ids.map((id) => ({ refType: type, refId: id })),\n          }),\n        },\n      )\n\n      return res.success && Array.isArray(res.data) ? res.data : null\n    })\n  }\n`
    source = source.slice(0, returnIndex) + functionText + source.slice(returnIndex)
  }
  const returnAnchor = '    initialize,\n'
  requireText(source, returnAnchor, 'userStore initialize return')
  if (!source.includes('    trackEarnedKarma,\n')) {
    source = source.replace(returnAnchor, `    trackEarnedKarma,\n${returnAnchor}`)
  }
  return source
})

for (const file of walkText(abs('components'))) {
  if (!file.endsWith('.vue')) continue
  let source = read(file)
  if (!source.includes('useEarnedKarma(')) continue
  source = source.replaceAll('useEarnedKarma(', 'userStore.trackEarnedKarma(')
  if (!source.includes('const userStore = useUserStore()')) {
    if (!source.includes("from '@/stores/userStore'")) {
      const scriptTag = '<script setup lang="ts">\n'
      requireText(source, scriptTag, `${file} script tag`)
      source = source.replace(scriptTag, `${scriptTag}import { useUserStore } from '@/stores/userStore'\n`)
    }
    const callIndex = source.indexOf('userStore.trackEarnedKarma(')
    const lineStart = source.lastIndexOf('\n', callIndex) + 1
    source = source.slice(0, lineStart) + 'const userStore = useUserStore()\n' + source.slice(lineStart)
  }
  write(file, source)
}
replaceEverywhere('stores/userStore.ts', 'stores/userStore.ts')

rewrite('utils/scripts/verifyEarnedKarmaWiring.ts', (source) =>
  source
    .replace('client: stores/userStore.ts.', 'client: stores/userStore.ts.')
    .replace("const OWNER = 'stores/userStore.ts'", "const OWNER = 'stores/userStore.ts'")
    .replace("const CLIENT_DIRS = ['components', 'composables', 'pages', 'stores', 'utils']", "const CLIENT_DIRS = ['components', 'pages', 'stores', 'utils']")
    .replace('a reader at the composable.', 'a reader at the store.')
    .replace('Use useEarnedKarma(refType, () => visibleIds) instead of a new copy.', 'Use useUserStore().trackEarnedKarma(refType, () => visibleIds) instead of a new copy.'),
)

// Storybook library remains factored for readability, but it is instantiated
// inside storybookStore and receives store-owned state through an explicit bridge.
let libraryHelper = read('stores/helpers/storybookLibraryHelper.ts')
libraryHelper = libraryHelper
  .replace('// /stores/helpers/storybookLibraryHelper.ts', '// /stores/helpers/storybookLibraryHelper.ts')
  .replace("import { computed, proxyRefs, ref, watch } from 'vue'", "import { computed, ref, watch } from 'vue'")
  .replace(
    `import {\n  useStorybookStore,\n  type StorybookBible,\n  type StorybookSession,\n} from '@/stores/storybookStore'\nimport { useUserStore } from '@/stores/userStore'`,
    `import type {\n  StorybookBible,\n  StorybookSession,\n  StorybookStartInput,\n} from '@/stores/storybookStore'`,
  )

const oldLibraryHeader = `export function useStorybookLibrary() {\n  const storyStore = useStorybookStore()\n  const userStore = useUserStore()\n`
requireText(libraryHelper, oldLibraryHeader, 'storybook library function header')
const bridge = `type StorybookLibraryBridge = {\n  getSession: () => StorybookSession | null\n  setSession: (session: StorybookSession) => void\n  isWeaving: () => boolean\n  resumeNarrativeArtJobs: () => void\n  beginStory: (input: StorybookStartInput) => Promise<boolean>\n  authenticatedUserId: () => number | null\n}\n\nexport function createStorybookLibraryController(bridge: StorybookLibraryBridge) {\n`
libraryHelper = libraryHelper.replace(oldLibraryHeader, bridge)
libraryHelper = libraryHelper
  .replace("storyStore.$patch({ session: cloneSession(found), errorMessage: '' })", 'bridge.setSession(cloneSession(found))')
  .replace("storyStore.$patch({ session: duplicate, errorMessage: '' })", 'bridge.setSession(duplicate)')
  .replaceAll('storyStore.resumeNarrativeArtJobs()', 'bridge.resumeNarrativeArtJobs()')
  .replaceAll('storyStore.beginStory(', 'bridge.beginStory(')
  .replaceAll('storyStore.isWeaving', 'bridge.isWeaving()')
  .replaceAll('storyStore.session', 'bridge.getSession()')
  .replaceAll('userStore.authenticatedUserId', 'bridge.authenticatedUserId()')
  .replace('return proxyRefs({', 'return {')
const proxyTail = '  })\n}\n'
if (!libraryHelper.endsWith(proxyTail)) throw new Error('Unexpected storybook library return tail')
libraryHelper = libraryHelper.slice(0, -proxyTail.length) + '  }\n}\n'
write('stores/helpers/storybookLibraryHelper.ts', libraryHelper)
remove('stores/helpers/storybookLibraryHelper.ts')

// Storybook mode is actual shared preference state, so it lives directly in
// storybookStore rather than in a module-level ref outside Pinia.
remove('stores/storybookStore.ts')
rewrite('stores/storybookStore.ts', (source) => {
  source = source
    .replace("import { createNarrativeArtJobsController } from '@/stores/helpers/narrativeArtJobsHelper'", "import { createNarrativeArtJobsController } from '@/stores/helpers/narrativeArtJobsHelper'\nimport { createStorybookLibraryController } from '@/stores/helpers/storybookLibraryHelper'")

  const storageAnchor = "const STORAGE_KEY = 'storybook-session'\n"
  requireText(source, storageAnchor, 'storybook storage key')
  if (!source.includes('export type StorybookMode =')) {
    const modeDefinitions = `export type StorybookMode = 'classic' | 'storybook' | 'storybook-dark'\n\nexport const STORYBOOK_MODES: {\n  key: StorybookMode\n  label: string\n  hint: string\n}[] = [\n  { key: 'classic', label: 'Classic', hint: 'Your own theme, standard layout' },\n  { key: 'storybook', label: 'Storybook', hint: 'Warm paper, serif narration' },\n  { key: 'storybook-dark', label: 'Storybook Dark', hint: 'A lit stage in a dark house' },\n]\n\nconst STORYBOOK_MODE_STORAGE_KEY = 'storybookMode'\nconst DEFAULT_STORYBOOK_MODE: StorybookMode = 'storybook'\n\nfunction isStorybookMode(value: unknown): value is StorybookMode {\n  return STORYBOOK_MODES.some((mode) => mode.key === value)\n}\n\n`
    source = source.replace(storageAnchor, modeDefinitions + storageAnchor)
  }

  const refsAnchor = "  const errorMessage = ref('')\n"
  requireText(source, refsAnchor, 'storybook error ref')
  if (!source.includes('const mode = ref<StorybookMode>')) {
    const state = `\n  const mode = ref<StorybookMode>(DEFAULT_STORYBOOK_MODE)\n  let modeHydrated = false\n  const dataTheme = computed<string | undefined>(() =>\n    mode.value === 'classic' ? undefined : mode.value,\n  )\n  const isStoryStyled = computed(() => mode.value !== 'classic')\n  const modes = STORYBOOK_MODES\n\n  function hydrateStorybookMode(): void {\n    if (modeHydrated || typeof localStorage === 'undefined') return\n    try {\n      const stored = localStorage.getItem(STORYBOOK_MODE_STORAGE_KEY)\n      mode.value = isStorybookMode(stored) ? stored : DEFAULT_STORYBOOK_MODE\n    } catch {\n      mode.value = DEFAULT_STORYBOOK_MODE\n    }\n    modeHydrated = true\n  }\n\n  function setMode(next: StorybookMode): void {\n    if (!isStorybookMode(next)) return\n    mode.value = next\n    if (typeof localStorage === 'undefined') return\n    try {\n      localStorage.setItem(STORYBOOK_MODE_STORAGE_KEY, next)\n    } catch {}\n  }\n\n  const {\n    library,\n    recentStories,\n    initialize: initializeLibrary,\n    archiveCurrent,\n    openStory,\n    duplicateStory,\n    restartStory,\n    buildExport,\n  } = createStorybookLibraryController({\n    getSession: () => session.value,\n    setSession: (next) => {\n      session.value = next\n      errorMessage.value = ''\n      persist()\n    },\n    isWeaving: () => isWeaving.value,\n    resumeNarrativeArtJobs,\n    beginStory,\n    authenticatedUserId: () => userStore.authenticatedUserId,\n  })\n`
    source = source.replace(refsAnchor, refsAnchor + state)
  }

  source = source.replace(
    "  function restoreFromLocalStorage() {\n    if (typeof localStorage === 'undefined') return\n",
    "  function restoreFromLocalStorage() {\n    if (typeof localStorage === 'undefined') return\n    hydrateStorybookMode()\n",
  )

  const returnAnchor = '    setupDraft,\n'
  requireText(source, returnAnchor, 'storybook return setupDraft')
  if (!source.includes('    initializeLibrary,\n')) {
    source = source.replace(
      returnAnchor,
      `    mode,\n    setMode,\n    dataTheme,\n    isStoryStyled,\n    modes,\n    library,\n    recentStories,\n    initializeLibrary,\n    archiveCurrent,\n    openStory,\n    duplicateStory,\n    restartStory,\n    buildExport,\n${returnAnchor}`,
    )
  }
  return source
})

rewrite('components/conductor/storybook-page.vue', (source) =>
  source
    .replace('see stores/storybookStore.ts.', 'see storybookStore reading-mode state.')
    .replace(':data-theme="dataTheme"', ':data-theme="store.dataTheme"')
    .replace('v-for="option in modes"', 'v-for="option in store.modes"')
    .replaceAll('mode === option.key', 'store.mode === option.key')
    .replace('@click="setMode(option.key)"', '@click="store.setMode(option.key)"')
    .replace("const { mode, setMode, dataTheme, modes } = useStorybookMode()\n\n", ''),
)
rewrite('components/narrative/kr-choice-list.vue', (source) =>
  source.replace('see useStorybookMode', 'see storybookStore reading mode'),
)

rewrite('components/pages/storybook-library-page.vue', (source) => {
  source = source.replace("import { useStorybookLibrary } from '@/stores/helpers/useStorybookLibrary'\n", '')
  source = source.replace('const library = useStorybookLibrary()\n', '')
  source = source.replaceAll('library.recentStories', 'storyStore.recentStories')
  source = source.replace('library.initialize()', 'storyStore.initializeLibrary()')
  source = source.replaceAll('library.', 'storyStore.')
  return source
})
replaceEverywhere('stores/helpers/storybookLibraryHelper.ts', 'stores/helpers/storybookLibraryHelper.ts')
replaceEverywhere('stores/storybookStore.ts', 'stores/storybookStore.ts')

// Rewrite the Storybook library contract around the new ownership boundary.
write(
  'utils/scripts/verifyStorybookSessionLibrary.mjs',
  `// /utils/scripts/verifyStorybookSessionLibrary.mjs\nimport assert from 'node:assert/strict'\nimport { readFileSync } from 'node:fs'\nimport { resolve } from 'node:path'\n\nfunction source(path) { return readFileSync(resolve(process.cwd(), path), 'utf8') }\nfunction includesAll(path, values) {\n  const contents = source(path)\n  for (const value of values) assert.ok(contents.includes(value), \`\${path} must include \${value}\`)\n}\n\nconst helperPath = 'stores/helpers/storybookLibraryHelper.ts'\nconst shellPath = 'components/pages/storybook-library-page.vue'\nconst contentPath = 'content/storybook.md'\nconst storePath = 'stores/storybookStore.ts'\n\nconst helper = source(helperPath)\nconst shell = source(shellPath)\nconst store = source(storePath)\n\nincludesAll(helperPath, [\n  "const LIBRARY_STORAGE_KEY = 'storybook-session-library-v1'",\n  'const MAX_LIBRARY_SESSIONS = 20',\n  'bridge.authenticatedUserId()',\n  'function openStory(',\n  'function duplicateStory(',\n  'async function restartStory(',\n  'function buildExport(',\n  "format: 'markdown' | 'json'",\n  'archiveCurrent',\n])\nincludesAll(helperPath, [\n  'const sessionId = makeId()',\n  'const beatIds = new Map<string, string>()',\n  'const beatId = makeId()',\n  "dedupeKey: [beat.art.product, sessionId, beatId, beat.art.moment].join(':')",\n  'jobId: undefined',\n  "beat.art?.status === 'done'",\n  'branchHistory: duplicate.branchHistory.map',\n  'consequences: duplicate.consequences.map',\n  'inventory: duplicate.inventory.map',\n])\nassert.ok(!helper.includes("beat.art?.status === 'queued'") && !helper.includes("beat.art?.status === 'rendering'"))\nassert.ok(helper.indexOf('upsert(source)') < helper.indexOf('bridge.beginStory('))\nassert.ok(!helper.includes('useTaskmasterStore') && !helper.includes('useTodoStore') && !helper.includes('useConductorStore'))\n\nincludesAll(storePath, [\n  "defineStore('storybookStore'",\n  'createStorybookLibraryController',\n  'initializeLibrary',\n  'recentStories',\n  'openStory',\n  'duplicateStory',\n  'restartStory',\n  'buildExport',\n  "const STORYBOOK_MODE_STORAGE_KEY = 'storybookMode'",\n  'function setMode(',\n])\nincludesAll(shellPath, [\n  '<StorybookPage />',\n  'Story library',\n  'Recent stories',\n  'storyStore.openStory(',\n  'storyStore.duplicateStory(',\n  'storyStore.restartStory(',\n  'storyStore.buildExport(',\n  'storyStore.archiveCurrent()',\n])\nassert.ok(!shell.includes('useStorybookLibrary'))\nincludesAll(contentPath, [':storybook-library-page'])\nassert.ok(!source(contentPath).includes(':storybook-page\\n'))\n\nconsole.log('Storybook session-library contract passed: library and reading-mode state are owned by storybookStore, with helper-only implementation machinery.')\n`,
)

// Architecture fence: Kind Robots intentionally uses the root-first client tree.
write(
  'utils/scripts/verify-project-architecture.mjs',
  `import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'\nimport { join, relative, resolve } from 'node:path'\n\nconst root = process.cwd()\nconst failures = []\nfor (const forbidden of ['app', 'composables']) {\n  const full = resolve(root, forbidden)\n  if (existsSync(full) && statSync(full).isDirectory()) failures.push(\`root \${forbidden}/ is forbidden by the Kind Robots architecture\`)\n}\n\nconst skip = new Set(['.git', 'node_modules', '.nuxt', '.output', 'dist', 'public', 'prisma'])\nfunction walk(dir, out = []) {\n  for (const entry of readdirSync(dir)) {\n    if (skip.has(entry)) continue\n    const full = join(dir, entry)\n    if (statSync(full).isDirectory()) walk(full, out)\n    else if (/\\.(ts|vue|js|mjs|md|yml|yaml)$/.test(entry)) out.push(full)\n  }\n  return out\n}\nfor (const file of walk(root)) {\n  const rel = relative(root, file).replace(/\\\\/g, '/')\n  if (rel === 'utils/scripts/verify-project-architecture.mjs') continue\n  const text = readFileSync(file, 'utf8')\n  if (/[~@]\\/composables\\//.test(text)) failures.push(\`\${rel} still imports from composables/\`)\n}\n\nconst clientMiddleware = resolve(root, 'middleware/navigation-access.global.ts')\nif (!existsSync(clientMiddleware)) failures.push('client route middleware must remain at middleware/navigation-access.global.ts')\nconst middlewareText = existsSync(clientMiddleware) ? readFileSync(clientMiddleware, 'utf8') : ''\nif (!middlewareText.includes('defineNuxtRouteMiddleware')) failures.push('root middleware must remain Nuxt route middleware')\n\nconst agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8')\nif (!agents.includes('Root-first client layout')) failures.push('AGENTS.md must document the root-first client layout')\nif (!agents.includes('Do not create a root \`composables/\` directory')) failures.push('AGENTS.md must document the composables ban')\n\nif (failures.length) throw new Error(\`Project architecture contract failed:\\n- \${failures.join('\\n- ')}\`)\nconsole.log('Project architecture verified: root-first layout, no composables island, client/server middleware remain distinct.')\n`,
)
write(
  '.github/workflows/project-architecture-contract.yml',
  `name: Project Architecture Contract\n\non:\n  pull_request:\n    paths:\n      - 'AGENTS.md'\n      - 'app/**'\n      - 'composables/**'\n      - 'middleware/**'\n      - 'server/middleware/**'\n      - 'stores/**'\n      - 'components/**'\n      - 'utils/scripts/verify-project-architecture.mjs'\n  push:\n    branches: [main]\n    paths:\n      - 'AGENTS.md'\n      - 'app/**'\n      - 'composables/**'\n      - 'middleware/**'\n      - 'server/middleware/**'\n      - 'stores/**'\n      - 'components/**'\n      - 'utils/scripts/verify-project-architecture.mjs'\n\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Verify Kind Robots project architecture\n        run: node utils/scripts/verify-project-architecture.mjs\n`,
)

rewrite('AGENTS.md', (source) => {
  const anchor = '- Keep props and emits few. Shared state belongs in a Pinia store, not threaded through\n  component trees.\n'
  requireText(source, anchor, 'AGENTS shared-state rule')
  if (source.includes('Root-first client layout')) return source
  const rules = `- **Root-first client layout is intentional.** Kind Robots keeps \`components/\`, \`pages/\`,\n  \`stores/\`, \`middleware/\`, \`assets/\`, and \`utils/\` at repository root. Do not migrate\n  them into a wrapper \`app/\` directory merely because a newer Nuxt convention suggests it.\n- **Do not create a root \`composables/\` directory.** Domain state, API calls, persistence,\n  caching, and orchestration belong to the responsible Pinia store. Store-owned implementation\n  machinery belongs in \`stores/helpers/\`; genuinely cross-domain stateless code belongs in\n  \`utils/\`. Using \`ref\`, \`computed\`, or \`watch\` does not by itself justify a new\n  architectural category.\n- Root \`middleware/\` is client/router middleware (\`defineNuxtRouteMiddleware\`).\n  \`server/middleware/\` is Nitro request middleware. Keep both when needed; they are different\n  execution layers and must not be collapsed for folder-count aesthetics.\n`
  return source.replace(anchor, anchor + rules)
})

// Remove the now-empty architectural island and stale exact-path references.
remove('composables')
replaceEverywhere('@/stores/helpers/', '@/stores/helpers/')
replaceEverywhere('~/stores/helpers/', '~/stores/helpers/')

console.log('Composable-island migration applied.')
