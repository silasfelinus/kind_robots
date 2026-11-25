<template>
  <span v-if="trap" class="trap-slice" aria-hidden="true" data-testid="clash-trap-slice">
    <SlimeCityArtwork
      :image-id="slimeCardArtId(trap.cardId, trap.level)"
      :alt="cardById(trap.cardId).name"
      :fallback="cardById(trap.cardId).symbol"
      compact
    />
    <span class="trap-armed">✦ TRAP</span>
  </span>
</template>

<script setup lang="ts">
import { slimeCardArtId } from '~/utils/slimeCity/artManifest'
import { cardById } from '~/utils/slimeCity/prototypes'
import type { ClashTrap } from '~/utils/slimeCity/clash'

defineProps<{ trap?: ClashTrap }>()
</script>

<style scoped>
.trap-slice {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  clip-path: polygon(100% 24%, 100% 100%, 24% 100%);
  background: #f4d66b;
}
.trap-slice :deep(.slime-art) {
  position: absolute;
  inset: 0;
  clip-path: polygon(100% 29%, 100% 100%, 29% 100%);
}
.trap-slice :deep(img) {
  object-fit: cover;
  object-position: right bottom;
}
.trap-armed {
  position: absolute;
  right: 0.15rem;
  bottom: 29%;
  padding: 0.12rem 0.25rem;
  border-radius: 0.25rem;
  background: #141522e8;
  color: #ffe584;
  font-size: clamp(0.48rem, 1vw, 0.8rem);
  font-weight: 900;
  line-height: 1;
}
</style>
