<!-- /components/content/achievements/locked-achievements.vue -->
<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Locked Achievements</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="achievement in lockedAchievements"
        :key="achievement.id"
        class="card bg-base-300 rounded-2xl p-4 transition duration-300 ease-in-out relative"
      >
        <div class="text-center">
          <!-- Achievement Icon with fallback -->
          <Icon
            :name="achievement.icon ?? 'default-icon'"
            class="text-6xl mb-2"
          />
          <!-- Achievement Label -->
          <div class="text-xl font-bold text-gray-700">
            {{ achievement.label }}
          </div>
          <!-- Subtle Hint -->
          <div v-if="achievement.subtleHint" class="text-sm text-gray-500">
            {{ achievement.subtleHint }}
          </div>
          <!-- Question Mark Icon for Directions -->
          <div class="absolute top-2 right-2 z-6">
            <nuxt-link :to="achievement.pageHint || '#'">
              <Icon name="kind-icon:question" class="text-blue-500 text-2xl" />
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'
import { useUserStore } from '@/stores/userStore'

const achievementStore = useAchievementStore()
const userStore = useUserStore()
const achievements = computed(() => achievementStore.achievements)
const userAchievements = computed(() => userStore.achievements)

const lockedAchievements = computed(() => {
  return achievements.value.filter(
    (achievement: { id: any }) => !userAchievements.value?.includes(achievement.id),
  )
})
</script>
