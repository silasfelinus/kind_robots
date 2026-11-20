import { defineStore } from 'pinia'
import { finaleCollisionSetup } from './helpers/finaleCollisionStore'

/** e11: Char's Sea of Strangers. */
export const useMemorySeaCollisionStore = defineStore(
  'memorySeaCollision',
  () => finaleCollisionSetup('e11'),
)

/** e12: Hoshimori, the last unwritten road, and the Last Door. */
export const useMemoryHoshimoriCollisionStore = defineStore(
  'memoryHoshimoriCollision',
  () => finaleCollisionSetup('e12'),
)
