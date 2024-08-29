<template>
  <div class="effect-container">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>
  <div class="relative">
    <!-- Global Tooltip -->
    <div
      v-if="!hoveredEffect"
      class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-opacity-75 text-4xl text-default font-bold p-1 rounded-sm whitespace-nowrap pointer-events-none z-10"
    />
    <div class="flex flex-wrap items-center justify-center space-x-4 space-y-4">
      <!-- Invisible First Icon -->
      <div
        class="relative flex flex-col items-center space-y-2 md:space-y-0 md:flex-row md:space-x-4 opacity-0"
      >
        <div class="flex flex-col items-center space-y-2" />
      </div>
      <!-- Visible Icons -->
      <div
        v-for="effect in effects"
        :key="effect.id"
        class="relative flex flex-col items-center space-y-2 md:space-y-0 md:flex-row md:space-x-4"
      >
        <!-- Individual Tooltip -->
        <div
          v-if="hoveredEffect === effect.id"
          class="absolute top-0 mt-[-60px] left-1/2 transform -translate-x-1/2 bg-opacity-75 text-xl text-default font-bold p-1 rounded-xl whitespace-nowrap pointer-events-none z-10"
        >
          {{ effect.tooltip }}
        </div>

        <!-- Icon and Label Container -->
        <div class="flex flex-col items-center space-y-2">
          <div
            class="flex items-center justify-center transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent"
            :class="{
              'bg-accent': effect.isActive,
              'bg-transluscent': !effect.isActive,
            }"
            @click="toggleEffect(effect.id)"
            @mouseover="hoveredEffect = effect.id"
            @mouseout="hoveredEffect = null"
          >
            <Icon
              :name="effect.Icon"
              :title="effect.label"
              :active="effect.isActive"
              :class="{ glow: effect.isActive }"
              class="w-8 h-8 md:w-12 md:h-12 fill-current text-default"
            />
          </div>

          <!-- Label or Reveal -->
          <div class="text-center text-xl text-default">
            {{ effect.isActive ? effect.reveal : effect.label }}
          </div>
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
  'talking-butterflies': resolveComponent('LazyTalkingButterflies'),
}

const effects = ref([
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    Icon: 'mdi:bottle-soda-classic-outline',
    tooltip: 'Float away with fizzy bubbles 🍾',
    reveal: 'Carbonation!',
    isActive: false,
  },
  {
    id: 'bubble-effect',
    label: 'Bubble Fiesta',
    Icon: 'game-Icons:bubbles',
    tooltip: 'rainbow clown bubbles 🌈',
    reveal: 'Bubble Overload!',
    isActive: false,
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    Icon: 'line-md:paint-drop-twotone',
    tooltip: `Rain doesn't have to be sad`,
    route: 'Summon a rainstorm 🌧️',
    reveal: 'Just a drizzle',
    isActive: false,
  },
  {
    id: 'talking-butterflies',
    label: 'Butterfly Scouts',
    Icon: 'ph:butterfly-light',
    tooltip: 'Release AMI 🦋',
    reveal: 'Happy butterflies',
    route: '/fundraiser',
    isActive: false,
  },
])

const hoveredEffect = ref<string | null>(null)
const toggleEffect = (effectId: string) => {
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
      component: componentsMap[effect.id],
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
</style>
