import { defineStore } from 'pinia'
import { useMemoryEarthStore } from './memoryEarthStore'
import { useMemoryHoshimoriStore } from './memoryHoshimoriStore'
import { useMemoryHoshimoriNightStore } from './memoryHoshimoriNightStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  FURNACE_OF_NAMES,
  type FurnaceEntry,
} from '~/utils/memoryDungeon/furnaceOfNames'

function siteFlags(world: string, choices: Record<string, string>): string[] {
  return Object.entries(choices).map(
    ([key, choice]) => world + ':' + key + ':' + choice,
  )
}

/**
 * e08's dungeon, e07's Red Oven after the night procession, opened by
 * Vesper's choice at the Furnace of Names (e08 4,3). Its rooms remember the
 * warm Oven run room by room.
 */
export const useMemoryFurnaceOfNamesStore = defineStore(
  'memoryFurnaceOfNames',
  () => {
    const earth = useMemoryEarthStore()
    const warm = useMemoryHoshimoriStore()
    const night = useMemoryHoshimoriNightStore()
    return useAuthoredDungeonState({
      dungeon: FURNACE_OF_NAMES,
      storageKey: 'memory-dungeon-furnace-of-names-v1',
      defaultEntry: 'named' as FurnaceEntry,
      unlocked: () => Boolean(night.progress.choices['4,3']),
      entry: () =>
        night.progress.choices['4,3'] === 'feed-without-claim'
          ? 'unnamed'
          : 'named',
      externalFlags: () => [
        ...earth.e04Flags,
        ...siteFlags('e07', warm.progress.choices),
        ...siteFlags('e08', night.progress.choices),
        ...Object.entries(warm.progress.ovenChoices).map(
          ([room, choice]) => room + ':' + choice,
        ),
      ],
      beforeHydrate: () => {
        earth.hydrate()
        warm.hydrate()
        night.hydrate()
      },
      ui: {
        title: 'The Furnace of Names',
        subtitle: 'The Red Oven, after the procession took Hoshimori',
        entryLabels: {
          named: 'Into the Oven with the ledger of burnt names',
          unnamed: 'Into the Oven unnamed, with the queue you fed',
        },
        guardianPending:
          'Kogane keeps the register now. The ember spirit will want your name.',
        guardianPassed: 'Kogane has let you through to the Furnace’s mouth.',
        completed:
          'You climbed out of the Oven. Hoshimori keeps the names you chose.',
        lockedTitle: 'The Oven has not taken your name yet.',
        lockedBody:
          'Find the Furnace of Names at the bakery corner of night Hoshimori and decide what it may burn.',
        saveName: 'Furnace of Names',
      },
    })
  },
)
