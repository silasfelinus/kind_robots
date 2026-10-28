<template>
  <main class="kr-surface hybridizer-root" data-testid="hybridizer-lab">
    <div class="hybridizer-console" :class="{ 'is-working': lab.working }">
      <header class="hybridizer-header">
        <div>
          <p class="eyebrow">KIND ROBOTS / EXPERIMENT 014</p>
          <div class="lab-title">HYBRIDIZER</div>
          <p class="subtitle">Every creature has an impossible cousin.</p>
        </div>
        <div class="header-count">
          <strong>{{ lab.starterCount }}</strong>
          <span>STARTERS</span>
          <strong>{{ lab.discoveries.length }}</strong>
          <span>LOCAL STUDIES</span>
        </div>
      </header>

      <section class="hybridizer-stage" aria-label="Creature fusion laboratory">
        <button
          type="button"
          class="specimen-chamber left-chamber"
          data-testid="hybridizer-left"
          aria-label="Choose left ingredient"
          @click="openDrawer('left')"
        >
          <div class="chamber-label">
            <span>CHAMBER 01</span>
            <strong>{{ lab.left?.title || 'Choose specimen' }}</strong>
          </div>
          <div class="specimen-art">
            <img
              v-if="lab.imageFor(lab.left)"
              :src="lab.imageFor(lab.left) || undefined"
              :alt="lab.left?.title || ''"
              class="specimen-image"
            />
            <div v-else class="specimen-fallback" aria-hidden="true">
              <span class="specimen-glow"></span>
              <span class="specimen-glyph">{{ glyphFor(lab.left?.title, lab.left?.taxonomy) }}</span>
            </div>
          </div>
          <span class="chamber-bottom">{{ lab.left?.taxonomy || 'EMPTY' }} <span>CHANGE ✦</span></span>
        </button>

        <div class="hybridizer-machine" aria-hidden="true">
          <span class="coil coil-one"></span>
          <span class="coil coil-two"></span>
          <span class="core">×</span>
          <span class="machine-caption">{{ lab.working ? 'FUSING' : 'MIX' }}</span>
        </div>

        <button
          type="button"
          class="specimen-chamber right-chamber"
          data-testid="hybridizer-right"
          aria-label="Choose right ingredient"
          @click="openDrawer('right')"
        >
          <div class="chamber-label">
            <span>CHAMBER 02</span>
            <strong>{{ lab.right?.title || 'Choose specimen' }}</strong>
          </div>
          <div class="specimen-art">
            <img
              v-if="lab.imageFor(lab.right)"
              :src="lab.imageFor(lab.right) || undefined"
              :alt="lab.right?.title || ''"
              class="specimen-image"
            />
            <div v-else class="specimen-fallback" aria-hidden="true">
              <span class="specimen-glow"></span>
              <span class="specimen-glyph">{{ glyphFor(lab.right?.title, lab.right?.taxonomy) }}</span>
            </div>
          </div>
          <span class="chamber-bottom">{{ lab.right?.taxonomy || 'EMPTY' }} <span>CHANGE ✦</span></span>
        </button>

        <article class="hybridizer-result" aria-live="polite">
          <p class="eyebrow">THE DISCOVERY CHAMBER</p>
          <template v-if="lab.result">
            <h2 data-testid="hybridizer-result-title">{{ lab.result.title }}</h2>
            <div class="fusion-study" aria-label="Compositional preview using the two source ingredients">
              <div class="fusion-part">
                <img
                  v-if="lab.imageFor(lab.left)"
                  :src="lab.imageFor(lab.left) || undefined"
                  :alt="lab.left?.title || ''"
                />
                <span v-else aria-hidden="true">{{ glyphFor(lab.left?.title, lab.left?.taxonomy) }}</span>
              </div>
              <div class="fusion-lightning" aria-hidden="true">✧</div>
              <div class="fusion-part">
                <img
                  v-if="lab.imageFor(lab.right)"
                  :src="lab.imageFor(lab.right) || undefined"
                  :alt="lab.right?.title || ''"
                />
                <span v-else aria-hidden="true">{{ glyphFor(lab.right?.title, lab.right?.taxonomy) }}</span>
              </div>
            </div>
            <div class="result-foot">
              <p class="study-label">COMPOSITION STUDY · GENERATED HYBRID ART PENDING</p>
              <button type="button" class="remix-button" data-testid="hybridizer-remix" @click="lab.remix('left')">
                Use as next ingredient ↗
              </button>
            </div>
          </template>
          <template v-else>
            <h2>{{ lab.working ? 'Something impossible is forming…' : 'Awaiting discovery' }}</h2>
            <div class="empty-study" aria-hidden="true">
              <span class="orb orb-a"></span>
              <span class="orb orb-b"></span>
              <span class="orb orb-c"></span>
              <span class="empty-star">✧</span>
            </div>
            <p class="result-hint">
              {{ lab.working ? 'The laboratory is recombining its specimens.' : 'Select any two specimens, then energize the chamber.' }}
            </p>
          </template>
        </article>
      </section>

      <footer class="hybridizer-footer">
        <button
          type="button"
          class="fusion-button"
          :disabled="lab.working"
          data-testid="hybridizer-fuse"
          @click="lab.fuse()"
        >
          <span aria-hidden="true">✦</span> {{ lab.working ? 'FUSION IN PROGRESS' : 'ACTIVATE FUSION' }} <span aria-hidden="true">✦</span>
        </button>
        <p class="lab-status" role="status">{{ lab.status }}</p>
        <button
          type="button"
          class="atlas-button"
          data-testid="hybridizer-atlas"
          @click="openDrawer('atlas')"
        >
          DISCOVERY SHELF · {{ lab.discoveries.length }}
        </button>
      </footer>

      <aside v-if="drawer" class="ingredient-drawer" aria-label="Ingredient picker">
        <div class="drawer-head">
          <div>
            <p class="eyebrow">{{ drawer === 'atlas' ? 'LOCAL DISCOVERIES' : 'SPECIMEN DRAWER' }}</p>
            <h2>{{ drawer === 'atlas' ? 'Discovery shelf' : 'Choose ' + drawer + ' ingredient' }}</h2>
          </div>
          <button type="button" class="drawer-close" aria-label="Close picker" @click="drawer = null">✕</button>
        </div>
        <template v-if="drawer !== 'atlas'">
          <label class="search-wrap">
            <span class="sr-only">Search ingredients</span>
            <input v-model="search" type="search" placeholder="Find an animal, species, fruit or curiosity…" />
          </label>
          <div class="type-filters" aria-label="Filter ingredients">
            <button
              v-for="option in filters"
              :key="option"
              type="button"
              :class="{ selected: filter === option }"
              :aria-pressed="filter === option"
              @click="filter = option"
            >
              {{ option }}
            </button>
          </div>
        </template>
        <div class="ingredient-grid kr-scroll">
          <button
            v-for="entry in visibleEntries"
            :key="entry.key"
            type="button"
            class="ingredient-option"
            :aria-label="'Select ' + entry.title"
            @click="pick(entry.key)"
          >
            <img v-if="lab.imageFor(entry)" :src="lab.imageFor(entry) || undefined" :alt="entry.title" />
            <span v-else class="option-glyph" aria-hidden="true">{{ glyphFor(entry.title, entry.taxonomy) }}</span>
            <strong>{{ entry.title }}</strong>
            <small>{{ entry.taxonomy === 'OTHER' && entry.facetGroup === 'fruit' ? 'FRUIT' : entry.taxonomy }}</small>
          </button>
          <p v-if="!visibleEntries.length" class="empty-filter">
            {{ drawer === 'atlas' ? 'Your local discovery shelf is empty. Try a fusion.' : 'No ingredients match your search.' }}
          </p>
        </div>
        <p class="drawer-foot">
          Prototype: these studies are saved only in this browser. Global result caching,
          real image generation and contributions are separate roadmap tasks.
        </p>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHybridizerStore } from '@/stores/hybridizerStore'

const lab = useHybridizerStore()
const drawer = ref<'left' | 'right' | 'atlas' | null>(null)
const search = ref('')
const filter = ref('ALL')
const filters = ['ALL', 'ANIMAL', 'SPECIES', 'FRUIT', 'ARCHETYPE', 'OTHER', 'HYBRID']

const visibleEntries = computed(() => {
  if (drawer.value === 'atlas') return [...lab.discoveries].reverse()
  const word = search.value.toLowerCase().trim()
  return lab.inputs.filter((entry) => {
    const type = entry.taxonomy === 'OTHER' && entry.facetGroup === 'fruit' ? 'FRUIT' : entry.taxonomy
    return (filter.value === 'ALL' || type === filter.value) &&
      (!word || entry.title.toLowerCase().includes(word))
  })
})

function openDrawer(side: 'left' | 'right' | 'atlas') {
  drawer.value = side
  search.value = ''
  filter.value = side === 'atlas' ? 'HYBRID' : 'ALL'
}

function pick(key: string) {
  if (drawer.value === 'left' || drawer.value === 'right')
    lab.choose(drawer.value, key)
  else
    lab.choose('left', key)
  drawer.value = null
}

function glyphFor(title?: string, taxonomy?: string): string {
  const value = (title || '').toLowerCase()
  if (value.includes('banana')) return '🍌'
  if (value.includes('cat')) return '🐈'
  if (value.includes('vampire')) return '🦇'
  if (value.includes('zombie')) return '🧟'
  if (value.includes('dog')) return '🐕'
  if (value.includes('dragon')) return '🐉'
  if (taxonomy === 'ANIMAL') return '🦊'
  if (taxonomy === 'SPECIES') return '🧬'
  if (taxonomy === 'OTHER') return '🍓'
  if (taxonomy === 'ARCHETYPE') return '🎭'
  return '✧'
}

onMounted(() => {
  lab.hydrate()
  void lab.loadArtwork()
})
</script>

<style scoped>
.hybridizer-root {
  min-height: 0;
  height: 100%;
  overflow: hidden;
  color: #fff1e8;
  background: radial-gradient(ellipse at 56% 36%, #553365 0%, #281a45 46%, #140f29 100%);
  container-type: inline-size;
}

.hybridizer-console {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: clamp(9px, 1.4vw, 18px);
  height: 100%;
  min-height: 0;
  padding: clamp(12px, 2vw, 25px);
  background-image: radial-gradient(#b8a9d32b 1px, transparent 1px);
  background-size: 27px 27px;
}

.hybridizer-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  min-height: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #957b9e50;
}

.eyebrow {
  font-size: clamp(0.56rem, 0.85vw, 0.75rem);
  font-weight: 900;
  letter-spacing: 0.21em;
  color: #d3b9db;
}

.hybridizer-header .lab-title {
  font-size: clamp(1.55rem, 3.8vw, 3.1rem);
  letter-spacing: 0.18em;
  font-weight: 950;
  line-height: 1.12;
  color: #fff2d8;
}

.subtitle {
  font-size: clamp(0.66rem, 1vw, 0.87rem);
  letter-spacing: 0.075em;
  color: #d4f0b3;
  font-weight: 700;
}

.header-count {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  column-gap: 15px;
  align-items: center;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: #d8c7de;
}

.header-count strong {
  font-size: 1.3rem;
  color: #def19d;
}

.hybridizer-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr) minmax(0, 1.7fr);
  gap: clamp(7px, 1vw, 14px);
  min-height: 0;
  height: 100%;
}

.specimen-chamber,
.hybridizer-result {
  min-height: 0;
  overflow: hidden;
  border: 2px solid #9a78a4;
  border-radius: 24px;
  background: linear-gradient(145deg, #38465bba, #2a2147c9 48%, #593774ad);
  box-shadow: 0 9px 22px #12092599, inset 0 0 0 7px #28204478;
}

.specimen-chamber {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: clamp(8px, 1.2vw, 16px);
  transition: transform 0.18s, border-color 0.18s;
}

.specimen-chamber:hover,
.specimen-chamber:focus-visible {
  border-color: #e5f2a3;
  transform: translateY(-2px);
}

.chamber-label span {
  font-size: 0.66rem;
  letter-spacing: 0.2em;
  color: #ded1e5;
  font-weight: 900;
}

.chamber-label strong {
  display: block;
  font-size: clamp(0.9rem, 1.6vw, 1.75rem);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.specimen-art {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.specimen-image {
  object-fit: contain;
  width: 100%;
  height: 100%;
  max-height: 100%;
  filter: drop-shadow(0 12px 15px #0b0826);
}

.specimen-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.specimen-glow {
  position: absolute;
  width: 85%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #cfec94aa, #bd84dc22 56%, transparent 75%);
}

.specimen-glyph {
  position: relative;
  font-size: clamp(3.5rem, 9vw, 9rem);
  filter: drop-shadow(0 17px 16px #130c2c);
}

.chamber-bottom {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 0.66rem;
  color: #e1c6e7;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.chamber-bottom span {
  color: #d6eda0;
}

.hybridizer-machine {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  min-width: 0;
  gap: 10px;
}

.core {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 9px solid #bd8b9b;
  border-radius: 50%;
  background: #23163d;
  color: #ebffb0;
  font-size: 2.5rem;
  font-weight: 700;
  z-index: 1;
  box-shadow: 0 0 37px #d7f3b544;
}

.coil {
  position: absolute;
  width: 66px;
  height: 66px;
  border: 2px dashed #d6f8a9;
  border-radius: 50%;
  opacity: 0.6;
}

.coil-two {
  width: 91px;
  height: 91px;
  border-color: #d991d8;
  opacity: 0.27;
}

.machine-caption {
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  color: #effbb4;
}

.is-working .coil-one {
  animation: coil-spin 0.5s linear infinite;
}

.is-working .coil-two {
  animation: coil-spin 0.8s linear infinite reverse;
}

.is-working .core {
  box-shadow: 0 0 70px #ddf3aacc, 0 0 120px #c27ff4aa;
}

.hybridizer-result {
  padding: clamp(10px, 1.5vw, 20px);
  display: flex;
  flex-direction: column;
}

.hybridizer-result h2 {
  font-size: clamp(0.95rem, 2vw, 2rem);
  line-height: 1.1;
  font-weight: 900;
  margin: 0.4rem 0 0.6rem;
}

.fusion-study,
.empty-study {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.fusion-study:before,
.empty-study:before {
  content: '';
  position: absolute;
  inset: 8% 10%;
  border-radius: 50%;
  background: radial-gradient(circle, #d2ef9b48, #9254c22a 48%, transparent 75%);
  z-index: -1;
}

.fusion-part {
  width: 52%;
  height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(3rem, 7vw, 7.5rem);
  filter: drop-shadow(0 15px 12px #171026);
  overflow: hidden;
}

.fusion-part:first-child {
  transform: rotate(-9deg) translateX(12%);
}

.fusion-part:nth-child(3) {
  transform: rotate(9deg) translateX(-12%);
}

.fusion-part img {
  height: 100%;
  width: 100%;
  object-fit: contain;
}

.fusion-lightning {
  font-size: clamp(3rem, 7vw, 7rem);
  color: #dfffa2;
  position: absolute;
  text-shadow: 0 0 19px #aaf1d4;
}

.empty-star {
  font-size: clamp(5rem, 10vw, 10rem);
  color: #e2f3a3;
  text-shadow: 0 0 45px #ddf8af;
}

.orb {
  position: absolute;
  width: 40%;
  height: 55%;
  border: 1px dashed #b29bc28a;
  border-radius: 50%;
}

.orb-a {
  transform: rotate(28deg);
}

.orb-b {
  transform: rotate(-43deg);
}

.orb-c {
  transform: rotate(80deg);
}

.result-foot {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 10px;
}

.study-label,
.result-hint {
  font-size: clamp(0.58rem, 0.85vw, 0.78rem);
  font-weight: 800;
  color: #ecd6f5;
  line-height: 1.4;
  letter-spacing: 0.03em;
}

.remix-button {
  color: #e6f5aa;
  border: 1px solid #b8d79388;
  border-radius: 10px;
  padding: 8px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.hybridizer-footer {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 0;
}

.fusion-button {
  padding: 13px 9px;
  background: #d5f28b;
  color: #251734;
  border: 2px solid #f0ffc7;
  border-radius: 16px;
  font-weight: 950;
  font-size: clamp(0.76rem, 1.1vw, 1rem);
  letter-spacing: 0.13em;
  box-shadow: 0 5px 0 #71965b66;
}

.fusion-button:disabled {
  opacity: 0.7;
  cursor: progress;
}

.lab-status {
  color: #dbc5e7;
  font-size: 0.75rem;
  line-height: 1.3;
}

.atlas-button {
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 12px;
  border-radius: 12px;
  background: #4b3163;
  border: 1px solid #b78ebc;
}

.ingredient-drawer {
  position: absolute;
  inset: clamp(8px, 1vw, 16px);
  background: #221833f7;
  border: 2px solid #c69bbd;
  border-radius: 22px;
  padding: clamp(10px, 1.6vw, 22px);
  box-shadow: 0 0 0 70px #130c2f88, 0 16px 30px #060409aa;
  z-index: 12;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 10px;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-head h2 {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 900;
}

.drawer-close {
  border: 1px solid #bd9cca;
  border-radius: 12px;
  padding: 8px 13px;
  font-size: 1.25rem;
}

.search-wrap input {
  width: 100%;
  background: #3d2d56;
  border: 1px solid #8d76a3;
  border-radius: 11px;
  padding: 11px;
  color: #fff;
}

.type-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.type-filters button {
  border: 1px solid #836f9d;
  border-radius: 18px;
  padding: 7px 11px;
  white-space: nowrap;
  font-size: 0.71rem;
  font-weight: 900;
}

.type-filters button.selected {
  background: #d4f089;
  color: #22162a;
  border-color: #e2ffc7;
}

.ingredient-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  align-content: start;
  gap: 9px;
}

.ingredient-option {
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: center;
  text-align: center;
  gap: 5px;
  border: 1px solid #987db1;
  border-radius: 14px;
  padding: 8px;
  background: linear-gradient(155deg, #35425b, #39234e);
}

.ingredient-option:hover,
.ingredient-option:focus-visible {
  border-color: #e0ffae;
}

.ingredient-option img {
  height: 85px;
  width: 100%;
  object-fit: contain;
}

.option-glyph {
  height: 85px;
  display: grid;
  place-items: center;
  font-size: 2.6rem;
}

.ingredient-option strong {
  font-size: 0.85rem;
  line-height: 1.12;
}

.ingredient-option small {
  font-size: 0.61rem;
  letter-spacing: 0.08em;
  color: #d8e3a6;
}

.empty-filter {
  grid-column: 1/-1;
  place-self: center;
  color: #dbcde4;
}

.drawer-foot {
  font-size: 0.7rem;
  color: #cfbcd9;
}

@keyframes coil-spin {
  to {
    transform: rotate(360deg);
  }
}

@container (max-width: 820px) {
  .hybridizer-stage {
    grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr);
    grid-template-rows: minmax(0, 0.46fr) minmax(0, 0.54fr);
  }
  .left-chamber {
    grid-column: 1;
    grid-row: 1;
  }
  .hybridizer-machine {
    grid-column: 2;
    grid-row: 1;
  }
  .right-chamber {
    grid-column: 3;
    grid-row: 1;
  }
  .hybridizer-result {
    grid-column: 1/4;
    grid-row: 2;
  }
  .specimen-glyph {
    font-size: clamp(3rem, 15vw, 7rem);
  }
  .hybridizer-footer {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .fusion-button {
    grid-column: 1/3;
  }
  .lab-status {
    grid-column: 1;
  }
  .atlas-button {
    grid-column: 2;
  }
  .result-foot {
    align-items: center;
  }
}

@container (max-width: 440px) {
  .hybridizer-header .lab-title {
    font-size: 1.46rem;
    letter-spacing: 0.085em;
  }
  .subtitle {
    font-size: 0.59rem;
  }
  .header-count {
    column-gap: 6px;
    letter-spacing: 0;
    font-size: 0.54rem;
  }
  .header-count strong {
    font-size: 0.9rem;
  }
  .hybridizer-console {
    padding: 8px;
    gap: 7px;
  }
  .hybridizer-stage {
    grid-template-columns: minmax(0, 1fr) 37px minmax(0, 1fr);
  }
  .specimen-chamber,
  .hybridizer-result {
    border-radius: 13px;
  }
  .specimen-chamber {
    padding: 7px;
  }
  .chamber-label strong {
    font-size: 0.82rem;
  }
  .chamber-label span {
    font-size: 0.53rem;
  }
  .chamber-bottom {
    font-size: 0.53rem;
  }
  .core {
    width: 38px;
    height: 38px;
    border-width: 5px;
    font-size: 1.8rem;
  }
  .coil {
    width: 45px;
    height: 45px;
  }
  .coil-two {
    width: 53px;
    height: 53px;
  }
  .machine-caption {
    font-size: 0.52rem;
  }
  .hybridizer-result {
    padding: 10px;
  }
  .hybridizer-result h2 {
    font-size: 1.13rem;
  }
  .study-label,
  .result-hint {
    font-size: 0.6rem;
  }
  .remix-button {
    font-size: 0.62rem;
    padding: 6px;
    white-space: normal;
  }
  .lab-status {
    font-size: 0.61rem;
  }
  .atlas-button {
    font-size: 0.61rem;
    padding: 8px;
  }
  .fusion-button {
    padding: 9px;
    font-size: 0.75rem;
  }
  .ingredient-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-working .coil,
  .specimen-chamber {
    animation: none;
    transition: none;
  }
}
</style>
