<template>
  <figure
    class="relative aspect-video overflow-hidden rounded-xl border border-warning/35 bg-base-300"
    :aria-label="locked ? 'Undiscovered ending' : undefined"
  >
    <img
      :src="image"
      :alt="
        locked
          ? ''
          : failed
            ? 'The wasteland: ending illustration not yet delivered'
            : `${ENDINGS[endingId].title} ending illustration`
      "
      class="h-full w-full object-cover"
      :class="locked ? 'brightness-[0.15] grayscale' : ''"
      @error="failed = true"
    />
    <div
      v-if="locked"
      class="absolute inset-0 grid place-content-center gap-2 bg-black/45 text-center"
      aria-hidden="true"
    >
      <Icon name="kind-icon:lock" class="mx-auto size-7 text-warning/60" />
      <span class="text-xs font-bold uppercase tracking-widest text-warning/75">
        Undiscovered
      </span>
    </div>
    <div
      v-else-if="failed"
      class="absolute inset-x-0 bottom-0 bg-base-300/85 px-3 py-1 text-center text-xs"
    >
      Painted ending illustration awaiting delivery
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ENDINGS } from '~/utils/emperorOfDust/fortress/endings'
import type { EndingId } from '~/utils/emperorOfDust/fortress/endings'

const props = withDefaults(
  defineProps<{ endingId: EndingId; locked?: boolean }>(),
  { locked: false },
)
const failed = ref(false)
const image = computed(() =>
  props.locked || failed.value
    ? '/emperor-of-dust/map/wasteland.webp'
    : `/emperor-of-dust/endings/${props.endingId}.webp`,
)
watch(
  () => props.endingId,
  () => {
    failed.value = false
  },
)
</script>
