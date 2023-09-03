<template>
  <div>
    <div class="flex flex-wrap items-center justify-center space-x-4 space-y-4">
      <div v-for="effect in effects" :key="effect.id" class="relative">
        <div
          v-if="hoveredEffect === effect.id"
          class="absolute tooltip"
          v-text="effect.tooltip"
        ></div>

        <icon
          :name="effect.icon"
          :title="effect.label"
          :active="activeEffect === effect.id"
          :class="{ 'glow-animation': activeEffect === effect.id }"
          class="icon-effect transform transition-transform ease-in-out hover:scale-110 hover:shadow-lg"
          :aria-pressed="activeEffect === effect.id"
          @click="setActiveEffect(effect.id)"
          @mouseenter="hoveredEffect = effect.id"
          @mouseleave="hoveredEffect = null"
        />
      </div>
    </div>

    <!-- Dynamic component based on activeComponent -->
    <component :is="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'
const hoveredEffect = ref<string | null>(null)

type ComponentMapType = {
  [key: string]: ReturnType<typeof resolveComponent>
}

const componentsMap: ComponentMapType = {
  'bubble-effect': resolveComponent('BubbleEffect'),
  'dream-status': resolveComponent('DreamStatus'),
  'fizzy-bubbles': resolveComponent('FizzyBubbles'),
  'rain-effect': resolveComponent('RainEffect')
}

const activeEffect = ref<string | null>(null)

// Your effects data
const effects = [
  {
    id: 'bubble-effect',
    label: 'Bubble Effect',
    icon: 'line-md:emoji-grin-twotone',
    tooltip: 'Rainbow clown bubbles'
  },
  {
    id: 'dream-status',
    label: 'Dream Status',
    icon: 'line-md:heart-filled',
    tooltip: 'Random Dreams'
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Bubbles',
    icon: 'twemoji:beverage-box',
    tooltip: 'Fizzy lifting bubbles'
  },
  {
    id: 'rain-effect',
    label: 'Rain Effect',
    icon: 'line-md:paint-drop-twotone',
    tooltip: 'Rain Rain Go Away'
  }
]

const setActiveEffect = (effectId: string) => {
  if (activeEffect.value === effectId) {
    activeEffect.value = null // disable if the effect is already active
  } else {
    activeEffect.value = effectId // enable the clicked effect
  }
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

.tooltip {
  position: absolute;
  bottom: 100%; /* position it above the icon */
  left: 50%; /* center it horizontally relative to the icon */
  transform: translateX(-50%); /* adjust for exact centering */
  background-color: rgba(0, 0, 0, 0.75); /* semi-transparent black */
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none; /* so it doesn't interfere with clicks/hovers on other elements */
  margin-bottom: 8px; /* some spacing between the tooltip and the icon */
  z-index: 10; /* ensure it appears above other content */
}
</style>
