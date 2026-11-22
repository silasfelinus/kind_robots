<template>
  <span
    class="relative block overflow-hidden bg-base-300 bg-no-repeat"
    :class="faded ? 'grayscale' : ''"
    :style="src ? undefined : regionCropStyle(region)"
    role="img"
    :aria-label="label"
  >
    <img
      v-if="src"
      :key="src"
      :src="src"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      @error="tryNext"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  questArtCandidates,
  regionCropStyle,
} from '~/utils/emperorOfDust/fortress/questArt'
import type { QuestArtVariant } from '~/utils/emperorOfDust/fortress/questArt'
import type { QuestResultTier } from '~/utils/emperorOfDust/fortress/types'

const props = withDefaults(
  defineProps<{
    questId: string
    region: string
    label: string
    variant?: QuestArtVariant
    /** A dawn result's tier selects a curated consequence plate first. */
    tier?: QuestResultTier | 'expired'
    faded?: boolean
  }>(),
  { variant: 'notice', faded: false },
)

const index = ref(0)
const candidates = computed(() =>
  questArtCandidates(props.questId, props.variant, props.tier),
)
const src = computed(() => candidates.value[index.value])

function tryNext() {
  if (index.value < candidates.value.length) index.value += 1
}

watch(
  () => [props.questId, props.variant, props.tier],
  () => {
    index.value = 0
  },
)
</script>
