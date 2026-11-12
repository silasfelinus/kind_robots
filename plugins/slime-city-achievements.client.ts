// /plugins/slime-city-achievements.client.ts
//
// Slime City achievements (conductor slime-city t-060). When a Slime City
// store is created, watch it and award what each deed earned: the game
// store's actions (utils/slimeCity/achievementWatch.ts) and duels against
// other players. A Pinia plugin, so the game stores themselves are untouched
// and are still only loaded on the pages that use them.
import type { Pinia } from 'pinia'
import { watch } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { pvpAchievements } from '@/utils/slimeCity/achievementAwards'
import {
  watchSlimeCityAchievements,
  type SlimeCityAchievementSource,
} from '@/utils/slimeCity/achievementWatch'
import type { PvpSnapshot } from '@/utils/slimeCity/pvp'

function award(codes: string[]): void {
  if (!codes.length) return
  const achievements = useAchievementStore()
  for (const code of codes)
    void achievements.rewardAchievementByCode(code).catch(() => undefined)
}

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia
  pinia.use(({ store }) => {
    if (store.$id === 'slimeCityLab')
      watchSlimeCityAchievements(
        store as unknown as SlimeCityAchievementSource,
        award,
      )
    // The server settles every duel, so a finished one this seat won is a
    // real win however it arrives: a last move, a poll, or the VS list.
    if (store.$id === 'slimeCityPvp')
      watch(
        () => (store as unknown as { duel: PvpSnapshot | null }).duel,
        (duel) => award(pvpAchievements(duel)),
      )
  })
})
