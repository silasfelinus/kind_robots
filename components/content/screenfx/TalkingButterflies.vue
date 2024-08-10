<template>
  <div>
    <ami-butterfly
      v-for="(butterfly, index) in butterflies"
      :key="'butterfly-' + index"
      :butterfly="butterfly"
    />
    <div
      v-for="(butterfly, index) in butterflies"
      :key="'text-bubble-' + index"
      :style="{ left: butterfly.goal.x + 20 + 'px', top: butterfly.goal.y + 20 + 'px' }"
      class="text-bubble"
    >
      <icon
        name="mdi:butterfly"
        class="inline-block mr-2"
      /> {{ butterfly.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { defaultPhrase, funPhrases } from '@/training/butterflyPhrases'

interface ButterflyPosition {
  x: number
  y: number
  text: string
  goal: { x: number, y: number }
}

const butterflies = ref<Array<ButterflyPosition>>([])

const getRandomPhrase = () => {
  const randomIndex = Math.floor(Math.random() * funPhrases.length)
  return funPhrases[randomIndex] || defaultPhrase
}

onMounted(() => {
  const updateButterflies = () => {
    butterflies.value = Array.from({ length: 3 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      text: getRandomPhrase(),
      goal: { x: 0, y: 0 },
    }))
  }

  updateButterflies()
  window.addEventListener('resize', updateButterflies)

  onUnmounted(() => {
    window.removeEventListener('resize', updateButterflies)
  })
})
</script>

<style scoped>
.text-bubble {
  position: absolute;
  background-color: var(--bg-base-200);
  border: 2px solid var(--bg-primary);
  border-radius: 25px;
  padding: 10px;
  max-width: 150px;
  font-size: 14px;
  font-family: 'Bangers', cursive;
  color: var(--bg-primary);
  white-space: nowrap;
  transform: translate(-50%, -100%);
  transition:
    top 0.3s,
    left 0.3s;
}
</style>
