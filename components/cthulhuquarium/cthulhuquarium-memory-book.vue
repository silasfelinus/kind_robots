<!-- components/cthulhuquarium/cthulhuquarium-memory-book.vue
     The Memory Book (conductor cthulhuquarium/t-104): every Charlotte and
     Wilbur scene the player has seen, as an illustrated card to watch again,
     in the order of the descent. Scenes not reached yet stand as dark,
     untitled cards. Reads the store only; replaying goes through
     tankStore.replayScene(), which records nothing. -->
<template>
  <section class="cq-memory-book" aria-labelledby="cq-memory-title">
    <header class="cq-memory-head">
      <h4 id="cq-memory-title" class="cq-section-title">Memory Book</h4>
      <span class="cq-memory-count tabular-nums">
        {{ seenCount }} of {{ memories.length }} remembered
      </span>
    </header>
    <!-- cthulhuquarium/t-100: the three soft endings, each with its plate. The
         tank goes on after every one of them. -->
    <div class="cq-memory-head">
      <h5 class="cq-memory-subtitle">Endings</h5>
      <span class="cq-memory-count tabular-nums">
        {{ endingsSeen }} of {{ endings.length }} reached
      </span>
    </div>
    <ul class="cq-memory-grid cq-endings" role="list">
      <li v-for="ending in endings" :key="ending.id">
        <button
          v-if="ending.seen"
          type="button"
          data-nav
          class="cq-memory-card cq-ending-card"
          :aria-label="`Watch again: ${ending.title}, an ending`"
          @click="replay(ending.id)"
        >
          <img
            v-if="ending.art"
            :src="ending.art"
            alt=""
            loading="lazy"
            class="cq-memory-art"
          />
          <span class="cq-memory-eyebrow">An ending</span>
          <span class="cq-memory-title">{{ ending.title }}</span>
          <Icon name="kind-icon:play" class="cq-memory-play" />
        </button>
        <div
          v-else
          class="cq-memory-card cq-memory-locked"
          :aria-label="`An ending not yet reached. ${ending.hint}`"
        >
          <span class="cq-memory-eyebrow">An ending</span>
          <span class="cq-memory-title">{{ ending.hint }}</span>
        </div>
      </li>
    </ul>
    <div class="cq-memory-head">
      <h5 class="cq-memory-subtitle">Scenes</h5>
    </div>
    <ul class="cq-memory-grid kr-scroll" role="list">
      <li v-for="memory in memories" :key="memory.id">
        <button
          v-if="memory.seen"
          type="button"
          data-nav
          class="cq-memory-card"
          :aria-label="`Watch again: ${memory.title}`"
          :title="memory.floorName || undefined"
          @click="replay(memory.id)"
        >
          <img
            v-if="memory.art"
            :src="memory.art"
            alt=""
            loading="lazy"
            class="cq-memory-art"
          />
          <span class="cq-memory-eyebrow">{{ memory.eyebrow }}</span>
          <span class="cq-memory-title">{{ memory.title }}</span>
          <Icon name="kind-icon:play" class="cq-memory-play" />
        </button>
        <div
          v-else
          class="cq-memory-card cq-memory-locked"
          :aria-label="`Not yet remembered. ${memory.eyebrow} ${memory.floorName}`"
        >
          <span class="cq-memory-eyebrow">{{ memory.eyebrow }}</span>
          <span class="cq-memory-title">Not yet</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCthulhuquariumTankStore } from '~/stores/cthulhuquariumTankStore'
import { backgroundArt, plateArt } from '~/utils/cthulhuquariumArt'
import { floorInfo } from '~/utils/cthulhuquariumFloors'
import { CTHULHUQUARIUM_SCENES } from '~/utils/cthulhuquariumCanon.generated'

const emit = defineEmits<{ replay: [] }>()
const tankStore = useCthulhuquariumTankStore()

// The descent's order: the arrival, each floor's scenes from the top down,
// then the scenes that belong to no floor, then the end of the book.
const ORDER_LAST = ['bestiary_complete', 'after_the_last_aquarium']

const memories = computed(() => {
  const scenes = Object.values(CTHULHUQUARIUM_SCENES)
  const ordered = [
    ...scenes
      .filter((scene) => scene.floor !== null)
      .sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0)),
    ...scenes.filter(
      (scene) => scene.floor === null && !ORDER_LAST.includes(scene.id),
    ),
    ...ORDER_LAST.map((id) => CTHULHUQUARIUM_SCENES[id]).filter(
      (scene) => !!scene,
    ),
  ]
  return ordered.map((scene) => {
    const floor = scene.floor ? floorInfo(scene.floor) : null
    return {
      id: scene.id,
      title: scene.title,
      seen: tankStore.hasSeen(scene.id),
      eyebrow: floor ? `Floor ${floor.numeral}` : 'The shop',
      floorName: floor?.name ?? '',
      art:
        plateArt(scene.plate) ??
        backgroundArt(scene.background) ??
        backgroundArt(floor?.background ?? 'parlour'),
    }
  })
})
// The three soft endings (Silas, 2026-11-21): the book complete, the last
// floor reached, and the Last Aquarium bought.
const ENDINGS: ReadonlyArray<{ id: string; hint: string }> = [
  { id: 'bestiary_complete', hint: 'Know every species' },
  { id: 'milestone_bestiary_95', hint: 'Keep going down' },
  {
    id: 'after_the_last_aquarium',
    hint: 'The most expensive thing in the shop',
  },
]
const endings = computed(() =>
  ENDINGS.map(({ id, hint }) => {
    const scene = CTHULHUQUARIUM_SCENES[id]
    return {
      id,
      hint,
      title: scene?.title ?? id,
      seen: tankStore.hasSeen(id),
      art:
        plateArt(scene?.plate) ??
        backgroundArt(scene?.background) ??
        backgroundArt('the-reading-room'),
    }
  }),
)
const endingsSeen = computed(
  () => endings.value.filter((ending) => ending.seen).length,
)

const seenCount = computed(
  () => memories.value.filter((memory) => memory.seen).length,
)

function replay(id: string) {
  emit('replay')
  tankStore.replayScene(id)
}
</script>

<style scoped>
.cq-memory-book {
  display: grid;
  gap: 0.6rem;
}
.cq-memory-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.cq-memory-subtitle {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(216 181 106);
}
.cq-ending-card {
  border-color: rgb(216 181 106 / 0.8);
}
.cq-memory-count {
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.65);
}
.cq-memory-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(9.5rem, 11rem);
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
}
.cq-endings {
  /* Three cards: they share the width instead of scrolling, so the book
     keeps one scroll region (the scenes shelf). */
  grid-auto-flow: row;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow-x: visible;
}
.cq-memory-card {
  position: relative;
  display: flex;
  aspect-ratio: 16 / 10;
  width: 100%;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.15rem;
  overflow: hidden;
  border: 1px solid rgb(216 181 106 / 0.45);
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #0b2a33, #050f18);
  padding: 0.5rem 0.6rem;
  text-align: left;
  color: white;
}
.cq-memory-card:focus-visible,
.cq-memory-card:hover {
  border-color: rgb(153 246 228);
  outline: none;
}
.cq-memory-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.cq-memory-card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, transparent 30%, rgb(3 12 20 / 0.92));
}
.cq-memory-eyebrow,
.cq-memory-title,
.cq-memory-play {
  position: relative;
  z-index: 1;
}
.cq-memory-eyebrow {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(153 246 228 / 0.85);
}
.cq-memory-title {
  font-family: var(--cq-display, ui-serif, Georgia, serif);
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.15;
}
.cq-memory-play {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  height: 1.1rem;
  width: 1.1rem;
  opacity: 0.85;
}
.cq-memory-locked {
  border-style: dashed;
  border-color: rgb(255 255 255 / 0.2);
  background: repeating-linear-gradient(
    135deg,
    #06141c 0 8px,
    #081a24 8px 16px
  );
  color: rgb(255 255 255 / 0.45);
}
.cq-memory-locked::after {
  display: none;
}
</style>
