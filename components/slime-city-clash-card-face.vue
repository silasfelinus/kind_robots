<!-- One Clash card face, authored at full size: art, plays, badge, name, rules. -->
<template>
  <span class="ccf">
    <SlimeCityArtwork
      class="ccf-art"
      :image-id="slimeArtId('cards', card.id)"
      :fallback-image-id="
        slimeArtId(
          'crews',
          card.team === 'mercenary' ? lab.activeTeam : card.team,
        )
      "
      :alt="card.name"
      :fallback="card.symbol"
      compact
    />
    <span class="ccf-top">
      <b class="ccf-cost">{{ plays }} PLAY{{ plays === 2 ? 'S' : '' }}</b>
      <em class="ccf-badge">{{ clashCardBadge(card) }}</em>
    </span>
    <strong class="ccf-name">{{ card.name }}</strong>
    <span class="ccf-rules">
      <small>{{ kind }}</small>
      <span class="ccf-text">{{ clashCardText(card) }}</span>
      <span v-if="note" class="ccf-text ccf-note">{{ note }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { cardById } from '~/utils/slimeCity/prototypes'
import {
  clashCardBadge,
  clashCardText,
  clashPlayCost,
} from '~/utils/slimeCity/clash'
import { useSlimeCityStore } from '~/stores/slimeCity'

const props = withDefaults(defineProps<{ cardId: string; note?: string }>(), {
  note: '',
})
const lab = useSlimeCityStore()
const card = computed(() => cardById(props.cardId))
const plays = computed(() => clashPlayCost(card.value))
const kind = computed(() =>
  card.value.kind === 'creature'
    ? 'FIGHTER'
    : card.value.kind === 'equipment'
      ? 'GEAR'
      : card.value.kind.toUpperCase(),
)
</script>

<style scoped>
.ccf {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  border: 2px solid #9fd8c288;
  background: #16323a;
  box-shadow:
    0 10px 22px #000a,
    0 0 0 1px #00000066;
  container-type: inline-size;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.ccf-art {
  position: absolute;
  inset: 0;
}
.ccf-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ccf-top {
  position: absolute;
  top: 3.5cqw;
  left: 3.5cqw;
  right: 3.5cqw;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2cqw;
}
.ccf-cost,
.ccf-badge {
  border-radius: 4cqw;
  padding: 1.6cqw 3.4cqw;
  font-size: 7.4cqw;
  font-weight: 950;
  font-style: normal;
  line-height: 1.1;
  white-space: nowrap;
  box-shadow: 0 2px 6px #0009;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ccf-cost {
  background: #b9ef56;
  color: #071115;
}
.ccf-badge {
  background: #071a20ee;
  color: #ffe6a6;
}
.ccf-name {
  position: absolute;
  top: 19cqw;
  left: 3.5cqw;
  right: 3.5cqw;
  font-size: 8.8cqw;
  line-height: 1.08;
  font-weight: 900;
  text-align: left;
  color: #f3fbf6;
  text-shadow:
    0 2px 4px #000,
    0 0 10px #000c;
}
.ccf-rules {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 1.8cqw;
  padding: 14cqw 5cqw 5cqw;
  text-align: left;
  background: linear-gradient(transparent, #041217f2 32%);
  opacity: var(--rules-open, 0);
  transform: translateY(calc((1 - var(--rules-open, 0)) * 1.5rem));
  transition:
    opacity 0.3s ease 0.08s,
    transform 0.4s cubic-bezier(0.2, 0.9, 0.25, 1.12) 0.08s;
}
.ccf-rules small {
  font-size: 4.4cqw;
  font-weight: 850;
  letter-spacing: 0.12em;
  color: #b9f151;
}
.ccf-text {
  font-size: 5.6cqw;
  line-height: 1.32;
  color: #e3f1ec;
}
.ccf-note {
  color: #ffe6a6;
  font-weight: 750;
}
@media (prefers-reduced-motion: reduce) {
  .ccf,
  .ccf-rules {
    transition-duration: 0.12s;
    transition-delay: 0ms;
  }
}
</style>
