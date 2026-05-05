<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <div class="effect-container">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>

  <div class="relative">
    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 p-2">
      <div
        v-for="effect in effects"
        :key="effect.id"
        class="relative flex flex-col items-center gap-2"
      >
        <!-- Tooltip -->
        <div
          v-if="hoveredEffect === effect.id"
          class="absolute -top-10 left-1/2 -translate-x-1/2 bg-base-300 bg-opacity-90 text-base-content text-sm font-bold px-2 py-1 rounded-xl whitespace-nowrap pointer-events-none z-10"
        >
          {{ effect.tooltip }}
        </div>

        <!-- Icon button -->
        <div
          class="flex items-center justify-center transition-transform transform hover:scale-125 cursor-pointer p-3 rounded-full hover:bg-accent"
          :class="{
            'bg-accent': effect.isActive,
            'bg-transparent': !effect.isActive,
          }"
          @click="toggleEffect(effect.id)"
          @mouseover="hoveredEffect = effect.id"
          @mouseout="hoveredEffect = null"
        >
          <Icon
            :name="effect.icon"
            :title="effect.label"
            :class="{ glow: effect.isActive }"
            class="w-8 h-8 md:w-12 md:h-12 fill-current text-default"
          />
        </div>

        <!-- Label -->
        <div class="text-center text-sm text-default">
          {{ effect.isActive ? effect.reveal : effect.label }}
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
  // Original effects
  'bubble-effect': resolveComponent('LazyBubbleEffect'),
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'butterfly-animation': resolveComponent('LazyButterflyAnimation'),
  // New effects
  'starfield-effect': resolveComponent('LazyStarfieldEffect'),
  'matrix-rain': resolveComponent('LazyMatrixRain'),
  'firefly-effect': resolveComponent('LazyFireflyEffect'),
  'lightning-effect': resolveComponent('LazyLightningEffect'),
  'snow-effect': resolveComponent('LazySnowEffect'),
  'lava-lamp': resolveComponent('LazyLavaLamp'),
  'toaster-effect': resolveComponent('LazyToasterEffect'),
}

interface Effect {
  id: string
  label: string
  icon: string
  tooltip: string
  reveal: string
  isActive: boolean
}

const effects = ref<Effect[]>([
  // --- Original ---
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    reveal: 'Carbonation!',
    isActive: false,
  },
  {
    id: 'bubble-effect',
    label: 'Bubble Fiesta',
    icon: 'kind-icon:bubbles',
    tooltip: 'Rainbow clown bubbles 🌈',
    reveal: 'Bubble Overload!',
    isActive: false,
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    icon: 'kind-icon:raindrop',
    tooltip: "Rain doesn't have to be sad 🌧️",
    reveal: 'Just a drizzle',
    isActive: false,
  },
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    icon: 'kind-icon:butterfly',
    tooltip: 'Release AMI 🦋',
    reveal: 'Happy butterflies',
    isActive: false,
  },
  // --- New ---
  {
    id: 'starfield-effect',
    label: 'Warp Drive',
    icon: 'kind-icon:star',
    tooltip: 'Punch it, Chewie ✨',
    reveal: 'Hyperspace!',
    isActive: false,
  },
  {
    id: 'matrix-rain',
    label: 'Matrix Rain',
    icon: 'kind-icon:code',
    tooltip: 'Follow the white rabbit 🐇',
    reveal: 'There is no spoon',
    isActive: false,
  },
  {
    id: 'firefly-effect',
    label: 'Fireflies',
    icon: 'kind-icon:sparkle',
    tooltip: 'Organic drift and warmth 🌿',
    reveal: 'Golden hour',
    isActive: false,
  },
  {
    id: 'lightning-effect',
    label: 'Storm Caller',
    icon: 'kind-icon:lightning',
    tooltip: 'Periodic arc strikes ⚡',
    reveal: 'Feel the power',
    isActive: false,
  },
  {
    id: 'snow-effect',
    label: 'Snow Globe',
    icon: 'kind-icon:snowflake',
    tooltip: 'Soft particle drift ❄️',
    reveal: 'Cozy',
    isActive: false,
  },
  {
    id: 'lava-lamp',
    label: 'Lava Lamp',
    icon: 'kind-icon:flame',
    tooltip: 'Goo blobs merge and float 🫧',
    reveal: 'Far out',
    isActive: false,
  },
  {
    id: 'toaster-effect',
    label: 'Flying Toasters',
    icon: 'kind-icon:toast',
    tooltip: 'After Dark tribute 🍞',
    reveal: 'Toast incoming!',
    isActive: false,
  },
])

const hoveredEffect = ref<string | null>(null)

const toggleEffect = (effectId: string) => {
  const effect = effects.value.find((e) => e.id === effectId)
  if (effect) effect.isActive = !effect.isActive
}

const activeComponents = computed(() =>
  effects.value
    .filter((e) => e.isActive)
    .map((e) => ({
      id: e.id,
      component: componentsMap[e.id],
    })),
)
</script>

<style scoped>
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow:
      0 0 16px rgba(255, 255, 255, 0.7),
      0 0 24px rgba(255, 115, 253, 0.7);
  }
}

.glow {
  animation: glow 1.5s infinite;
}
</style>
