<!-- /components/ecotone-choice-hand.vue -->
<!--
  Ecotone's choices on the shared hand (components/narrative/kr-choice-hand).
  Each card's face is the picture of where that choice leads (its outcome,
  or who it meets); a hand never repeats a picture or the stage's own scene,
  so a card with nothing of its own gets a drawn face with its lens icon.
  The complete card face stays visible; hover and keyboard focus expose details.
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
      <template #art="{ choice, src }">
        <EcotoneScene
          v-if="src && byId.get(choice.id)?.thumb"
          :kind="byId.get(choice.id)!.thumb!.scene"
          :art="src.startsWith(SCENE) ? undefined : src"
          :label="choice.label"
        />
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
  thumb?: {
    scene: SceneKind
    art?: string | string[]
    sceneFallback?: boolean
  }
  icon?: string
}

const SCENE = 'scene:'

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
    icon: option.icon ?? '✦',
    image: candidates(option),
    details: [option.preview, option.possibilities].filter(
      (line): line is string => Boolean(line),
    ),
  })),
)

/** Art keys that actually render in this style, then the drawn scene when it
 *  isn't the stage's own; the shared hand keeps each one to a single card. */
function candidates(option: EcotoneHandOption): string[] {
  const thumb = option.thumb
  if (!thumb) return []
  const keys = (
    typeof thumb.art === 'string' ? [thumb.art] : (thumb.art ?? [])
  ).filter((key) => ecotoneArtSrc(key, props.artStyle))
  return thumb.sceneFallback === false && keys.length
    ? keys
    : [...keys, `${SCENE}${thumb.scene}`]
}

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
  --hand-tuck: 0;
  --hand-card-vh: 22vh;
  --hand-card-max: 10.75rem;
  --hand-focus-scale: 1.06;
}
.eco-hand :deep(.krh-detail) {
  max-width: min(100%, 33rem);
  max-height: none;
  overflow: visible;
  white-space: normal;
}
.eco-hand :deep(.krh-title strong) {
  -webkit-line-clamp: 4;
}
.eco-hand :deep(.krh-title strong),
.eco-hand :deep(.krh-detail strong) {
  font-family: ui-serif, Georgia, serif;
}
</style>
