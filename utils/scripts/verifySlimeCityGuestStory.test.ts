import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  GUEST_SLIME_STORY_KEY,
  readGuestSlimeStory,
  writeGuestSlimeStory,
} from '../slimeCity/guestStorySave'
import { newSlimeCityStory } from '../slimeCity/storySave'

test('guest journey round-trips through versioned device storage', () => {
  const records = new Map<string, string>()
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value) },
  }
  const story = newSlimeCityStory()
  assert.equal(writeGuestSlimeStory(story, storage), true)
  assert.ok(records.has(GUEST_SLIME_STORY_KEY))
  assert.deepEqual(readGuestSlimeStory(storage), story)
})

test('malformed and incompatible guest saves are ignored safely', () => {
  const records = new Map<string, string>([[GUEST_SLIME_STORY_KEY, '{invalid']])
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value) },
  }
  assert.equal(readGuestSlimeStory(storage), null)
  records.set(GUEST_SLIME_STORY_KEY, JSON.stringify({ version: 999 }))
  assert.equal(readGuestSlimeStory(storage), null)
  assert.equal(writeGuestSlimeStory({ version: 999 } as never, storage), false)
})

test('storage denial never crashes guest gameplay', () => {
  const blocked = {
    getItem: (_key: string): string => { throw new Error('blocked') },
    setItem: (_key: string, _value: string): void => { throw new Error('blocked') },
  }
  assert.equal(readGuestSlimeStory(blocked), null)
  assert.equal(writeGuestSlimeStory(newSlimeCityStory(), blocked), false)
})
