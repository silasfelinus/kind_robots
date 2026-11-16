<template>
  <div class="dh-hand">
    <KrChoiceHand
      :choices="cards"
      :deal-key="dealKey"
      :question="question"
      :animate="animate"
      :testid-prefix="testidPrefix"
      @play="(choice: KrHandChoice) => emit('play', choice.id)"
    >
      <template #art="{ choice, src, markFailed }">
        <DeepheartPortrait
          v-if="portraitOf(choice.id)"
          :id="portraitOf(choice.id)!"
          size="lg"
          class="dh-hand-portrait"
        />
        <img
          v-else-if="src"
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

export type DhCard = {
  id: string
  label: string
  chip?: string
  hint?: string
  details?: string[]
  icon?: string
  image?: string | null
  portrait?: string
  disabled?: boolean
  badge?: string
}

const props = withDefaults(
  defineProps<{
    choices: readonly DhCard[]
    dealKey: string
    question?: string
    animate?: boolean
    testidPrefix?: string
  }>(),
  { question: '', animate: true, testidPrefix: 'dh-hand' },
)

const emit = defineEmits<{ play: [id: string] }>()

const cards = computed<KrHandChoice[]>(() =>
  props.choices.map((c) => ({
    id: c.id,
    label: c.label,
    chip: c.chip,
    hint: c.hint,
    details: c.details,
    icon: c.icon ?? '✦',
    image: c.image ?? null,
    disabled: c.disabled,
    badge: c.badge,
  })),
)

function portraitOf(id: string): string | null {
  return props.choices.find((c) => c.id === id)?.portrait ?? null
}
</script>

<style scoped>
.dh-hand {
  --hand-text-scale: 1.1;
  --hand-card-max: 10rem;
  --hand-card-cqw: 36cqw;
  --hand-card-vh: 24vh;
  --hand-focus-scale: 1.3;
  --hand-accent: var(--color-primary);
  --hand-accent-2: var(--color-secondary);
  --hand-band: var(--color-base-200);
  --hand-band-ink: var(--color-base-content);
}
@media (max-height: 760px) {
  .dh-hand {
    --hand-card-max: 8rem;
    --hand-card-vh: 20vh;
  }
}
.dh-hand-portrait {
  position: absolute;
  inset: 0;
  border: 0;
  border-radius: 0;
  aspect-ratio: auto;
}
.dh-hand :deep(.krh-title strong) {
  -webkit-line-clamp: 4;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 800;
  line-height: 1.2;
}
</style>
