import { defineStore } from 'pinia'
import { useMemorySeaCollisionStore } from './memoryFinaleCollisionStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  WELL_OF_RECORDS,
  WELL_OF_RECORDS_ENTRY_BY_CHOICE,
  type WellOfRecordsEntry,
} from '~/utils/memoryDungeon/wellOfRecords'

/** e11's dungeon, opened by the lead's choice at e11 6,2. */
export const useMemoryWellOfRecordsStore = defineStore(
  'memoryWellOfRecords',
  () => {
    const overworld = useMemorySeaCollisionStore()
    const chosen = () => overworld.progress.choices['6,2']
    return useAuthoredDungeonState({
      dungeon: WELL_OF_RECORDS,
      storageKey: 'memory-dungeon-well-of-records-v1',
      defaultEntry: 'by-choice' as WellOfRecordsEntry,
      unlocked: () => Boolean(chosen()),
      entry: () =>
        WELL_OF_RECORDS_ENTRY_BY_CHOICE[chosen() ?? ''] ?? 'by-choice',
      externalFlags: () =>
        Object.entries(overworld.progress.choices).map(
          ([key, choice]) => 'e11:' + key + ':' + choice,
        ),
      beforeHydrate: () => overworld.hydrate(),
      ui: {
        title: 'The Well of Records',
        subtitle: 'Beneath the Throne',
        entryLabels: {
          'by-choice': 'Descending by her own choice',
          'oracle-tested': 'With the oracle tested',
        },
        guardianPending:
          'The keeper of the deepest room is waiting. Bring something true.',
        guardianPassed: 'The keeper has let you through.',
        completed: 'You climbed out. The place keeps what you chose.',
        lockedTitle: 'The Well of Records is still shut.',
        lockedBody: 'Find its entrance at 6,2 and decide how to go down.',
        saveName: 'The Well of Records',
      },
    })
  },
)
