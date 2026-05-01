<template>
  <div v-if="hydrated" class="relative w-full h-full">
    <div class="flip-card h-full w-full" @click="handleClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            :src="pageImage"
            alt="Page"
            class="w-full h-full object-cover"
            draggable="false"
          />
        </div>
        <div class="flip-card-back">
          <img
            :src="pageImage"
            alt="Page"
            class="w-full h-full object-cover"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const flipped = ref(false)
const hydrated = ref(false)
const pageStore = usePageStore()

const fallback = '/images/botcafe.webp'

const pageImage = computed(() => {
  const img = pageStore.page?.image
  if (!img) return fallback
  return img.startsWith('/') ? img : `/images/${img}`
})

onMounted(() => {
  hydrated.value = true
})

const handleClick = () => {
  flipped.value = !flipped.value
}
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
  cursor: pointer;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}
.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}
.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 1rem;
  overflow: hidden;
}
.flip-card-back {
  transform: rotateY(180deg);
}
</style>
