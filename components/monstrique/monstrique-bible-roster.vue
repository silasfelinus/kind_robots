<template>
  <nav
    class="kr-scroll mb-roster grid min-h-0 shrink-0 auto-rows-max grid-cols-3 gap-2 overflow-y-auto @md:grid-cols-4 @3xl:w-[22rem] @3xl:grid-cols-2"
    aria-label="Monstrique cast"
  >
    <template v-for="group in groups" :key="group.label">
      <p class="mb-eyebrow col-span-full pt-1">{{ group.label }}</p>
      <button
        v-for="key in group.keys"
        :key="key"
        type="button"
        class="mb-card"
        :class="{ 'is-active': bible.selectedKey === key }"
        :aria-pressed="bible.selectedKey === key"
        :data-testid="'bible-card-' + key"
        @click="choose(key)"
      >
        <span class="mb-card-art">
          <img v-if="coverOf(key)" :src="coverOf(key)!" alt="" loading="lazy" />
          <MonstriqueCharacterSprite
            v-else
            class="mb-card-sprite"
            :character="key"
            bust
          />
        </span>
        <span class="mb-card-name">{{ bible.nameOf(key) }}</span>
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMonstriqueBibleStore } from '~/stores/monstriqueBibleStore'
import {
  CHARACTER_IDS,
  CHARACTER_MODELS,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'

const bible = useMonstriqueBibleStore()
const INVESTIGATORS: MonstriqueCharacterId[] = ['iris', 'norb']
const GHOSTS: MonstriqueCharacterId[] = ['odette', 'violet']
const groups = computed(() => [
  { label: 'Investigators', keys: INVESTIGATORS },
  { label: 'Ghosts', keys: GHOSTS },
  {
    label: 'Monster stars',
    keys: CHARACTER_IDS.filter((id) => CHARACTER_MODELS[id].monsterStar),
  },
  {
    label: 'Midnight City',
    keys: CHARACTER_IDS.filter(
      (id) =>
        !CHARACTER_MODELS[id].monsterStar &&
        !INVESTIGATORS.includes(id) &&
        !GHOSTS.includes(id),
    ),
  },
])

function coverOf(key: MonstriqueCharacterId): string | null {
  return bible.coverOf(key)
}

function choose(key: MonstriqueCharacterId): void {
  bible.selectedKey = key
  bible.message = ''
}
</script>

<style scoped>
.mb-eyebrow {
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.7;
}
.mb-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  border: 2px solid transparent;
  background: var(--color-base-200);
  text-align: left;
}
.mb-card.is-active {
  border-color: var(--color-primary);
}
.mb-card-art {
  display: grid;
  place-items: center;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: linear-gradient(160deg, #2a1d3a, #120d18);
}
.mb-card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mb-card-sprite {
  width: 80%;
}
.mb-card-name {
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
