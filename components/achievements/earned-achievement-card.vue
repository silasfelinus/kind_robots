<template>
  <article
    class="card relative h-full min-h-64 rounded-2xl border border-base-300 bg-base-300 p-4 transition duration-300 ease-in-out hover:border-primary/30 hover:shadow-lg"
  >
    <Icon
      name="ph:star-bold"
      class="absolute right-3 top-3 z-6 text-3xl text-warning"
      aria-label="Earned achievement"
    />

    <div class="flex h-full flex-col items-center text-center">
      <kr-deferred-image
        v-if="achievement.imagePath"
        :src="achievement.imagePath"
        :alt="achievement.label"
        class="mb-3 h-24 w-24 rounded-2xl object-cover"
      />
      <Icon
        v-else
        :name="achievement.icon ?? 'kind-icon:map'"
        class="mb-3 size-16 text-primary"
      />

      <div class="kr-text-black-xl max-w-full">
        <a
          v-if="achievement.pageHint"
          :href="achievement.pageHint"
          class="hover:underline"
        >
          {{ achievement.label }}
        </a>
        <template v-else>
          {{ achievement.label }}
        </template>
      </div>

      <p class="kr-text-dim-sm mt-1 line-clamp-2">
        {{ achievement.subtleHint }}
      </p>
      <p class="mt-3 line-clamp-2 text-sm italic text-base-content/75">
        {{ achievement.tooltip }}
      </p>

      <div class="mt-auto flex flex-wrap justify-center gap-2 pt-4">
        <span class="kr-badge-ghost-sm">Earned {{ earnedDate }}</span>
        <span class="kr-badge-ghost-sm">+{{ achievement.karma }} karma</span>
        <span class="kr-badge-primary-sm inline-flex items-center gap-1">
          <Icon name="kind-icon:jellybean" class="kr-icon-3-5" />
          1 jellybean
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement } from '~/prisma/generated/prisma/client'

const props = defineProps<{
  achievement: Achievement
  acquiredAt: string | null
}>()

const earnedDate = computed(() => {
  if (!props.acquiredAt) return 'date unknown'

  const date = new Date(props.acquiredAt)
  if (Number.isNaN(date.getTime())) return 'date unknown'

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

const achievement = props.achievement
</script>
