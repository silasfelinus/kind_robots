<template>
  <div v-if="hydrated" class="relative h-full w-full rounded-2xl">
    <div class="flip-card h-full w-full rounded-2xl" @click="handleClick">
      <div
        class="flip-card-inner rounded-2xl"
        :class="{ 'is-flipped': flipped }"
      >
        <div class="flip-card-front rounded-2xl">
          <img
            :src="pageImage"
            alt="Page"
            class="h-full w-full rounded-2xl object-cover"
            draggable="false"
          />
        </div>

        <div class="flip-card-back rounded-2xl">
          <img
            :src="pageImage"
            alt="Page"
            class="h-full w-full rounded-2xl object-cover"
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
  /* Isolate the stacking context */
  isolation: isolate;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d; /* Safari */
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden; /* Safari */
  backface-visibility: hidden;
  border-radius: 1rem;
  /* DO NOT use overflow: hidden here — breaks 3D */
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
