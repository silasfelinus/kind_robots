<template>
  <div
    class="lair-illustration"
    :class="['scene-' + beat, { 'scene-window': windowOpen }]"
    role="img"
    :aria-label="description"
  >
    <svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="lair-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#130c14" />
          <stop offset=".7" stop-color="#513022" />
          <stop offset="1" stop-color="#ba6d37" />
        </linearGradient>
        <radialGradient id="lair-light">
          <stop offset="0" stop-color="#ffd48b" stop-opacity=".88" />
          <stop offset="1" stop-color="#f7ac46" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="lair-rock" x1="0" y1="0" x2="1" y2=".8">
          <stop stop-color="#643c2c" />
          <stop offset=".5" stop-color="#281e20" />
          <stop offset="1" stop-color="#090d16" />
        </linearGradient>
        <linearGradient id="lair-cloak" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#a94b29" />
          <stop offset="1" stop-color="#5d251e" />
        </linearGradient>
      </defs>

      <rect width="960" height="540" fill="url(#lair-sky)" />
      <circle cx="810" cy="288" r="290" fill="url(#lair-light)" />
      <path d="M0 0H960V150L810 235 0 84Z" fill="#1a1119" />
      <path d="M0 540V85L810 235 960 275 960 540Z" fill="#3d2520" />
      <path d="M0 540L808 325 960 540Z" fill="#8d5935" />
      <path d="M0 0L810 236 695 317 0 175Z" fill="url(#lair-rock)" />
      <path d="M960 0L826 226 820 329 960 540Z" fill="#100e16" />
      <path d="M0 540L0 180 695 317 809 339Z" fill="#24191c" opacity=".7" />
      <path d="M0 510L812 340M0 454L810 340M0 389L810 340" stroke="#b27a50" stroke-opacity=".45" stroke-width="3" />
      <path d="M0 75L784 249M0 132L780 257M0 193L787 272" stroke="#c08a5b" stroke-opacity=".23" stroke-width="5" />
      <path d="M960 70L829 241M960 175L835 264M960 410L838 322" stroke="#ae754c" stroke-opacity=".35" stroke-width="5" />

      <path d="M734 323L734 212Q804 179 855 227L860 340Z" fill="#110d16" stroke="#d89a59" stroke-width="8" />
      <path d="M761 318V238Q808 211 841 240V323" fill="#362525" stroke="#644536" stroke-width="5" />
      <path d="M808 239L808 318" stroke="#ac7045" stroke-width="7" />
      <path d="M781 311L798 289 815 311 830 286" stroke="#f9c478" stroke-width="3" opacity=".4" />
      <path d="M72 437L230 410 406 391 565 370" stroke="#e09b55" stroke-width="4" opacity=".45" />
      <path d="M60 120Q190 90 308 129L286 153Q163 130 73 156Z" fill="#1c1519" opacity=".9" />
      <path d="M30 244L102 199 126 240 188 204 196 268 0 303Z" fill="#3b2925" />
      <path d="M0 487L166 450 201 474 140 510Z" fill="#64402c" />
      <path d="M597 372L653 350 677 373 633 394Z" fill="#7e5136" />

      <g v-if="isBats" class="bat-swarm">
        <g
          v-for="(bat, i) in batPositions"
          :key="i"
          :transform="'translate(' + bat.x + ' ' + bat.y + ') scale(' + bat.scale + ')'"
          class="lair-bat"
          :style="{ animationDelay: i * -0.09 + 's' }"
        >
          <path d="M0 5Q-23 -30 -62 -15Q-48 -4 -47 15Q-30 0 -12 20L0 16 12 20Q30 0 47 15Q48 -4 62 -15Q23 -30 0 5Z" fill="#0e1019" stroke="#d59e66" stroke-width="2" />
          <path d="M-4 9L-10 -1 0 5 10 -1 4 9" fill="#1a1c24" />
          <circle cx="-4" cy="9" r="2" fill="#ff644d" />
          <circle cx="4" cy="9" r="2" fill="#ff644d" />
        </g>
      </g>

      <g transform="translate(310 410)">
        <g class="zuzu-character">
          <ellipse cx="0" cy="37" rx="67" ry="12" fill="#130e13" opacity=".5" />
          <path d="M-29 -49L-35 31 -16 34 -10 -25 9 -25 16 34 37 31 26 -53Z" fill="#282631" />
          <path d="M-41 28L-11 28 -9 40 -43 40ZM13 28L44 28 47 40 14 40Z" fill="#241c20" />
          <path d="M-52 -109Q-75 -68 -52 -27L54 -27Q73 -67 48 -112L15 -129 -27 -126Z" fill="url(#lair-cloak)" stroke="#d07e43" stroke-width="4" />
          <path d="M-45 -55L-28 -47 -10 -55 7 -47 24 -55 43 -47" stroke="#e6a05a" stroke-width="7" fill="none" />
          <path d="M-56 -84L-76 -52 -59 -38 -39 -69M51 -86L76 -55 59 -42 38 -69" fill="#65332b" stroke="#bd7951" stroke-width="5" />
          <path d="M-52 -47L50 -43" stroke="#f5a64f" stroke-width="9" />
          <path d="M-3 -125L47 -191" stroke="#33272a" stroke-width="15" stroke-linecap="round" />
          <path d="M40 -175L69 -204" stroke="#e9b66b" stroke-width="8" stroke-linecap="round" />
          <path d="M32 -174L48 -157" stroke="#f6ba64" stroke-width="9" stroke-linecap="round" />
          <circle cx="-47" cy="-159" r="26" fill="#a6a6a2" stroke="#49494e" stroke-width="7" />
          <circle cx="46" cy="-159" r="26" fill="#a6a6a2" stroke="#49494e" stroke-width="7" />
          <circle cx="-47" cy="-159" r="12" fill="#d68f85" />
          <circle cx="46" cy="-159" r="12" fill="#d68f85" />
          <ellipse cx="0" cy="-157" rx="49" ry="47" fill="#b8b8ad" stroke="#47464a" stroke-width="5" />
          <ellipse cx="-19" cy="-156" rx="8" ry="5" fill="#28252a" />
          <ellipse cx="18" cy="-156" rx="8" ry="5" fill="#28252a" />
          <ellipse cx="0" cy="-137" rx="15" ry="22" fill="#4b4448" />
          <path d="M-13 -115Q0 -107 13 -115" stroke="#30282c" stroke-width="3" fill="none" />
          <path d="M-85 -183Q-6 -232 76 -181L103 -162Q2 -149 -102 -162Z" fill="#a2773c" stroke="#f0bb68" stroke-width="7" />
          <path d="M-62 -186Q-5 -234 58 -185" stroke="#ecca7c" stroke-width="6" fill="none" />
          <path d="M-80 -171Q0 -161 87 -171" stroke="#5b3d29" stroke-width="4" fill="none" />
        </g>
      </g>
      <g v-if="beat === 'attack'" class="lair-impact">
        <path d="M223 170L267 212 242 138 313 175 333 102 359 180 417 134 395 216 459 210 393 254 428 318 355 276 316 342 294 264 229 290 268 237Z" fill="#e85230" opacity=".72" />
        <path d="M278 147L311 208M380 158L354 213M254 281L306 249" stroke="#ffe1a3" stroke-width="12" />
      </g>
      <g class="lair-dust">
        <circle cx="205" cy="432" r="6" fill="#e1a166" />
        <circle cx="268" cy="419" r="9" fill="#e1a166" />
        <circle cx="373" cy="446" r="5" fill="#e1a166" />
      </g>
    </svg>
    <div class="lair-illustration-caption">
      <span class="lair-caption-title">{{ heading }}</span>
      <span class="lair-caption-subtitle">{{ subtitle }}</span>
    </div>
    <div v-if="beat === 'moment' && windowOpen" class="lair-cue" aria-hidden="true">
      ↓ DUCK!
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sceneId: string
  windowOpen?: boolean
}>()

const beat = computed(() => {
  if (props.sceneId === 'bat-opening') return 'opening'
  if (props.sceneId === 'bat-horde') return 'moment'
  if (props.sceneId === 'bat-duck') return 'duck'
  if (props.sceneId === 'bat-attack') return 'attack'
  if (props.sceneId === 'bat-escape') return 'escape'
  return 'gulch'
})
const isBats = computed(() => beat.value !== 'gulch')
const heading = computed(() => ({
  opening: 'THE NARROW PASSAGE',
  moment: 'THE BAT HORDE',
  duck: 'BELOW THEIR WINGS',
  attack: 'A VERY BAD EVENING',
  escape: 'BEYOND THE SWARM',
  gulch: 'THE DRY GULCH',
})[beat.value])
const subtitle = computed(() => ({
  opening: 'Zuzu moves quietly into the darkness.',
  moment: 'Something stirs above. Press DOWN when the bats swoop.',
  duck: 'Zuzu drops below the swarm.',
  attack: 'The horde catches him. The corridor remembers.',
  escape: 'He crawls into the opening beyond the bats.',
  gulch: 'The illustrated film is awaiting its first rendered clips.',
})[beat.value])
const description = computed(() => heading.value + '. ' + subtitle.value)
const batPositions = [
  { x: 0, y: 0, scale: 1.1 },
  { x: 120, y: -55, scale: 0.8 },
  { x: 245, y: 28, scale: 1.2 },
  { x: 380, y: -30, scale: 0.9 },
  { x: 500, y: 65, scale: 1.4 },
  { x: 615, y: -15, scale: 0.75 },
  { x: 740, y: 40, scale: 1.1 },
]
</script>

<style scoped>
.lair-illustration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1d1319;
  color: #fff0ce;
}
.lair-illustration svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.zuzu-character {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: lair-walk .57s ease-in-out infinite alternate;
}
.bat-swarm {
  transform: translate(850px, 165px);
  animation: lair-swarm 4s linear both;
}
.lair-bat {
  transform-box: fill-box;
  transform-origin: center;
  animation: lair-flap .2s ease-in-out infinite alternate;
}
.scene-opening .bat-swarm { opacity: 0; }
.scene-duck .zuzu-character { animation: lair-duck 3.6s ease-in-out forwards; }
.scene-escape .zuzu-character { animation: lair-escape 3.2s ease-in-out forwards; }
.scene-attack .zuzu-character { animation: lair-fall .95s ease-in forwards; }
.scene-duck .bat-swarm { animation: lair-swarm 3.6s linear both; }
.scene-escape .bat-swarm { opacity: .25; }
.scene-attack .bat-swarm { animation: lair-attack .85s ease-in-out infinite alternate; }
.lair-impact { transform-origin: 330px 225px; animation: lair-impact .4s ease-out 3; }
.lair-dust { animation: lair-dust 1.6s ease-in-out infinite alternate; }
.lair-illustration-caption {
  position: absolute;
  left: 1rem;
  bottom: .75rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .15rem;
  text-shadow: 0 2px 5px #0b090d;
  pointer-events: none;
}
.lair-caption-title {
  font: 900 clamp(.75rem, 1.5vw, 1.25rem) Georgia, serif;
  letter-spacing: .15em;
  color: #ffcc81;
}
.lair-caption-subtitle {
  font: 600 clamp(.65rem, 1.25vw, .95rem) system-ui, sans-serif;
  color: #ffebce;
}
.lair-cue {
  position: absolute;
  top: 20%;
  right: 11%;
  font: 900 clamp(1.2rem, 3.5vw, 3rem) system-ui, sans-serif;
  color: #fff8d5;
  text-shadow: 0 0 22px #ff8b2e, 0 3px 4px #180e16;
  animation: lair-cue-pulse .55s ease-in-out infinite alternate;
  pointer-events: none;
}
.scene-window { box-shadow: inset 0 0 0 5px #ffb747; }
@keyframes lair-walk {
  from { transform: rotate(-2deg) translateY(2px); }
  to { transform: rotate(2deg) translateY(-9px); }
}
@keyframes lair-swarm {
  from { transform: translate(960px, 145px); }
  to { transform: translate(-820px, 180px); }
}
@keyframes lair-flap {
  from { transform: scaleY(.56) rotate(-6deg); }
  to { transform: scaleY(1.25) rotate(6deg); }
}
@keyframes lair-duck {
  0% { transform: translateY(0) scale(1); }
  18% { transform: translateY(52px) scale(1.2, .52); }
  75% { transform: translate(40px, 55px) scale(1.2, .52); }
  100% { transform: translate(90px, 58px) scale(1.1, .55); }
}
@keyframes lair-escape {
  0% { transform: translate(90px, 58px) scale(1.1, .55); }
  55% { transform: translate(310px, 0) scale(.73); }
  100% { transform: translate(505px, -65px) scale(.31); }
}
@keyframes lair-fall {
  0% { transform: rotate(0) translate(0, 0); }
  35% { transform: rotate(-18deg) translate(-16px, -35px); }
  100% { transform: rotate(95deg) translate(38px, 70px); }
}
@keyframes lair-attack {
  from { transform: translate(290px, 125px) rotate(-8deg); }
  to { transform: translate(170px, 230px) rotate(14deg); }
}
@keyframes lair-impact {
  from { opacity: 1; transform: scale(.7); }
  to { opacity: 0; transform: scale(1.4); }
}
@keyframes lair-dust {
  from { transform: translateY(0); opacity: .45; }
  to { transform: translateY(-15px); opacity: .15; }
}
@keyframes lair-cue-pulse {
  from { opacity: .65; transform: scale(.96); }
  to { opacity: 1; transform: scale(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .lair-bat, .lair-dust, .lair-cue { animation: none; }
  .zuzu-character { animation: none; }
  .scene-moment .bat-swarm { animation-duration: 4s; }
  .scene-duck .zuzu-character { animation: lair-duck 3.6s linear forwards; }
  .scene-escape .zuzu-character { animation: lair-escape 3.2s linear forwards; }
  .scene-attack .zuzu-character { animation: lair-fall .95s linear forwards; }
}
</style>
