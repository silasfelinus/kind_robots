<template>
  <div
    class="flex items-center justify-center w-full md:flex-grow mb-2 md:mb-0 space-x-3 text-lg md:text-2xl"
  >
    <icon-button
      icon="emojione:butterfly"
      title="Kind Butterflies"
      :active="showAmiSwarm"
      :class="{
        glow: showAmiSwarm
      }"
      @click="toggleAmiSwarm"
    />
    <icon-button
      icon="twemoji:cloud-with-rain"
      title="Kind Weather"
      :active="showRainEffect"
      :class="{ glow: showRainEffect }"
      @click="toggleRainEffect"
    />
    <icon-button
      icon="icon-park:soap-bubble"
      title="Kind Bubbles"
      :active="showSoapBubbles"
      :class="{ glow: showSoapBubbles }"
      @click="toggleSoapBubbles"
    />
  </div>
</template>

<script setup lang="ts">
const showAmiSwarm = ref(false)
const showRainEffect = ref(false)
const showSoapBubbles = ref(false)

const toggleAmiSwarm = () => {
  showAmiSwarm.value = !showAmiSwarm.value
}
const toggleRainEffect = () => {
  showRainEffect.value = !showRainEffect.value
}
const toggleSoapBubbles = () => {
  showSoapBubbles.value = !showSoapBubbles.value
}
</script>

<style scoped>
.glow {
  text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #fff;
}
</style>
