<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,3fr)_minmax(0,1fr)] gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] @3xl:grid-rows-1"
    aria-label="Theme music video"
  >
    <div
      class="cs-frame cs-tv-room relative min-h-0 overflow-hidden"
      aria-label="A haunted living room with an old television"
      data-testid="cs-theme-room"
    >
      <div class="cs-tv-window" aria-hidden="true">
        <div class="cs-tv-moon" />
        <div class="cs-tv-window-cross" />
      </div>
      <div class="cs-tv-portrait" aria-hidden="true">
        <span />
      </div>
      <div class="cs-tv-lamp" aria-hidden="true" />
      <div class="cs-tv-floor" aria-hidden="true" />

      <div class="cs-tv-set">
        <div class="cs-tv-aerial" aria-hidden="true" />
        <div class="cs-tv-cabinet">
          <div class="cs-tv-screen">
            <video
              class="cs-tv-video"
              src="/crystal-street/video/theme.mp4"
              poster="/crystal-street/video/theme-poster.webp"
              aria-label="Terrors on Crystal Street theme trailer"
              controls
              playsinline
              preload="none"
              data-testid="cs-theme-video"
            />
            <span class="cs-tv-reflection" aria-hidden="true" />
          </div>
          <div class="cs-tv-control-panel" aria-hidden="true">
            <div class="cs-tv-brand">CRYSTAL<br />VISION</div>
            <div class="cs-tv-knob" />
            <div class="cs-tv-knob cs-tv-knob-small" />
            <div class="cs-tv-speaker" />
            <span class="cs-tv-power-light" />
          </div>
        </div>
        <div class="cs-tv-feet" aria-hidden="true"><span /><span /></div>
      </div>
      <p class="cs-tv-room-label">CHANNEL 13 · GLIMMER FALLS · 1986</p>
    </div>
    <aside class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-lg leading-tight">
          Terrors on Crystal Street (Theme)
        </h2>
      </div>
      <div class="kr-pane-scroll space-y-3 p-3 text-sm" aria-label="Lyrics">
        <div v-for="section in THEME_LYRICS" :key="section.id">
          <p class="cs-kicker">{{ section.kind }}</p>
          <p v-for="line in section.lines" :key="line" class="leading-snug">
            {{ line }}
          </p>
        </div>
        <p class="text-xs opacity-70">
          Horror punk, written and sung with Kind Robots' music studio, every
          frame painted in the game's own style.
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { THEME_LYRICS } from '~/utils/crystalStreet/theme'
</script>

<style scoped>
.cs-tv-room {
  container-type: size;
  display: grid;
  place-items: center;
  isolation: isolate;
  background:
    radial-gradient(ellipse at 55% 16%, #6e657660, transparent 55%),
    repeating-linear-gradient(
      90deg,
      #2c2735 0 26px,
      #39303c 27px 30px,
      #201b29 31px 55px
    ),
    #211a2a;
}
.cs-tv-room::before {
  content: '';
  position: absolute;
  z-index: 1;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at 50% 45%,
    transparent 15%,
    #08060dc9 100%
  );
}
.cs-tv-window {
  position: absolute;
  top: 6%;
  right: 6%;
  width: 20%;
  height: 38%;
  border: 9px solid #241923;
  box-shadow:
    inset 0 0 0 2px #9e8164,
    0 0 0 4px #4d3345,
    0 6px 16px #050207;
  background: radial-gradient(
    circle at 58% 35%,
    #eae1c3 0 14%,
    #8d98ae 16%,
    #273552 46%,
    #111a32 100%
  );
  transform: rotate(3deg);
}
.cs-tv-window::before,
.cs-tv-window::after {
  content: '';
  position: absolute;
  top: -6%;
  height: 111%;
  width: 20%;
  background: linear-gradient(90deg, #180e20, #6b3b50 55%, #180e20);
}
.cs-tv-window::before {
  left: -21%;
}
.cs-tv-window::after {
  right: -21%;
}
.cs-tv-window-cross {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 47%, #281f32 47% 54%, transparent 54%),
    linear-gradient(transparent 47%, #281f32 47% 54%, transparent 54%);
}
.cs-tv-portrait {
  position: absolute;
  top: 8%;
  left: 6%;
  width: 14%;
  height: 31%;
  border: 7px ridge #74503d;
  background: radial-gradient(ellipse at 50% 25%, #766079, #281d31 68%);
  transform: rotate(-8deg);
  box-shadow: 0 7px 17px #08050d;
}
.cs-tv-portrait span {
  position: absolute;
  inset: 17% 19% 8%;
  border-radius: 47% 47% 8% 8%;
  background:
    radial-gradient(ellipse at 50% 27%, #271d2b 0 22%, transparent 24%),
    linear-gradient(transparent 32%, #17111f 33% 100%);
}
.cs-tv-lamp {
  position: absolute;
  bottom: 25%;
  left: 8%;
  height: 27%;
  width: 9%;
  background: linear-gradient(
    90deg,
    transparent 46%,
    #4f413b 46% 54%,
    transparent 54%
  );
}
.cs-tv-lamp::before {
  content: '';
  position: absolute;
  top: 0;
  width: 100%;
  height: 44%;
  clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%);
  background: linear-gradient(90deg, #58443a, #b19170, #493038);
  filter: drop-shadow(0 0 12px #b78b5555);
}
.cs-tv-lamp::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 17%;
  height: 6%;
  width: 66%;
  background: #352626;
  border-radius: 50%;
}
.cs-tv-floor {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  border-top: 9px solid #20141e;
  background:
    repeating-linear-gradient(174deg, transparent 0 23px, #0f0a14 24px 26px),
    linear-gradient(#48333c, #18131e);
  transform: perspective(400px) rotateX(25deg);
  transform-origin: bottom;
}
.cs-tv-set {
  position: relative;
  z-index: 2;
  width: min(96cqw, 130cqh, 65rem);
  max-width: 96%;
  transform: translateY(4%);
  filter: drop-shadow(0 12px 10px #050309cc) drop-shadow(0 24px 18px #050309bb);
}
.cs-tv-aerial {
  position: absolute;
  bottom: 97%;
  left: 47%;
  width: 6%;
  height: 18%;
  border-top: 3px solid #b6a69a;
  transform: rotate(-18deg);
}
.cs-tv-aerial::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 70%;
  width: 100%;
  height: 100%;
  border-top: 3px solid #b6a69a;
  transform: rotate(36deg);
}
.cs-tv-cabinet {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 13%;
  align-items: center;
  gap: 2%;
  aspect-ratio: 1.63;
  padding: 3%;
  border-radius: 12% / 11%;
  border: 4px solid #2f1a18;
  background: linear-gradient(
    120deg,
    #9b6042,
    #4b2825 24%,
    #825236 57%,
    #301b20 94%
  );
  box-shadow:
    inset 0 0 0 3px #b28a60,
    inset 0 0 26px #130a0b;
}
.cs-tv-screen {
  position: relative;
  overflow: hidden;
  border: clamp(4px, 0.8cqw, 12px) solid #1c1921;
  border-radius: 12% / 13%;
  aspect-ratio: 16 / 9;
  box-shadow:
    0 0 0 3px #a07956,
    inset 0 0 25px #020407;
  background: #05030a;
}
.cs-tv-video {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: #08030d;
}
.cs-tv-reflection {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    138deg,
    #ffffff29,
    transparent 28%,
    transparent 76%,
    #50c5bf12
  );
  box-shadow: inset 0 0 25px #80e9df40;
}
.cs-tv-control-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5%;
  height: 86%;
  min-height: 0;
  padding: 4% 1%;
  border-radius: 30%;
  background: linear-gradient(90deg, #352525, #a0774d 30%, #5b3c31 85%);
  border: 2px solid #2b1919;
}
.cs-tv-brand {
  font-size: clamp(4px, 0.72cqw, 10px);
  font-weight: 900;
  line-height: 1.15;
  color: #e1ca99;
  text-align: center;
  letter-spacing: 0.1em;
}
.cs-tv-knob {
  width: 52%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 30%,
    #d4b387,
    #6a4a37 48%,
    #1e1920 50%,
    #7a6351 64%,
    #1a151b 70%
  );
  border: 2px solid #241b1e;
  box-shadow: 1px 2px 3px #100a0e;
}
.cs-tv-knob-small {
  width: 37%;
}
.cs-tv-speaker {
  flex: 1;
  width: 78%;
  min-height: 15%;
  border: 2px solid #241b1e;
  border-radius: 5px;
  background: repeating-linear-gradient(0deg, #2a2021 0 2px, #98754f 3px 5px);
}
.cs-tv-power-light {
  height: 5%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #9bffc3;
  box-shadow: 0 0 9px #8affbb;
}
.cs-tv-feet {
  display: flex;
  justify-content: space-between;
  padding: 0 11%;
}
.cs-tv-feet span {
  width: 9%;
  height: 1.4cqh;
  background: linear-gradient(90deg, #160e12, #5e3a2e, #160e12);
  transform: skewX(-14deg);
}
.cs-tv-feet span:last-child {
  transform: skewX(14deg);
}
.cs-tv-room-label {
  position: absolute;
  z-index: 2;
  bottom: 2%;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  font: 700 clamp(7px, 1.25cqw, 12px) / 1.2 monospace;
  letter-spacing: 0.22em;
  color: #d6b28a;
  text-shadow: 0 2px 4px #000;
}
@media (prefers-reduced-motion: reduce) {
  .cs-tv-room *,
  .cs-tv-room *::before,
  .cs-tv-room *::after {
    animation: none;
  }
}
</style>
