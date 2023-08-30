<template>
  <div>
    <div class="flex flex-wrap items-center justify-center space-x-4 space-y-4">
      <icon
        v-for="effect in effects"
        :key="effect.id"
        :name="effect.icon"
        :title="effect.label"
        :active="activeEffect === effect.id"
        :class="{ 'glow-animation': activeEffect === effect.id }"
        class="icon-effect transform transition-transform ease-in-out hover:scale-110 hover:shadow-lg"
        :aria-pressed="activeEffect === effect.id"
        @click="setActiveEffect(effect.id)"
      />
    </div>

    <!-- Dynamic component based on activeComponent -->
    <component :is="activeComponent" />

    <theme-selector />
    <butterfly-toggle />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'

type ComponentMapType = {
  [key: string]: ReturnType<typeof resolveComponent>
}

const componentsMap: ComponentMapType = {
  'bubble-effect': resolveComponent('BubbleEffect'),
  'dream-status': resolveComponent('DreamStatus'),
  'fizzy-bubbles': resolveComponent('FizzyBubbles'),
  'lava-lamp': resolveComponent('LavaLamp'),
  'rain-effect': resolveComponent('RainEffect'),
  'tiny-bubbles': resolveComponent('TinyBubbles')
}

const activeEffect = ref<string | null>(null)

// Your effects data
const effects = [
  { id: 'bubble-effect', label: 'Bubble Effect', icon: 'twemoji:cloud-with-rain' },
  { id: 'dream-status', label: 'Dream Status', icon: 'line-md:heart-filled' },
  { id: 'fizzy-bubbles', label: 'Fizzy Bubbles', icon: 'twemoji:beverage-box' },
  { id: 'lava-lamp', label: 'Lava Lamp', icon: 'twemoji:fire' },
  { id: 'rain-effect', label: 'Rain Effect', icon: 'line-md:paint-drop-twotone' },
  { id: 'tiny-bubbles', label: 'Tiny Bubbles', icon: 'twemoji:sparkles' }
]

// Set the active effect based on the user's click
const setActiveEffect = (effectId: string) => {
  activeEffect.value = effectId
}

// Dynamically get the component to be rendered based on the active effect
const activeComponent = computed(() => {
  return activeEffect.value ? componentsMap[activeEffect.value] : null
})
</script>

<style scoped>
.icon-effect {
  @apply w-6 h-6 md:w-24 md:h-24 cursor-pointer transition-shadow;
}

/* Glow animation */
@keyframes glow {
  0% {
    box-shadow: 0 0 5px #fff;
  }
  50% {
    box-shadow:
      0 0 20px #fff,
      0 0 30px #ff73fd;
  }
  100% {
    box-shadow: 0 0 5px #fff;
  }
}

.glow-animation {
  animation: glow 1.5s infinite;
}
</style>
