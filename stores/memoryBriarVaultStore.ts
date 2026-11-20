import { defineStore } from 'pinia'
import { useMemoryBriarCollisionStore } from './memoryBriarCollisionStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  BRIAR_VAULT,
  BRIAR_VAULT_ENTRY_BY_CHOICE,
  type BriarVaultEntry,
} from '~/utils/memoryDungeon/briarVault'

/** e09's dungeon, opened by the lead's choice at e09 3,6. */
export const useMemoryBriarVaultStore = defineStore('memoryBriarVault', () => {
  const overworld = useMemoryBriarCollisionStore()
  const chosen = () => overworld.progress.choices['3,6']
  return useAuthoredDungeonState({
    dungeon: BRIAR_VAULT,
    storageKey: 'memory-dungeon-briar-vault-v1',
    defaultEntry: 'vesper-road' as BriarVaultEntry,
    unlocked: () => Boolean(chosen()),
    entry: () => BRIAR_VAULT_ENTRY_BY_CHOICE[chosen() ?? ''] ?? 'vesper-road',
    externalFlags: () =>
      Object.entries(overworld.progress.choices).map(
        ([key, choice]) => 'e09:' + key + ':' + choice,
      ),
    beforeHydrate: () => overworld.hydrate(),
    ui: {
      title: 'The House\u2019s Memory Vault',
      subtitle: 'Beneath the Moth-Lit Stair',
      entryLabels: {
        'vesper-road': 'By Vesper\u2019s road',
        'red-wax': 'On the red-wax receipt',
      },
      guardianPending:
        'The keeper of the deepest room is waiting. Bring something true.',
      guardianPassed: 'The keeper has let you through.',
      completed: 'You climbed out. The place keeps what you chose.',
      lockedTitle: 'The House\u2019s Memory Vault is still shut.',
      lockedBody: 'Find its entrance at 3,6 and decide how to go down.',
      saveName: 'The House\u2019s Memory Vault',
    },
  })
})
