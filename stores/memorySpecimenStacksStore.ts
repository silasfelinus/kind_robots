import { defineStore } from 'pinia'
import { useMemoryEarthCollisionStore } from './memoryEarthCollisionStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  SPECIMEN_STACKS,
  SPECIMEN_STACKS_ENTRY_BY_CHOICE,
  type SpecimenStacksEntry,
} from '~/utils/memoryDungeon/specimenStacks'

/** e10's dungeon, opened by the lead's choice at e10 6,2. */
export const useMemorySpecimenStacksStore = defineStore(
  'memorySpecimenStacks',
  () => {
    const overworld = useMemoryEarthCollisionStore()
    const chosen = () => overworld.progress.choices['6,2']
    return useAuthoredDungeonState({
      dungeon: SPECIMEN_STACKS,
      storageKey: 'memory-dungeon-specimen-stacks-v1',
      defaultEntry: 'testimony' as SpecimenStacksEntry,
      unlocked: () => Boolean(chosen()),
      entry: () =>
        SPECIMEN_STACKS_ENTRY_BY_CHOICE[chosen() ?? ''] ?? 'testimony',
      externalFlags: () =>
        Object.entries(overworld.progress.choices).map(
          ([key, choice]) => 'e10:' + key + ':' + choice,
        ),
      beforeHydrate: () => overworld.hydrate(),
      ui: {
        title: 'The Specimen Stacks',
        subtitle: 'Beneath the Specimen Pines',
        entryLabels: {
          testimony: 'Carrying signed testimony',
          'returned-pages': 'With the loose pages returned',
        },
        guardianPending:
          'The keeper of the deepest room is waiting. Bring something true.',
        guardianPassed: 'The keeper has let you through.',
        completed: 'You climbed out. The place keeps what you chose.',
        lockedTitle: 'The Specimen Stacks is still shut.',
        lockedBody: 'Find its entrance at 6,2 and decide how to go down.',
        saveName: 'The Specimen Stacks',
      },
    })
  },
)
