<!-- /components/content/story/icon-gallery.vue -->
<template>
  <div class="container mx-auto p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-primary">Smart Icon Gallery</h1>
      <NuxtLink to="/addicon" class="btn btn-primary btn-sm rounded-xl">
        ➕ Add New Icon
      </NuxtLink>
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
    <div class="grid grid-cols-[repeat(auto-fit,_minmax(140px,_1fr))] gap-6">
      <div
        v-for="icon in filteredIcons"
        :key="icon.id"
        class="relative group p-4 border rounded-2xl bg-base-100 shadow-md flex flex-col items-center gap-2"
      >
        <Icon :name="icon.icon || 'lucide:help-circle'" class="text-4xl" />
        <div class="text-center text-sm font-medium">
          {{ icon.label || icon.title }}
        </div>

        <button
          class="btn btn-xs mt-1"
          @click="toggleIcon(icon.id)"
          :class="{
            'btn-secondary': isInSmartBar(icon.id),
            'btn-outline': !isInSmartBar(icon.id),
          }"
        >
          {{ isInSmartBar(icon.id) ? 'Remove' : 'Add' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useIconStore } from '@/stores/iconStore'
import { useUserStore } from '@/stores/userStore'

const iconStore = useIconStore()
const userStore = useUserStore()

const { icons, smartBarIds } = storeToRefs(iconStore)
const { user } = storeToRefs(userStore)

const filterScope = ref<'all' | 'user' | 'public'>('all')
const filterType = ref('')

// Fetch if not loaded
onMounted(() => {
  if (!iconStore.isInitialized) iconStore.initialize()
})

const filteredIcons = computed(() =>
  icons.value.filter((i) => {
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

function toggleIcon(id: number) {
  const updated = isInSmartBar(id)
    ? smartBarIds.value.filter((x) => x !== id)
    : [...smartBarIds.value, id]
  iconStore.updateSmartBar(updated)
}
</script>
