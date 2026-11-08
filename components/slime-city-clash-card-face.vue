<!-- One Clash card face, authored at full size: art, plays, badge, name, rules. -->
<template>
  <span class="ccf" :class="'lv-' + level">
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
      <em class="ccf-badge">{{ clashCardBadge(card, level) }}</em>
    </span>
    <strong class="ccf-name">{{ card.name }}</strong>
    <span class="ccf-level" :aria-label="'Level ' + level + ' of ' + maxLevel"
      ><i v-for="n in maxLevel" :key="n" :class="{ on: n <= level }" /><b
        >LV {{ level }}{{ preview ? ' · PREVIEW' : '' }}</b
      ><em v-if="stageTitle && level > 1" class="ccf-stage">{{
        stageTitle
      }}</em></span
    >
    <span class="ccf-rules">
      <small>{{ kind }}</small>
      <span v-if="clashCardText(card, level)" class="ccf-text">{{
        clashCardText(card, level)
      }}</span>
      <span v-if="note" class="ccf-text ccf-note">{{ note }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { cardById } from '~/utils/slimeCity/prototypes'
import {
  CLASH_MAX_LEVEL,
  clashCardBadge,
  clashCardText,
  clashPlayCost,
} from '~/utils/slimeCity/clash'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { clashStageTitle } from '~/utils/slimeCity/clashEvolutions'

const props = withDefaults(
  defineProps<{
    cardId: string
    note?: string
    level?: number
    preview?: boolean
  }>(),
  { note: '', level: 1, preview: false },
)
const maxLevel = CLASH_MAX_LEVEL
const lab = useSlimeCityStore()
const card = computed(() => cardById(props.cardId))
/** Evolved stage name (Solforge-style): what this card becomes at its level. */
const stageTitle = computed(() => clashStageTitle(props.cardId, props.level))
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
.ccf.lv-3 {
  border-color: #ffd34d;
  box-shadow:
    0 0 0 2px #ffd34d55,
    0 0 26px #ffb80066,
    0 10px 22px #000a;
}
.ccf-art {
  position: absolute;
  inset: 0;
}
.ccf-stage {
  font-style: normal;
  font-weight: 900;
  letter-spacing: 0.03em;
  color: #ffe9a8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 52cqw;
}
.lv-3 .ccf-stage {
  color: #fff3c4;
  text-shadow: 0 0 2cqw #ffd76a;
}
.ccf-level {
  position: absolute;
  left: 3.5cqw;
  top: 36cqw;
  display: flex;
  align-items: center;
  gap: 1.4cqw;
  padding: 1cqw 2.4cqw;
  border-radius: 99px;
  background: #071a20d9;
}
.ccf-level i {
  width: 3.4cqw;
  height: 3.4cqw;
  transform: rotate(45deg);
  border: 0.6cqw solid #ffe6a6aa;
  background: transparent;
}
.ccf-level i.on {
  background: #ffd34d;
  border-color: #ffd34d;
  box-shadow: 0 0 2cqw #ffb800;
}
.ccf-level b {
  font-size: 4.2cqw;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #ffe6a6;
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
