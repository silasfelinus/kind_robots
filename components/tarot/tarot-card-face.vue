<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    cardKey?: string
    imageUrl?: string | null
    reversed?: boolean
    side?: 'face' | 'back'
    backUrl?: string | null
  }>(),
  {
    cardKey: '',
    imageUrl: null,
    reversed: false,
    side: 'face',
    backUrl: null,
  },
)

const ROMAN = [
  '0',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
  'XXI',
]

const SUIT_GLYPH: Record<string, string> = {
  wands: '✺',
  cups: '♁',
  swords: '⚔',
  pentacles: '✪',
}

const numeral = computed(() => {
  const ordinal = /^major-(\d+)$/.exec(props.cardKey)?.[1]
  if (ordinal !== undefined) return ROMAN[Number(ordinal)] ?? ''
  return props.cardKey.split('-of-')[0] ?? ''
})

const glyph = computed(() => {
  const suit = props.cardKey.split('-of-')[1] ?? ''
  return SUIT_GLYPH[suit] ?? '✧'
})
</script>

<template>
  <div
    class="tarot-card-face relative aspect-[2/3] w-full overflow-hidden rounded-xl"
    :class="{ 'rotate-180': reversed && side === 'face' }"
  >
    <template v-if="side === 'back'">
      <img
        v-if="backUrl"
        :src="backUrl"
        alt=""
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="tarot-back-fallback absolute inset-0"
        aria-hidden="true"
      >
        <span class="tarot-back-star">✦</span>
      </div>
    </template>
    <template v-else>
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="`${title} illustration`"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="tarot-face-fallback absolute inset-0 flex flex-col items-center justify-between p-[8%] text-center"
      >
        <span class="tarot-numeral">{{ numeral }}</span>
        <span class="tarot-glyph" aria-hidden="true">{{ glyph }}</span>
        <span class="tarot-title">{{ title }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tarot-card-face {
  background: #16112e;
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.35);
  container-type: inline-size;
}

.tarot-face-fallback {
  background:
    radial-gradient(ellipse at 50% 42%, #ad6dbe65, transparent 45%),
    repeating-conic-gradient(
      from 45deg at 50% 50%,
      #e6b76b0c 0 12deg,
      transparent 12deg 24deg
    ),
    linear-gradient(155deg, #34234e, #151027 65%, #112b3a);
  box-shadow:
    inset 0 0 0 4px #aa8d4f66,
    inset 0 0 0 7px #141026;
  color: #f3dca8;
}

.tarot-numeral {
  font-size: max(10px, 9cqi);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.85;
}

.tarot-glyph {
  font-size: 34cqi;
  line-height: 1;
  color: #e9bd72;
  text-shadow: 0 0 22px #f8b45c80;
}

.tarot-title {
  font-size: max(10px, 9cqi);
  font-weight: 700;
  line-height: 1.15;
}

.tarot-back-fallback {
  display: grid;
  place-items: center;
  background:
    repeating-linear-gradient(45deg, #e6b76b14 0 2px, transparent 2px 10px),
    repeating-linear-gradient(-45deg, #e6b76b14 0 2px, transparent 2px 10px),
    radial-gradient(circle at 50% 50%, #4b2f6e, #140f28 70%);
  box-shadow:
    inset 0 0 0 4px #aa8d4f88,
    inset 0 0 0 7px #141026;
}

.tarot-back-star {
  font-size: 38cqi;
  color: #e9bd72;
  text-shadow: 0 0 26px #f8b45c90;
}
</style>
