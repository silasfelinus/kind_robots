// /utils/scripts/verifyComponentTestFixtures.ts
import assert from 'node:assert/strict'
import {
  isComponentTestFixture,
  parseComponentFixtureIds,
  selectComponentTestFixtures,
} from '@/server/utils/componentTestFixtures'

const records = [
  {
    id: 1,
    componentName: 'TestComponent-1783889202735',
    folderName: 'test-folder-1783889202735',
    title: 'Test Component',
  },
  {
    id: 2,
    componentName: 'TestComponent_1784371054025',
    folderName: 'test-folder',
    title: 'Test Component',
  },
  {
    id: 3,
    componentName: 'ComponentTestPanel',
    folderName: 'wonderlab',
    title: 'Test Component',
  },
  {
    id: 4,
    componentName: 'TestComponent-Documentation',
    folderName: 'wonderlab',
    title: 'Real documentation component',
  },
]

assert.equal(isComponentTestFixture(records[0]!), true)
assert.equal(isComponentTestFixture(records[1]!), true)
assert.equal(isComponentTestFixture(records[2]!), false)
assert.equal(isComponentTestFixture(records[3]!), false)
assert.deepEqual(
  selectComponentTestFixtures(records).map((record) => record.id),
  [1, 2],
)
assert.deepEqual(parseComponentFixtureIds([2, '1', 2, -1, 'bad']), [1, 2])
assert.deepEqual(parseComponentFixtureIds(null), [])

console.log('Component test fixture cleanup verification passed.')
