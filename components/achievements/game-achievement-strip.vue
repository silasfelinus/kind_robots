<template>
  <section
    v-if="entries.length"
    class="space-y-2"
    :aria-label="`${title} achievements`"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-bold uppercase tracking-widest opacity-70">
        Achievements · {{ earnedCount }}/{{ entries.length }}
      </p>
      <NuxtLink
        :to="`/achievements?section=${entries[0]!.section}`"
        class="link link-primary text-xs"
      >
        All achievements
      </NuxtLink>
    </div>

    <ul class="grid gap-2" :class="layoutClass">
      <li
        v-for="entry in entries"
        :key="entry.code"
        class="game-achievement flex min-w-0 gap-3 rounded-2xl border p-2"
        :class="
          entry.earned
            ? 'border-warning/50 bg-warning/10'
            : 'border-base-300 bg-base-100/60'
        "
        :data-earned="entry.earned"
      >
        <div
          class="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-base-300"
        >
          <img
            v-if="entry.imagePath"
            :src="entry.imagePath"
            :alt="entry.earned ? entry.label : ''"
            class="kr-img-cover"
            :class="entry.earned ? '' : 'game-achievement-locked'"
            loading="lazy"
          />
          <Icon
            v-else
            :name="entry.icon"
            class="absolute inset-0 m-auto size-8"
            :class="entry.earned ? 'text-warning' : 'text-base-content/35'"
          />
          <span
            class="absolute bottom-1 left-1 flex gap-0.5 rounded-full bg-base-100/80 px-1 py-0.5"
            :aria-label="`Tier ${entry.tier} of 3`"
          >
            <Icon
              v-for="n in 3"
              :key="n"
              name="kind-icon:star"
              class="size-2.5"
              :class="n <= entry.tier ? 'text-warning' : 'text-base-content/20'"
            />
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="kr-text-black-sm truncate">
            {{ entry.label }}
          </p>
          <p class="text-xs leading-snug opacity-80">
            {{ entry.earned ? entry.message : entry.tooltip }}
          </p>
          <p class="mt-1 text-[0.7rem] font-bold text-accent">
            {{ entry.earned ? 'Earned' : `+${entry.karma} karma` }}
          </p>
        </div>
      </li>
    </ul>

    <p v-if="userStore.isGuest" class="text-xs opacity-70">
      Earned while signed out, these wait on this device and join your account
      when you sign in.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useUserStore } from '@/stores/userStore'
import {
  ACHIEVEMENT_GAMES,
  achievementsForGame,
} from '~/utils/achievements/gameAchievements'

const props = withDefaults(
  defineProps<{
    game: string
    layout?: 'list' | 'row'
  }>(),
  { layout: 'list' },
)

const achievementStore = useAchievementStore()
const userStore = useUserStore()

const title = computed(
  () => ACHIEVEMENT_GAMES.find((game) => game.key === props.game)?.title ?? '',
)

const layoutClass = computed(() =>
  props.layout === 'row' ? 'md:grid-cols-3' : 'grid-cols-1',
)

const entries = computed(() =>
  achievementsForGame(props.game).map((entry) => {
    const row = achievementStore.achievementByCode(entry.code)
    return {
      ...entry,
      imagePath: row?.imagePath || null,
      earned: achievementStore.hasEarnedCode(entry.code),
    }
  }),
)

const earnedCount = computed(
  () => entries.value.filter((entry) => entry.earned).length,
)

onMounted(() => {
  void achievementStore.fetchAchievements()
})
</script>

<style scoped>
.game-achievement-locked {
  filter: grayscale(1) brightness(0.25) blur(2px);
  opacity: 0.7;
}
</style>
