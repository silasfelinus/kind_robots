<!-- /components/content/resonance/add-resonance-form.vue -->
<template>
  <div
    class="rounded-2xl border border-base-300 p-4 bg-base-200 mx-auto w-full max-w-7xl space-y-8"
  >
    <!-- Header -->
    <header class="text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-primary">
        Resonance Designer
      </h1>
    </header>

    <!-- Title + Description -->
    <section class="space-y-4">
      <input
        v-model="form.title"
        type="text"
        placeholder="Resonance Title"
        class="input input-bordered rounded-2xl w-full text-lg"
      />
      <textarea
        v-model="form.description"
        placeholder="Short description..."
        class="textarea textarea-bordered rounded-2xl w-full text-lg"
        rows="3"
      />
      <input
        v-model="form.genres"
        type="text"
        placeholder="Genres (comma-separated)"
        class="input input-bordered rounded-2xl w-full text-lg"
      />
    </section>

    <!-- Art Collection Selection -->
    <section class="space-y-4">
      <div class="flex flex-col gap-2">
        <label class="text-base font-semibold">Select Art Collection:</label>
        <select
          v-model="selectedCollectionId"
          @change="handleCollectionSelect"
          class="select select-bordered rounded-2xl w-full"
        >
          <option disabled value="">Choose a collection</option>
          <option
            v-for="collection in artStore.collections"
            :key="collection.id"
            :value="collection.id"
          >
            {{ collection.label || 'Unnamed Collection' }}
          </option>
        </select>
      </div>

      <!-- Art Grid -->
      <div v-if="filteredArt.length" class="flex flex-wrap gap-2 pt-4">
        <div v-for="art in filteredArt" :key="art.id" class="relative">
          <img
            :src="art.imagePath || ''"
            @click="toggleArtSelection(art.id)"
            class="w-24 h-24 object-cover rounded-xl cursor-pointer border-2 transition"
            :class="
              form.artIds.includes(art.id) ? 'border-accent' : 'border-base-300'
            "
          />
        </div>
      </div>
    </section>

    <!-- Settings -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="flex flex-col gap-2">
        <label class="text-base font-semibold">Creativity Rate</label>
        <input
          v-model.number="form.creativityRate"
          type="range"
          min="0"
          max="100"
          class="range"
        />
        <div class="text-center">{{ form.creativityRate }}%</div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-base font-semibold">Image Mask Strength</label>
        <input
          v-model.number="form.imageMask"
          type="range"
          min="0"
          max="100"
          class="range"
        />
        <div class="text-center">{{ form.imageMask }}%</div>
      </div>

      <div class="flex flex-col gap-2 col-span-1 md:col-span-2">
        <label class="text-base font-semibold">Iteration Count</label>
        <input
          v-model.number="form.iteration"
          type="number"
          min="1"
          class="input input-bordered rounded-2xl w-full text-lg"
        />
      </div>

      <!-- Toggles -->
      <div class="flex flex-wrap gap-4 col-span-1 md:col-span-2 justify-center">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="form.isPublic"
            class="checkbox checkbox-accent"
          />
          Public
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="form.isMature"
            class="checkbox checkbox-warning"
          />
          Mature
        </label>
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="form.useMicrophone"
            class="checkbox checkbox-info"
          />
          Use Microphone
        </label>
      </div>
    </section>

    <!-- Save Button -->
    <section class="w-full flex justify-center">
      <button
        class="btn btn-primary rounded-2xl text-lg w-full max-w-sm"
        @click="saveResonance"
      >
        Save Resonance
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useResonanceStore } from '@/stores/resonanceStore'

const artStore = useArtStore()
const resonanceStore = useResonanceStore()

const form = ref({
  title: '',
  description: '',
  genres: '',
  creativityRate: 50,
  imageMask: 50,
  iteration: 1000,
  useMicrophone: false,
  isPublic: true,
  isMature: false,
  artIds: [] as number[],
})

const selectedCollectionId = ref<number | null>(null)

const filteredArt = computed(() => {
  if (!selectedCollectionId.value) return []
  const collection = artStore.collections.find(
    (c) => c.id === selectedCollectionId.value,
  )
  return collection?.art || []
})

function handleCollectionSelect() {
  form.value.artIds = []
}

function toggleArtSelection(artId: number) {
  const index = form.value.artIds.indexOf(artId)
  if (index > -1) {
    form.value.artIds.splice(index, 1)
  } else {
    form.value.artIds.push(artId)
  }
}

async function saveResonance() {
  const { success, message } = await resonanceStore.saveResonance({
    ...form.value,
  })

  if (!success) {
    console.error('Failed to save resonance:', message)
  } else {
    console.log('Resonance saved successfully!')
    resetForm()
  }
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    genres: '',
    creativityRate: 50,
    imageMask: 50,
    iteration: 1000,
    useMicrophone: false,
    isPublic: true,
    isMature: false,
    artIds: [],
  }
}
</script>
