<!-- /components/conductor/sketchy-page.vue -->
<template>
  <ProjectFrontPage slug="sketchy" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col items-start gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:pencil" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Try today's assignment
          </h3>
        </div>
        <p class="text-sm text-base-content/70">
          Sketchy hands you a tier-appropriate drawing prompt, then critiques
          the result on five dimensions and picks your next study. Preview a
          sample from each skill tier below.
        </p>

        <div class="flex flex-wrap gap-2" role="tablist">
          <button
            v-for="tier in skillTiers"
            :key="tier.key"
            type="button"
            role="tab"
            :aria-selected="activeTier === tier.key"
            class="btn btn-sm rounded-2xl"
            :class="
              activeTier === tier.key
                ? 'btn-primary'
                : 'btn-ghost border border-base-300'
            "
            @click="activeTier = tier.key"
          >
            {{ tier.label }}
          </button>
        </div>

        <div
          class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/60 p-4"
        >
          <p class="text-sm font-semibold text-base-content">
            {{ activeSample.prompt }}
          </p>
          <p class="text-xs text-base-content/60">
            {{ activeSample.window }} · Fundamentals
          </p>
          <div class="flex flex-wrap gap-1.5 pt-1">
            <span
              v-for="dim in activeSample.scoredDimensions"
              :key="dim"
              class="badge badge-sm badge-primary badge-outline rounded-xl"
            >
              {{ dim }}
            </span>
            <span
              v-for="dim in activeSample.sometimesDimensions"
              :key="dim"
              class="badge badge-sm badge-ghost rounded-xl"
            >
              {{ dim }} (sometimes)
            </span>
          </div>
        </div>

        <p class="text-xs text-base-content/50">
          The full assignment engine and AI critique loop are in active
          development — this preview mirrors the real skill ladder and rubric.
        </p>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

type SkillTierKey = 'beginner' | 'intermediate' | 'advanced'

// Fundamentals-category samples pulled verbatim from
// projects/sketchy/SKILL-LADDER.md; dimension applicability from
// projects/sketchy/CRITIQUE-RUBRIC.md §2 ("Fundamentals" row).
const skillTiers: { key: SkillTierKey; label: string }[] = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
]

const samplesByTier: Record<
  SkillTierKey,
  {
    prompt: string
    window: string
    scoredDimensions: string[]
    sometimesDimensions: string[]
  }
> = {
  beginner: {
    prompt:
      'Draw 10 straight lines, 10 curves, and 10 ellipses; circle the cleanest three of each.',
    window: '5–20 min',
    scoredDimensions: ['Construction', 'Proportions', 'Line quality'],
    sometimesDimensions: ['Value', 'Observation'],
  },
  intermediate: {
    prompt:
      'Draw a pair of shoes using simplified boxes and cylinders before adding contour.',
    window: '20–60 min',
    scoredDimensions: ['Construction', 'Proportions', 'Line quality'],
    sometimesDimensions: ['Value', 'Observation'],
  },
  advanced: {
    prompt:
      'Build a complex prop, such as a bicycle or coffee grinder, from major forms first.',
    window: '45–120 min',
    scoredDimensions: ['Construction', 'Proportions', 'Line quality'],
    sometimesDimensions: ['Value', 'Observation'],
  },
}

const activeTier = ref<SkillTierKey>('beginner')
const activeSample = computed(() => samplesByTier[activeTier.value])

const config: ProjectFrontConfig = {
  slug: 'sketchy',
  title: 'Sketchy',
  channelKey: 'wonder',
  tabKey: 'sketchy',
  icon: 'kind-icon:pencil',
  tagline: 'Show up, fill the page, get a little better.',
  description:
    'A drawing-habit studio. Sketchy hands you an assignment and a timer, then offers gentle critique — the low-pressure daily practice that turns "I can\'t draw" into a stack of finished pages.',
  sections: [
    {
      key: 'prompt',
      title: 'A prompt a day',
      body: 'Fresh assignments and constraints keep the blank page from winning.',
      icon: 'kind-icon:pencil',
    },
    {
      key: 'critique',
      title: 'Kind critique',
      body: 'Honest, encouraging feedback that helps without stinging.',
      icon: 'kind-icon:hand-heart',
    },
  ],
  deliverables: {
    done: ['Assignment + critique concept', 'Reference imagery'],
    next: ['Daily prompt engine', 'Submission + streak tracking'],
  },
}
</script>
