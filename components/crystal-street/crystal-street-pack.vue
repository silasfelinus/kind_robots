<template>
  <section v-if="run" class="kr-panes grid-cols-1" aria-label="Your pack">
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">Pack</h2>
        <span class="ml-auto text-sm">{{ run.quarters }} quarters</span>
      </div>
      <div class="kr-pane-scroll p-3">
        <section class="mb-4" aria-label="Skills">
          <h3 class="cs-kicker mb-2">Skills</h3>
          <ul class="grid grid-cols-3 gap-2 @xl:grid-cols-6">
            <li v-for="s in SKILLS" :key="s" class="cs-card p-2 text-center">
              <span
                class="block text-[11px] uppercase tracking-wider opacity-70"
                >{{ SKILL_LABELS[s] }}</span
              >
              <strong class="cs-display text-2xl">{{ run.skills[s] }}</strong>
            </li>
          </ul>
        </section>
        <h3 class="cs-kicker mb-2">Gear</h3>
        <ul
          v-if="run.items.length"
          class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3"
        >
          <li v-for="id in run.items" :key="id" class="cs-card overflow-hidden">
            <crystal-street-art
              frame="aspect-[4/3]"
              kind="night"
              :seed="id"
              :src="`/crystal-street/items/${id}.webp`"
              :alt="itemById(id)?.art"
            />
            <div class="space-y-1 p-2">
              <p class="font-semibold leading-tight">
                {{ itemById(id)?.name }}
              </p>
              <p class="text-xs opacity-80">{{ itemById(id)?.text }}</p>
              <button
                v-if="itemById(id)?.consumable"
                type="button"
                class="btn btn-xs btn-primary rounded-2xl"
                :disabled="!!run.pending"
                @click="store.useItem(id)"
              >
                Use now
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm opacity-75">
          Your pack is empty. Oddment and Daughters parks somewhere new every
          day.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { SKILL_LABELS, itemById } from '~/utils/crystalStreet/rules'
import { SKILLS } from '~/utils/crystalStreet/types'

const store = useCrystalStreetStore()
const run = computed(() => store.run)
</script>
