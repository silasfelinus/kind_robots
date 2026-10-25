<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] @3xl:grid-rows-1"
    aria-label="Monster gallery"
  >
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">Monster gallery</h2>
        <span class="cs-pill cs-pill-info ml-auto"
          >{{ store.metVillains.size }}/{{ VILLAINS.length }} faced</span
        >
      </div>
      <div class="kr-pane-scroll p-3">
        <crystal-street-villain-list
          v-model="selected"
          label="Nightmares of Crystal Street"
        />
      </div>
    </div>

    <aside class="kr-pane cs-frame" data-testid="cs-gallery-file">
      <div v-if="villain && met" class="kr-pane-scroll space-y-3 p-3">
        <div class="join">
          <button
            v-for="f in FORMATS"
            :key="f"
            type="button"
            class="btn join-item btn-xs"
            :class="format === f ? 'btn-primary' : 'btn-ghost'"
            :aria-pressed="format === f"
            @click="format = f"
          >
            {{ FORMAT_LABELS[f] }}
          </button>
        </div>
        <crystal-street-art
          class="mx-auto w-full max-w-72 rounded-xl"
          :frame="FRAMES[format]"
          kind="villain"
          :seed="villain.id"
          :src="`/crystal-street/villains/${villain.id}-${format}.webp`"
          :palette="villain.palette"
          :sigil="villain.sigil"
          :alt="
            format === 'poster'
              ? villain.poster
              : format === 'ending'
                ? villain.endingPhoto
                : villain.portrait
          "
        />
        <div>
          <h3 class="cs-display text-2xl leading-tight">{{ villain.name }}</h3>
          <p class="text-[11px] uppercase tracking-wider opacity-75">
            {{ villain.epithet }}
          </p>
          <p class="mt-1 text-[11px] uppercase tracking-wider text-secondary">
            {{ remixLine(villain) }}
          </p>
        </div>
        <p class="cs-quote">“{{ villain.taunts[0] }}”</p>
        <p class="text-sm leading-relaxed">{{ villain.logline }}</p>
        <div>
          <h4 class="cs-kicker">Backstory</h4>
          <p class="text-sm leading-relaxed">{{ villain.backstory }}</p>
        </div>
        <div class="cs-card space-y-2 p-3">
          <div>
            <h4 class="cs-kicker">The old script</h4>
            <p class="text-sm">{{ villain.inspiration.oldScript }}</p>
          </div>
          <div>
            <h4 class="cs-kicker">The new lens</h4>
            <p class="text-sm">{{ villain.inspiration.newLens }}</p>
          </div>
        </div>
        <div>
          <h4 class="cs-kicker">The heart of it</h4>
          <template v-if="heartOpen">
            <p class="text-sm font-semibold">
              {{ villain.centralIssue.title }}
            </p>
            <p class="text-sm leading-relaxed">
              {{ villain.centralIssue.summary }}
            </p>
          </template>
          <p v-else class="text-sm opacity-75">
            Find all three of its leads in a single week to open this page.
          </p>
        </div>
        <p class="flex flex-wrap gap-1">
          <span v-for="tag in villain.tags" :key="tag" class="cs-pill">{{
            tag
          }}</span>
        </p>
        <ul class="grid grid-cols-2 gap-1 text-xs" aria-label="Endings found">
          <li
            v-for="tier in ENDING_TIERS"
            :key="tier"
            class="flex items-center gap-1"
          >
            <span
              class="h-2 w-4 rounded-full"
              :class="found(tier) ? `cs-bar-${tier}` : 'bg-base-content/15'"
            />
            <span :class="found(tier) ? '' : 'opacity-60'">{{
              TIER_LABELS[tier]
            }}</span>
          </li>
        </ul>
        <button
          type="button"
          class="btn btn-primary btn-sm w-full rounded-2xl"
          @click="$emit('endings', villain.id)"
        >
          See its endings
        </button>
      </div>
      <div
        v-else
        class="kr-pane-scroll grid place-items-center p-6 text-center"
      >
        <div class="max-w-xs space-y-2">
          <p class="cs-display text-3xl">No nightmares yet</p>
          <p class="text-sm opacity-80">
            Whatever comes for you on Crystal Street opens its file here: its
            portrait, poster, backstory and the classic it remixes.
          </p>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  ENDING_TIERS,
  TIER_LABELS,
  VILLAINS,
  endingKey,
  remixLine,
  villainById,
} from '~/utils/crystalStreet/rules'
import type { EndingTier } from '~/utils/crystalStreet/types'

const props = defineProps<{ initial?: string }>()
defineEmits<{ endings: [string] }>()

const store = useCrystalStreetStore()
const FORMATS = ['portrait', 'poster', 'ending'] as const
type Format = (typeof FORMATS)[number]
const FORMAT_LABELS: Record<Format, string> = {
  portrait: 'Portrait',
  poster: 'Poster',
  ending: 'Ending photo',
}
const FRAMES: Record<Format, string> = {
  portrait: 'aspect-[4/5]',
  poster: 'aspect-[2/3]',
  ending: 'aspect-[3/4]',
}
const format = ref<Format>('portrait')
const selected = ref(
  props.initial ??
    VILLAINS.find((v) => store.metVillains.has(v.id))?.id ??
    VILLAINS[0]!.id,
)
const villain = computed(() => villainById(selected.value))
const met = computed(() => store.metVillains.has(selected.value))
const heartOpen = computed(() =>
  store.scrapbook.runs.some(
    (r) => r.villain === selected.value && r.clues >= 3,
  ),
)
const found = (tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(selected.value, tier))
</script>
