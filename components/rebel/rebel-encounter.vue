<template>
  <div
    class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-base-300/95 p-2 text-center"
    role="group"
    :aria-label="
      kind === 'cannon' ? 'Cannon at the arch' : 'Spot the real button'
    "
    data-testid="rebel-encounter"
  >
    <template v-if="kind === 'cannon'">
      <p class="text-sm font-bold">{{ message }}</p>
      <div class="relative h-16 w-full">
        <div
          class="absolute bottom-0 h-14 w-10 -translate-x-1/2 rounded-t-full border-4 border-base-content/70"
          :style="{ left: `${arch}%` }"
          aria-hidden="true"
        ></div>
        <div
          class="absolute bottom-0 h-6 w-6 -translate-x-1/2 rounded-full bg-primary"
          :style="{ left: `${aim}%` }"
          aria-hidden="true"
        ></div>
      </div>
      <input
        v-model.number="aim"
        type="range"
        min="0"
        max="100"
        class="range range-primary range-sm w-full"
        aria-label="Aim the cannon"
        @keydown.enter.prevent="fire"
      />
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm rounded-xl" @click="fire">
          Fire
        </button>
        <button class="btn btn-ghost btn-sm rounded-xl" @click="emit('done')">
          Skip
        </button>
      </div>
    </template>
    <template v-else>
      <p class="text-sm font-bold">{{ message }}</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="i in count"
          :key="i"
          :class="[
            'btn btn-sm rounded-xl',
            rebelDecoyIsReal(i - 1, seed)
              ? 'btn-accent border-4 border-base-content font-bold'
              : 'btn-neutral',
          ]"
          :aria-label="
            rebelDecoyIsReal(i - 1, seed) ? 'The glowing button' : 'Button'
          "
          @click="choose(i - 1)"
        >
          Press
        </button>
      </div>
      <button class="btn btn-ghost btn-xs rounded-xl" @click="emit('done')">
        Skip
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  REBEL_DECOY_COUNT,
  rebelArchPosition,
  rebelCannonHit,
  rebelDecoyIsReal,
} from '@/utils/rebelEncounters'
import type { RebelEncounterKind } from '@/utils/rebelEncounters'

const props = defineProps<{ kind: RebelEncounterKind; seed: number }>()
const emit = defineEmits<{ done: [] }>()

const count = REBEL_DECOY_COUNT
const aim = ref(50)
const arch = computed(() => rebelArchPosition(props.seed))
const message = ref(
  props.kind === 'cannon'
    ? 'A wall blocks the button. Aim the cannon at the arch!'
    : 'Which one is the real button? One looks different.',
)

const fire = () => {
  if (rebelCannonHit(aim.value, props.seed)) emit('done')
  else message.value = 'Missed! Line up with the arch and try again.'
}

const choose = (index: number) => {
  if (rebelDecoyIsReal(index, props.seed)) emit('done')
  else message.value = 'A decoy! Look for the glowing one.'
}
</script>
