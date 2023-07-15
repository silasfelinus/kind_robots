<template>
  <div>
    <AmiButterfly
      v-for="(butterfly, index) in butterflies"
      :key="index"
      :x="butterfly.x"
      :y="butterfly.y"
    />
  </div>
</template>
<script setup lang="ts">
interface ButterflyPosition {
  x: number
  y: number
}

const butterflies = ref<Array<ButterflyPosition>>([])

onMounted(() => {
  for (let i = 0; i < 5; i++) {
    butterflies.value.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight
    })
  }
})
</script>
