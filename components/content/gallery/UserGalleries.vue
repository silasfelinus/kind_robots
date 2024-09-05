<template>
  <div class="user-galleries">
    <gallery-selector />
    <div
      v-for="art in artAssets"
      :key="art.id"
      class="art-frame"
      @click="selectAndShowArt(art.id)"
    >
      <img :src="art.path" alt="Artwork thumbnail" />
      <div class="art-title">{{ art.title }}</div>
    </div>
  </div>

  <!-- Art Modal -->
  <div v-if="selectedArt" class="art-modal" @click.self="closeModal">
    <img :src="selectedArt.imageUrl" alt="Selected Artwork" />
    <div class="art-info">
      <h2>{{ selectedArt.title }}</h2>
      <p>{{ selectedArt.description }}</p>
      <!-- Additional info can be added here -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useArtStore } from './../../../stores/artStore'

const { artAssets, selectArt, selectedArt, fetchAllArt } = useArtStore()

const modalOpen = ref(false)

onMounted(() => {
  fetchAllArt()
})

function selectAndShowArt(artId) {
  selectArt(artId)
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}
</script>

<style scoped>
.art-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.art-frame {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.art-frame:hover {
  transform: scale(1.05);
}

.art-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.art-info {
  margin-top: 20px;
  color: white;
  text-align: center;
}
</style>
