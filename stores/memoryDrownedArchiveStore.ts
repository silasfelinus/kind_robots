import { defineStore } from 'pinia'
import { useMemoryEarthStore } from './memoryEarthStore'
import { useMemorySublevelStore } from './memorySublevelStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  DROWNED_ARCHIVE,
  type DrownedEntry,
} from '~/utils/memoryDungeon/drownedArchive'

/**
 * e04's dungeon, Sublevel B flooded, opened by Morrow's choice at the same
 * door in e04 (6,2). Its rooms remember the dry Sublevel B run.
 */
export const useMemoryDrownedArchiveStore = defineStore(
  'memoryDrownedArchive',
  () => {
    const earth = useMemoryEarthStore()
    const sublevel = useMemorySublevelStore()
    return useAuthoredDungeonState({
      dungeon: DROWNED_ARCHIVE,
      storageKey: 'memory-dungeon-drowned-archive-v1',
      defaultEntry: 'alone' as DrownedEntry,
      unlocked: () => Boolean(earth.e04Choices['6,2']),
      entry: () => (earth.e04Choices['6,2'] === 'care' ? 'walt' : 'alone'),
      externalFlags: () => [
        ...earth.e03Flags,
        ...earth.e04Flags,
        ...sublevel.ownFlags.filter((flag) => !flag.startsWith('entry:')),
      ],
      beforeHydrate: () => {
        earth.hydrate()
        sublevel.hydrate()
      },
      ui: {
        title: 'The Drowned Archive',
        subtitle: 'Sublevel B, after the sea came in',
        entryLabels: {
          walt: 'Down the dock ramp, Walt holding the rope',
          alone: 'Through the forced door, alone',
        },
        guardianPending:
          'The sea keeps a ledger at Hollis’s desk. It wants one account.',
        guardianPassed: 'The ledger has let you through to the night archive.',
        completed:
          'You came up out of the water. The archive keeps what you chose.',
        lockedTitle: 'The sea has not let you in yet.',
        lockedBody:
          'Find the Sublevel B door in the changed city and decide what to do about the water.',
        saveName: 'Drowned Archive',
      },
    })
  },
)
