<template>
  <div class="relative overflow-hidden">
    <PlumberHeroinePortrait
      :heroine="heroine"
      class="absolute inset-0 h-full w-full"
    />
    <PlumberPainted
      :key="src"
      :src="src"
      :alt="`Portrait of ${heroine.name}`"
      :class="focus"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Heroine } from '~/utils/arcade/games/savePlumberHeroine'
import {
  rosterFor,
  rosterPortrait,
} from '~/utils/arcade/games/savePlumberRoster'

const props = withDefaults(
  defineProps<{ heroine: Heroine; face?: boolean }>(),
  { face: false },
)

const src = computed(() => rosterPortrait(rosterFor(props.heroine)))
const focus = computed(() => (props.face ? 'origin-[50%_17%] scale-[2.6]' : ''))
</script>
