<template>
  <div
    class="grid min-h-0 flex-1 items-center gap-8 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
  >
    <div class="flex min-w-0 flex-col gap-8">
      <div class="flex flex-col gap-3">
        <p class="pf-kicker text-secondary">Idea in · playbook out</p>
        <p class="pf-display pf-hero-title">Playbook<br />Forge</p>
        <p class="max-w-xl text-base opacity-80 @3xl:text-lg">
          Shape a story game factor by factor and see what every choice costs in
          pictures, words and render time before anyone builds it.
        </p>
      </div>
      <ul class="flex max-w-xl flex-col gap-2" aria-label="Main menu">
        <li v-for="(item, i) in menu" :key="item.label">
          <button
            type="button"
            data-nav
            :data-autofocus="i === 0 ? '' : undefined"
            class="pf-menu-item pf-focusable"
            @click="item.run()"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
          >
            <span class="pf-display text-xl @3xl:text-2xl">{{
              item.label
            }}</span>
            <span class="text-sm opacity-70">{{ item.detail }}</span>
          </button>
        </li>
      </ul>
    </div>

    <aside
      class="pf-panel hidden flex-col gap-3 p-5 @4xl:flex"
      aria-label="Calibration"
    >
      <p class="pf-kicker text-secondary">Measured render time per image</p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="lane in CHECKPOINT_CLASSES"
          :key="lane.id"
          class="flex items-center gap-3"
        >
          <span class="pf-label w-28 shrink-0 text-xs">{{ lane.label }}</span>
          <span class="relative h-2 flex-1 overflow-hidden bg-base-content/10">
            <span
              class="absolute inset-y-0 left-0 bg-secondary"
              :class="lane.measured ? '' : 'opacity-40'"
              :style="{
                width: `${Math.max(0.04, Math.log10(lane.secondsPerImage) / Math.log10(800)) * 100}%`,
              }"
            />
          </span>
          <span class="w-14 shrink-0 text-right font-semibold tabular-nums">{{
            formatDuration(lane.secondsPerImage)
          }}</span>
        </li>
      </ul>
      <p class="text-xs opacity-60">
        Medians from Kind Robots ArtJobs, claim to image saved. Distilled is
        inferred until measured.
      </p>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { CHECKPOINT_CLASSES } from '~/utils/playbookForge/calibration'
import { formatDuration } from '~/utils/playbookForge/estimate'
import { EXISTING_PLAYBOOKS } from '~/utils/playbookForge/existing'

const forge = usePlaybookForgeStore()

const menu = computed(() => [
  {
    label: 'New playbook',
    detail: 'From an idea and a genre to a configured, forecast project.',
    run: () => forge.startIdea(),
  },
  {
    label: 'Load a game',
    detail: `Every beat of ${EXISTING_PLAYBOOKS.length} playbooks: edit beats, spend and stars, and the plan.`,
    run: () => forge.go('library'),
  },
  ...(forge.draftList.length
    ? [
        {
          label: 'Continue a draft',
          detail: `${forge.draftList.length} saved in this browser.`,
          run: () => forge.go('library'),
        },
      ]
    : []),
  {
    label: 'The 100 redshirts',
    detail: 'Meet Space Couch’s expendable expedition corps, inspect portraits and quests, and direct redesigns.',
    run: () => forge.openRedshirts(),
  },
  {
    label: 'Catalogue',
    detail:
      'Facets, Characters, Locations, Scenarios, Rewards and every game’s art, for brainstorming.',
    run: () => forge.openCatalog(),
  },
  {
    label: 'Gestation',
    detail:
      'The daily playbook challenge’s concepts as they grow. Leave notes for the next development, or forge one.',
    run: () => forge.openGestation(),
  },
  {
    label: 'Kit console',
    detail:
      'Rehearse the games built on the Playbook Kit, with their settings and budget.',
    run: () => forge.openKit(''),
  },
  {
    label: 'Assumptions',
    detail: 'Render times, word rates and session size behind every forecast.',
    run: () => forge.go('assumptions'),
  },
])
</script>
