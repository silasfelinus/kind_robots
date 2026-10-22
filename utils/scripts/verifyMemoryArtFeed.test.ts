import assert from 'node:assert/strict'
import { loadMemoryArtCandidates } from '../../utils/memoryArtFeed'

type Image = { id: number; playable: boolean }

async function run() {
  const calls: Array<[number | null, number | null]> = []
  const images = await loadMemoryArtCandidates<Image>({
    collectionIds: [],
    pairCount: 3,
    playable: (image) => image.playable,
    fetchPage: async (collectionId, cursor) => {
      calls.push([collectionId, cursor])
      return cursor === null
        ? {
            items: [{ id: 1, playable: false }, { id: 2, playable: true }],
            nextCursor: 2,
          }
        : {
            items: [
              { id: 2, playable: true },
              { id: 3, playable: true },
              { id: 4, playable: true },
            ],
            nextCursor: null,
          }
    },
  })
  assert.deepEqual(images.map(({ id }) => id), [2, 3, 4])
  assert.deepEqual(calls, [[null, null], [null, 2]])

  const collections: number[] = []
  const selected = await loadMemoryArtCandidates<Image>({
    collectionIds: [12, 24, 12],
    pairCount: 2,
    playable: () => true,
    fetchPage: async (collectionId) => {
      collections.push(collectionId!)
      return {
        items: [{ id: collectionId! * 2, playable: true }],
        nextCursor: null,
      }
    },
  })
  assert.deepEqual(collections, [12, 24])
  assert.deepEqual(selected.map(({ id }) => id), [24, 48])

  const empty = await loadMemoryArtCandidates<Image>({
    collectionIds: [],
    pairCount: 2,
    playable: () => true,
    fetchPage: async () => ({ items: [], nextCursor: null }),
  })
  assert.deepEqual(empty, [])

  await assert.rejects(
    loadMemoryArtCandidates<Image>({
      collectionIds: [],
      pairCount: 2,
      playable: () => true,
      fetchPage: async () => {
        throw new Error('Art feed unavailable')
      },
    }),
    /Art feed unavailable/,
  )

  const sameCursorCalls: number[] = []
  await loadMemoryArtCandidates<Image>({
    collectionIds: [],
    pairCount: 20,
    playable: () => true,
    fetchPage: async (_id, cursor) => {
      sameCursorCalls.push(cursor ?? 0)
      return {
        items: [{ id: 99, playable: true }],
        nextCursor: 99,
      }
    },
  })
  assert.deepEqual(sameCursorCalls, [0, 99])

  console.log('Memory Dungeon art-feed paging and collections: passed')
}

void run()
