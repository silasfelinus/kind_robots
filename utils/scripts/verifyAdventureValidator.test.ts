import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { Adventure } from '~/types/adventure'
import { validateAdventure } from '@/utils/adventures/validateAdventure'

const load = (): Adventure =>
  JSON.parse(
    readFileSync('utils/adventures/fixtureAdventure.json', 'utf8'),
  ) as Adventure
const codes = (b: Adventure) => validateAdventure(b).errors.map((e) => e.code)

const good = validateAdventure(load())
assert.equal(good.ok, true, JSON.stringify(good.errors))
assert.deepEqual(good.stats, { nodes: 7, endings: 3, reachable: 7 })

let b = load()
b.nodes.start!.choices![0]!.to = 'nowhere'
assert.ok(codes(b).includes('dangling-link'))

b = load()
b.nodes.orphan = { ...b.nodes.tidy!, id: 'orphan' }
assert.ok(codes(b).includes('ending-unreachable'))

b = load()
delete b.nodes.hum!.ending
assert.ok(codes(b).includes('dead-end'))

b = load()
b.nodes.shelves!.choices![0]!.sets = []
assert.ok(codes(b).includes('flag-never-set'))

b = load()
b.nodes.start!.choices!.forEach((c) => (c.requires = ['wound']))
assert.ok(codes(b).includes('no-open-choice'))

b = load()
b.nodes.tidy!.art.alt = ''
b.nodes.tidy!.text = 'Too short.'
assert.ok(codes(b).includes('art-alt') && codes(b).includes('word-count'))

b = load()
b.start = 'missing'
assert.ok(codes(b).includes('start-missing'))

console.log('adventure validator: ok')
