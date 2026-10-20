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
      :src="src"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  questArtUrl,
  regionCropStyle,
} from '~/utils/emperorOfDust/fortress/questArt'
import type { QuestArtVariant } from '~/utils/emperorOfDust/fortress/questArt'

const props = withDefaults(
  defineProps<{
    questId: string
    region: string
    label: string
    variant?: QuestArtVariant
    faded?: boolean
  }>(),
  { variant: 'notice', faded: false },
)

const src = computed(() => questArtUrl(props.questId, props.variant))
</script>
