<!-- /components/game-of-captains/space-couch-choice-hand.vue -->
<!--
  Space Couch's choices on the shared hand (components/narrative/kr-choice-hand),
  in the bridge's amber-on-midnight palette.
-->
<template>
  <div class="sc-hand" data-testid="space-couch-choice-hand">
    <KrChoiceHand
      :choices="choices"
      :question="question"
      :deal-key="dealKey"
      :testid-prefix="testidPrefix"
      @play="(picked) => emit('play', picked)"
    >
      <template v-if="$slots.art" #art="scope">
        <slot name="art" v-bind="scope" />
      </template>
    </KrChoiceHand>
  </div>
</template>

<script setup lang="ts">
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

defineProps<{
  choices: KrHandChoice[]
  question?: string
  dealKey?: string
  testidPrefix?: string
}>()

const emit = defineEmits<{ play: [choice: KrHandChoice] }>()
</script>

<style scoped>
.sc-hand {
  --hand-accent: #efb981;
  --hand-accent-2: #86c9d2;
  --hand-band: #0e1b2d;
  --hand-band-ink: #fcf1e4;
  margin: 0.6rem 0;
}
.sc-hand :deep(.krh-title strong),
.sc-hand :deep(.krh-detail strong) {
  font-family: Georgia, serif;
}
</style>
