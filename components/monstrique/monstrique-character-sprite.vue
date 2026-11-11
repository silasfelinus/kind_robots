<template>
  <div
    class="mq-sprite"
    :class="[
      'is-' + (mood ?? 'neutral'),
      {
        'is-ghost': rig.ghost && !living,
        'is-talking': talking,
        'is-flipped': facing === 'left',
      },
    ]"
    :style="{ aspectRatio: bust ? '1' : undefined }"
    :data-character="model.id"
    role="img"
    :aria-label="model.name"
  >
    <svg
      :viewBox="viewBox"
      class="size-full"
      :class="bust ? 'overflow-hidden' : 'overflow-visible'"
    >
      <ellipse
        v-if="!rig.ghost || living"
        cx="50"
        cy="216"
        :rx="torsoWidth * 0.75"
        ry="4"
        fill="#000"
        opacity=".35"
      />
      <path
        v-if="rig.prop === 'cape'"
        :d="`M${50 - torsoWidth / 2 - 4} ${neckY - 6} L${50 - torsoWidth} ${hipY + 46} L${50 + torsoWidth} ${hipY + 46} L${50 + torsoWidth / 2 + 4} ${neckY - 6} Z`"
        :fill="rig.accent"
        stroke="#000"
        stroke-width="1.5"
      />
      <path
        v-if="
          rig.hairStyle === 'snout' ||
          rig.hairStyle === 'panther' ||
          rig.hairStyle === 'wolf'
        "
        :d="`M${50 + torsoWidth / 2 - 4} ${hipY + 12} Q${50 + torsoWidth + 18} ${hipY + 30} ${50 + torsoWidth + 10} ${hipY - 8}`"
        :stroke="rig.skin"
        :stroke-width="rig.hairStyle === 'snout' ? 12 : 4"
        stroke-linecap="round"
        fill="none"
      />
      <g v-if="!rig.ghost || living">
        <rect
          :x="50 - legGap - legWidth"
          :y="hipY"
          :width="legWidth"
          :height="214 - hipY"
          rx="3"
          :fill="legColor"
        />
        <rect
          :x="50 + legGap"
          :y="hipY"
          :width="legWidth"
          :height="214 - hipY"
          rx="3"
          :fill="legColor"
        />
        <ellipse
          :cx="50 - legGap - legWidth / 2 - 2"
          cy="214"
          :rx="legWidth * 0.9"
          ry="3.5"
          fill="#1c1820"
        />
        <ellipse
          :cx="50 + legGap + legWidth / 2 + 2"
          cy="214"
          :rx="legWidth * 0.9"
          ry="3.5"
          fill="#1c1820"
        />
      </g>
      <path
        v-else
        :d="`M${50 - torsoWidth / 2} ${hipY - 4} Q50 ${hipY + 70} ${50 + 4} 214 Q${50 + torsoWidth / 2 + 6} ${hipY + 40} ${50 + torsoWidth / 2} ${hipY - 4} Z`"
        :fill="rig.outfit"
        opacity=".85"
      />
      <ellipse
        v-if="rig.hunch"
        :cx="50 - torsoWidth * 0.35"
        :cy="neckY + 6"
        :rx="torsoWidth * 0.55"
        :ry="torsoWidth * 0.5"
        fill="#7d7884"
        stroke="#000"
        stroke-opacity=".5"
      />
      <path
        :d="torsoPath"
        :fill="rig.outfit"
        stroke="#000"
        stroke-opacity=".55"
        stroke-width="1.5"
      />
      <text
        v-if="rig.shirt"
        x="50"
        :y="neckY + (hipY - neckY) * 0.45"
        text-anchor="middle"
        font-size="4.2"
        font-weight="900"
        fill="#fff"
        :textLength="torsoWidth * 0.95"
        lengthAdjust="spacingAndGlyphs"
      >
        {{ rig.shirt }}
      </text>
      <path
        :d="armPath"
        :stroke="rig.outfit"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
      />
      <circle :cx="handLeft.x" :cy="handLeft.y" r="3.6" :fill="handColor" />
      <circle :cx="handRight.x" :cy="handRight.y" r="3.6" :fill="handColor" />

      <g v-if="rig.prop === 'camera'">
        <path
          :d="`M${50 - torsoWidth / 2 + 2} ${neckY + 2} L${50 + 6} ${neckY + 24}`"
          stroke="#111"
          stroke-width="1.5"
        />
        <rect
          :x="50 - 2"
          :y="neckY + 20"
          width="18"
          height="12"
          rx="2"
          fill="#222"
        />
        <circle
          :cx="50 + 7"
          :cy="neckY + 26"
          r="4.5"
          fill="#6b7f9a"
          stroke="#eee"
          stroke-width="1"
        />
        <rect :x="50 + 9" :y="neckY + 15" width="6" height="5" fill="#ddd" />
      </g>
      <g v-else-if="rig.prop === 'long-lens'">
        <rect
          :x="handRight.x - 4"
          :y="handRight.y - 7"
          width="10"
          height="9"
          rx="2"
          fill="#222"
        />
        <rect
          :x="handRight.x + 5"
          :y="handRight.y - 6"
          width="26"
          height="7"
          rx="2"
          fill="#3a3a3a"
        />
      </g>
      <g v-else-if="rig.prop === 'contract'">
        <rect
          :x="handRight.x - 2"
          :y="handRight.y - 18"
          width="12"
          height="16"
          fill="#fff"
          transform-origin="center"
        />
        <rect
          :x="handRight.x + 2"
          :y="handRight.y - 16"
          width="12"
          height="16"
          fill="#eef"
        />
      </g>
      <g v-else-if="rig.prop === 'ice-bucket'">
        <path
          :d="`M${handRight.x - 6} ${handRight.y} h14 l-2 12 h-10 z`"
          fill="#c8ced6"
          stroke="#5c636b"
        />
      </g>
      <g v-else-if="rig.prop === 'remote'">
        <rect
          :x="handRight.x - 2"
          :y="handRight.y - 10"
          width="5"
          height="12"
          rx="1.5"
          fill="#222"
        />
      </g>
      <g v-else-if="rig.prop === 'wrench'">
        <path
          :d="`M${handRight.x} ${handRight.y} l8 -14`"
          stroke="#9aa3ad"
          stroke-width="3"
        />
      </g>
      <g v-else-if="rig.prop === 'mic'">
        <path
          :d="`M${handRight.x} ${handRight.y} l2 -10`"
          stroke="#333"
          stroke-width="2.5"
        />
        <circle
          :cx="handRight.x + 2"
          :cy="handRight.y - 12"
          r="3.5"
          fill="#888"
        />
      </g>
      <g v-else-if="rig.prop === 'pen'">
        <path
          :d="`M${handRight.x} ${handRight.y} l6 -12`"
          stroke="#d4a72c"
          stroke-width="2"
        />
      </g>
      <g v-else-if="rig.prop === 'stole'">
        <ellipse
          cx="50"
          :cy="neckY + 3"
          :rx="torsoWidth / 2 + 6"
          ry="6"
          fill="#f6f1e6"
          stroke="#cfc7b5"
        />
      </g>
      <g v-if="rig.prop === 'cape'">
        <path
          :d="`M${50 - headR - 2} ${neckY + 2} L${50 - headR - 6} ${neckY - headR * 1.1} L50 ${neckY} L${50 + headR + 6} ${neckY - headR * 1.1} L${50 + headR + 2} ${neckY + 2} Z`"
          fill="#1b0f1d"
          stroke="#000"
          stroke-width="1"
        />
      </g>

      <rect :x="47" :y="neckY - 4" width="6" height="8" :fill="rig.skin" />
      <rect
        v-if="rig.neckBandage"
        x="51"
        :y="neckY - 3"
        width="4.5"
        height="3.2"
        rx="0.8"
        fill="#e7c3a0"
        stroke="#b08868"
        stroke-width=".5"
        :transform="`rotate(-18 53 ${neckY - 1.5})`"
      />

      <g
        :transform="`translate(${rig.hunch ? 54 : 50} ${headCy + (rig.hunch ? headR * 0.35 : 0)})`"
      >
        <path
          v-if="rig.hairStyle === 'snout'"
          :d="`M${-headR * 0.4} ${-headR * 0.1} L${headR * 2.3} ${headR * 0.05} Q${headR * 2.5} ${headR * 0.4} ${headR * 2.2} ${headR * 0.55} L${-headR * 0.2} ${headR * 0.7} Z`"
          :fill="rig.skin"
          stroke="#8f8a7d"
          stroke-width="1.2"
        />
        <ellipse
          v-if="rig.hairStyle === 'wolf' || rig.hairStyle === 'panther'"
          :cx="headR * 0.55"
          :cy="headR * 0.35"
          :rx="headR * 0.6"
          :ry="headR * 0.38"
          :fill="rig.skin"
          stroke="#000"
          stroke-opacity=".4"
        />
        <circle
          :r="headR"
          :fill="rig.skin"
          stroke="#000"
          stroke-opacity=".5"
          stroke-width="1.2"
        />

        <path
          v-if="rig.hairStyle === 'bob'"
          :d="`M${-headR * 1.12} ${headR * 0.55} Q${-headR * 1.2} ${-headR * 1.25} 0 ${-headR * 1.15} Q${headR * 1.2} ${-headR * 1.25} ${headR * 1.12} ${headR * 0.55} L${headR * 0.7} ${headR * 0.5} Q${headR * 0.6} ${-headR * 0.45} ${-headR * 0.2} ${-headR * 0.55} Q${-headR * 0.75} ${-headR * 0.2} ${-headR * 0.7} ${headR * 0.5} Z`"
          :fill="rig.hair"
        />
        <g v-else-if="rig.hairStyle === 'curls'">
          <circle
            v-for="n in 5"
            :key="n"
            :cx="(n - 3) * headR * 0.42"
            :cy="-headR * 0.85"
            :r="headR * 0.32"
            :fill="rig.hair"
            stroke="#c75a8a"
            stroke-width="1"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'updo'">
          <ellipse
            cx="0"
            :cy="-headR * 1.05"
            :rx="headR * 0.6"
            :ry="headR * 0.45"
            :fill="rig.hair"
          />
          <path
            :d="`M${-headR} 0 Q${-headR} ${-headR * 1.1} 0 ${-headR} Q${headR} ${-headR * 1.1} ${headR} 0 Q${headR * 0.6} ${-headR * 0.6} 0 ${-headR * 0.55} Q${-headR * 0.6} ${-headR * 0.6} ${-headR} 0 Z`"
            :fill="rig.hair"
          />
        </g>
        <path
          v-else-if="rig.hairStyle === 'scarf'"
          :d="`M${-headR * 1.15} ${headR * 0.3} Q${-headR * 1.1} ${-headR * 1.3} 0 ${-headR * 1.2} Q${headR * 1.1} ${-headR * 1.3} ${headR * 1.15} ${headR * 0.3} L${headR * 0.3} ${headR * 1.3} L${-headR * 0.3} ${headR * 1.3} Z M${-headR * 0.75} ${-headR * 0.1} Q0 ${-headR * 0.8} ${headR * 0.75} ${-headR * 0.1} L${headR * 0.65} ${headR * 0.75} L${-headR * 0.65} ${headR * 0.75} Z`"
          fill-rule="evenodd"
          :fill="rig.hair"
        />
        <g v-else-if="rig.hairStyle === 'bandage'">
          <path
            :d="`M${-headR * 1.25} ${headR * 0.8} L${-headR * 1.1} ${-headR * 1.1} L${headR * 1.1} ${-headR * 1.1} L${headR * 1.25} ${headR * 0.8} L${headR * 0.8} ${headR * 0.6} L${headR * 0.7} ${-headR * 0.5} L${-headR * 0.7} ${-headR * 0.5} L${-headR * 0.8} ${headR * 0.6} Z`"
            :fill="rig.hair"
          />
          <path
            v-for="n in 4"
            :key="n"
            :d="`M${-headR * 1.15} ${-headR * 1.1 + n * headR * 0.45} h${headR * 0.35}`"
            stroke="#d4a72c"
            stroke-width="2"
          />
          <path
            v-for="n in 4"
            :key="'r' + n"
            :d="`M${headR * 0.8} ${-headR * 1.1 + n * headR * 0.45} h${headR * 0.35}`"
            stroke="#d4a72c"
            stroke-width="2"
          />
          <path
            :d="`M${-headR * 0.7} ${headR * 0.2} h${headR * 1.4} M${-headR * 0.75} ${headR * 0.55} h${headR * 1.5}`"
            stroke="#b8a882"
            stroke-width="1.2"
          />
        </g>
        <path
          v-else-if="rig.hairStyle === 'comb-over'"
          :d="`M${-headR * 0.9} ${-headR * 0.45} Q${-headR * 0.2} ${-headR * 1.25} ${headR * 0.95} ${-headR * 0.5}`"
          :stroke="rig.hair"
          stroke-width="2.4"
          fill="none"
        />
        <g v-else-if="rig.hairStyle === 'cap'">
          <path
            :d="`M${-headR} ${-headR * 0.25} Q0 ${-headR * 1.6} ${headR} ${-headR * 0.25} Z`"
            :fill="rig.outfit"
            stroke="#000"
            stroke-opacity=".5"
          />
          <path
            :d="`M${headR * 0.2} ${-headR * 0.3} h${headR * 1.2}`"
            :stroke="rig.outfit"
            stroke-width="3"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'snout'">
          <path
            :d="`M${-headR * 0.7} ${-headR * 0.9} l${headR * 0.3} ${-headR * 0.55} l${headR * 0.25} ${headR * 0.4} l${headR * 0.25} ${-headR * 0.5} l${headR * 0.25} ${headR * 0.5} l${headR * 0.3} ${-headR * 0.4} l${headR * 0.15} ${headR * 0.55} Z`"
            :fill="rig.accent"
            stroke="#b9a64a"
          />
          <path
            :d="`M${headR * 0.2} ${headR * 0.6} Q${headR} ${headR * 0.75} ${headR * 2.1} ${headR * 0.55}`"
            stroke="#d6336c"
            stroke-width="2.6"
            fill="none"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'wolf' || rig.hairStyle === 'panther'">
          <path
            :d="`M${-headR * 0.85} ${-headR * 0.4} L${-headR * 0.7} ${-headR * (rig.hairStyle === 'wolf' ? 1.9 : 1.45)} L${-headR * 0.15} ${-headR * 0.85} Z M${headR * 0.15} ${-headR * 0.85} L${headR * 0.7} ${-headR * (rig.hairStyle === 'wolf' ? 1.9 : 1.45)} L${headR * 0.85} ${-headR * 0.4} Z`"
            :fill="rig.hair"
          />
          <path
            v-if="rig.hairStyle === 'wolf'"
            :d="`M${-headR * 1.1} ${headR * 0.5} L${-headR * 1.3} ${-headR * 0.2} L${-headR * 0.9} ${-headR * 0.6} L${-headR * 0.5} ${-headR * 1.1} L0 ${-headR * 0.8} L${headR * 0.5} ${-headR * 1.15} L${headR * 0.9} ${-headR * 0.6} L${headR * 1.3} ${-headR * 0.2} L${headR * 1.1} ${headR * 0.5} L${headR * 0.8} 0 L${-headR * 0.8} 0 Z`"
            :fill="rig.hair"
          />
          <circle
            :cx="headR * 1.08"
            :cy="headR * 0.25"
            :r="headR * 0.14"
            fill="#111"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'beehive'">
          <ellipse
            cx="0"
            :cy="-headR * 1.35"
            :rx="headR * 0.85"
            :ry="headR * 1.05"
            :fill="rig.hair"
          />
          <path
            :d="`M${-headR * 0.2} ${-headR * 2.3} q${headR * 0.3} ${headR * 0.6} ${-headR * 0.05} ${headR * 1.4}`"
            :stroke="rig.streak ?? '#fff'"
            stroke-width="2.2"
            fill="none"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'antennae'">
          <ellipse
            :cx="-headR * 0.42"
            :cy="-headR * 0.1"
            :rx="headR * 0.42"
            :ry="headR * 0.5"
            :fill="rig.accent"
          />
          <ellipse
            :cx="headR * 0.42"
            :cy="-headR * 0.1"
            :rx="headR * 0.42"
            :ry="headR * 0.5"
            :fill="rig.accent"
          />
          <path
            :d="`M${-headR * 0.2} ${-headR * 0.85} q${-headR * 0.3} ${-headR * 0.8} ${-headR * 0.7} ${-headR * 0.9} M${headR * 0.2} ${-headR * 0.85} q${headR * 0.3} ${-headR * 0.8} ${headR * 0.7} ${-headR * 0.9}`"
            stroke="#111"
            stroke-width="1.6"
            fill="none"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'frill'">
          <path
            v-for="side in [-1, 1]"
            :key="side"
            :d="`M${side * headR * 0.8} ${-headR * 0.2} l${side * headR * 0.7} ${-headR * 0.5} l${-side * headR * 0.15} ${headR * 0.45} l${side * headR * 0.45} ${headR * 0.05} l${-side * headR * 0.4} ${headR * 0.35} Z`"
            :fill="rig.hair"
          />
        </g>
        <g v-else-if="rig.hairStyle === 'goo'">
          <circle
            v-for="n in 3"
            :key="n"
            :cx="(n - 2) * headR * 0.45"
            :cy="-headR * (0.2 + n * 0.15)"
            :r="headR * 0.12"
            fill="#fff"
            fill-opacity=".45"
          />
        </g>
        <path
          v-if="rig.streak && rig.hairStyle === 'bob'"
          :d="`M${-headR * 0.15} ${-headR * 1.12} Q${-headR * 0.45} ${-headR * 0.6} ${-headR * 0.75} ${headR * 0.3}`"
          :stroke="rig.streak"
          :stroke-width="headR * 0.18"
          stroke-linecap="round"
          fill="none"
        />
        <path
          v-if="rig.hairStyle === 'bob' && model.id === 'iris'"
          :d="`M${headR * 0.15} ${-headR * 0.6} q${headR * 0.35} ${headR * 0.25} ${headR * 0.05} ${headR * 0.6}`"
          :stroke="rig.hair"
          stroke-width="2.4"
          fill="none"
        />

        <g v-if="rig.glasses">
          <circle
            :cx="-headR * 0.36"
            :cy="-headR * 0.05"
            :r="headR * (rig.bigNose ? 0.34 : 0.26)"
            fill="#fff"
            fill-opacity=".85"
            stroke="#111"
            :stroke-width="rig.bigNose ? 2.2 : 1.6"
          />
          <circle
            :cx="headR * 0.36"
            :cy="-headR * 0.05"
            :r="headR * (rig.bigNose ? 0.34 : 0.26)"
            fill="#fff"
            fill-opacity=".85"
            stroke="#111"
            :stroke-width="rig.bigNose ? 2.2 : 1.6"
          />
          <path
            :d="`M${-headR * 0.06} ${-headR * 0.05} h${headR * 0.12}`"
            stroke="#111"
            stroke-width="1.6"
          />
        </g>
        <circle
          :cx="-headR * 0.36"
          :cy="-headR * 0.05"
          :r="eyeR * (rig.hunch ? 1.6 : 1)"
          fill="#111"
        />
        <circle :cx="headR * 0.36" :cy="-headR * 0.05" :r="eyeR" fill="#111" />
        <path
          v-if="mood === 'flirt' || mood === 'smirk'"
          :d="`M${headR * 0.15} ${-headR * 0.3} l${headR * 0.4} ${-headR * 0.08}`"
          stroke="#111"
          stroke-width="1.6"
        />
        <ellipse
          v-if="rig.bigNose"
          cx="0"
          :cy="headR * 0.32"
          :rx="headR * 0.3"
          :ry="headR * 0.26"
          fill="#e39b84"
          stroke="#000"
          stroke-opacity=".45"
        />
        <path
          :d="mouthPath"
          :stroke="mouthColor"
          stroke-width="2"
          :fill="mouthFill"
          stroke-linecap="round"
        />
        <g v-if="rig.prop === 'cape' || model.id === 'draculina'">
          <path
            :d="`M${-headR * 0.18} ${headR * 0.55} l${headR * 0.06} ${headR * 0.18} l${headR * 0.06} ${-headR * 0.18} M${headR * 0.06} ${headR * 0.55} l${headR * 0.06} ${headR * 0.18} l${headR * 0.06} ${-headR * 0.18}`"
            fill="#fff"
            stroke="#fff"
            stroke-width=".8"
          />
        </g>
      </g>

      <g v-if="rig.prop === 'gloves'">
        <circle
          :cx="handLeft.x"
          :cy="handLeft.y"
          r="5"
          fill="#f2d64b"
          stroke="#a88f15"
        />
        <circle
          :cx="handRight.x"
          :cy="handRight.y"
          r="5"
          fill="#f2d64b"
          stroke="#a88f15"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CHARACTER_MODELS,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'

const props = defineProps<{
  character: MonstriqueCharacterId
  mood?: string
  talking?: boolean
  facing?: 'left' | 'right'
  living?: boolean
  bust?: boolean
}>()

const model = computed(() => CHARACTER_MODELS[props.character])
const rig = computed(() => model.value.sprite)
const headR = computed(() => Math.min(34, 100 / rig.value.heads))
const headCy = computed(() => 8 + headR.value)
const viewBox = computed(() => {
  if (!props.bust) return '0 0 100 220'
  const size = headR.value * 3.4
  return `${50 - size / 2} ${headCy.value - size * 0.45} ${size} ${size}`
})
const neckY = computed(() => headCy.value + headR.value + 2)
const hipY = computed(() => neckY.value + (214 - neckY.value) * 0.48)
const torsoWidth = computed(
  () =>
    ({ slim: 24, curvy: 28, stout: 36, scrawny: 18, towering: 40 })[
      rig.value.build
    ],
)
const legWidth = computed(() =>
  rig.value.build === 'towering' ? 11 : rig.value.build === 'stout' ? 9 : 7,
)
const legGap = computed(() => (rig.value.build === 'curvy' ? 1.5 : 2.5))
const legColor = computed(() =>
  model.value.id === 'gavin' || model.value.id === 'iris'
    ? rig.value.skin
    : rig.value.build === 'towering'
      ? rig.value.skin
      : rig.value.accent,
)
const handColor = computed(() =>
  rig.value.prop === 'gloves' || model.value.id === 'marta'
    ? rig.value.accent
    : rig.value.skin,
)
const torsoPath = computed(() => {
  const w = torsoWidth.value
  const top = neckY.value
  const hip = hipY.value
  const flare =
    rig.value.build === 'curvy' || rig.value.build === 'stout' ? 8 : 3
  const skirt =
    model.value.id === 'iris' || rig.value.build === 'curvy' ? 14 : 0
  return `M${50 - w / 2} ${top} Q50 ${top - 4} ${50 + w / 2} ${top} L${50 + w / 2 + flare} ${hip + skirt} L${50 - w / 2 - flare} ${hip + skirt} Z`
})
const raised = computed(
  () =>
    props.mood === 'recoil' ||
    props.mood === 'shock' ||
    rig.value.prop === 'gloves',
)
const handLeft = computed(() =>
  raised.value
    ? { x: 50 - torsoWidth.value / 2 - 10, y: neckY.value - 4 }
    : { x: 50 - torsoWidth.value / 2 - 5, y: hipY.value - 2 },
)
const handRight = computed(() =>
  raised.value && rig.value.prop === 'gloves'
    ? { x: 50 + torsoWidth.value / 2 + 10, y: neckY.value - 4 }
    : { x: 50 + torsoWidth.value / 2 + 6, y: hipY.value - 10 },
)
const armPath = computed(() => {
  const w = torsoWidth.value / 2
  const top = neckY.value + 4
  return `M${50 - w} ${top} L${handLeft.value.x} ${handLeft.value.y} M${50 + w} ${top} L${handRight.value.x} ${handRight.value.y}`
})
const eyeR = computed(() =>
  props.mood === 'shock' || props.mood === 'recoil'
    ? headR.value * 0.12
    : headR.value * 0.08,
)
const mouthPath = computed(() => {
  const r = headR.value
  const y = r * (rig.value.bigNose ? 0.68 : 0.5)
  switch (props.mood) {
    case 'shock':
    case 'recoil':
      return `M${-r * 0.12} ${y} a${r * 0.12} ${r * 0.16} 0 1 0 ${r * 0.24} 0 a${r * 0.12} ${r * 0.16} 0 1 0 ${-r * 0.24} 0`
    case 'laugh':
      return `M${-r * 0.3} ${y - r * 0.05} Q0 ${y + r * 0.4} ${r * 0.3} ${y - r * 0.05} Z`
    case 'annoyed':
    case 'deadpan':
      return `M${-r * 0.25} ${y} h${r * 0.5}`
    case 'smirk':
    case 'flirt':
    case 'scheme':
    case 'sweet':
      return `M${-r * 0.25} ${y} Q${r * 0.05} ${y + r * 0.12} ${r * 0.32} ${y - r * 0.12}`
    default:
      return `M${-r * 0.22} ${y} Q0 ${y + r * 0.14} ${r * 0.22} ${y}`
  }
})
const mouthColor = computed(() =>
  ['iris', 'odette', 'violet', 'draculina', 'albina'].includes(model.value.id)
    ? '#b3182f'
    : '#3a1d1d',
)
const mouthFill = computed(() => (props.mood === 'laugh' ? '#5a1620' : 'none'))
</script>

<style scoped>
.mq-sprite {
  aspect-ratio: 100 / 220;
  transform-origin: 50% 100%;
}
.mq-sprite.is-flipped svg {
  transform: scaleX(-1);
}
.mq-sprite.is-ghost {
  opacity: 0.82;
  filter: drop-shadow(0 0 0.6rem rgb(190 210 255 / 0.75));
  animation: mq-float 3.6s ease-in-out infinite;
}
.mq-sprite.is-talking {
  animation: mq-talk 0.55s ease-in-out infinite alternate;
}
.mq-sprite.is-ghost.is-talking {
  animation:
    mq-float 3.6s ease-in-out infinite,
    mq-talk 0.55s ease-in-out infinite alternate;
}
.mq-sprite.is-recoil {
  transform: rotate(-7deg) translateX(-4%);
}
.mq-sprite.is-shock {
  transform: scaleY(1.04);
}
@keyframes mq-float {
  50% {
    translate: 0 -4%;
  }
}
@keyframes mq-talk {
  to {
    scale: 1.02 0.985;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mq-sprite,
  .mq-sprite.is-ghost,
  .mq-sprite.is-talking {
    animation: none;
  }
}
</style>
