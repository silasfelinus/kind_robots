<template>
  <div class="effect-container">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>
  <div>
    <div class="flex flex-wrap items-center justify-center space-x-4 space-y-4">
      <div v-for="effect in effects" :key="effect.id" class="relative flex flex-col items-center">
        <!-- Fixed height and centered text -->
        <div class="text-container text-center mb-1 flex items-center justify-center">
          {{ effect.label }}
        </div>

        <!-- Tooltip -->
        <div
          v-if="hoveredEffect === effect.id"
          class="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-opacity-75 text-white p-1 rounded-sm text-xs whitespace-nowrap pointer-events-none mb-2 z-10"
        >
          {{ effect.tooltip }}
        </div>

        <!-- Reveal -->
        <div
          v-if="effect.isActive"
          class="absolute top-full left-1/2 transform -translate-x-1/2 bg-opacity-75 text-white p-1 rounded-sm text-xs whitespace-nowrap pointer-events-none mt-2 z-10"
        >
          {{ effect.reveal }}
        </div>

        <!-- Icon -->
        <div
          class="transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent-200"
          :class="{ 'bg-secondary': effect.isActive, 'bg-primary': !effect.isActive }"
          @click="toggleEffect(effect.id)"
          @mouseover="hoveredEffect = effect.id"
          @mouseout="hoveredEffect = null"
        >
          <icon
            :name="effect.icon"
            :title="effect.label"
            :active="effect.isActive"
            :class="{ glow: effect.isActive }"
            class="w-8 h-8 md:w-12 md:h-12 fill-current text-[your-color]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'

type ComponentMapType = {
  [key: string]: ReturnType<typeof resolveComponent>
}

const componentsMap: ComponentMapType = {
  'bubble-effect': resolveComponent('LazyBubbleEffect'),
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'talking-butterflies': resolveComponent('LazyTalkingButterflies')
}

const effects = ref([
  {
    id: 'bubble-effect',
    label: 'Bubble Fiesta',
    icon: 'game-icons:bubbles',
    tooltip: 'Unleash a parade of rainbow clown bubbles 🌈',
    reveal: 'Bubble Overload!',
    isActive: false
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting Drinks',
    icon: 'mdi:bottle-soda-classic-outline',
    tooltip: 'Float away with fizzy lifting bubbles 🍾',
    reveal: 'Too Fizzy!',
    isActive: false
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    icon: 'line-md:paint-drop-twotone',
    tooltip: `Rain doesn't always have to be sad`,
    route: 'Summon a rainstorm 🌧️',
    reveal: 'Rainpocalypse!',
    isActive: false
  },
  {
    id: 'talking-butterlies',
    label: 'Butterfly Scouts',
    icon: 'ph:butterfly-light',
    tooltip: 'Release AMI, the Anti-Malaria Intelligence 🦋',
    reveal: "We're Free! twemoji:butterfly",
    route: '/fundraiser',
    isActive: false
  }
])

const hoveredEffect = ref<string | null>(null)
const toggleEffect = (effectId: string) => {
  console.log('Toggling effect:', effectId) // Debugging line
  const effect = effects.value.find((e) => e.id === effectId)
  if (effect) {
    effect.isActive = !effect.isActive
  }
}

// Computed property to get all active components
const activeComponents = computed(() => {
  return effects.value
    .filter((effect) => effect.isActive)
    .map((effect) => ({
      id: effect.id,
      component: componentsMap[effect.id]
    }))
})
</script>
<style scoped>
/* Glow animation */
@keyframes glow {
  0%,
  100% {
    @apply shadow-sm;
  }
  50% {
    @apply shadow-2xl;
  }
}

.glow {
  animation: glow 1.5s infinite;
}

/* Icon container */
.icon-container {
  @apply w-16 h-16 md:w-24 md:h-24; /* Set fixed width and height */
}

/* Icon size */
.icon-size {
  @apply w-full h-full;
}

/* Fixed height for text container */
.text-container {
  @apply h-12;
}
</style>
