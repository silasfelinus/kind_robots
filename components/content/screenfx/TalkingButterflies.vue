<template>
  <div>
    <butterfly-single
      v-for="(butterfly, index) in butterflies"
      :key="'butterfly-' + index"
      :x="butterfly.x"
      :y="butterfly.y"
    />
    <TextBubble
      v-for="(butterfly, index) in butterflies"
      :key="'text-bubble-' + index"
      :x="butterfly.x"
      :y="butterfly.y"
      :text="butterfly.text"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { defaultPhrase, funPhrases } from '@/training/butterflyPhrases' // Importing our phrases

interface ButterflyPosition {
  x: number
  y: number
  text: string
}

const butterflies = ref<Array<ButterflyPosition>>([])

// Function to get a random phrase
const getRandomPhrase = () => {
  const randomIndex = Math.floor(Math.random() * funPhrases.length)
  return funPhrases[randomIndex] || defaultPhrase
}

onMounted(() => {
  for (let i = 0; i < 3; i++) {
    butterflies.value.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      text: getRandomPhrase()
    })
  }
})
</script>
