<template>
  <div ref="frame" class="advert-poster-frame">
    <div class="ad-scaler" :style="{ transform: `scale(${scale})` }">
      <div
        ref="posterEl"
        class="ad-poster"
        :class="`ad-poster--${poster.variant}`"
        :style="posterVars"
        :data-advert-poster="poster.slug"
      >
        <template v-if="poster.variant === 'arcade'">
          <div class="ad-arc-wall">
            <img
              v-for="(src, index) in poster.wall"
              :key="index"
              :src="src"
              alt=""
            />
          </div>
          <div class="ad-arc-wall-fade" />
          <div class="ad-arc-ribbon">
            ★ {{ poster.copy.ribbon }} <span class="ad-arc-blink">★</span>
          </div>
          <div class="ad-arc-fan">
            <div
              v-for="(card, index) in poster.cards"
              :key="card.slot.key"
              class="ad-arc-card"
              :class="cardSide(index)"
              :style="card.glow ? { '--glow': card.glow } : undefined"
            >
              <img
                :src="images[card.slot.key]"
                :alt="card.label"
                :style="{ objectPosition: card.slot.position }"
              />
              <div class="ad-arc-tag" :style="tagStyle(card)">
                {{ card.label }}
              </div>
            </div>
            <div class="ad-arc-spark ad-arc-spark--1">✦</div>
            <div class="ad-arc-spark ad-arc-spark--2">✦</div>
            <div class="ad-arc-spark ad-arc-spark--3">✦</div>
            <div class="ad-arc-spark ad-arc-spark--4">✦</div>
          </div>
          <div class="ad-arc-title">
            <div class="ad-arc-kicker">{{ poster.copy.kicker }}</div>
            <div ref="nameEl" class="ad-arc-name">{{ poster.copy.title }}</div>
          </div>
          <div class="ad-arc-stats">
            <div class="ad-arc-count">
              <div class="ad-arc-n">{{ poster.copy.statValue }}</div>
              <div class="ad-arc-u">{{ poster.copy.statUnit }}</div>
            </div>
            <div class="ad-arc-pitch">
              <h2>
                {{ poster.copy.hook }} <em>{{ poster.copy.hookHighlight }}</em>
              </h2>
              <p>{{ poster.copy.blurb }}</p>
              <div class="ad-arc-chips">
                <span
                  v-for="(chip, index) in poster.copy.chips"
                  :key="chip"
                  class="ad-arc-chip"
                  :style="{ background: ARCADE_CHIP_COLORS[index % 4] }"
                  >{{ chip }}</span
                >
              </div>
            </div>
          </div>
          <div class="ad-arc-marquee">
            <template v-for="(item, index) in marquee" :key="index">
              <span v-if="index" class="ad-sep">♥</span>{{ item }}
            </template>
          </div>
        </template>

        <template v-else>
          <div class="ad-hero">
            <div v-if="poster.wall.length" class="ad-wall">
              <img
                v-for="(src, index) in poster.wall"
                :key="index"
                :src="src"
                alt=""
              />
            </div>
            <img
              v-else-if="poster.hero"
              :src="images[poster.hero.key]"
              :alt="`${poster.name} hero art`"
              :style="{ objectPosition: poster.hero.position }"
            />
          </div>
          <div class="ad-hero-fade" />
          <div class="ad-grain" />
          <div class="ad-ribbon">★ {{ poster.copy.ribbon }} ★</div>
          <div class="ad-cards">
            <div
              v-for="(card, index) in poster.cards"
              :key="card.slot.key"
              class="ad-card"
              :class="cardSide(index)"
            >
              <img
                :src="images[card.slot.key]"
                :alt="card.label"
                :style="{ objectPosition: card.slot.position }"
              />
              <div
                class="ad-tag"
                :style="
                  card.labelSize ? { fontSize: `${card.labelSize}px` } : {}
                "
              >
                {{ card.label }}
              </div>
            </div>
          </div>
          <div class="ad-content">
            <div class="ad-title">
              <div ref="kickerEl" class="ad-kicker">
                {{ poster.copy.kicker }}
              </div>
              <div
                ref="nameEl"
                class="ad-name"
                :class="
                  poster.type.titleGradient
                    ? 'ad-name--gradient'
                    : 'ad-name--ink'
                "
              >
                {{ poster.copy.title }}
              </div>
              <div v-if="poster.copy.title2" ref="name2El" class="ad-name2">
                {{ poster.copy.title2 }}
              </div>
            </div>
            <div class="ad-stats">
              <div class="ad-count">
                <div class="ad-n">{{ poster.copy.statValue }}</div>
                <div class="ad-u">{{ poster.copy.statUnit }}</div>
              </div>
              <div class="ad-pitch">
                <h2>
                  {{ poster.copy.hook }}
                  <em>{{ poster.copy.hookHighlight }}</em>
                </h2>
                <p>{{ poster.copy.blurb }}</p>
                <div class="ad-chips">
                  <span
                    v-for="chip in poster.copy.chips"
                    :key="chip"
                    class="ad-chip"
                    >{{ chip }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div ref="stripEl" class="ad-strip">
            <template v-for="(item, index) in poster.copy.strip" :key="index">
              {{ index ? ' ' : '' }}<span v-if="index" class="ad-sep">♥</span
              >{{ index ? ` ${item}` : item }}
            </template>
          </div>
        </template>

        <div class="ad-foot">
          <div ref="brandEl" class="ad-brand">
            <img :src="ADVERT_LOGO_SRC" alt="Kind Robots" />
            <div class="ad-b">
              KIND ROBOTS<small>AI for human benefit</small>
            </div>
          </div>
          <div ref="urlEl" class="ad-url">
            {{ ADVERT_SITE_HOST }}<b>{{ poster.path }}</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAdvertStore } from '@/stores/advertStore'
import {
  ADVERT_LOGO_SRC,
  ADVERT_POSTER_WIDTH,
  ADVERT_SITE_HOST,
  advertFontStylesheetUrl,
  type AdvertCard,
  type AdvertPoster,
} from '@/utils/adverts/posters'

const props = defineProps<{
  poster: AdvertPoster
  images: Record<string, string>
}>()

const ARCADE_CHIP_COLORS = ['#f9a8d4', '#a5f3fc', '#bbf7d0', '#fde68a']
const FONT_LINK_ID = 'advert-poster-fonts'
const CONTENT_WIDTH = 968

const advertStore = useAdvertStore()
const frame = ref<HTMLElement | null>(null)
const posterEl = ref<HTMLElement | null>(null)
const nameEl = ref<HTMLElement | null>(null)
const name2El = ref<HTMLElement | null>(null)
const kickerEl = ref<HTMLElement | null>(null)
const stripEl = ref<HTMLElement | null>(null)
const brandEl = ref<HTMLElement | null>(null)
const urlEl = ref<HTMLElement | null>(null)
const scale = ref(1)
let resizeObserver: ResizeObserver | null = null
let registeredSlug = ''

const posterVars = computed(() => {
  const { palette, type, layout } = props.poster
  return {
    '--bg': palette.bg,
    '--a1': palette.a1,
    '--a2': palette.a2,
    '--a3': palette.a3,
    '--ink': palette.ink,
    '--hero-h': `${layout.heroHeight}px`,
    '--hero-fade-h': `${layout.heroHeight + 10}px`,
    '--cards-top': `${layout.cardsTop}px`,
    '--cards-scale': String(layout.cardsScale),
    '--content-top': `${layout.contentTop}px`,
    '--content-bottom': `${layout.contentBottom}px`,
    '--content-gap': `${layout.contentGap}px`,
    '--title-font': type.titleFont,
    '--title-size': `${type.titleSize}px`,
    '--title2-size': `${Math.floor(type.titleSize * 0.62)}px`,
    '--title-spacing': type.titleSpacing,
    '--stat-size': `${type.statSize}px`,
    '--hook-size': `${type.hookSize}px`,
    '--url-size': `${type.urlSize}px`,
  }
})

const marquee = computed(() => [
  ...props.poster.copy.strip,
  ...props.poster.copy.strip.slice(0, 4),
])

function cardSide(index: number): string {
  return ['is-left', 'is-center', 'is-right'][index] ?? 'is-center'
}

function tagStyle(card: AdvertCard) {
  return card.tag
    ? { background: `linear-gradient(90deg,${card.tag[0]},${card.tag[1]})` }
    : {}
}

function stylesheetReady(): Promise<void> {
  const existing = document.getElementById(
    FONT_LINK_ID,
  ) as HTMLLinkElement | null
  if (existing?.dataset.loaded === '1') return Promise.resolve()
  const link = existing ?? document.createElement('link')
  const ready = new Promise<void>((resolve) => {
    link.addEventListener('load', () => resolve(), { once: true })
    link.addEventListener('error', () => resolve(), { once: true })
    window.setTimeout(resolve, 8000)
  }).then(() => {
    link.dataset.loaded = '1'
  })
  if (!existing) {
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    link.crossOrigin = 'anonymous'
    link.href = advertFontStylesheetUrl()
    document.head.appendChild(link)
  }
  return ready
}

async function loadFonts(): Promise<void> {
  if (!document.fonts) return
  await stylesheetReady()
  const { type, copy } = props.poster
  const sample = `${copy.title} ${copy.title2}`
  await Promise.allSettled([
    document.fonts.load(`${type.titleSize}px ${type.titleFont}`, sample),
    document.fonts.load("28px 'Bungee'"),
    document.fonts.load("168px 'Bungee Shade'", copy.title),
    document.fonts.load("14px 'Press Start 2P'"),
    document.fonts.load("800 42px 'Baloo 2'"),
    document.fonts.load("600 23px 'Baloo 2'"),
    document.fonts.load("700 16px 'Baloo 2'"),
  ])
  await document.fonts.ready
}

function shrink(el: HTMLElement | null, max: number, min: number): void {
  if (!el) return
  el.style.fontSize = ''
  let size = parseFloat(getComputedStyle(el).fontSize)
  while (el.offsetWidth > max && size > min) {
    size -= 1
    el.style.fontSize = `${size}px`
  }
}

function fitKicker(): void {
  const kicker = kickerEl.value
  if (!kicker) return
  kicker.style.fontSize = ''
  kicker.style.letterSpacing = ''
  let size = parseFloat(getComputedStyle(kicker).fontSize)
  while (kicker.scrollWidth > kicker.clientWidth && size > 14) {
    size -= 1
    kicker.style.fontSize = `${size}px`
    kicker.style.letterSpacing = `${Math.max(2, size * 0.28)}px`
  }
}

function fitStrip(): void {
  const strip = stripEl.value
  if (!strip) return
  strip.style.fontSize = ''
  let size = 14
  while (strip.scrollWidth > strip.clientWidth - 40 && size > 9) {
    size -= 0.5
    strip.style.fontSize = `${size}px`
  }
}

async function fit(): Promise<void> {
  await loadFonts()
  await nextTick()
  shrink(nameEl.value, CONTENT_WIDTH, 30)
  shrink(name2El.value, CONTENT_WIDTH, 24)
  if (props.poster.variant === 'arcade') return
  fitKicker()
  const brand = brandEl.value?.offsetWidth ?? 0
  shrink(urlEl.value, CONTENT_WIDTH - brand - 24, 16)
  fitStrip()
}

function measure(): void {
  const width = frame.value?.getBoundingClientRect().width ?? 0
  if (Number.isFinite(width) && width > 0) {
    scale.value = width / ADVERT_POSTER_WIDTH
  }
}

function register(): void {
  if (!posterEl.value) return
  if (registeredSlug)
    advertStore.releasePosterElement(registeredSlug, posterEl.value)
  registeredSlug = props.poster.slug
  advertStore.registerPosterElement(registeredSlug, posterEl.value)
}

watch(
  () => props.poster.slug,
  async () => {
    await nextTick()
    register()
    await fit()
  },
)

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (frame.value) resizeObserver.observe(frame.value)
  register()
  void fit()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (registeredSlug && posterEl.value)
    advertStore.releasePosterElement(registeredSlug, posterEl.value)
})
</script>

<style scoped>
.advert-poster-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1080 / 1350;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #0b0618;
}

.ad-scaler {
  position: absolute;
  top: 0;
  left: 0;
  width: 1080px;
  height: 1350px;
  transform-origin: 0 0;
}

.ad-poster {
  position: relative;
  width: 1080px;
  height: 1350px;
  overflow: hidden;
  background: var(--bg);
  font-family: 'Baloo 2', sans-serif;
  color: #fff;
  text-align: left;
  line-height: normal;
}

.ad-poster *,
.ad-poster *::before,
.ad-poster *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.ad-poster img {
  max-width: none;
}

.ad-hero {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: var(--hero-h);
  overflow: hidden;
}

.ad-hero > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.03);
}

.ad-wall {
  position: absolute;
  left: 50%;
  top: -160px;
  width: 1800px;
  transform: translateX(-50%) perspective(1400px) rotateX(22deg) rotateZ(-10deg);
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
}

.ad-wall img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.12);
}

.ad-hero-fade {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: var(--hero-fade-h);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--bg) 55%, transparent) 0%,
      transparent 16%,
      transparent 52%,
      color-mix(in srgb, var(--bg) 70%, transparent) 76%,
      var(--bg) 100%
    ),
    radial-gradient(
      80% 50% at 50% 100%,
      color-mix(in srgb, var(--a1) 22%, transparent),
      transparent 70%
    );
}

.ad-grain {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: repeating-linear-gradient(
    0deg,
    #fff 0 1px,
    transparent 1px 3px
  );
}

.ad-ribbon {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  letter-spacing: 2px;
  color: var(--bg);
  background: linear-gradient(
    90deg,
    var(--a2),
    color-mix(in srgb, var(--a2) 55%, #fff),
    var(--a2)
  );
  padding: 13px 24px 11px;
  border-radius: 999px;
  box-shadow:
    0 0 0 4px var(--bg),
    0 0 0 7px var(--a2),
    0 0 40px color-mix(in srgb, var(--a2) 55%, transparent);
  white-space: nowrap;
}

.ad-cards {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--cards-top);
  height: 330px;
  z-index: 4;
  transform: scale(var(--cards-scale));
  transform-origin: 50% 0;
}

.ad-card {
  position: absolute;
  width: 262px;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
  padding: 8px 8px 0;
}

.ad-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 15px;
}

.ad-tag {
  font-family: 'Bungee', sans-serif;
  font-size: 17px;
  color: #14091f;
  text-align: center;
  padding: 8px 4px 9px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
}

.ad-card.is-left {
  left: 70px;
  top: 22px;
  transform: rotate(-7deg);
  box-shadow:
    0 26px 50px rgba(0, 0, 0, 0.55),
    0 0 0 3px #fff,
    0 0 50px color-mix(in srgb, var(--a1) 55%, transparent);
}

.ad-card.is-center {
  left: 50%;
  top: 0;
  width: 282px;
  transform: translateX(-50%) rotate(1.5deg);
  z-index: 2;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.6),
    0 0 0 3px #fff,
    0 0 60px color-mix(in srgb, var(--a2) 60%, transparent);
}

.ad-card.is-right {
  right: 70px;
  top: 22px;
  transform: rotate(7deg);
  box-shadow:
    0 26px 50px rgba(0, 0, 0, 0.55),
    0 0 0 3px #fff,
    0 0 50px color-mix(in srgb, var(--a3) 55%, transparent);
}

.ad-card.is-left .ad-tag {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--a1) 35%, #fff),
    color-mix(in srgb, var(--a1) 75%, #fff)
  );
}

.ad-card.is-center .ad-tag {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--a2) 35%, #fff),
    color-mix(in srgb, var(--a2) 75%, #fff)
  );
}

.ad-card.is-right .ad-tag {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--a3) 35%, #fff),
    color-mix(in srgb, var(--a3) 75%, #fff)
  );
}

.ad-content {
  position: absolute;
  top: var(--content-top);
  bottom: var(--content-bottom);
  left: 56px;
  right: 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--content-gap);
  z-index: 3;
}

.ad-title {
  text-align: center;
}

.ad-kicker {
  font-family: 'Bungee', sans-serif;
  font-size: 28px;
  letter-spacing: 8px;
  white-space: nowrap;
  color: color-mix(in srgb, var(--a1) 45%, #fff);
  text-shadow:
    0 2px 0 rgba(0, 0, 0, 0.5),
    0 0 18px color-mix(in srgb, var(--a1) 50%, transparent);
}

.ad-name {
  font-family: var(--title-font);
  font-size: var(--title-size);
  line-height: 0.95;
  letter-spacing: var(--title-spacing);
  margin-top: 6px;
  white-space: nowrap;
  display: inline-block;
}

.ad-name--gradient {
  background: linear-gradient(90deg, var(--a1), var(--a2) 50%, var(--a3));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 20px color-mix(in srgb, var(--a1) 40%, transparent))
    drop-shadow(0 5px 0 rgba(0, 0, 0, 0.65));
}

.ad-name--ink {
  color: var(--ink);
  text-shadow:
    0 5px 0 rgba(0, 0, 0, 0.6),
    0 0 30px color-mix(in srgb, var(--a1) 55%, transparent);
}

.ad-name2 {
  white-space: nowrap;
  display: inline-block;
  font-family: var(--title-font);
  font-size: var(--title2-size);
  line-height: 1;
  margin-top: 4px;
  color: color-mix(in srgb, var(--a2) 60%, #fff);
  text-shadow: 0 4px 0 rgba(0, 0, 0, 0.6);
  letter-spacing: var(--title-spacing);
}

.ad-stats {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 0 6px;
}

.ad-count {
  flex: none;
  width: 222px;
  height: 222px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background:
    radial-gradient(circle at 35% 30%, #fff7 0, transparent 42%),
    conic-gradient(from 200deg, var(--a1), var(--a2), var(--a3), var(--a1));
  box-shadow:
    0 0 0 8px var(--bg),
    0 0 0 12px rgba(255, 255, 255, 0.85),
    0 0 60px color-mix(in srgb, var(--a2) 45%, transparent);
  transform: rotate(-6deg);
}

.ad-n {
  font-family: 'Bungee', sans-serif;
  font-size: var(--stat-size);
  line-height: 0.9;
  color: #14091f;
  text-shadow: 0 4px 0 rgba(255, 255, 255, 0.5);
}

.ad-u {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  line-height: 1.35;
  color: #14091f;
  margin-top: 8px;
  max-width: 170px;
}

.ad-pitch {
  min-width: 0;
}

.ad-pitch h2 {
  font-weight: 800;
  font-size: var(--hook-size);
  line-height: 1.04;
  color: #fff;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.4);
}

.ad-pitch h2 em,
.ad-arc-pitch h2 em {
  font-style: normal;
  color: var(--a2);
}

.ad-pitch p {
  font-size: 23px;
  line-height: 1.28;
  color: color-mix(in srgb, var(--a1) 18%, #ece6ff);
  margin-top: 10px;
  font-weight: 600;
}

.ad-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.ad-chip {
  font-family: 'Press Start 2P', monospace;
  font-size: 11.5px;
  padding: 10px 11px 9px;
  border-radius: 10px;
  color: #14091f;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.ad-chip:nth-child(4n + 1) {
  background: color-mix(in srgb, var(--a1) 45%, #fff);
}

.ad-chip:nth-child(4n + 2) {
  background: color-mix(in srgb, var(--a2) 45%, #fff);
}

.ad-chip:nth-child(4n + 3) {
  background: color-mix(in srgb, var(--a3) 45%, #fff);
}

.ad-chip:nth-child(4n + 4) {
  background: #fde68a;
}

.ad-strip {
  position: absolute;
  top: 1198px;
  left: -20px;
  right: -20px;
  transform: rotate(-1.4deg);
  z-index: 2;
  background: #0b0618;
  border-top: 3px solid var(--a1);
  border-bottom: 3px solid var(--a3);
  padding: 12px 0 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: color-mix(in srgb, var(--a2) 55%, #fff);
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: 1px;
  text-align: center;
}

.ad-strip .ad-sep {
  color: var(--a1);
  margin: 0 12px;
}

.ad-foot {
  position: absolute;
  bottom: 22px;
  left: 56px;
  right: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 3;
}

.ad-brand {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}

.ad-brand img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  box-shadow:
    0 0 0 3px #fff,
    0 0 22px color-mix(in srgb, var(--a3) 60%, transparent);
  object-fit: cover;
}

.ad-b {
  font-family: 'Bungee', sans-serif;
  font-size: 23px;
  line-height: 1.05;
}

.ad-b small {
  display: block;
  font-family: 'Baloo 2', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: color-mix(in srgb, var(--a1) 35%, #fff);
  letter-spacing: 0.5px;
}

.ad-url {
  font-family: 'Bungee', sans-serif;
  font-size: var(--url-size);
  color: #fff;
  padding: 12px 22px 10px;
  border-radius: 16px;
  white-space: nowrap;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--a1) 80%, #000),
    color-mix(in srgb, var(--a3) 75%, #000)
  );
  box-shadow:
    0 0 0 3px #fff,
    0 0 34px color-mix(in srgb, var(--a1) 55%, transparent);
}

.ad-url b {
  color: color-mix(in srgb, var(--a2) 55%, #fff);
  font-weight: 400;
}

.ad-poster--arcade {
  background: radial-gradient(
    120% 70% at 50% 0%,
    #3b1680 0%,
    #1c0c40 55%,
    #0d0620 100%
  );
}

.ad-arc-wall {
  position: absolute;
  left: 50%;
  top: -180px;
  width: 1900px;
  transform: translateX(-50%) perspective(1400px) rotateX(24deg) rotateZ(-11deg);
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 16px;
  opacity: 0.62;
  filter: saturate(1.15);
}

.ad-arc-wall img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
}

.ad-arc-wall-fade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(20, 10, 46, 0.15) 0%,
      rgba(20, 10, 46, 0) 18%,
      rgba(20, 10, 46, 0.35) 46%,
      rgba(16, 8, 38, 0.93) 62%,
      #100826 74%
    ),
    radial-gradient(
      60% 38% at 50% 30%,
      rgba(244, 114, 182, 0.18),
      transparent 70%
    );
}

.ad-arc-ribbon {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  font-family: 'Press Start 2P', monospace;
  font-size: 17px;
  letter-spacing: 2px;
  color: #1a0b3a;
  background: linear-gradient(90deg, var(--a2), #fde68a, var(--a2));
  padding: 14px 26px 12px;
  border-radius: 999px;
  box-shadow:
    0 0 0 4px #1a0b3a,
    0 0 0 7px var(--a2),
    0 0 40px rgba(250, 204, 21, 0.55);
  white-space: nowrap;
}

.ad-arc-blink {
  color: #c026d3;
}

.ad-arc-fan {
  position: absolute;
  top: 150px;
  left: 0;
  right: 0;
  height: 520px;
}

.ad-arc-card {
  position: absolute;
  width: 310px;
  border-radius: 26px;
  overflow: hidden;
  background: #fff;
  padding: 9px 9px 0;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.55),
    0 0 0 3px #fff,
    0 0 60px var(--glow, rgba(255, 255, 255, 0.3));
}

.ad-arc-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 18px;
}

.ad-arc-tag {
  font-family: 'Bungee', sans-serif;
  font-size: 19px;
  color: #1a0b3a;
  text-align: center;
  padding: 10px 0 11px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.ad-arc-card.is-left {
  left: 34px;
  top: 84px;
  transform: rotate(-9deg);
}

.ad-arc-card.is-right {
  right: 34px;
  top: 84px;
  transform: rotate(9deg);
}

.ad-arc-card.is-center {
  left: 50%;
  top: 10px;
  width: 372px;
  transform: translateX(-50%) rotate(-1.5deg);
  z-index: 2;
  box-shadow:
    0 34px 70px rgba(0, 0, 0, 0.6),
    0 0 0 3px #fff,
    0 0 70px var(--glow, rgba(232, 121, 249, 0.6));
}

.ad-arc-spark {
  position: absolute;
  color: #fff;
  text-shadow:
    0 0 12px #fff,
    0 0 24px var(--a1);
  font-size: 34px;
  z-index: 3;
}

.ad-arc-spark--1 {
  left: 150px;
  top: 30px;
}

.ad-arc-spark--2 {
  right: 150px;
  top: 20px;
  font-size: 26px;
}

.ad-arc-spark--3 {
  right: 96px;
  top: 470px;
  font-size: 22px;
}

.ad-arc-spark--4 {
  left: 98px;
  top: 480px;
  font-size: 28px;
}

.ad-arc-title {
  position: absolute;
  top: 688px;
  left: 0;
  right: 0;
  text-align: center;
}

.ad-arc-kicker {
  font-family: 'Bungee', sans-serif;
  font-size: 34px;
  letter-spacing: 9px;
  color: #c4b5fd;
  text-shadow: 0 0 18px rgba(196, 181, 253, 0.6);
}

.ad-arc-name {
  display: inline-block;
  white-space: nowrap;
  font-family: 'Bungee Shade', sans-serif;
  font-size: var(--title-size);
  line-height: 0.92;
  letter-spacing: var(--title-spacing);
  margin-top: 2px;
  background: linear-gradient(
    90deg,
    #f472b6 0%,
    #fb923c 20%,
    #facc15 38%,
    #4ade80 56%,
    #22d3ee 74%,
    #a78bfa 92%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 22px rgba(244, 114, 182, 0.45))
    drop-shadow(0 6px 0 #0b0420);
}

.ad-arc-stats {
  position: absolute;
  top: 930px;
  left: 70px;
  right: 70px;
  display: flex;
  align-items: center;
  gap: 34px;
}

.ad-arc-count {
  flex: none;
  width: 236px;
  height: 236px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 35% 30%, #fff7 0, transparent 40%),
    conic-gradient(
      from 200deg,
      #f472b6,
      #facc15,
      #4ade80,
      #22d3ee,
      #a78bfa,
      #f472b6
    );
  box-shadow:
    0 0 0 8px #100826,
    0 0 0 12px rgba(255, 255, 255, 0.85),
    0 0 60px rgba(250, 204, 21, 0.45);
  transform: rotate(-6deg);
}

.ad-arc-n {
  font-family: 'Bungee', sans-serif;
  font-size: var(--stat-size);
  line-height: 0.9;
  color: #100826;
  text-shadow: 0 4px 0 rgba(255, 255, 255, 0.55);
}

.ad-arc-u {
  font-family: 'Press Start 2P', monospace;
  font-size: 17px;
  color: #100826;
  margin-top: 8px;
  letter-spacing: 1px;
}

.ad-arc-pitch {
  min-width: 0;
}

.ad-arc-pitch h2 {
  font-family: 'Baloo 2', sans-serif;
  font-weight: 800;
  font-size: 46px;
  line-height: 1.02;
  color: #fff;
}

.ad-arc-pitch p {
  font-size: 25px;
  line-height: 1.28;
  color: #ddd6fe;
  margin-top: 12px;
  font-weight: 600;
}

.ad-arc-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-top: 16px;
}

.ad-arc-chip {
  font-family: 'Press Start 2P', monospace;
  font-size: 11.5px;
  padding: 10px 11px 9px;
  white-space: nowrap;
  border-radius: 10px;
  color: #100826;
  letter-spacing: 0.5px;
}

.ad-arc-marquee {
  position: absolute;
  top: 1196px;
  left: -20px;
  right: -20px;
  transform: rotate(-1.6deg);
  background: #0b0420;
  border-top: 3px solid var(--a1);
  border-bottom: 3px solid var(--a3);
  padding: 12px 0 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #fde68a;
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: 1px;
  text-indent: -6px;
}

.ad-arc-marquee .ad-sep {
  color: var(--a1);
  margin: 0 12px;
}

.ad-poster--arcade .ad-foot {
  left: 60px;
  right: 60px;
}

.ad-poster--arcade .ad-brand img {
  width: 66px;
  height: 66px;
  box-shadow:
    0 0 0 3px #fff,
    0 0 22px rgba(34, 211, 238, 0.6);
}

.ad-poster--arcade .ad-b {
  font-size: 24px;
}

.ad-poster--arcade .ad-b small {
  font-size: 17px;
  color: #c4b5fd;
}

.ad-poster--arcade .ad-url {
  font-size: var(--url-size);
  padding: 12px 24px 10px;
  background: linear-gradient(90deg, #db2777, #7c3aed);
  box-shadow:
    0 0 0 3px #fff,
    0 0 34px rgba(219, 39, 119, 0.6);
}

.ad-poster--arcade .ad-url b {
  color: #fde68a;
}
</style>
