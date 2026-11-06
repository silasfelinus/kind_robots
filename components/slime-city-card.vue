<!-- /components/slime-city-card.vue -->
<!--
  THE FULL CARD FACE.

  Silas, 2026-11-02, after a playtest: "The cards are so far the best part of
  the game … the card gallery isn't showing the entire card content. they
  should look like the card design anyway, it's a good design."

  This grows the in-match hand card (components/slime-city-hand.vue: portrait
  2:3, full-bleed art, cost gem, crew-toned rim) into a complete trading card:
  name banner, type line, every word of rules text, keyword reminders and the
  creature stat bar. Type scales with the card's own width (cqw), and the face
  is never clipped: a card with unusually long text shrinks its art first and
  only then grows taller than 2:3. Pure presentation, no store or deck logic,
  so the Armory, the pack reveal and a battle-board inspect popup can share it.
-->
<template>
  <article
    class="scc"
    :class="[
      'scc-' + rarity,
      'scc-kind-' + card.kind,
      { 'scc-mercenary': isMercenary, 'scc-signature': card.signature },
    ]"
    :style="{ '--tone': toneColor }"
  >
    <div class="scc-face">
      <div class="scc-art">
        <SlimeCityArtwork
          class="scc-art-image"
          :image-id="slimeArtId('cards', card.id)"
          :fallback-image-id="
            slimeArtId(
              'crews',
              card.team === 'mercenary' ? 'exchange' : card.team,
            )
          "
          :alt="card.name + ' card art'"
          :fallback="card.symbol"
          compact
        />
        <b class="scc-cost" :title="card.cost + ' mana'">
          <span class="sr-only">Cost </span>{{ card.cost
          }}<span class="sr-only"> mana</span>
        </b>
        <div v-if="$slots.default" class="scc-overlay">
          <slot />
        </div>
      </div>
      <div class="scc-banner">
        <strong class="scc-name">{{ card.name }}</strong>
      </div>
      <p class="scc-type">
        <i class="scc-rarity-gem" aria-hidden="true" />
        <span>{{ rarity }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ card.kind }}</span>
        <template v-if="card.signature">
          <span aria-hidden="true">·</span>
          <span class="scc-tag">★ signature</span>
        </template>
        <template v-if="isMercenary">
          <span aria-hidden="true">·</span>
          <span class="scc-tag">mercenary</span>
        </template>
      </p>
      <div class="scc-rules">
        <p class="scc-text">{{ card.text }}</p>
        <ul v-if="keywords.length" class="scc-keywords">
          <li v-for="keyword in keywords" :key="keyword">
            <b
              >{{ grantsOnly ? 'GRANTS ' : '' }}{{ KEYWORDS[keyword].label }}</b
            >
            {{ KEYWORDS[keyword].text }}
          </li>
        </ul>
      </div>
      <dl v-if="card.kind === 'creature'" class="scc-stats">
        <div v-for="stat in stats" :key="stat.label" :class="stat.class">
          <dt>{{ stat.label }}</dt>
          <dd>{{ stat.value }}</dd>
        </div>
      </dl>
    </div>
    <div v-if="$slots.footer" class="scc-footer">
      <slot name="footer" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  KEYWORDS,
  TEAMS,
  cardAttackRange,
  type Card,
} from '~/utils/slimeCity/prototypes'
import { rarityOf } from '~/utils/slimeCity/progression'
import { slimeArtId } from '~/utils/slimeCity/artManifest'

const props = defineProps<{
  card: Card
  tone?: string
}>()

const CREW_TONES: Record<string, string> = {
  red: '#fe6657',
  blue: '#6fc8ff',
  purple: '#d38cff',
  green: '#c7fa62',
  gold: '#f7c968',
  mercenary: '#e9a46a',
}

const isMercenary = computed(() => props.card.team === 'mercenary')
const rarity = computed(() => rarityOf(props.card))
const toneColor = computed(() => {
  if (props.tone) return CREW_TONES[props.tone] ?? props.tone
  if (isMercenary.value) return CREW_TONES.mercenary
  const color = TEAMS.find((team) => team.id === props.card.team)?.color
  return CREW_TONES[color ?? 'green']
})
const keywords = computed(() => props.card.keywords ?? props.card.grants ?? [])
const grantsOnly = computed(
  () => !props.card.keywords && !!props.card.grants?.length,
)
const stats = computed(() => [
  { label: 'ATK', value: props.card.attack ?? 0, class: 'scc-atk' },
  { label: 'HP', value: props.card.hp ?? 0, class: 'scc-hp' },
  { label: 'ARMOR', value: props.card.armor ?? 0, class: 'scc-armor' },
  { label: 'MOVE', value: props.card.ap ?? 0, class: 'scc-move' },
  { label: 'RANGE', value: cardAttackRange(props.card), class: 'scc-range' },
])
</script>

<style scoped>
.scc {
  --rim: color-mix(in srgb, var(--tone) 80%, #fff);
  --ink: #0b1019;
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  min-width: 0;
  color: #eef3fa;
  font-family: system-ui, sans-serif;
  text-align: left;
}
.scc-face {
  position: relative;
  display: grid;
  grid-template-rows: minmax(38cqw, 1fr) auto auto auto auto;
  aspect-ratio: 2 / 3;
  padding: 2.4cqw;
  border-radius: 5.5cqw;
  background:
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--rim) 90%, #fff) 0%,
      color-mix(in srgb, var(--tone) 55%, var(--ink)) 18%,
      var(--ink) 46%,
      color-mix(in srgb, var(--tone) 40%, var(--ink)) 100%
    ),
    var(--ink);
  box-shadow:
    0 1.6cqw 5cqw #000c,
    inset 0 0 0 0.5cqw #0009,
    inset 0 0 0 0.9cqw color-mix(in srgb, var(--tone) 35%, transparent);
}
.scc-face::before {
  content: '';
  position: absolute;
  inset: 2.4cqw;
  z-index: 0;
  border-radius: 3.6cqw;
  background:
    radial-gradient(
      ellipse at 50% 110%,
      color-mix(in srgb, var(--tone) 22%, transparent),
      transparent 60%
    ),
    linear-gradient(#111a27, #0a1019);
  pointer-events: none;
}
.scc-face > * {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.scc-art {
  min-height: 0;
  border-radius: 3.6cqw 3.6cqw 1.2cqw 1.2cqw;
  overflow: hidden;
  background: #141c29;
}
.scc-art .scc-art-image {
  position: absolute;
  inset: 0;
}
.scc-art::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 0.45cqw color-mix(in srgb, var(--tone) 65%, #000),
    inset 0 -9cqw 10cqw -5cqw #000d;
  pointer-events: none;
}
.scc-art-image :deep(.slime-art-fallback) {
  font-size: 22cqw;
  color: var(--rim);
  text-shadow: 0 0 6cqw var(--tone);
  background:
    radial-gradient(circle, #ffffff1f, transparent 58%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--tone) 32%, #171b2b),
      #121925
    );
}
.scc-rare .scc-art::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    115deg,
    transparent 30%,
    #ffffff3d 45%,
    #ffe9a833 52%,
    transparent 64%
  );
  background-size: 260% 100%;
  background-position: 120% 0;
  mix-blend-mode: screen;
  animation: scc-foil 5.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes scc-foil {
  0%,
  55% {
    background-position: 120% 0;
  }
  100% {
    background-position: -40% 0;
  }
}

.scc-cost {
  position: absolute;
  z-index: 2;
  top: 2cqw;
  left: 2cqw;
  display: grid;
  place-items: center;
  width: 14cqw;
  height: 14cqw;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f2ffb8, #8bd136 58%, #3d6a12);
  color: #10200a;
  font-size: 8cqw;
  font-weight: 1000;
  line-height: 1;
  box-shadow:
    0 0 0 0.7cqw #0b1019,
    0 0 0 1.3cqw color-mix(in srgb, var(--rim) 85%, #fff),
    0 1.5cqw 3cqw #000c,
    0 0 5cqw #c5ff5966;
}
.scc-overlay {
  position: absolute;
  z-index: 2;
  top: 2cqw;
  right: 2cqw;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1cqw;
  max-width: 70%;
}

.scc-banner {
  margin: -7.5cqw 1cqw 0;
  padding: 1.6cqw 3.4cqw 1.8cqw;
  clip-path: polygon(
    2.6cqw 0,
    calc(100% - 2.6cqw) 0,
    100% 2.6cqw,
    100% calc(100% - 2.6cqw),
    calc(100% - 2.6cqw) 100%,
    2.6cqw 100%,
    0 calc(100% - 2.6cqw),
    0 2.6cqw
  );
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--rim) 70%, transparent) 0 0.5cqw,
      transparent 0.5cqw calc(100% - 0.5cqw),
      color-mix(in srgb, var(--tone) 60%, transparent) calc(100% - 0.5cqw)
    ),
    linear-gradient(
      100deg,
      color-mix(in srgb, var(--tone) 46%, #0c1220),
      #101827 55%,
      color-mix(in srgb, var(--tone) 30%, #0c1220)
    );
  filter: drop-shadow(0 1cqw 1.5cqw #000);
  text-align: center;
}
.scc-mercenary .scc-banner {
  background:
    repeating-linear-gradient(-45deg, #f6c56a 0 1.4cqw, #1a1309 1.4cqw 2.8cqw)
      top / 100% 0.9cqw no-repeat,
    repeating-linear-gradient(-45deg, #f6c56a 0 1.4cqw, #1a1309 1.4cqw 2.8cqw)
      bottom / 100% 0.9cqw no-repeat,
    linear-gradient(100deg, #4a2c17, #1b130e 55%, #3d2614);
}
.scc-name {
  display: block;
  color: #fff;
  font-size: 6.6cqw;
  font-weight: 950;
  font-style: italic;
  line-height: 1.05;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-wrap: balance;
  overflow-wrap: anywhere;
  text-shadow:
    0 0.4cqw 0 #000,
    0 0 3cqw color-mix(in srgb, var(--tone) 60%, transparent);
}

.scc-type {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4em 0.55em;
  margin: 1.8cqw 0 0;
  color: color-mix(in srgb, var(--tone) 70%, #fff);
  font-size: max(0.5rem, 3.7cqw);
  font-weight: 850;
  letter-spacing: 0.14em;
  line-height: 1.15;
  text-transform: uppercase;
}
.scc-rarity-gem {
  width: 0.85em;
  height: 0.85em;
  transform: rotate(45deg);
  border-radius: 0.15em;
  background: linear-gradient(135deg, #f2f5fa, #8792a3);
  box-shadow: 0 0 0.5em #fff6;
}
.scc-uncommon .scc-rarity-gem {
  background: linear-gradient(135deg, #c9f0ff, #3a8bd8);
  box-shadow: 0 0 0.6em #6fc8ffaa;
}
.scc-rare .scc-rarity-gem {
  background: linear-gradient(135deg, #fff2c2, #e2a530);
  box-shadow: 0 0 0.8em #f7cb68;
}
.scc-tag {
  color: #ffe9a8;
}

.scc-rules {
  display: grid;
  align-content: start;
  gap: 1.6cqw;
  margin: 1.8cqw 0.6cqw 0;
  padding: 2.6cqw 3cqw;
  border-radius: 2cqw;
  border: 0.35cqw solid color-mix(in srgb, var(--tone) 32%, transparent);
  background: linear-gradient(180deg, #0f1826f2, #0b121ce6);
  box-shadow: inset 0 0 4cqw #0008;
}
.scc-text {
  margin: 0;
  color: #eef2f8;
  font-size: max(0.6rem, 5cqw);
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.scc-keywords {
  display: grid;
  gap: 1.2cqw;
  margin: 0;
  padding: 1.6cqw 0 0;
  border-top: 0.3cqw solid #ffffff14;
  list-style: none;
  color: #b8c4d4;
  font-size: max(0.55rem, 4.3cqw);
  line-height: 1.28;
}
.scc-keywords b {
  display: inline-block;
  margin-right: 0.3em;
  padding: 0.05em 0.45em;
  border-radius: 0.3em;
  background: color-mix(in srgb, var(--tone) 85%, #000);
  color: #0b1019;
  font-size: 0.92em;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.scc-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1cqw;
  margin: 1.8cqw 0.6cqw 0;
}
.scc-stats > div {
  --stat: #dfe7f2;
  display: grid;
  justify-items: center;
  padding: 1cqw 0 1.2cqw;
  border-radius: 1.6cqw;
  border: 0.35cqw solid color-mix(in srgb, var(--stat) 45%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--stat) 22%, #0b1019),
    #0b1019
  );
}
.scc-stats dt {
  color: color-mix(in srgb, var(--stat) 75%, #fff);
  font-size: max(0.4rem, 2.9cqw);
  font-weight: 850;
  letter-spacing: 0.1em;
}
.scc-stats dd {
  margin: 0;
  color: #fff;
  font-size: max(0.75rem, 6.4cqw);
  font-weight: 1000;
  line-height: 1.05;
  text-shadow: 0 0 2.5cqw var(--stat);
}
.scc-stats .scc-atk {
  --stat: #ff7a5c;
}
.scc-stats .scc-hp {
  --stat: #7dff8a;
}
.scc-stats .scc-armor {
  --stat: #8cc8ff;
}
.scc-stats .scc-move {
  --stat: #ffe066;
}
.scc-stats .scc-range {
  --stat: #d9a2ff;
}

.scc-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .scc-rare .scc-art::after {
    animation: none;
  }
}
</style>
