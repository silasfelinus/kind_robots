<!-- /components/content/icons/icon-gallery.vue -->
<template>
  <div class="container mx-auto p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-primary">Smart Icon Gallery</h1>
      <NuxtLink to="/addicon" class="btn btn-primary btn-sm rounded-xl">
        ➕ Add New Icon
      </NuxtLink>
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

    <!-- Icon Grid -->
    <div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6">
      <div
        v-for="icon in filteredIcons"
        :key="icon.id"
        class="relative group p-4 border-2 rounded-2xl bg-base-100 shadow-md flex flex-col items-center gap-2"
        :class="{
          'border-primary/30': icon.type === 'nav',
          'border-secondary/30': icon.type === 'utility',
          'border-base-300': !icon.type,
        }"
      >
        <!-- Type badge -->
        <span
          class="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
          :class="{
            'bg-primary/10 text-primary': icon.type === 'nav',
            'bg-secondary/10 text-secondary': icon.type === 'utility',
            'bg-base-300 text-base-content/40': !icon.type,
          }"
        >
          {{ icon.type || '?' }}
        </span>

        <Icon :name="icon.icon || 'kind-icon:help'" class="text-4xl mt-3" />

        <div class="text-center text-sm font-medium">
          {{ icon.label || icon.title }}
        </div>

        <div v-if="icon.description" class="text-center text-sm font-medium">
          {{ icon.description }}
        </div>

        <button
          v-if="isAdmin"
          class="mt-1 text-[10px] underline text-blue-500 hover:text-blue-700"
          @click="openEditModal(icon)"
        >
          Edit Details
        </button>

        <button
          class="btn btn-xs mt-1 rounded-xl"
          :class="{
            'btn-secondary': isInSmartBar(icon.id),
            'btn-outline': !isInSmartBar(icon.id),
          }"
          @click="toggleIcon(icon.id)"
        >
          {{ isInSmartBar(icon.id) ? 'Remove' : 'Add' }}
        </button>
      </div>
    </div>

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
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useUserStore } from '@/stores/userStore'

const smartbarStore = useSmartbarStore()
const userStore = useUserStore()

const { icons, smartBarIds, customIconsEnabled } = storeToRefs(smartbarStore)
const { user } = storeToRefs(userStore)

const selectedIcon = ref<SmartIcon | null>(null)

const filterScope = ref<'all' | 'user' | 'public'>('all')
const filterType = ref('')

const isAdmin = computed(() => userStore.isAdmin)

function openEditModal(icon: SmartIcon) {
  selectedIcon.value = icon
}

const filteredIcons = computed(() =>
  icons.value.filter((i: SmartIcon) => {
    if (filterScope.value === 'user' && i.userId !== user.value?.id)
      return false
    if (filterScope.value === 'public' && !i.isPublic) return false
    if (filterType.value && i.type !== filterType.value) return false
    return true
  }),
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
</script>
