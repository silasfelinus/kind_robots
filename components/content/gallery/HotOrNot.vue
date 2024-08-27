<template>
  <div class="hot-or-not">
    <div v-if="selectedArt" class="art-display">
      <img :src="selectedArt.imageUrl" alt="Art Piece" class="art-image" />
      <div class="actions">
        <button class="not-btn" @click="rateArt(false)">Not 🔻</button>
        <button class="hot-btn" @click="rateArt(true)">Hot 🔺</button>
      </div>
    </div>
    <div v-else class="no-art">
      <p>No more art to display.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()
const selectedArt = ref(null)

onMounted(() => {
  artStore.init()
  selectRandomArt()
})

function selectRandomArt() {
  const randomIndex = Math.floor(Math.random() * artStore.artAssets.length)
  selectedArt.value = artStore.artAssets[randomIndex]
}

function rateArt(isHot) {
  const reaction = {
    artId: selectedArt.value.id,
    isHot,
    userId: 1, // Assuming you have user authentication and can get the current user's ID
  }
  artStore.createArtReaction(reaction).then(() => {
    selectRandomArt() // Move to next art piece after rating
  })
}
</script>

<style scoped>
.art-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.art-image {
  max-width: 90%;
  border-radius: 10px;
  margin-bottom: 20px;
}
.actions {
  display: flex;
  justify-content: space-around;
  width: 100%;
}
.not-btn,
.hot-btn {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
