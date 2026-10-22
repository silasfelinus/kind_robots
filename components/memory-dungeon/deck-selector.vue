<template>
  <div class="w-full text-[#f7e6c7]">
    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <button
        v-for="choice in families"
        :key="choice.key"
        type="button"
        class="group relative min-h-24 overflow-hidden rounded-xl border-2 bg-[#25312f] text-left shadow-lg transition hover:-translate-y-0.5 hover:border-[#ead39c] focus-visible:outline-2 focus-visible:outline-[#ffe6a0] sm:min-h-40"
        :class="
          selected.family === choice.key
            ? 'border-[#ffe29a] shadow-[#f5c66c]/20'
            : 'border-[#8f7a57]/50'
        "
        :aria-pressed="selected.family === choice.key"
        @click="choose({ family: choice.key })"
      >
        <div class="absolute inset-0 grid grid-cols-3">
          <img
            v-for="(photo, index) in preview(choice.key)"
            :key="choice.key + index"
            :src="photo"
            alt=""
            class="h-full w-full object-cover opacity-90"
          />
        </div>
        <div
          class="absolute inset-0 bg-linear-to-t from-[#182324] via-[#182324]/40 to-transparent"
        ></div>
        <div class="absolute bottom-0 p-2 sm:p-3">
          <p class="text-xs font-black drop-shadow sm:text-base">
            {{ choice.title }}
          </p>
          <p class="mt-0.5 hidden text-xs text-[#f5e4c8]/85 sm:block">
            {{ choice.description }}
          </p>
        </div>
        <span
          v-if="selected.family === choice.key"
          class="absolute right-2 top-2 rounded-full bg-[#ebd098] px-2 py-1 text-xs font-black text-[#2e362c]"
          >✓</span
        >
      </button>
    </div>

    <div
      class="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-[#bea070]/40 bg-[#1e2c2a]/90 p-2 text-xs sm:mt-3 sm:p-3"
    >
      <template v-if="selected.family === 'designed'">
        <span class="font-semibold"
          >✦ Eight illustrated fantasy motifs. Two-card matching with original
          game art.</span
        >
      </template>
      <template v-else-if="selected.family === 'gallery'">
        <label class="flex items-center gap-1.5">
          <span class="font-semibold">Gallery:</span>
          <select
            class="rounded-md border border-[#bdac7c] bg-[#2c3b35] p-1.5 text-[#f8edce]"
            :value="selected.gallery"
            @change="
              choose({
                gallery:
                  ($event.target as HTMLSelectElement).value === 'collections'
                    ? 'collections'
                    : 'all',
              })
            "
          >
            <option value="all">All public images</option>
            <option value="collections">Chosen collection(s)</option>
          </select>
        </label>
        <button
          v-if="selected.gallery === 'collections'"
          type="button"
          class="rounded-lg border border-[#bdac7c] bg-[#405141] px-3 py-1.5 font-bold hover:bg-[#526c50]"
          @click="collectionsOpen = !collectionsOpen"
        >
          {{
            collectionsOpen ? 'Hide collection gallery' : 'Choose collections'
          }}
          · {{ selected.collectionIds.length }}
        </button>
      </template>
      <template v-else>
        <label class="flex items-center gap-2">
          <span class="font-bold">Worlds of Kind Robots:</span>
          <select
            class="rounded-md border border-[#bdac7c] bg-[#2c3b35] p-1.5 text-[#f8edce]"
            :value="selected.entityKind"
            @change="
              choose({
                entityKind: ($event.target as HTMLSelectElement)
                  .value as DungeonEntityKind,
              })
            "
          >
            <option v-for="entity in kinds" :key="entity.id" :value="entity.id">
              {{ entity.label }}
            </option>
          </select>
        </label>
      </template>

      <label
        v-if="selected.family !== 'designed'"
        class="ml-auto flex items-center gap-2 rounded-lg bg-[#29352d] px-2 py-1.5"
      >
        <input
          type="checkbox"
          class="accent-amber-300"
          :checked="selected.includeMature && matureAvailable"
          :disabled="!matureAvailable"
          @change="
            choose({
              includeMature: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        <span>Include mature, public art</span>
      </label>
      <span
        v-if="selected.family !== 'designed' && !matureAvailable"
        class="text-[11px] text-[#e1c4a6]"
      >
        Mature art follows your account visibility setting.
      </span>
      <span
        v-if="selected.family !== 'designed'"
        class="w-full text-[11px] text-[#e0cdad]"
      >
        Private and inactive records are always excluded. A room requires at
        least 3 distinct loadable images, 4 for the Vault's last chamber.
      </span>
    </div>
    <div
      v-if="
        selected.family === 'gallery' &&
        selected.gallery === 'collections' &&
        collectionsOpen
      "
      class="mt-2"
    >
      <collection-picker
        title="Choose art collections"
        :mode="selected.collectionIds.length ? 'collections' : 'all'"
        :collection-id="null"
        :collection-ids="selected.collectionIds"
        @change="pickCollections"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtStore } from '~/stores/artStore'
import {
  DESIGNED_DUNGEON_ART,
  imageUrlForDeck,
  isEligibleDungeonArt,
  type DungeonDeckSelection,
  type DungeonDeckFamily,
  type DungeonEntityKind,
} from '~/utils/memoryDungeonDeck'
import type { CollectionPickerMode } from '@/components/art/collection-picker.vue'

const props = defineProps<{
  selected: DungeonDeckSelection
  matureAvailable: boolean
}>()
const emit = defineEmits<{ change: [choice: Partial<DungeonDeckSelection>] }>()
const artStore = useArtStore()
const collectionsOpen = ref(false)
const families: {
  key: DungeonDeckFamily
  title: string
  description: string
}[] = [
  {
    key: 'designed',
    title: 'Enchanted Deck',
    description: 'Original painted sigils',
  },
  { key: 'gallery', title: 'Your Art', description: 'Random gallery memories' },
  {
    key: 'entities',
    title: 'Kind Robots',
    description: 'Dreams and creations',
  },
]
const kinds: { id: DungeonEntityKind; label: string }[] = [
  { id: 'dreams', label: 'Dreams' },
  { id: 'characters', label: 'Characters' },
  { id: 'bots', label: 'Bots' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'facets', label: 'Facets' },
]
const publicPreview = computed(() =>
  artStore.artImages
    .filter((image) =>
      isEligibleDungeonArt(
        image,
        props.selected.includeMature,
        props.matureAvailable,
      ),
    )
    .map(imageUrlForDeck)
    .filter(Boolean)
    .slice(0, 3),
)

function preview(family: DungeonDeckFamily): string[] {
  if (family === 'designed')
    return DESIGNED_DUNGEON_ART.slice(0, 3).map((art) => art.imagePath)
  if (family === 'gallery')
    return publicPreview.value.length
      ? publicPreview.value
      : ['/images/background/memorydungeon.webp']
  return DESIGNED_DUNGEON_ART.slice(4, 7).map((art) => art.imagePath)
}
function choose(update: Partial<DungeonDeckSelection>): void {
  emit('change', update)
}
function pickCollections(value: {
  mode: CollectionPickerMode
  collectionId: number | null
  collectionIds: number[]
}): void {
  if (value.mode === 'manual') return
  const ids = value.collectionId ? [value.collectionId] : value.collectionIds
  choose({ gallery: ids.length ? 'collections' : 'all', collectionIds: ids })
}
</script>
