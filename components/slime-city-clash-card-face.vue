<!-- One Clash card face, authored at full size: art, plays, badge, name, rules. -->
<template>
  <span class="ccf" :class="'lv-' + level">
    <SlimeCityArtwork
      class="ccf-art"
      :image-id="slimeCardArtId(card.id, level, pick ?? 0)"
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
    <!--
      Silas, 2026-11-24 PT (iPad): "On the actual cards, some text isn't being
      read." The name and the evolved stage title were pinned at fixed
      heights and clipped to one line ("Catchy H..."). The header now flows
      top to bottom: plays and badge, the full name, the level pips, then the
      full stage title, each wrapping instead of truncating.
    -->
    <span class="ccf-head">
      <span class="ccf-top">
        <b class="ccf-cost">{{ plays }} PLAY{{ plays === 2 ? 'S' : '' }}</b>
        <em class="ccf-badge">{{ clashCardBadge(card, level) }}</em>
      </span>
      <strong class="ccf-name">{{ card.name }}</strong>
      <span class="ccf-level" :aria-label="'Level ' + level + ' of ' + maxLevel"
        ><i v-for="n in maxLevel" :key="n" :class="{ on: n <= level }" /><b
          >LV {{ level }}{{ preview ? ' · PREVIEW' : '' }}</b
        ></span
      >
      <em v-if="stageTitle && level > 1" class="ccf-stage">{{ stageTitle }}</em>
    </span>
    <!--
      Silas, 2026-11-24 PT: "We need easier to read cards." Rules sit on a
      solid plate edged in the level color, one ability per line with its
      label ("Armor:", "Arrive:") picked out, at a larger size.
    -->
    <span class="ccf-rules">
      <small>{{ kind }}</small>
      <span v-if="rules" class="ccf-text">
        <span v-for="(line, i) in ruleLines" :key="i" class="ccf-line">
          <template v-for="(part, j) in line" :key="j">
            <span
              v-if="part.entry"
              :class="{ 'ccf-label': part.label, 'ccf-term': glossaryInteractive }"
              :title="part.entry.definition"
              @pointerenter="showTerm(part.entry)"
              @pointerleave="leaveTerm"
              @pointerdown="termPointerDown"
              @click="toggleTerm($event, part.entry)"
            >{{ part.text }}</span>
            <span v-else :class="{ 'ccf-label': part.label }">{{ part.text }}</span>
          </template>
        </span>
      </span>
      <span v-if="note" class="ccf-text ccf-note">{{ note }}</span>
      <span v-if="flavor && flavorText" class="ccf-flavor">{{
        flavorText
      }}</span>
    </span>
    <span
      v-if="glossaryInteractive && activeTerm"
      class="ccf-glossary"
      role="status"
      data-testid="clash-glossary-popup"
      @pointerdown.stop
      @click.stop="clearTerm"
    >
      <b>{{ activeTerm.term }} · GLOSSARY</b>
      <span>{{ activeTerm.definition }}</span>
      <small>Tap to close</small>
    </span>
    <SlimeCityLevelFrame :level="level" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { clashGlossaryParts, type ClashGlossaryEntry } from '~/utils/slimeCity/glossary'
import { slimeArtId, slimeCardArtId } from '~/utils/slimeCity/artManifest'
import { cardById } from '~/utils/slimeCity/prototypes'
import {
  CLASH_MAX_LEVEL,
  clashCardBadge,
  clashCardText,
  clashPlayCost,
} from '~/utils/slimeCity/clash'
import { useSlimeCityStore } from '~/stores/slimeCity'
import {
  clashCardFlavor,
  clashStageTitle,
  type EvoPick,
} from '~/utils/slimeCity/clashEvolutions'

const props = withDefaults(
  defineProps<{
    cardId: string
    note?: string
    glossaryInteractive?: boolean
    level?: number
    preview?: boolean
    /** A choose-one level three already played as option 0 or 1. */
    pick?: EvoPick
    /**
     * Show the card's flavor line under its rules. Only reading views ask
     * for it (the collection inspector); cards in play show rules alone.
     */
    flavor?: boolean
  }>(),
  { note: '', glossaryInteractive: false, level: 1, preview: false, pick: undefined, flavor: false },
)
const maxLevel = CLASH_MAX_LEVEL
const lab = useSlimeCityStore()
const card = computed(() => cardById(props.cardId))
/** Evolved stage name (Solforge-style): what this card becomes at its level. */
const stageTitle = computed(() =>
  clashStageTitle(props.cardId, props.level, props.pick),
)
const rules = computed(() => clashCardText(card.value, props.level, props.pick))
const flavorText = computed(() => clashCardFlavor(props.cardId))
/**
 * The rules as one line per sentence, with a leading "Label:" (Armor, Regen,
 * Arrive, Tap (skip strike), Cast...) split out so it can be picked out.
 */
const ruleLines = computed(() =>
  rules.value
    .split(/(?<=[.!])\s+(?=[A-Z0-9])/)
    .filter(Boolean)
    .map((sentence) => {
      const m = /^([A-Z][A-Za-z' -]{0,22}(?: \([^)]{1,24}\))?):\s+(.+)$/.exec(
        sentence,
      )
      return [
        ...clashGlossaryParts(m ? m[1] + ': ' : '').map((part) => ({ ...part, label: true })),
        ...clashGlossaryParts(m ? m[2] ?? '' : sentence).map((part) => ({ ...part, label: false })),
      ]
    }),
)
const activeTerm = ref<ClashGlossaryEntry | null>(null)
const lockedTerm = ref(false)
function clearTerm() {
  activeTerm.value = null
  lockedTerm.value = false
}
function showTerm(entry: ClashGlossaryEntry) {
  if (props.glossaryInteractive && !lockedTerm.value) activeTerm.value = entry
}
function leaveTerm() {
  if (!lockedTerm.value) clearTerm()
}
function termPointerDown(event: PointerEvent) {
  if (props.glossaryInteractive) event.stopPropagation()
}
function toggleTerm(event: MouseEvent, entry: ClashGlossaryEntry) {
  if (!props.glossaryInteractive) return
  event.stopPropagation()
  if (lockedTerm.value && activeTerm.value === entry) clearTerm()
  else {
    activeTerm.value = entry
    lockedTerm.value = true
  }
}
watch(() => [props.cardId, props.level, props.pick, props.glossaryInteractive], clearTerm)
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
  border: 2px solid #0b2a26;
  background: #16323a;
  box-shadow:
    0 10px 22px #000a,
    0 0 0 1px #00000066;
  container-type: inline-size;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.ccf {
  --lv: #8af2c2;
}
.ccf.lv-2 {
  --lv: #a996ff;
  border-color: #3a2f7a;
  box-shadow:
    0 0 18px #8f7bff55,
    0 10px 22px #000a;
}
.ccf.lv-3 {
  --lv: #ffd34d;
  border-color: #7a4a12;
  box-shadow:
    0 0 26px #ffb80066,
    0 10px 22px #000a;
}
.ccf-art {
  position: absolute;
  inset: 0;
}
.ccf-head {
  position: absolute;
  top: 3.5cqw;
  left: 3.5cqw;
  right: 3.5cqw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.6cqw;
  min-width: 0;
}
.ccf-stage {
  max-width: 100%;
  padding: 1cqw 2.6cqw;
  border-radius: 2.4cqw;
  background: #071a20d9;
  font-size: 6cqw;
  font-style: normal;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0.02em;
  color: var(--lv);
  overflow-wrap: anywhere;
}
.lv-3 .ccf-stage {
  color: #fff3c4;
  text-shadow: 0 0 2cqw #ffd76a;
}
.ccf-level {
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
  background: var(--lv);
  border-color: var(--lv);
  box-shadow: 0 0 2cqw var(--lv);
}
.ccf-level b {
  font-size: 4.2cqw;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--lv);
}
.ccf-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ccf-top {
  align-self: stretch;
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
  max-width: 100%;
  margin-top: 1cqw;
  padding: 0.6cqw 2.4cqw 1cqw;
  border-radius: 2.4cqw;
  background: #04141ac4;
  font-size: 8.8cqw;
  line-height: 1.08;
  font-weight: 900;
  text-align: left;
  color: #f7fdf9;
  text-shadow: 0 1px 2px #000;
}
.ccf-rules {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 1.8cqw;
  padding: 3.4cqw 5cqw 5cqw;
  border-top: 0.8cqw solid var(--lv);
  text-align: left;
  background: #04141af2;
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
  display: flex;
  flex-direction: column;
  gap: 1.2cqw;
  font-size: 6.4cqw;
  font-weight: 600;
  line-height: 1.28;
  color: #f2faf6;
}
.ccf-line {
  display: block;
}
.ccf-label {
  font-weight: 900;
  color: var(--lv);
}
.ccf-term {
  pointer-events: auto;
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 0.15em;
}
.ccf-glossary {
  position: absolute;
  z-index: 5;
  top: 4%;
  left: 4%;
  right: 4%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.55rem;
  border: 1px solid var(--lv);
  border-radius: 0.6rem;
  background: #071a20;
  color: #f2faf6;
  font-size: clamp(0.75rem, 6cqw, 1rem);
  line-height: 1.3;
  text-align: left;
  pointer-events: auto;
}
.ccf-glossary b {
  color: var(--lv);
}
.ccf-glossary small {
  font-size: 0.7em;
  opacity: 0.75;
}
.ccf-note {
  color: #ffe6a6;
  font-weight: 750;
}
.ccf-flavor {
  display: block;
  margin-top: 0.6cqw;
  padding-top: 1.8cqw;
  border-top: 1px solid #b9f15133;
  font-size: 5cqw;
  font-style: italic;
  line-height: 1.3;
  color: #a9c4ba;
}
@media (prefers-reduced-motion: reduce) {
  .ccf,
  .ccf-rules {
    transition-duration: 0.12s;
    transition-delay: 0ms;
  }
}
</style>
