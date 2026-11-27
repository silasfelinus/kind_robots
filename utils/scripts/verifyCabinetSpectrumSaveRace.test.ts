import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { withSave, type SaveRecord } from '../arcade/saves'
import {
  mergeSpectrumSaves,
  readSpectrumSave,
  validSpectrumCloudSave,
  type SpectrumSave,
} from '../arcade/superkateSpectrum/progress'

const slug = 'superkate-spectrum'
const root = new URL('../../', import.meta.url)
const source = readFileSync(new URL('stores/arcadeStore.ts', root), 'utf8')
const ast = ts.createSourceFile(
  'store.ts',
  source,
  ts.ScriptTarget.Latest,
  true,
)
const names = [
  'switchSpectrumOwner',
  'fetchSpectrumCopy',
  'syncSuperkateCareer',
  'queueSpectrumUpload',
  'uploadSpectrumCareer',
  'recordSave',
]
const functions = new Map<string, string>()
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name) {
    const name = node.name.text
    if (names.includes(name)) functions.set(name, node.getText(ast))
  }
  ts.forEachChild(node, visit)
}
visit(ast)
assert.equal(functions.size, names.length)

const base = readSpectrumSave(null)
const fresh = mergeSpectrumSaves(base, base)
function career(xp: number, stage = 1): SpectrumSave {
  return {
    ...fresh,
    stage,
    career: { ...fresh.career, xp, highestStage: stage },
  }
}
const user = { authenticatedUserId: 1, token: 'one' }
const saves: { value: SaveRecord } = { value: { [slug]: fresh } }
const status = { value: 'local' }
const cache = new Map<string, string>([['owner', '1']])
type Copy = { save: SpectrumSave; revision: number }
const copies = new Map<string, Copy>([
  ['Bearer one', { save: fresh, revision: 0 }],
  ['Bearer two', { save: fresh, revision: 0 }],
])
type Pending = {
  owner: string
  save: SpectrumSave
  revision: number | null
  resolve: (result: unknown) => void
  reject: (error: unknown) => void
}
const puts: Pending[] = []
const context = vm.createContext({
  SPECTRUM_SLUG: slug,
  PLUMBER_SLUG: 'save-the-plumber',
  SPECTRUM_OWNER: 'owner',
  SPECTRUM_SCOPED: (id: string) => 'scope-' + id,
  RAINBOW_SAVE_GAME: 'rainbow',
  spectrumRead: (key: string) => cache.get(key) ?? null,
  spectrumWrite: (key: string, value: string) => cache.set(key, value),
  saves,
  spectrumCloudStatus: status,
  useUserStore: () => user,
  mergeSpectrumSaves,
  readSpectrumSave,
  validSpectrumCloudSave,
  withSave,
  writeSaves: () => {},
  $fetch: async (
    _path: string,
    request: {
      method?: string
      headers: { Authorization: string }
      body?: { save: SpectrumSave; expectedRevision: number | null }
    },
  ) => {
    const owner = request.headers.Authorization
    if (request.method !== 'PUT')
      return { success: true, data: copies.get(owner) ?? null }
    return new Promise((resolve, reject) => {
      puts.push({
        owner,
        save: request.body!.save,
        revision: request.body!.expectedRevision,
        resolve,
        reject,
      })
    })
  },
})
const state = [
  'let spectrumOwner = null',
  'let spectrumRevision = null',
  'let spectrumUploading = null',
  'let spectrumDeviceOwner = null',
  'let spectrumDirty = false',
  'let spectrumSession = 0',
].join('\n')
vm.runInContext(
  ts.transpile(
    state +
      '\n' +
      [...functions.values()]
        .join('\n')
        .replaceAll('import.meta.client', 'true'),
  ),
  context,
)
const sync = vm.runInContext(
  'syncSuperkateCareer',
  context,
) as () => Promise<void>
const record = vm.runInContext('recordSave', context) as (
  slug: string,
  save: SpectrumSave,
) => void
const drain = () => new Promise<void>((resolve) => setImmediate(resolve))
const finish = (request: Pending, revision: number) =>
  request.resolve({ success: true, data: { revision } })

await sync()
assert.equal(status.value, 'synced')
record(slug, career(1000, 3))
assert.equal(status.value, 'saving')
assert.equal(puts.length, 1)
record(slug, career(2000, 4))
assert.equal(puts.length, 1, 'coalesce writes in the same session')
copies.set('Bearer one', { save: career(1500, 6), revision: 4 })
puts[0]!.reject({ status: 409 })
await drain()
assert.equal(puts.length, 2)
assert.equal(puts[1]!.revision, 4)
assert.equal(puts[1]!.save.career.xp, 2000, 'keep progress earned during PUT')
assert.equal(puts[1]!.save.career.highestStage, 6, 'keep remote unlocks too')
assert.equal(readSpectrumSave(saves.value[slug]).career.xp, 2000)

user.authenticatedUserId = 2
user.token = 'two'
record(slug, career(9999, 30))
assert.equal(readSpectrumSave(saves.value[slug]).career.xp, 2000)
await sync()
assert.equal(readSpectrumSave(saves.value[slug]).career.xp, 0)
record(slug, career(500, 2))
assert.equal(puts.length, 3, 'a former account cannot block the new uploader')
assert.equal(puts[2]!.owner, 'Bearer two')
assert.equal(status.value, 'saving')
finish(puts[1]!, 5)
await drain()
record(slug, career(750, 3))
assert.equal(puts.length, 3, 'old finally cannot unlock the new uploader')
finish(puts[2]!, 1)
await drain()
assert.equal(puts.length, 4)
assert.equal(puts[3]!.owner, 'Bearer two')
assert.equal(puts[3]!.save.career.xp, 750)
assert.equal(puts[3]!.revision, 1)
finish(puts[3]!, 2)
await drain()
assert.equal(status.value, 'synced')
assert.equal(
  readSpectrumSave(JSON.parse(cache.get('scope-1')!)).career.xp,
  2000,
)
assert.equal(readSpectrumSave(JSON.parse(cache.get('scope-2')!)).career.xp, 750)

const cabinet = readFileSync(
  new URL('components/arcade/arcade-cabinet.vue', root),
  'utf8',
)
assert.match(
  cabinet,
  /spectrumRunOwner !== \(useUserStore\(\).authenticatedUserId \?\? null\)/,
)
assert.match(
  cabinet,
  /if \(owner !== previousOwner\) \{\s+releaseInterruptedInput\(\)\s+void boot\(\)/,
)
assert.match(cabinet, /generation !== bootGeneration/)
console.log(
  'Spectrum save races: concurrent progress and account changes verified',
)
