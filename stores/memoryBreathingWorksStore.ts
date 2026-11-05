import { defineStore } from 'pinia'
import { useMemoryEarthStore } from './memoryEarthStore'
import { useMemorySeaStore } from './memorySeaStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  BREATHING_WORKS,
  type WorksEntry,
} from '~/utils/memoryDungeon/breathingWorks'

/** e05's dungeon, opened by Scylla's choice at the Glass Throat (e05 4,6). */
export const useMemoryBreathingWorksStore = defineStore(
  'memoryBreathingWorks',
  () => {
    const earth = useMemoryEarthStore()
    const sea = useMemorySeaStore()
    return useAuthoredDungeonState({
      dungeon: BREATHING_WORKS,
      storageKey: 'memory-dungeon-breathing-works-v1',
      defaultEntry: 'current' as WorksEntry,
      unlocked: () => Boolean(sea.e05Choices['4,6']),
      entry: () => (sea.e05Choices['4,6'] === 'risk' ? 'still' : 'current'),
      externalFlags: () => [...earth.e04Flags, ...sea.e05Flags],
      beforeHydrate: () => sea.hydrate(),
      ui: {
        title: 'The Breathing Works',
        subtitle: 'The sea palace’s old service tunnels',
        entryLabels: {
          current: 'Down the Glass Throat, the intake still drawing',
          still: 'Down the silent shaft, the intake shut',
        },
        guardianPending:
          'The Sluice-Warden keeps the deep works. She will want to know why you are here.',
        guardianPassed: 'The Sluice-Warden has let you into the deep works.',
        completed:
          'You came back up the shaft. The works keep breathing what you chose.',
        lockedTitle: 'The Glass Throat is still above you.',
        lockedBody:
          'Find the Glass Throat at the intake grate and decide what to do about its draw.',
        saveName: 'Breathing Works',
      },
    })
  },
)
