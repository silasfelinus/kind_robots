<!-- /components/content/icons/icon-gallery.vue -->
<template>
  <div class="container mx-auto space-y-2 p-3">
    <!--
      ONE HEADER ROW, THEN THE SHELL'S TOOLBAR. This page previously stacked
      FOUR full-width blocks before the first icon: a text-3xl title row, a
      `p-4` bordered panel holding a single Custom Icons toggle, a row of two
      full-size selects, and then kr-gallery's own mode bar. The chrome audit
      measured /icons over its whole budget at every width -- the worst of any
      gallery route.

      The title and its two actions stay as one row; the toggle and the two
      filters move into the shell's `#toolbar` slot, which exists exactly so
      filters share the mode bar's line instead of claiming rows of their own.
      Same move reward-gallery already made.
    -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold text-primary">Smart Icon Gallery</h1>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-outline btn-xs rounded-xl"
          :disabled="smartbarStore.loading"
          @click="smartbarStore.fetchIcons(true)"
        >
          {{ smartbarStore.loading ? 'Refreshing...' : 'Refresh' }}
        </button>

        <NuxtLink to="/addicon" class="btn btn-primary btn-xs rounded-xl">
          ➕ Add New Icon
        </NuxtLink>
      </div>
    </div>

    <!-- The shared shell owns the grid, the Cards/Heroes/Icons bar, and the
         loading and empty states; icon-card stays the card. Smart Icons are
         glyphs rather than art, so the #item slot replaces kr-gallery's default
         card outright instead of handing it an image to resolve. -->
    <kr-gallery
      :items="galleryItems"
      :mode="galleryMode"
      :loading="smartbarStore.loading"
      empty-label="icons"
      @update:mode="galleryMode = $event"
    >
      <template #toolbar>
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="filterScope"
            class="select select-bordered select-xs rounded-lg"
            aria-label="Filter icons by scope"
          >
            <option value="all">All Icons</option>
            <option value="user">My Icons</option>
            <option value="public">Public Only</option>
          </select>

          <select
            v-model="filterType"
            class="select select-bordered select-xs rounded-lg"
            aria-label="Filter icons by type"
          >
            <option value="">All Types</option>
            <option value="nav">Navigation</option>
            <option value="utility">Utility</option>
          </select>

          <button
            class="btn btn-xs rounded-xl"
            :class="customIconsEnabled ? 'btn-secondary' : 'btn-outline'"
            :aria-pressed="customIconsEnabled"
            @click="toggleCustom"
          >
            Custom icons: {{ customIconsEnabled ? 'On' : 'Off' }}
          </button>
        </div>
      </template>

      <template #item="{ item }">
        <icon-card
          v-if="iconById.get(Number(item.id))"
          :icon="iconById.get(Number(item.id))!"
          :in-smart-bar="isInSmartBar(Number(item.id))"
          :can-edit="isAdmin"
          @edit="openEditModal"
          @toggle="toggleIcon"
        />
      </template>
    </kr-gallery>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="selectedIcon"
        class="fixed inset-0 z-50 bg-base-200/90 backdrop-blur-md flex items-center justify-center p-4"
        @click.self="selectedIcon = null"
      >
        <edit-icon
          :icon="selectedIcon"
          @close="selectedIcon = null"
          style="max-height: 95vh; overflow-y: auto"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import type { GalleryMode } from '@/utils/galleryVocabulary'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useUserStore } from '@/stores/userStore'

const smartbarStore = useSmartbarStore()
const userStore = useUserStore()

const { icons, smartBarIds, customIconsEnabled } = storeToRefs(smartbarStore)
const { user } = storeToRefs(userStore)

const selectedIcon = ref<SmartIcon | null>(null)

const filterScope = ref<'all' | 'user' | 'public'>('all')
const filterType = ref('')
const galleryMode = ref<GalleryMode>('cards')

const isAdmin = computed(() => userStore.isAdmin)

function openEditModal(icon: SmartIcon) {
  selectedIcon.value = icon
}

const LOCKED_ICON_IDS = new Set([1, 2, 3, 8])

const filteredIcons = computed(() =>
  icons.value.filter((i: SmartIcon) => {
    if (LOCKED_ICON_IDS.has(i.id)) return false
    if (filterScope.value === 'user' && i.userId !== user.value?.id)
      return false
    if (filterScope.value === 'public' && !i.isPublic) return false
    if (filterType.value && i.type !== filterType.value) return false
    return true
  }),
)

/*
 * kr-gallery takes GalleryItems and hands one back to the #item slot, so the
 * card reaches its record through this map. Title falls back to the icon's own
 * name so the shared empty/loading states have something to say.
 */
const galleryItems = computed<GalleryItem[]>(() =>
  filteredIcons.value.map((icon) => ({
    id: icon.id,
    title: icon.label || icon.title || `Icon ${icon.id}`,
    description: icon.description || undefined,
  })),
)

const iconById = computed(
  () => new Map(filteredIcons.value.map((icon) => [icon.id, icon])),
)

function isInSmartBar(id: number) {
  return smartBarIds.value.includes(id)
}

async function toggleCustom() {
  await smartbarStore.toggleCustomIcons(!customIconsEnabled.value)
}

async function toggleIcon(id: number) {
  if (isInSmartBar(id)) {
    await smartbarStore.removeIconFromSmartBar(id)
  } else {
    await smartbarStore.addIconToSmartBar(id)
  }
}

onMounted(async () => {
  await smartbarStore.initialize({
    hydrate: true,
    refresh: true,
  })
})
</script>
