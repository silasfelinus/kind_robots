<!-- /components/content/icons/icon-gallery.vue -->
<template>
  <div class="container mx-auto p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-primary">Smart Icon Gallery</h1>

      <div class="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          class="btn btn-outline btn-sm rounded-xl"
          :disabled="smartbarStore.loading"
          @click="smartbarStore.fetchIcons(true)"
        >
          {{ smartbarStore.loading ? 'Refreshing...' : 'Refresh Icons' }}
        </button>

        <NuxtLink to="/addicon" class="btn btn-primary btn-sm rounded-xl">
          ➕ Add New Icon
        </NuxtLink>
      </div>
    </div>

    <!-- Custom Toggle -->
    <div
      class="flex items-center justify-between rounded-2xl border bg-base-100 p-4"
    >
      <div class="text-sm">
        <span class="font-semibold">Custom Icons:</span>
        <span class="ml-2">{{
          customIconsEnabled ? 'Enabled' : 'Disabled'
        }}</span>
      </div>
      <button
        class="btn btn-sm rounded-xl"
        :class="customIconsEnabled ? 'btn-secondary' : 'btn-outline'"
        @click="toggleCustom"
      >
        {{ customIconsEnabled ? 'Disable' : 'Enable' }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4">
      <select v-model="filterScope" class="select select-bordered rounded-lg">
        <option value="all">All Icons</option>
        <option value="user">My Icons</option>
        <option value="public">Public Only</option>
      </select>
      <select v-model="filterType" class="select select-bordered rounded-lg">
        <option value="">All Types</option>
        <option value="nav">Navigation</option>
        <option value="utility">Utility</option>
      </select>
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
