<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <div class="pointer-events-none fixed inset-0 z-60">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>

  <Transition name="fade">
    <button
      v-if="activeCount > 0"
      class="escape-btn"
      title="Clear all effects"
      type="button"
      @click="clearAll"
    >
      <Icon name="kind-icon:close" class="h-5 w-5" />
      <span>clear fx</span>
    </button>
  </Transition>

  <section class="relative">
    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 p-2">
      <div
        v-for="effect in effects"
        :key="effect.id"
        class="relative flex flex-col items-center gap-2"
      >
        <div
          v-if="hoveredEffect === effect.id"
          class="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-base-300 bg-opacity-90 px-2 py-1 text-sm font-bold text-base-content"
        >
          {{ effect.tooltip }}
        </div>

        <button
          type="button"
          class="flex cursor-pointer items-center justify-center rounded-full p-3 transition-transform hover:scale-125 hover:bg-accent"
          :class="{
            'bg-accent': effect.isActive,
            'bg-transparent': !effect.isActive,
          }"
          @click="toggleEffect(effect.id)"
          @mouseenter="hoveredEffect = effect.id"
          @mouseleave="hoveredEffect = null"
          @focus="hoveredEffect = effect.id"
          @blur="hoveredEffect = null"
        >
          <Icon
            :name="effect.icon"
            :title="effect.label"
            :class="{ glow: effect.isActive }"
            class="h-8 w-8 fill-current text-default md:h-12 md:w-12"
          />
        </button>

        <div class="text-center text-sm text-default">
          {{ effect.isActive ? effect.reveal : effect.label }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Effect {
  id: string
  component: string
  label: string
  icon: string
  tooltip: string
  reveal: string
  isActive: boolean
}

const effects = ref<Effect[]>([
  {
    id: 'fizzy-bubbles',
    component: 'LazyFizzyBubbles',
    label: 'Fizzy Lifting',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    reveal: 'Carbonation!',
    isActive: false,
  },
  {
    id: 'bubble-effect',
    component: 'LazyBubbleEffect',
    label: 'Bubble Fiesta',
    icon: 'kind-icon:bubbles',
    tooltip: 'Rainbow clown bubbles 🌈',
    reveal: 'Bubble Overload!',
    isActive: false,
  },
  {
    id: 'rain-effect',
    component: 'LazyRainEffect',
    label: 'Rainmaker',
    icon: 'kind-icon:raindrop',
    tooltip: "Rain doesn't have to be sad 🌧️",
    reveal: 'Just a drizzle',
    isActive: false,
  },
  {
    id: 'butterfly-animation',
    component: 'LazyButterflyAnimation',
    label: 'Butterfly Scouts',
    icon: 'kind-icon:butterfly',
    tooltip: 'Release AMI 🦋',
    reveal: 'Happy butterflies',
    isActive: false,
  },
  {
    id: 'starfield-effect',
    component: 'LazyStarfieldEffect',
    label: 'Warp Drive',
    icon: 'kind-icon:star',
    tooltip: 'Punch it, Chewie ✨',
    reveal: 'Hyperspace!',
    isActive: false,
  },
  {
    id: 'matrix-rain',
    component: 'LazyMatrixRain',
    label: 'Matrix Rain',
    icon: 'kind-icon:code',
    tooltip: 'Follow the white rabbit 🐇',
    reveal: 'There is no spoon',
    isActive: false,
  },
  {
    id: 'firefly-effect',
    component: 'LazyFireflyEffect',
    label: 'Fireflies',
    icon: 'kind-icon:sparkle',
    tooltip: 'Organic drift and warmth 🌿',
    reveal: 'Golden hour',
    isActive: false,
  },
  {
    id: 'lightning-effect',
    component: 'LazyLightningEffect',
    label: 'Storm Caller',
    icon: 'kind-icon:lightning',
    tooltip: 'Periodic arc strikes ⚡',
    reveal: 'Feel the power',
    isActive: false,
  },
  {
    id: 'snow-effect',
    component: 'LazySnowEffect',
    label: 'Snow Globe',
    icon: 'kind-icon:snowflake',
    tooltip: 'Soft particle drift ❄️',
    reveal: 'Cozy',
    isActive: false,
  },
  {
    id: 'lava-lamp',
    component: 'LazyLavaLamp',
    label: 'Lava Lamp',
    icon: 'kind-icon:flame',
    tooltip: 'Goo blobs merge and float 🫧',
    reveal: 'Far out',
    isActive: false,
  },
  {
    id: 'toaster-effect',
    component: 'LazyToasterEffect',
    label: 'Flying Toasters',
    icon: 'kind-icon:toast',
    tooltip: 'After Dark tribute 🍞',
    reveal: 'Toast incoming!',
    isActive: false,
  },
])

const hoveredEffect = ref<string | null>(null)

const activeCount = computed(() => {
  return effects.value.filter((effect) => effect.isActive).length
})

const activeComponents = computed(() => {
  return effects.value
    .filter((effect) => effect.isActive)
    .map((effect) => ({
      id: effect.id,
      component: effect.component,
    }))
})

function toggleEffect(effectId: string) {
  const effect = effects.value.find((entry) => entry.id === effectId)

  if (!effect) return

  effect.isActive = !effect.isActive
}

function clearAll() {
  effects.value.forEach((effect) => {
    effect.isActive = false
  })
}
</script>

<style scoped>
.escape-btn {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 70;
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