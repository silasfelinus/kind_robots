<!-- /components/screenfx/screen-fx.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="activeCount > 0"
      class="pointer-events-none fixed inset-0 z-[60] h-dvh w-dvw overflow-hidden"
    >
      <div
        v-for="activeComponent in activeComponents"
        :key="activeComponent.id"
        class="pointer-events-none absolute inset-0 h-full w-full"
      >
        <component :is="activeComponent.component" />
      </div>
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
  </Teleport>

  <section class="relative mx-auto flex w-full max-w-7xl flex-col gap-5 p-3 sm:p-4 lg:p-6">
    <div class="rounded-2xl border border-base-300 bg-base-200/80 p-4 shadow-lg backdrop-blur sm:p-5">
      <div class="flex flex-col gap-2 text-center">
        <h2 class="text-2xl font-black text-base-content sm:text-3xl">
          Screen FX
        </h2>

        <p class="mx-auto max-w-2xl text-sm text-base-content/70 sm:text-base">
          Toggle a little visual chaos. The responsible kind. Probably.
        </p>

        <div
          v-if="activeCount > 0"
          class="mx-auto mt-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1 text-sm font-bold text-accent-content"
        >
          {{ activeCount }} active effect{{ activeCount === 1 ? '' : 's' }}
        </div>
      </div>
    </div>

    <div
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      <button
        v-for="effect in effects"
        :key="effect.id"
        type="button"
        class="group relative flex min-h-40 flex-col items-center justify-between overflow-hidden rounded-2xl border p-4 text-center shadow-md transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-accent/40 sm:min-h-48 sm:p-5 lg:min-h-52"
        :class="getEffectButtonClasses(effect.isActive)"
        :title="effect.tooltip"
        @click="toggleEffect(effect.id)"
        @mouseenter="hoveredEffect = effect.id"
        @mouseleave="hoveredEffect = null"
        @focus="hoveredEffect = effect.id"
        @blur="hoveredEffect = null"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          :class="effect.isActive ? 'bg-accent/10' : 'bg-primary/10'"
        />

        <div
          v-if="effect.isActive"
          class="absolute right-3 top-3 rounded-full border border-accent/40 bg-accent px-2 py-1 text-xs font-black uppercase tracking-wide text-accent-content shadow"
        >
          on
        </div>

        <div
          class="relative flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-200 group-hover:scale-110 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
          :class="getIconShellClasses(effect.isActive)"
        >
          <Icon
            :name="effect.icon"
            :title="effect.label"
            :class="{ glow: effect.isActive }"
            class="h-11 w-11 fill-current sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          />
        </div>

        <div class="relative flex min-h-20 flex-col justify-end gap-2">
          <div class="text-base font-black leading-tight text-base-content sm:text-lg">
            {{ effect.label }}
          </div>

          <div
            class="mx-auto rounded-full px-3 py-1 text-xs font-bold sm:text-sm"
            :class="effect.isActive ? 'bg-accent text-accent-content' : 'bg-base-300 text-base-content/70'"
          >
            {{ effect.isActive ? effect.reveal : 'Tap to activate' }}
          </div>
        </div>

        <Transition name="tooltip">
          <div
            v-if="hoveredEffect === effect.id"
            class="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-base-300 bg-base-100/95 px-3 py-2 text-xs font-bold text-base-content shadow-lg backdrop-blur sm:text-sm"
          >
            {{ effect.tooltip }}
          </div>
        </Transition>
      </button>
    </div>

    <div
      v-if="activeCount > 0"
      class="flex justify-center pt-2"
    >
      <button
        type="button"
        class="btn btn-error btn-wide rounded-2xl text-base font-black shadow-lg"
        @click="clearAll"
      >
        <Icon name="kind-icon:close" class="h-5 w-5" />
        Clear all effects
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/screenfx/screen-fx.vue
import {
  computed,
  defineAsyncComponent,
  markRaw,
  ref,
  shallowRef,
  type Component,
} from 'vue'

interface Effect {
  id: string
  component: Component
  label: string
  icon: string
  tooltip: string
  reveal: string
  isActive: boolean
}

const FizzyBubbles = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/fizzy-bubbles.vue')),
)

const BubbleEffect = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/bubble-effect.vue')),
)

const RainEffect = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/rain-effect.vue')),
)

const ButterflyAnimation = markRaw(
  defineAsyncComponent(
    () => import('@/components/screenfx/butterfly-animation.vue'),
  ),
)

const StarfieldEffect = markRaw(
  defineAsyncComponent(
    () => import('@/components/screenfx/starfield-effect.vue'),
  ),
)

const MatrixRain = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/matrix-rain.vue')),
)

const FireflyEffect = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/firefly-effect.vue')),
)

const LightningEffect = markRaw(
  defineAsyncComponent(
    () => import('@/components/screenfx/lightning-effect.vue'),
  ),
)

const SnowEffect = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/snow-effect.vue')),
)

const LavaLamp = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/lava-lamp.vue')),
)

const ToasterEffect = markRaw(
  defineAsyncComponent(() => import('@/components/screenfx/toaster-effect.vue')),
)

const effects = shallowRef<Effect[]>([
  {
    id: 'fizzy-bubbles',
    component: FizzyBubbles,
    label: 'Fizzy Lifting',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    reveal: 'Carbonation!',
    isActive: false,
  },
  {
    id: 'bubble-effect',
    component: BubbleEffect,
    label: 'Bubble Fiesta',
    icon: 'kind-icon:bubbles',
    tooltip: 'Rainbow clown bubbles 🌈',
    reveal: 'Bubble Overload!',
    isActive: false,
  },
  {
    id: 'rain-effect',
    component: RainEffect,
    label: 'Rainmaker',
    icon: 'kind-icon:raindrop',
    tooltip: "Rain doesn't have to be sad 🌧️",
    reveal: 'Just a drizzle',
    isActive: false,
  },
  {
    id: 'butterfly-animation',
    component: ButterflyAnimation,
    label: 'Butterfly Scouts',
    icon: 'kind-icon:butterfly',
    tooltip: 'Release AMI 🦋',
    reveal: 'Happy butterflies',
    isActive: false,
  },
  {
    id: 'starfield-effect',
    component: StarfieldEffect,
    label: 'Warp Drive',
    icon: 'kind-icon:star',
    tooltip: 'Punch it, Chewie ✨',
    reveal: 'Hyperspace!',
    isActive: false,
  },
  {
    id: 'matrix-rain',
    component: MatrixRain,
    label: 'Matrix Rain',
    icon: 'kind-icon:code',
    tooltip: 'Follow the white rabbit 🐇',
    reveal: 'There is no spoon',
    isActive: false,
  },
  {
    id: 'firefly-effect',
    component: FireflyEffect,
    label: 'Fireflies',
    icon: 'kind-icon:sparkle',
    tooltip: 'Organic drift and warmth 🌿',
    reveal: 'Golden hour',
    isActive: false,
  },
  {
    id: 'lightning-effect',
    component: LightningEffect,
    label: 'Storm Caller',
    icon: 'kind-icon:lightning',
    tooltip: 'Periodic arc strikes ⚡',
    reveal: 'Feel the power',
    isActive: false,
  },
  {
    id: 'snow-effect',
    component: SnowEffect,
    label: 'Snow Globe',
    icon: 'kind-icon:snowflake',
    tooltip: 'Soft particle drift ❄️',
    reveal: 'Cozy',
    isActive: false,
  },
  {
    id: 'lava-lamp',
    component: LavaLamp,
    label: 'Lava Lamp',
    icon: 'kind-icon:flame',
    tooltip: 'Goo blobs merge and float 🫧',
    reveal: 'Far out',
    isActive: false,
  },
  {
    id: 'toaster-effect',
    component: ToasterEffect,
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

function getEffectButtonClasses(isActive: boolean) {
  return isActive
    ? 'border-accent bg-accent/20 text-accent-content shadow-accent/20'
    : 'border-base-300 bg-base-100/90 text-base-content hover:border-primary/60 hover:bg-base-200'
}

function getIconShellClasses(isActive: boolean) {
  return isActive
    ? 'border-accent bg-accent text-accent-content shadow-lg shadow-accent/30'
    : 'border-base-300 bg-base-200 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-content'
}

function toggleEffect(effectId: string) {
  effects.value = effects.value.map((effect) => {
    if (effect.id !== effectId) return effect

    return {
      ...effect,
      isActive: !effect.isActive,
    }
  })
}

function clearAll() {
  effects.value = effects.value.map((effect) => ({
    ...effect,
    isActive: false,
  }))
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

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.16s,
    transform 0.16s;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes glow {
  0%,
  100% {
    box-shadow:
      0 0 6px rgba(255, 255, 255, 0.45),
      0 0 12px rgba(255, 255, 255, 0.25);
  }

  50% {
    box-shadow:
      0 0 18px rgba(255, 255, 255, 0.75),
      0 0 30px rgba(255, 115, 253, 0.7),
      0 0 44px rgba(115, 195, 255, 0.45);
  }
}

.glow {
  animation: glow 1.5s infinite;
}
</style>