<!-- /components/ecotone-choice-hand.vue -->
<!--
  Ecotone's choices on the shared hand (components/narrative/kr-choice-hand).
  Each card's face is the picture of where the choice leads: its outcome
  art, then the beat's own art, then the drawn scene. On wide boards the
  resting cards tuck below the story column's edge.
-->
<template>
  <div class="eco-hand" data-testid="ecotone-choice-hand">
    <KrChoiceHand
      :choices="choices"
      :question="question"
      :deal-key="dealKey"
      :back-image="backImage"
      testid-prefix="ecotone-choice"
      @play="(picked) => play(picked.id)"
    >
      <template #art="{ choice }">
        <EcotoneScene
          v-if="byId.get(choice.id)?.thumb"
          :kind="byId.get(choice.id)!.thumb!.scene"
          :art="byId.get(choice.id)!.thumb!.art"
          :label="choice.label"
        />
        <span v-else class="eco-hand-plain" aria-hidden="true" />
      </template>
    </KrChoiceHand>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SceneKind } from '~/utils/ecotone/content'
import { ecotoneArtSrc } from '~/utils/ecotone/artStyles'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

export type EcotoneHandOption = {
  id: string
  label: string
  hint?: string
  chip?: string
  chipTitle?: string
  preview?: string
  possibilities?: string
  disabled?: boolean
  perkEligible?: boolean
  thumb?: { scene: SceneKind; art?: string | string[] }
}

const props = defineProps<{
  options: EcotoneHandOption[]
  question: string
  dealKey: string
  artStyle?: unknown
}>()

const emit = defineEmits<{ play: [option: EcotoneHandOption] }>()

const byId = computed(
  () => new Map(props.options.map((option) => [option.id, option])),
)

const choices = computed<KrHandChoice[]>(() =>
  props.options.map((option) => ({
    id: option.id,
    label: option.label,
    chip: option.chip,
    hint: option.hint,
    badge: option.perkEligible ? 'Perk' : undefined,
    disabled: option.disabled,
    details: [option.preview, option.possibilities].filter(
      (line): line is string => Boolean(line),
    ),
  })),
)

const backImage = computed(() => ecotoneArtSrc('ui/card-back', props.artStyle))

function play(id: string) {
  const option = byId.value.get(id)
  if (option) emit('play', option)
}
</script>

<style scoped>
.eco-hand {
  --hand-accent: #d9b877;
  --hand-accent-2: #8fb8b0;
  --hand-band: #071016;
  --hand-band-ink: #f3e6c8;
  --hand-text-scale: var(--eco-text-scale, 1.2);
}
@container (min-width: 64rem) {
  .eco-hand {
    --hand-tuck: 1;
  }
}
.eco-hand :deep(.krh-title strong),
.eco-hand :deep(.krh-detail strong) {
  font-family: ui-serif, Georgia, serif;
}
.eco-hand-plain {
  background:
    radial-gradient(circle at 50% 35%, #8fb8b055, transparent 60%),
    linear-gradient(160deg, #1d3a44, #0b1d27);
}
</style>
