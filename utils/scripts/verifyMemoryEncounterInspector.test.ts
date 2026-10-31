import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { useMemoryEncounterInspectorStore } from '../../stores/memoryEncounterInspectorStore'
import { worldEvent } from '../memoryDungeon/overworldEventCatalog'

setActivePinia(createPinia())
const inspector = useMemoryEncounterInspectorStore()
assert.equal(inspector.active, 'e03')
assert.equal(inspector.available.length, 12)
assert.equal(inspector.progress.revealed.length, 1)
assert.equal(inspector.tiles.length, 64)
assert.equal(inspector.position, '1,1')

inspector.travel('8,8')
assert.equal(inspector.position, '1,1')
assert.match(inspector.notice, /neighboring/)

inspector.travel('2,1')
assert.equal(inspector.position, '2,1')
assert.ok(inspector.progress.revealed.includes('2,1'))
assert.equal(inspector.current?.id, 'e03:2,1')

const first = worldEvent('e03', '2,1')!.choices[0]!
inspector.choose(first.id)
assert.equal(inspector.progress.choices['2,1'], first.id)
assert.equal(inspector.progress.flags.length, 1)
assert.match(inspector.notice, /The care and its cost/)
const supplies = inspector.progress.supplies
inspector.choose(first.id)
assert.equal(inspector.progress.supplies, supplies)
assert.equal(inspector.progress.flags.length, 1)

inspector.select('e04')
assert.equal(inspector.position, '1,1')
assert.equal(inspector.progress.flags.length, 0)
inspector.travel('1,2')
assert.equal(inspector.position, '1,2')
inspector.select('e03')
assert.equal(inspector.position, '2,1')
assert.equal(inspector.progress.flags.length, 1)
inspector.restart()
assert.equal(inspector.position, '1,1')
assert.equal(inspector.progress.flags.length, 0)
assert.equal(inspector.progress.revealed.length, 1)

const component = readFileSync('pages/admin/memory-dungeon-encounters.vue', 'utf8')
const navigation = readFileSync(
  'content/channels/admin/memory-dungeon-encounters.md',
  'utf8',
)
assert.match(component, /data-testid="memory-encounter-inspector"/)
assert.match(component, /inspector\.travel\(tile\.key\)/)
assert.match(component, /inspector\.choose\(choice\.id\)/)
assert.match(component, /sceneArt\.status === 'delivered'/)
assert.match(component, /choice\.art\.status === 'delivered'/)
assert.match(navigation, /requiredRole: ADMIN/)
assert.match(navigation, /route: \/admin\/memory-dungeon-encounters/)

console.log('Memory encounter inspector: adjacency, one-off choices, isolated previews and admin art slots passed')
