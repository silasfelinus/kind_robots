<!-- /components/content/butterfly/butterfly-swarm.vue -->
<template>
  <div>
    <ButterflySingle
      v-for="(butterfly, index) in butterflies"
      :key="'butterfly-' + index"
      :x="butterfly.x"
      :y="butterfly.y"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ButterflyPosition {
  x: number
  y: number
}

const butterflies = ref<Array<ButterflyPosition>>([])

onMounted(() => {
  for (let i = 0; i < 3; i++) {
    butterflies.value.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    })
  }
})
</script>
