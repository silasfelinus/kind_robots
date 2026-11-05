import { defineStore } from 'pinia'
import { useMemoryEarthStore } from './memoryEarthStore'
import { useMemorySeaStore } from './memorySeaStore'
import { useMemoryBreathingWorksStore } from './memoryBreathingWorksStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  CHOKING_WORKS,
  type ChokingEntry,
} from '~/utils/memoryDungeon/chokingWorks'

/**
 * e06's dungeon, the Breathing Works warped, opened by Scylla's choice at
 * the same intake grate in e06 (4,6). Its rooms remember the e05 run.
 */
export const useMemoryChokingWorksStore = defineStore(
  'memoryChokingWorks',
  () => {
    const earth = useMemoryEarthStore()
    const sea = useMemorySeaStore()
    const works = useMemoryBreathingWorksStore()
    return useAuthoredDungeonState({
      dungeon: CHOKING_WORKS,
      storageKey: 'memory-dungeon-choking-works-v1',
      defaultEntry: 'pulled' as ChokingEntry,
      unlocked: () => Boolean(sea.e06Choices['4,6']),
      entry: () => (sea.e06Choices['4,6'] === 'risk' ? 'listened' : 'pulled'),
      externalFlags: () => [
        ...earth.e04Flags,
        ...sea.e05Flags,
        ...sea.e06Flags,
        ...works.ownFlags.filter((flag) => !flag.startsWith('entry:')),
      ],
      beforeHydrate: () => {
        sea.hydrate()
        works.hydrate()
      },
      ui: {
        title: 'The Choking Works',
        subtitle: 'The same tunnels, swallowing what the court wants forgotten',
        entryLabels: {
          pulled: 'Down the throat with what you pulled from the grate',
          listened: 'Down the throat, the tunnels speaking in your voice',
        },
        guardianPending:
          'The Warden’s book writes itself in red now. It wants one history.',
        guardianPassed: 'The book has let you through to the deep works.',
        completed:
          'You climbed out of the throat. The works keep breathing what you chose.',
        lockedTitle: 'The throat has not swallowed you yet.',
        lockedBody:
          'Find the choking intake grate under the Undertide Crown and decide what to do there.',
        saveName: 'Choking Works',
      },
    })
  },
)
