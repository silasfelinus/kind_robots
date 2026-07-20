<!-- /components/conductor/davinci-page.vue -->
<template>
  <ProjectFrontPage slug="davinci" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col items-start gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:trophy" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Endings on record
          </h3>
        </div>
        <p class="text-sm text-base-content/70">
          Each life resolves into one of the seeded endings below — reach it
          once and the matching achievement is yours for good.
        </p>
        <p v-if="totalEndings > 0" class="text-xs text-base-content/60">
          {{ totalEndings }} ending{{ totalEndings === 1 ? '' : 's' }} seeded so
          far.
        </p>
        <ul v-if="recentEndings.length" class="flex flex-col gap-1">
          <li v-for="ending in recentEndings" :key="ending.id">
            <span class="text-sm text-base-content/80">{{ ending.label }}</span>
          </li>
        </ul>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { useAchievementStore } from '@/stores/achievementStore'

const achievementStore = useAchievementStore()

onMounted(() => {
  achievementStore.fetchAchievements()
})

const davinciEndingAchievements = computed(() =>
  achievementStore.achievements.filter((achievement) =>
    achievement.triggerCode?.startsWith('davinci-ending-'),
  ),
)
const totalEndings = computed(() => davinciEndingAchievements.value.length)
const recentEndings = computed(() =>
  davinciEndingAchievements.value.slice(0, 3),
)

const config: ProjectFrontConfig = {
  slug: 'davinci',
  title: 'Da Vinci',
  channelKey: 'wonder',
  tabKey: 'davinci',
  icon: 'kind-icon:castle',
  tagline: 'Live a life. Leave a legacy.',
  description:
    'A generative life-and-legacy simulation. Each run seeds a life of ambition and craft, advances through chapters of choices that move your stats, collects art along the way, and resolves into an ending — with hundreds of achievements tracking every mark you leave.',
  launch: {
    label: 'Begin a life',
    href: '/davinci',
    icon: 'kind-icon:sparkles',
  },
  stats: [
    { label: 'achievements', value: '1000+', icon: 'kind-icon:trophy' },
    { label: 'endings', value: 'many', icon: 'kind-icon:book' },
  ],
  sections: [
    {
      key: 'choices',
      title: 'Chapters of choice',
      body: 'Every decision nudges your stats and bends the story toward a different legacy.',
      icon: 'kind-icon:map',
    },
    {
      key: 'legacy',
      title: 'A legacy that remembers',
      body: 'Runs collect generated art and unlock achievements that persist across lives.',
      icon: 'kind-icon:trophy',
    },
  ],
  deliverables: {
    done: [
      'Life-run schema (runs, choices, stats, endings, achievements)',
      'Da Vinci API surface',
    ],
    next: ['Playable run UI', 'Achievement gallery'],
  },
}
</script>
