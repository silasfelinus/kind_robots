import { defineStore } from 'pinia'
import { useMemoryEarthStore } from './memoryEarthStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import { SUBLEVEL_B, type SublevelEntry } from '~/utils/memoryDungeon/sublevelB'

/** e03's dungeon, opened by Morrow's choice at the Sublevel B door (e03 6,2). */
export const useMemorySublevelStore = defineStore('memorySublevel', () => {
  const earth = useMemoryEarthStore()
  return useAuthoredDungeonState({
    dungeon: SUBLEVEL_B,
    storageKey: 'memory-dungeon-sublevel-b-v1',
    defaultEntry: 'badge' as SublevelEntry,
    unlocked: () => Boolean(earth.e03Choices['6,2']),
    entry: () => (earth.e03Choices['6,2'] === 'care' ? 'escort' : 'badge'),
    externalFlags: () => earth.e03Flags,
    beforeHydrate: () => earth.hydrate(),
    onEnding: (ending) => earth.recordSublevelEnding(ending),
    ui: {
      title: 'Sublevel B',
      subtitle: 'Under the Research Annex',
      entryLabels: {
        escort: 'Signed in, Walt beside you',
        badge: 'On a borrowed badge',
      },
      guardianPending:
        'Hollis keeps the night archive. Bring her something true.',
      guardianPassed: 'Hollis has let you through to the night archive.',
      completed: 'You climbed out. The archive keeps what you chose.',
      lockedTitle: 'The archive door is still shut.',
      lockedBody:
        'Find the Sublevel B door in the Research Annex and decide how Morrow gets past it.',
      saveName: 'Sublevel B',
    },
  })
})
