import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mergeRecordsById } from '../../stores/helpers/recordMerge'

type UserRow = {
  id: number
  username: string
  avatarImage?: string | null
  detail?: string
}

const cached: UserRow[] = [
  {
    id: 1,
    username: 'cached-admin',
    avatarImage: '/cached.webp',
    detail: 'locally loaded detail',
  },
  { id: 2, username: 'unrelated-user', detail: 'preserve me' },
]
const incoming: UserRow[] = [
  {
    id: 1,
    username: 'fresh-admin',
    avatarImage: undefined,
    detail: undefined,
  },
  { id: 3, username: 'new-user' },
]

const merged = mergeRecordsById(cached, incoming)
assert.equal(merged.length, 3)
assert.equal(merged.find((row) => row.id === 1)?.username, 'fresh-admin')
assert.equal(merged.find((row) => row.id === 1)?.avatarImage, '/cached.webp')
assert.equal(
  merged.find((row) => row.id === 1)?.detail,
  'locally loaded detail',
)
assert.equal(merged.find((row) => row.id === 2)?.detail, 'preserve me')

const source = readFileSync('stores/userStore.ts', 'utf8')
assert.ok(
  source.includes('users.value = mergeRecordsById(users.value, response.data)'),
  'userStore must merge fetched directory rows by ID.',
)
assert.ok(
  source.includes('return users.value') &&
    !source.includes("handleError(error, 'fetching users')\n        users.value = []"),
  'userStore must preserve the cached directory after a failed refresh.',
)

console.log('User store cache safety contract passed.')
