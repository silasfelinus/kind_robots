<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-1">
      <span
        v-for="tone in tones"
        :key="tone.id"
        class="badge badge-sm badge-outline gap-1"
        :class="BADGE[tone.tone]"
      >
        {{ tone.label }} {{ tone.found }}/{{ tone.total }}
      </span>
    </div>
    <ul
      class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10.5rem),1fr))] gap-2"
    >
      <li
        v-for="ending in spec.endings"
        :key="ending.id"
        class="overflow-hidden rounded-xl border border-base-content/10 bg-base-200/60"
      >
        <span class="relative block aspect-[4/3]">
          <PlaybookKitArt
            :art="ending.art"
            :tone="ENDING_TONES[ending.tone].tone"
            icon="kind-icon:star"
            class="absolute inset-0"
            :class="found(ending.id) ? '' : 'blur-md grayscale brightness-50'"
          />
          <span
            class="badge badge-sm absolute left-1.5 top-1.5"
            :class="BADGE[ENDING_TONES[ending.tone].tone]"
          >
            {{ ENDING_TONES[ending.tone].label }}
          </span>
          <Icon
            v-if="!found(ending.id)"
            name="kind-icon:lock"
            class="absolute right-1.5 top-1.5 size-4 text-white/70"
          />
        </span>
        <span class="flex flex-col gap-0.5 p-2">
          <span class="pk-display text-sm font-bold">
            {{ found(ending.id) ? ending.title : 'An ending not yet reached' }}
          </span>
          <span class="pk-dim text-xs leading-snug opacity-80">
            {{ found(ending.id) ? ending.summary : ending.hint }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { ENDING_TONES } from '~/utils/playbookKit/view'
import type {
  KitEndingTone,
  KitTone,
  PlaybookKitSpec,
} from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()

const found = (id: string) => kit.isUnlocked('endings', id)

const BADGE: Record<KitTone, string> = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  accent: 'badge-accent',
  info: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  neutral: 'badge-neutral',
}

const tones = computed(() =>
  (Object.keys(ENDING_TONES) as KitEndingTone[])
    .map((id) => {
      const endings = props.spec.endings.filter((e) => e.tone === id)
      return {
        id,
        ...ENDING_TONES[id],
        total: endings.length,
        found: endings.filter((e) => found(e.id)).length,
      }
    })
    .filter((tone) => tone.total),
)
</script>
