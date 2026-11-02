<!-- /components/memory-dungeon/memory-dungeon-choice-hand.vue -->
<!--
  Memory Dungeon's choices on the shared hand (components/narrative/kr-choice-hand).
  Each card's face is the picture of where the choice leads when that art is
  delivered, else a drawn card with the realm's glyph. Titles stay solid,
  plain sans on a dark band, the readable style Silas praised (PR #4646).
-->
<template>
  <div class="md-hand" :class="`md-hand-${palette}`">
    <KrChoiceHand
      :choices="cards"
      :deal-key="dealKey"
      :testid-prefix="testidPrefix"
      @play="(choice) => emit('play', choice)"
    >
      <template #art="{ src, markFailed }">
        <img
          v-if="src"
          :src="src"
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
          @error="markFailed(src)"
        />
      </template>
    </KrChoiceHand>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

export type MemoryHandChoice = {
  id: string
  label: string
  /** Authored outcome art: only a delivered picture is shown. */
  art?: { path: string; status: string } | null
  /** A picture to try; a failed load falls back to the drawn card. */
  image?: string | null
  chip?: string
  hint?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    choices: readonly MemoryHandChoice[]
    dealKey: string
    testidPrefix: string
    icon?: string
    palette?: 'tide' | 'briar' | 'violet' | 'theme'
  }>(),
  { icon: '✦', palette: 'tide' },
)

const emit = defineEmits<{ play: [choice: KrHandChoice] }>()

const cards = computed<KrHandChoice[]>(() =>
  props.choices.map((choice) => {
    const delivered = choice.art?.status === 'delivered'
    return {
      id: choice.id,
      label: choice.label,
      chip: choice.chip,
      hint: choice.hint,
      disabled: choice.disabled,
      icon: props.icon,
      image: [
        delivered ? choice.art!.path : null,
        choice.image,
        choice.art?.path,
      ],
    }
  }),
)
</script>

<style scoped>
/* A big held hand: cards take more of the row, and the one under the
   pointer or focus rises well clear of its neighbours (Silas, 2026-11-02). */
.md-hand {
  --hand-text-scale: 1.15;
  --hand-card-max: 10.5rem;
  --hand-card-cqw: 40cqw;
  --hand-card-vh: 21vh;
  --hand-focus-scale: 1.32;
}
.md-hand-tide {
  --hand-accent: #e9c48c;
  --hand-accent-2: #8ab49e;
  --hand-band: #111a26;
  --hand-band-ink: #fff4da;
}
.md-hand-briar {
  --hand-accent: #e4ce9e;
  --hand-accent-2: #8fb07a;
  --hand-band: #243020;
  --hand-band-ink: #fff4da;
}
.md-hand-violet {
  --hand-accent: #f6d39e;
  --hand-accent-2: #c4a8dc;
  --hand-band: #2a1f33;
  --hand-band-ink: #fff0d9;
}
@media (max-height: 760px) {
  .md-hand {
    --hand-card-max: 8.25rem;
    --hand-card-vh: 19vh;
  }
}
.md-hand :deep(.krh-title) {
  padding-bottom: 0.9rem;
  background: linear-gradient(var(--band) calc(100% - 1rem), transparent);
}
.md-hand :deep(.krh-title strong) {
  -webkit-line-clamp: 5;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 800;
  line-height: 1.2;
}
.md-hand :deep(.krh-title small) {
  font-size: 0.6rem;
}
.md-hand :deep(.krh-hint) {
  font-size: 0.64rem;
}
</style>
