<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <!-- Active effect layers — all children must have pointer-events: none -->
  <div class="effect-container">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>

  <!-- Floating escape button -->
  <Transition name="fade">
    <button
      v-if="activeCount > 0"
      class="escape-btn"
      title="Clear all effects"
      @click="clearAll"
    >
      <Icon name="kind-icon:close" class="w-5 h-5" />
      <span>clear fx</span>
    </button>
  </Transition>

  <!-- Effect picker -->
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
  // Original (bubble-fiesta and lava-lamp removed)
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'butterfly-animation': resolveComponent('LazyButterflyAnimation'),
  'starfield-effect': resolveComponent('LazyStarfieldEffect'),
  'matrix-rain': resolveComponent('LazyMatrixRain'),
  'firefly-effect': resolveComponent('LazyFireflyEffect'),
  'lightning-effect': resolveComponent('LazyLightningEffect'),
  'snow-effect': resolveComponent('LazySnowEffect'),
  'toaster-effect': resolveComponent('LazyToasterEffect'),
  // New
  'aurora-effect': resolveComponent('LazyAuroraEffect'),
  'constellation-effect': resolveComponent('LazyConstellationEffect'),
  'plasma-effect': resolveComponent('LazyPlasmaEffect'),
  'nyan-trail': resolveComponent('LazyNyanTrail'),
  'pixel-rain': resolveComponent('LazyPixelRain'),
  'orbit-effect': resolveComponent('LazyOrbitEffect'),
  'wishing-stars': resolveComponent('LazyWishingStars'),
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
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    reveal: 'Carbonation!',
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
    id: 'toaster-effect',
    label: 'Flying Toasters',
    icon: 'kind-icon:toast',
    tooltip: 'After Dark tribute 🍞',
    reveal: 'Toast incoming!',
    isActive: false,
  },
  {
    id: 'aurora-effect',
    label: 'Aurora',
    icon: 'kind-icon:rainbow',
    tooltip: 'Northern lights ribbons 🌌',
    reveal: 'Borealis!',
    isActive: false,
  },
  {
    id: 'constellation-effect',
    label: 'Constellation',
    icon: 'kind-icon:constellation',
    tooltip: 'Drifting stars connect 🔭',
    reveal: 'Star map',
    isActive: false,
  },
  {
    id: 'plasma-effect',
    label: 'Plasma',
    icon: 'kind-icon:wave',
    tooltip: 'Winamp/After Dark plasma 🌊',
    reveal: 'Sine wave soup',
    isActive: false,
  },
  {
    id: 'nyan-trail',
    label: 'Nyan Trail',
    icon: 'kind-icon:rainbow',
    tooltip: 'Rainbow cursor trail 🌈',
    reveal: 'Nyan nyan nyan',
    isActive: false,
  },
  {
    id: 'pixel-rain',
    label: 'Pixel Rain',
    icon: 'kind-icon:pixel',
    tooltip: 'Retro falling pixel blocks 🕹️',
    reveal: "It's raining bits",
    isActive: false,
  },
  {
    id: 'orbit-effect',
    label: 'Orrery',
    icon: 'kind-icon:orbit',
    tooltip: 'Glowing orbs in orbit 🪐',
    reveal: 'Solar system',
    isActive: false,
  },
  {
    id: 'wishing-stars',
    label: 'Wishing Stars',
    icon: 'kind-icon:shooting-star',
    tooltip: 'Make a wish 🌠',
    reveal: '✨ wish granted',
    isActive: false,
  },
])

const hoveredEffect = ref<string | null>(null)

const activeCount = computed(
  () => effects.value.filter((e) => e.isActive).length,
)

const toggleEffect = (effectId: string) => {
  const effect = effects.value.find((e) => e.id === effectId)
  if (effect) effect.isActive = !effect.isActive
}

const clearAll = () => {
  effects.value.forEach((e) => (e.isActive = false))
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
.escape-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  backdrop-filter: blur(8px);
  pointer-events: auto;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.1s;
}

.escape-btn:hover {
  background: rgba(220, 50, 50, 0.75);
  border-color: rgba(255, 100, 100, 0.5);
  transform: scale(1.05);
}

.escape-btn:active {
  transform: scale(0.97);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

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
