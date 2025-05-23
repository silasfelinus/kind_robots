<!-- /components/content/blueprints/blueprint-gallery.vue -->
<template>
  <div class="bg-base-300 p-6 min-h-screen">
    <!-- Add New Blueprint Button -->
    <div class="flex justify-end mb-4">
      <button
        class="bg-primary text-white p-3 rounded-lg hover:bg-primary-focus transition"
        @click="showAddBlueprint = true"
      >
        ➕ Add New Blueprint
      </button>
    </div>

    <!-- Detailed Blueprint View -->
    <div
      v-if="blueprintStore.selectedItem"
      class="p-6 bg-white rounded-lg shadow-lg"
    >
      <div class="text-center mb-4">
        <img
          v-if="blueprintStore.selectedItem.coverArtId"
          :src="coverArtUrl(blueprintStore.selectedItem.coverArtId)"
          alt="Blueprint Cover"
          class="rounded-lg shadow-md w-48 h-48 object-cover mx-auto mb-4"
        />

        <h1 class="text-3xl font-bold mb-2">
          {{ blueprintStore.selectedItem.title }}
        </h1>
        <p class="text-lg text-gray-600 mb-2">
          🛠 Designer: {{ blueprintStore.selectedItem.userId }}
        </p>
        <p class="text-lg text-gray-600">
          🔓 {{ blueprintStore.selectedItem.isPublic ? 'Public' : 'Private' }}
        </p>
      </div>
      <div class="flex justify-center gap-4 mt-4">
        <button
          class="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-focus transition"
          @click="deselectBlueprint"
        >
          Back
        </button>
        <button
          class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-focus transition"
          @click="showEditBlueprint = true"
        >
          ✏️ Edit
        </button>
      </div>
    </div>

    <!-- Add/Edit Forms -->
    <div v-if="showAddBlueprint" class="mt-6">
      <add-blueprint @close="showAddBlueprint = false" />
    </div>

    <div v-if="showEditBlueprint" class="mt-6">
      <edit-blueprint @close="showEditBlueprint = false" />
    </div>

    <!-- Blueprint Grid -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6"
    >
      <div
        v-for="blueprint in blueprintStore.items"
        :key="blueprint.id"
        class="bg-white p-4 rounded-xl shadow hover:shadow-lg cursor-pointer transition"
        @click="selectBlueprint(blueprint.id)"
      >
        <img
          v-if="blueprint.coverArtId"
          :src="coverArtUrl(blueprint.coverArtId)"
          alt="Cover"
          class="w-full h-32 object-cover rounded-md mb-2"
        />
        <div class="text-lg font-semibold truncate">{{ blueprint.title }}</div>
        <div class="text-sm text-base-content/70">
          {{ blueprint.userId }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/blueprints/blueprint-gallery.vue
import { ref, onMounted } from 'vue'
import { useBlueprintStore } from '@/stores/blueprintStore'

const blueprintStore = useBlueprintStore()

const showAddBlueprint = ref(false)
const showEditBlueprint = ref(false)

function selectBlueprint(id: number) {
  blueprintStore.select(id)
}

function deselectBlueprint() {
  blueprintStore.deselect()
  showEditBlueprint.value = false
}

function coverArtUrl(coverArtId: number | null): string {
  return coverArtId ? `/images/art/${coverArtId}.webp` : ''
}

onMounted(() => {
  blueprintStore.initialize()
})
</script>
