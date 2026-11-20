import { defineStore } from 'pinia'
import { useMemoryHoshimoriCollisionStore } from './memoryFinaleCollisionStore'
import { useAuthoredDungeonState } from './helpers/authoredDungeonStore'
import {
  BRINE_TUNNEL,
  BRINE_TUNNEL_ENTRY_BY_CHOICE,
  type BrineTunnelEntry,
} from '~/utils/memoryDungeon/brineTunnel'

/** e12's dungeon, opened by the lead's choice at e12 6,2. */
export const useMemoryBrineTunnelStore = defineStore(
  'memoryBrineTunnel',
  () => {
    const overworld = useMemoryHoshimoriCollisionStore()
    const chosen = () => overworld.progress.choices['6,2']
    return useAuthoredDungeonState({
      dungeon: BRINE_TUNNEL,
      storageKey: 'memory-dungeon-brine-tunnel-v1',
      defaultEntry: 'bell-marks' as BrineTunnelEntry,
      unlocked: () => Boolean(chosen()),
      entry: () => BRINE_TUNNEL_ENTRY_BY_CHOICE[chosen() ?? ''] ?? 'bell-marks',
      externalFlags: () =>
        Object.entries(overworld.progress.choices).map(
          ([key, choice]) => 'e12:' + key + ':' + choice,
        ),
      beforeHydrate: () => overworld.hydrate(),
      ui: {
        title: 'The Brine Tunnel of Bells',
        subtitle: 'Under the top terrace',
        entryLabels: {
          'bell-marks': 'With the bell marks copied',
          singers: 'With the singers beside you',
        },
        guardianPending:
          'The keeper of the deepest room is waiting. Bring something true.',
        guardianPassed: 'The keeper has let you through.',
        completed: 'You climbed out. The place keeps what you chose.',
        lockedTitle: 'The Brine Tunnel of Bells is still shut.',
        lockedBody: 'Find its entrance at 6,2 and decide how to go down.',
        saveName: 'The Brine Tunnel of Bells',
      },
    })
  },
)
