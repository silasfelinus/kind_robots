<template>
  <div
    class="plumber-album kr-scroll"
    :aria-label="view === 'endings' ? 'Ending gallery' : 'Collection album'"
  >
    <template v-if="view === 'collection'">
      <h2 class="plumber-album-heading">THE SOUVENIR CABINET</h2>
      <p class="plumber-album-summary">
        {{ clearedNodes.size }} cleared paths · {{ album.gears.length }} / 32
        Golden Gears · {{ album.heroines.length }} / 8 heroines
      </p>
      <div class="plumber-album-grid" aria-label="World medals">
        <figure
          v-for="world in worlds"
          :key="world.id"
          class="plumber-album-card"
          :class="{ 'is-locked': !world.bossCleared }"
        >
          <img
            :src="'/save-the-plumber/maps/world-' + world.id + '.webp'"
            :alt="world.name + ' map artwork'"
            loading="lazy"
          />
          <figcaption>
            <strong>WORLD {{ world.id }} · {{ world.name }}</strong>
            <span
              >{{ world.cleared }} / {{ world.total }} stages ·
              {{ world.gears }} gears</span
            >
            <span>{{
              world.bossCleared ? 'BOSS DEFEATED' : 'BOSS UNDISCOVERED'
            }}</span>
          </figcaption>
        </figure>
      </div>
      <h3 class="plumber-album-subheading">HEROINE RECORDS</h3>
      <div class="plumber-album-heroines" aria-label="Heroine memories">
        <figure
          v-for="member in heroines"
          :key="member.key"
          class="plumber-album-heroine"
          :class="{ 'is-locked': !member.played }"
        >
          <img
            :src="member.portrait"
            :alt="member.name + ' portrait'"
            loading="lazy"
          />
          <figcaption>
            {{ member.played ? member.name : 'NOT YET PLAYED' }}
          </figcaption>
        </figure>
      </div>
      <h3 class="plumber-album-subheading">LOCAL SAVE FILES</h3>
      <div class="plumber-album-files">
        <div
          v-for="(slot, index) in slots"
          :key="index"
          class="plumber-album-file"
        >
          <strong>FILE {{ index + 1 }}</strong>
          <template v-if="slot">
            <span>{{ heroineName(slot.heroine) }}</span>
            <span
              >{{ slot.done?.length ?? 0 }} stages ·
              {{ slot.gears?.length ?? 0 }} gears</span
            >
            <span
              >{{ slot.deaths ?? 0 }} falls ·
              {{ playedTime(slot.time ?? 0) }}</span
            >
          </template>
          <span v-else>EMPTY FILE</span>
        </div>
      </div>
      <p class="plumber-album-footnote">
        Souvenirs stay in this device's collection even if a local run slot is
        replaced. Save files themselves remain device-local.
      </p>
    </template>
    <template v-else>
      <h2 class="plumber-album-heading">THE ENDING GALLERY</h2>
      <p class="plumber-album-summary">
        {{ album.endings.length }} discovered ending · More outcomes are being
        developed
      </p>
      <figure
        class="plumber-album-finale"
        :class="{ 'is-locked': !finaleEarned }"
      >
        <img
          :src="finaleArt"
          :alt="
            finaleEarned
              ? 'The rivers return home'
              : 'Undiscovered finale artwork'
          "
          loading="lazy"
        />
        <figcaption>
          <strong>{{
            finaleEarned ? 'THE RIVERS RUN HOME' : 'ENDING UNDISCOVERED'
          }}</strong>
          <span>
            {{
              finaleEarned
                ? 'Lady Spigot releases the last river. Your heroine frees Teo.'
                : 'Reach the end of World 8 to unlock this memory.'
            }}
          </span>
        </figcaption>
      </figure>
      <h3 class="plumber-album-subheading">BOSS MEMORIES</h3>
      <div class="plumber-album-bosses">
        <div v-for="world in worlds" :key="world.id" class="plumber-album-boss">
          <span aria-hidden="true">{{ world.bossCleared ? '✦' : '◇' }}</span>
          <strong>{{ world.bossCleared ? world.boss : 'UNDEFEATED' }}</strong>
          <small>WORLD {{ world.id }}</small>
        </div>
      </div>
      <p class="plumber-album-footnote">
        Only outcomes actually present in the game appear as unlockable endings.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PLUMBER_ART } from '~/utils/arcade/games/savePlumberArt'
import { stageNode } from '~/utils/arcade/games/savePlumberOverworld'
import {
  PLUMBER_ROSTER,
  rosterHeroine,
  rosterPortrait,
} from '~/utils/arcade/games/savePlumberRoster'
import type {
  PlumberAlbum,
  PlumberSlot,
} from '~/utils/arcade/games/savePlumberSave'
import { PLUMBER_WORLDS } from '~/utils/arcade/games/savePlumberWorlds'

const props = defineProps<{
  view: 'collection' | 'endings'
  album: PlumberAlbum
  slots: (PlumberSlot | null)[]
}>()

const clearedNodes = computed(
  () => new Set([...props.album.done, ...props.album.secrets]),
)
const collectedGears = computed(() => new Set(props.album.gears))
const worlds = computed(() =>
  PLUMBER_WORLDS.map((world) => {
    const cleared = world.stages.filter((stage) => {
      const id = stageNode(stage.code)?.id
      return id && clearedNodes.value.has(id)
    }).length
    const bossId = stageNode(world.stages[world.stages.length - 1]!.code)?.id
    return {
      id: world.id,
      name: world.name,
      boss: world.boss.name,
      total: world.stages.length,
      cleared,
      gears: world.stages.filter((stage) =>
        collectedGears.value.has(stage.code),
      ).length,
      bossCleared: bossId ? clearedNodes.value.has(bossId) : false,
    }
  }),
)
const heroines = computed(() =>
  PLUMBER_ROSTER.map((member, index) => ({
    key: member.key,
    name: member.name,
    portrait: rosterPortrait(member),
    played: props.album.heroines.includes(index),
  })),
)
const finaleEarned = computed(() =>
  props.album.endings.includes('rivers-run-home'),
)
const finaleArt = PLUMBER_ART.cutscene('finale-reversal')

function heroineName(seed: number): string {
  return rosterHeroine(seed).name
}
function playedTime(seconds: number): string {
  return Math.floor(seconds / 60) + ' min played'
}
</script>

<style scoped>
.plumber-album {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 4rem clamp(0.7rem, 2vw, 2rem) 1.5rem;
  overflow-y: auto;
  background: linear-gradient(
    110deg,
    rgba(6, 19, 31, 0.94),
    rgba(9, 38, 50, 0.94)
  );
  color: #fff5df;
}
.plumber-album-heading {
  font-size: clamp(1.2rem, 3vw, 2.3rem);
  font-weight: 1000;
  letter-spacing: 0.04em;
}
.plumber-album-summary,
.plumber-album-footnote {
  color: #fbd090;
  font-size: 0.85rem;
  margin: 0.35rem 0 0.9rem;
}
.plumber-album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.6rem;
}
.plumber-album-card,
.plumber-album-finale {
  position: relative;
  overflow: hidden;
  border: 1px solid #6f9ca3;
  border-radius: 0.6rem;
  background: #09212f;
}
.plumber-album-card img {
  width: 100%;
  height: 9rem;
  object-fit: cover;
}
.plumber-album-card figcaption,
.plumber-album-finale figcaption {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.55rem;
  font-size: 0.72rem;
}
.plumber-album-card figcaption strong,
.plumber-album-finale figcaption strong {
  color: #fbd090;
}
.plumber-album-card.is-locked img,
.plumber-album-heroine.is-locked img,
.plumber-album-finale.is-locked img {
  filter: grayscale(1) brightness(0.3) blur(3px);
}
.plumber-album-subheading {
  margin: 1.1rem 0 0.5rem;
  font-size: 0.85rem;
  letter-spacing: 0.16em;
  font-weight: 900;
  color: #fbd090;
}
.plumber-album-heroines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr));
  gap: 0.5rem;
}
.plumber-album-heroine {
  overflow: hidden;
  border-radius: 0.45rem;
  border: 1px solid #6f9ca3;
  background: #0d2635;
  text-align: center;
  font-size: 0.6rem;
}
.plumber-album-heroine img {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}
.plumber-album-heroine figcaption {
  padding: 0.3rem;
}
.plumber-album-files,
.plumber-album-bosses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.5rem;
}
.plumber-album-file,
.plumber-album-boss {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.65rem;
  border: 1px solid #6f9ca3;
  border-radius: 0.45rem;
  background: #102b3a;
  font-size: 0.72rem;
}
.plumber-album-file strong,
.plumber-album-boss strong {
  color: #fbd090;
}
.plumber-album-finale {
  max-width: 42rem;
}
.plumber-album-finale img {
  width: 100%;
  max-height: 18rem;
  object-fit: cover;
}
.plumber-album-finale figcaption {
  font-size: 0.9rem;
}
.plumber-album-boss small {
  color: #b9d5d9;
}
@media (max-width: 500px) {
  .plumber-album {
    padding-inline: 0.55rem;
  }
  .plumber-album-card img {
    height: 6rem;
  }
}
</style>
