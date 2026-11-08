<template>
  <div
    v-if="moment"
    :key="moment.key"
    class="scx"
    :class="[
      'scx-' + moment.crew,
      'scx-' + moment.grade,
      'scx-' + moment.kind,
      'scx-effect-' + moment.effect,
      'scx-' + moment.side,
    ]"
    :style="{ '--lane-x': ((moment.lane + 0.5) / 5) * 100 + '%' }"
    data-testid="clash-spectacle"
    aria-hidden="true"
  >
    <span class="scx-wash" />
    <span class="scx-lane" />
    <span class="scx-ring" />
    <span class="scx-particles">
      <i v-for="n in 10" :key="n" :style="{ '--spark': n }" />
    </span>
    <div class="scx-announcement">
      <div
        v-if="moment.cardId || moment.grade !== 'flash'"
        class="scx-portrait"
      >
        <SlimeCityArtwork
          :image-id="
            moment.cardId
              ? slimeArtId('cards', moment.cardId)
              : slimeArtId('crews', moment.crew)
          "
          :alt="moment.title"
          :fallback="moment.kind === 'victory' ? '★' : '✦'"
          compact
        />
        <span class="scx-portrait-glare" />
      </div>
      <div class="scx-copy">
        <small>{{ moment.eyebrow }}</small>
        <strong>{{ moment.title }}</strong>
        <p v-if="moment.grade !== 'flash'">{{ moment.detail }}</p>
      </div>
    </div>
  </div>
  <span v-else class="sr-only" />
</template>

<script setup lang="ts">
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import type { ClashSpectacle } from '~/utils/slimeCity/clashSpectacle'

defineProps<{ moment: (ClashSpectacle & { key: number }) | null }>()
</script>

<style scoped>
.scx {
  --fx: #fff178;
  --fx-soft: #f552a4;
  position: absolute;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
  color: #fffdf4;
}
.scx-catgirls {
  --fx: #72fff4;
  --fx-soft: #f266ef;
}
.scx-bloodfairies {
  --fx: #ff70ed;
  --fx-soft: #bb66ff;
}
.scx-ironjaw {
  --fx: #c4ff62;
  --fx-soft: #ffad43;
}
.scx-riot {
  --fx: #ffcf40;
  --fx-soft: #ff4d5e;
}
.scx-undertow {
  --fx: #61dbff;
  --fx-soft: #6176ff;
}
.scx-exchange {
  --fx: #ffdc64;
  --fx-soft: #6dff9d;
}
.scx-mercenary {
  --fx: #e5f8ed;
  --fx-soft: #9bd9ff;
}
.scx-wash {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(
      ellipse at var(--lane-x) 55%,
      var(--fx-soft),
      transparent 37%
    ),
    radial-gradient(ellipse at 50% 50%, var(--fx), transparent 64%);
  mix-blend-mode: screen;
  opacity: 0;
  animation: scx-wash 0.88s ease-out both;
}
.scx-legend .scx-wash {
  animation-duration: 1.6s;
}
.scx-lane {
  position: absolute;
  left: var(--lane-x);
  top: 7%;
  bottom: 7%;
  width: 20%;
  transform: translateX(-50%) skewX(-6deg) scaleX(0.4);
  opacity: 0;
  border-inline: 2px solid var(--fx);
  box-shadow:
    inset 0 0 24px var(--fx),
    0 0 30px var(--fx-soft);
  background: linear-gradient(90deg, transparent, var(--fx-soft), transparent);
  animation: scx-lane 0.72s cubic-bezier(0.1, 0.8, 0.4, 1) both;
}
.scx-ring {
  position: absolute;
  left: var(--lane-x);
  top: 49%;
  width: 25%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%) scale(0.15);
  border: clamp(2px, 0.6vw, 7px) solid var(--fx);
  border-radius: 50%;
  box-shadow:
    0 0 25px var(--fx),
    inset 0 0 30px var(--fx-soft);
  animation: scx-ring 0.7s ease-out both;
}
.scx-particles {
  position: absolute;
  left: var(--lane-x);
  top: 49%;
}
.scx-particles i {
  position: absolute;
  width: clamp(4px, 0.65vw, 10px);
  height: clamp(10px, 1.8vw, 25px);
  border-radius: 0.2rem;
  background: linear-gradient(var(--fx), var(--fx-soft));
  box-shadow: 0 0 12px var(--fx-soft);
  opacity: 0;
  animation: scx-particle 0.95s ease-out both;
  transform: rotate(calc(var(--spark) * 36deg)) translateY(0);
}
.scx-legend .scx-particles i {
  animation-duration: 1.4s;
}
.scx-announcement {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  align-items: center;
  gap: clamp(0.4rem, 2.4vw, 1.2rem);
  width: max-content;
  max-width: 84%;
  min-height: 3.3rem;
  border: 1px solid var(--fx);
  border-radius: 0.8rem;
  padding: 0.3rem 1rem 0.3rem 0.3rem;
  background:
    linear-gradient(115deg, #071823f5, #102833f1 65%, #07131def), #091b25;
  box-shadow:
    0 10px 30px #000b,
    0 0 0 2px #05131be0,
    0 0 25px var(--fx-soft);
  transform: translate(-50%, -50%);
  animation: scx-card 0.84s cubic-bezier(0.2, 0.85, 0.22, 1) both;
}
.scx-portrait {
  width: clamp(3.5rem, 10vw, 6.5rem);
  aspect-ratio: 2 / 3;
  position: relative;
  flex: none;
  overflow: hidden;
  border-radius: 0.55rem;
  border: 2px solid var(--fx);
  box-shadow: 0 0 18px var(--fx-soft);
  transform: rotate(-5deg);
}
.scx-portrait :deep(.slime-art),
.scx-portrait :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scx-portrait-glare {
  position: absolute;
  inset: -30%;
  transform: translateX(-120%) rotate(28deg);
  background: linear-gradient(
    90deg,
    transparent 35%,
    #ffffff9e 50%,
    transparent 65%
  );
  animation: scx-shine 1s 0.13s ease-out both;
}
.scx-copy {
  min-width: 0;
  max-width: 23rem;
  text-shadow: 0 2px 5px #000;
}
.scx-copy small {
  display: block;
  margin-bottom: 0.12rem;
  color: var(--fx);
  font-size: clamp(0.54rem, 1.1vw, 0.7rem);
  letter-spacing: 0.15em;
  font-weight: 950;
}
.scx-copy strong {
  display: block;
  line-height: 0.96;
  font-size: clamp(0.9rem, 3vw, 2.25rem);
  font-weight: 1000;
  letter-spacing: 0.035em;
  text-transform: uppercase;
  text-wrap: balance;
}
.scx-copy p {
  margin: 0.4rem 0 0;
  color: #eef9f7;
  font-size: clamp(0.65rem, 1.2vw, 0.88rem);
  line-height: 1.25;
}
.scx-flash .scx-announcement {
  top: 18%;
  min-height: 2.2rem;
  max-width: 69%;
  animation-duration: 0.7s;
}
.scx-flash .scx-portrait {
  width: clamp(2.2rem, 5vw, 3.2rem);
  aspect-ratio: 1;
}
.scx-flash .scx-copy strong {
  font-size: clamp(0.72rem, 1.8vw, 1.2rem);
}
.scx-feature .scx-announcement {
  animation-duration: 1.15s;
}
.scx-legend .scx-announcement {
  min-height: 6.5rem;
  border-width: 3px;
  animation: scx-card-legend 1.55s cubic-bezier(0.14, 0.77, 0.3, 1) both;
}
.scx-legend .scx-portrait {
  width: clamp(5.5rem, 15vw, 9rem);
  transform: rotate(-7deg);
  box-shadow:
    0 0 18px var(--fx),
    0 0 40px var(--fx-soft);
}
.scx-victory .scx-announcement {
  border-radius: 1.4rem;
  background: radial-gradient(ellipse at top left, #385542, #081827 76%);
}
.scx-enemy .scx-announcement {
  border-left: 4px solid #ff7894;
}
.scx-effect-heal .scx-ring {
  border-color: #bcffab;
  border-radius: 35%;
  box-shadow:
    0 0 30px #83ffbf,
    inset 0 0 35px #baffad;
}
.scx-effect-heal .scx-particles i {
  height: clamp(5px, 1vw, 12px);
  width: clamp(5px, 1vw, 12px);
  border-radius: 50%;
  background: #a9ffb3;
}
.scx-effect-blast .scx-ring {
  border-style: dashed;
  border-width: clamp(5px, 0.9vw, 12px);
  border-radius: 20%;
  filter: drop-shadow(0 0 16px #ff774a);
}
.scx-effect-blast .scx-particles i {
  width: clamp(8px, 1.6vw, 20px);
  border-radius: 15%;
  background: linear-gradient(#fff6a4, #ff533b);
}
.scx-effect-trap .scx-lane {
  border-style: dashed;
  border-color: #ff6cc9;
  background: repeating-linear-gradient(
    135deg,
    #f55b8d6e 0 8px,
    #070d1955 8px 18px
  );
}
.scx-effect-control .scx-ring {
  border-style: double;
  border-width: clamp(7px, 1vw, 14px);
  border-color: #7cbcff;
}
.scx-effect-gear .scx-ring {
  border-radius: 24%;
  transform: translate(-50%, -50%) rotate(45deg) scale(0.15);
}
.scx-effect-summon .scx-lane {
  background: linear-gradient(0deg, var(--fx-soft), transparent 65%);
  animation: scx-rise 0.9s ease-out both;
}
.scx-effect-power .scx-wash {
  opacity: 0.55;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent,
    var(--fx-soft),
    transparent,
    var(--fx),
    transparent
  );
}
@keyframes scx-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 20%) scaleX(0.25);
  }
  24% {
    opacity: 0.65;
    transform: translate(-50%, 0) scaleX(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -15%) scaleX(1.25);
  }
}
@keyframes scx-wash {
  0% {
    opacity: 0;
    transform: scale(0.75);
  }
  15% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}
@keyframes scx-lane {
  0% {
    opacity: 0;
    transform: translateX(-50%) skewX(-6deg) scaleX(0.3);
  }
  24% {
    opacity: 0.55;
    transform: translateX(-50%) skewX(6deg) scaleX(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) skewX(0) scaleX(1.2);
  }
}
@keyframes scx-ring {
  0% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(0.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(3);
  }
}
@keyframes scx-particle {
  0% {
    opacity: 1;
    transform: rotate(calc(var(--spark) * 36deg)) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotate(calc(var(--spark) * 36deg)) translateY(-14vmin) scale(0.3);
  }
}
@keyframes scx-card {
  0% {
    opacity: 0;
    transform: translate(-50%, -20%) scale(0.55) rotate(-8deg);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.06) rotate(1deg);
  }
  65% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -60%) scale(1.03);
  }
}
@keyframes scx-card-legend {
  0% {
    opacity: 0;
    transform: translate(-50%, -22%) scale(0.4) rotate(-12deg);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.12) rotate(2deg);
  }
  34% {
    transform: translate(-50%, -50%) scale(1) rotate(0);
  }
  76% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -54%) scale(1.08);
  }
}
@keyframes scx-shine {
  0% {
    transform: translateX(-120%) rotate(28deg);
  }
  100% {
    transform: translateX(140%) rotate(28deg);
  }
}
@media (max-width: 520px) {
  .scx-announcement {
    max-width: 91%;
    padding-right: 0.45rem;
    gap: 0.45rem;
  }
  .scx-legend .scx-portrait {
    width: 4.6rem;
  }
  .scx-legend .scx-copy strong {
    font-size: 1.25rem;
  }
  .scx-copy p {
    font-size: 0.63rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scx-wash,
  .scx-lane,
  .scx-ring,
  .scx-particles i,
  .scx-portrait-glare {
    display: none;
    animation: none;
  }
  .scx-announcement,
  .scx-feature .scx-announcement,
  .scx-legend .scx-announcement {
    animation: scx-static 0.6s steps(1, end) both;
  }
}
@keyframes scx-static {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%);
  }
}
</style>
