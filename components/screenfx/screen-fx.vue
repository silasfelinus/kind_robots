<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <div class="effect-container">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>

  <Transition name="fade-up">
    <button
      v-if="activeCount > 0"
      class="escape-btn"
      title="Clear all effects"
      @click="clearAll"
    >
      <Icon name="kind-icon:close" class="w-4 h-4" />
      <span>clear all ({{ activeCount }})</span>
    </button>
  </Transition>

  <div class="fx-panel">
    <!-- Header -->
    <div class="fx-header">
      <div class="fx-title">
        <span class="fx-logo">✦</span>
        Screen FX
      </div>
      <div class="fx-header-right">
        <span v-if="activeCount > 0" class="fx-active-badge">
          {{ activeCount }} on
        </span>
        <span class="fx-total-label">{{ effects.length }} effects</span>
      </div>
    </div>

    <!-- Effect grid -->
    <div class="fx-grid">
      <div
        v-for="effect in effects"
        :key="effect.id"
        class="fx-btn"
        :class="{
          'fx-btn--active': effect.isActive,
          'fx-btn--blocks': effect.blocksInput,
        }"
        :style="effect.isActive ? { '--ec': effect.color } : {}"
        role="button"
        :aria-pressed="effect.isActive"
        :aria-label="effect.label"
        @click="toggleEffect(effect.id)"
        @mouseenter="hoveredEffect = effect.id"
        @mouseleave="hoveredEffect = null"
      >
        <Transition name="tooltip">
          <div v-if="hoveredEffect === effect.id" class="fx-tooltip">
            {{ effect.tooltip }}
            <span v-if="effect.blocksInput" class="fx-tooltip-warn"
              >⚠ captures clicks</span
            >
          </div>
        </Transition>
        <div v-if="effect.isActive" class="fx-pulse" />
        <div class="fx-icon-wrap">
          <Icon :name="effect.icon" class="fx-icon" />
        </div>
        <span class="fx-label" :class="{ 'fx-label--reveal': effect.isActive }">
          {{ effect.isActive ? effect.reveal : effect.label }}
        </span>
      </div>
    </div>

    <!-- ── Zone Coverage ──────────────────────────────────────────────────── -->
    <div class="fx-zone-section">
      <div class="fx-zone-header">
        <span class="fx-zone-title">Expand coverage</span>
        <button
          v-if="anyZoneActive"
          class="fx-zone-reset"
          @click="animationStore.resetZones()"
        >
          reset
        </button>
      </div>

      <div class="fx-zone-grid">
        <button
          v-for="zone in zoneOptions"
          :key="zone.id"
          class="fx-zone-btn"
          :class="{ 'fx-zone-btn--active': animationStore.zones[zone.id] }"
          :title="zone.tooltip"
          @click="animationStore.toggleZone(zone.id)"
        >
          <Icon :name="zone.icon" class="fx-zone-icon" />
          <span>{{ zone.label }}</span>
        </button>
      </div>
    </div>

    <div class="fx-footer">Effects layer on top of each other — mix freely</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'
import {
  useAnimationStore,
  type AnimationLayerZone,
} from '@/stores/animationStore'

const animationStore = useAnimationStore()

// ─── Zone options ─────────────────────────────────────────────────────────────

const zoneOptions: {
  id: AnimationLayerZone
  label: string
  icon: string
  tooltip: string
}[] = [
  {
    id: 'header',
    label: 'Header',
    icon: 'kind-icon:layout-top',
    tooltip: 'Extend into the header bar',
  },
  {
    id: 'left',
    label: 'Left',
    icon: 'kind-icon:layout-left',
    tooltip: 'Extend into the left sidebar',
  },
  {
    id: 'right',
    label: 'Right',
    icon: 'kind-icon:layout-right',
    tooltip: 'Extend into the right sidebar',
  },
  {
    id: 'footer',
    label: 'Footer',
    icon: 'kind-icon:layout-bottom',
    tooltip: 'Extend into the footer bar',
  },
]

const anyZoneActive = computed(() =>
  zoneOptions.some((z) => animationStore.zones[z.id]),
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Effect {
  id: string
  label: string
  reveal: string
  icon: string
  tooltip: string
  color: string
  isActive: boolean
  blocksInput?: boolean
}

type ComponentMapType = {
  [key: string]: ReturnType<typeof resolveComponent>
}

// ─── Component map ────────────────────────────────────────────────────────────

const componentsMap: ComponentMapType = {
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'butterfly-animation': resolveComponent('LazyButterflyAnimation'),
  'starfield-effect': resolveComponent('LazyStarfieldEffect'),
  'matrix-rain': resolveComponent('LazyMatrixRain'),
  'firefly-effect': resolveComponent('LazyFireflyEffect'),
  'lightning-effect': resolveComponent('LazyLightningEffect'),
  'snow-effect': resolveComponent('LazySnowEffect'),
  'toaster-effect': resolveComponent('LazyToasterEffect'),
  'aurora-effect': resolveComponent('LazyAuroraEffect'),
  'constellation-effect': resolveComponent('LazyConstellationEffect'),
  'plasma-effect': resolveComponent('LazyPlasmaEffect'),
  'nyan-trail': resolveComponent('LazyNyanTrail'),
  'pixel-rain': resolveComponent('LazyPixelRain'),
  'orbit-effect': resolveComponent('LazyOrbitEffect'),
  'wishing-stars': resolveComponent('LazyWishingStars'),
  'fireworks-effect': resolveComponent('LazyFireworksEffect'),
  'ripple-effect': resolveComponent('LazyRippleEffect'),
  'wandering-creatures': resolveComponent('LazyWanderingCreatures'),
  'floating-hearts': resolveComponent('LazyFloatingHearts'),
  'glitch-effect': resolveComponent('LazyGlitchEffect'),
  'fire-effect': resolveComponent('LazyFireEffect'),
  'kaleidoscope-effect': resolveComponent('LazyKaleidoscopeEffect'),
  'smudge-effect': resolveComponent('LazySmudgeEffect'),
  'pixel-explosion': resolveComponent('LazyPixelExplosion'),
  'ascii-aquarium': resolveComponent('LazyAsciiAquarium'),
  'pacbot-effect': resolveComponent('LazyPacbotEffect'),
  'pocket-gremlin': resolveComponent('LazyPocketGremlin'),
  'siege-engine': resolveComponent('LazySiegeEngine'),
}

// ─── Effects ──────────────────────────────────────────────────────────────────

const effects = ref<Effect[]>([
  // ── Atmospheric ──────────────────────────────────────────────────────────
  {
    id: 'aurora-effect',
    label: 'Aurora',
    reveal: 'Borealis!',
    icon: 'kind-icon:rainbow',
    tooltip: 'Northern lights drift across the sky 🌌',
    color: '#14b8a6',
    isActive: false,
  },
  {
    id: 'starfield-effect',
    label: 'Warp Drive',
    reveal: 'Hyperspace!',
    icon: 'kind-icon:star',
    tooltip: 'Punch it, Chewie ✨',
    color: '#6366f1',
    isActive: false,
  },
  {
    id: 'constellation-effect',
    label: 'Constellation',
    reveal: 'Star map',
    icon: 'kind-icon:sparkle',
    tooltip: 'Drifting stars connect into patterns 🔭',
    color: '#60a5fa',
    isActive: false,
  },
  {
    id: 'wishing-stars',
    label: 'Wishing Stars',
    reveal: '✨ Wish granted',
    icon: 'kind-icon:star',
    tooltip: 'Shooting stars streak across the sky 🌠',
    color: '#fbbf24',
    isActive: false,
  },
  {
    id: 'orbit-effect',
    label: 'Orrery',
    reveal: 'Solar system',
    icon: 'kind-icon:orbit',
    tooltip: 'Glowing orbs trace orbital paths 🪐',
    color: '#a855f7',
    isActive: false,
  },
  // ── Nature ───────────────────────────────────────────────────────────────
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    reveal: 'Happy butterflies',
    icon: 'kind-icon:butterfly',
    tooltip: 'Release AMI into the world 🦋',
    color: '#e879f9',
    isActive: false,
  },
  {
    id: 'firefly-effect',
    label: 'Fireflies',
    reveal: 'Golden hour',
    icon: 'kind-icon:sparkle',
    tooltip: 'Organic warm glow drifting through the dark 🌿',
    color: '#f59e0b',
    isActive: false,
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    reveal: 'Just a drizzle',
    icon: 'kind-icon:raindrop',
    tooltip: "Rain doesn't have to be sad 🌧️",
    color: '#7ba7c0',
    isActive: false,
  },
  {
    id: 'snow-effect',
    label: 'Snow Globe',
    reveal: 'Cozy ❄️',
    icon: 'kind-icon:snowflake',
    tooltip: 'Soft particle snowfall ❄️',
    color: '#93c5fd',
    isActive: false,
  },
  {
    id: 'floating-hearts',
    label: 'Love Bomb',
    reveal: 'So much love',
    icon: 'kind-icon:heart',
    tooltip: 'Click anywhere to burst 💖',
    color: '#f43f5e',
    isActive: false,
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    reveal: 'Carbonation!',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    color: '#38bdf8',
    isActive: false,
  },
  {
    id: 'ripple-effect',
    label: 'Ripple',
    reveal: 'Still waters',
    icon: 'kind-icon:raindrop',
    tooltip: 'Move your cursor to ripple the surface 💧',
    color: '#0ea5e9',
    isActive: false,
  },
  // ── Energy ───────────────────────────────────────────────────────────────
  {
    id: 'fireworks-effect',
    label: 'Fireworks',
    reveal: '🎆 Celebration!',
    icon: 'kind-icon:sparkle',
    tooltip: 'Click anywhere to fire 🎆',
    color: '#ef4444',
    isActive: false,
  },
  {
    id: 'lightning-effect',
    label: 'Storm Caller',
    reveal: 'Feel the power',
    icon: 'kind-icon:lightning',
    tooltip: 'Recursive arc strikes from the sky ⚡',
    color: '#eab308',
    isActive: false,
  },
  {
    id: 'fire-effect',
    label: 'Wildfire',
    reveal: 'Everything is fine',
    icon: 'kind-icon:flame',
    tooltip: 'This is fine 🔥',
    color: '#ea580c',
    isActive: false,
  },
  {
    id: 'glitch-effect',
    label: 'Glitch',
    reveal: 'ERR_404',
    icon: 'kind-icon:lightning',
    tooltip: 'Signal corruption detected 📺',
    color: '#7c3aed',
    isActive: false,
  },
  // ── Creative ─────────────────────────────────────────────────────────────
  {
    id: 'kaleidoscope-effect',
    label: 'Kaleidoscope',
    reveal: 'Infinite mirror',
    icon: 'kind-icon:gem',
    tooltip: 'Sacred geometry in motion 🔮',
    color: '#9333ea',
    isActive: false,
  },
  {
    id: 'plasma-effect',
    label: 'Plasma',
    reveal: 'Sine wave soup',
    icon: 'kind-icon:wave',
    tooltip: 'Summed sine waves — After Dark plasma 🌊',
    color: '#8b5cf6',
    isActive: false,
  },
  {
    id: 'nyan-trail',
    label: 'Nyan Trail',
    reveal: 'Nyan nyan nyan',
    icon: 'kind-icon:rainbow',
    tooltip: 'Rainbow particle trail follows your cursor 🌈',
    color: '#ec4899',
    isActive: false,
  },
  {
    id: 'matrix-rain',
    label: 'Matrix Rain',
    reveal: 'There is no spoon',
    icon: 'kind-icon:code',
    tooltip: 'Follow the white rabbit 🐇',
    color: '#22c55e',
    isActive: false,
  },
  {
    id: 'pixel-rain',
    label: 'Pixel Rain',
    reveal: "It's raining bits",
    icon: 'kind-icon:pixel',
    tooltip: 'Retro pixel blocks fall and pile up 🕹️',
    color: '#06b6d4',
    isActive: false,
  },
  {
    id: 'pixel-explosion',
    label: 'Pixel Smash',
    reveal: 'Everything is pixels',
    icon: 'kind-icon:pixel',
    tooltip: 'Click anything to shatter it into pixels 💥',
    color: '#dc2626',
    isActive: false,
  },
  // ── Fun ──────────────────────────────────────────────────────────────────
  {
    id: 'wandering-creatures',
    label: 'Creatures',
    reveal: 'They live here now',
    icon: 'kind-icon:butterfly',
    tooltip: 'Critters with distinct personalities roam the screen 🐾',
    color: '#10b981',
    isActive: false,
  },
  {
    id: 'toaster-effect',
    label: 'Flying Toasters',
    reveal: 'Toast incoming!',
    icon: 'kind-icon:toast',
    tooltip: 'After Dark tribute — the original screensaver 🍞',
    color: '#f97316',
    isActive: false,
  },
  // ── Interactive ──────────────────────────────────────────────────────────
  {
    id: 'smudge-effect',
    label: 'Smudge',
    reveal: 'Wet paint',
    icon: 'kind-icon:brush',
    tooltip: 'Drag to smudge · Shift to paint · Scroll to resize 🎨',
    color: '#db2777',
    isActive: false,
    blocksInput: true,
  },
  {
    id: 'ascii-aquarium',
    label: 'Aquarium',
    reveal: 'Glub glub',
    icon: 'kind-icon:fish',
    tooltip: 'Click to feed · Move cursor to spook 🐠',
    color: '#06b6d4',
    isActive: false,
  },
  {
    id: 'pacbot-effect',
    label: 'Pac-Bot',
    reveal: 'Nom nom nom',
    icon: 'kind-icon:robot',
    tooltip:
      'Move to leave crumbs · Click for power · Dbl-click for crumb storm 🤖',
    color: '#eab308',
    isActive: false,
  },
  {
    id: 'pocket-gremlin',
    label: 'Gremlin',
    reveal: 'beep?',
    icon: 'kind-icon:ghost',
    tooltip: 'Click it to pet it · Ignore it at your peril 👾',
    color: '#a78bfa',
    isActive: false,
  },
  {
    id: 'siege-engine',
    label: 'Siege Engine',
    reveal: 'FIRE!!!',
    icon: 'kind-icon:flame',
    tooltip: 'Hold to charge · Release to launch 🪨',
    color: '#b45309',
    isActive: false,
  },
])

// ─── State ────────────────────────────────────────────────────────────────────

const hoveredEffect = ref<string | null>(null)

const activeCount = computed(
  () => effects.value.filter((e) => e.isActive).length,
)

const activeComponents = computed(() =>
  effects.value
    .filter((e) => e.isActive)
    .map((e) => ({ id: e.id, component: componentsMap[e.id] })),
)

const toggleEffect = (id: string) => {
  const effect = effects.value.find((e) => e.id === id)
  if (effect) effect.isActive = !effect.isActive
}

const clearAll = () => effects.value.forEach((e) => (e.isActive = false))
</script>

<style scoped>
/* ── (all existing styles unchanged) ── */

/* ── Zone section ──────────────────────────────────────────────────────────── */

.fx-zone-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.fx-zone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fx-zone-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
}

.fx-zone-reset {
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition:
    color 0.15s,
    background 0.15s;
}
.fx-zone-reset:hover {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
}

.fx-zone-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.fx-zone-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.4);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}

.fx-zone-btn:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
}

.fx-zone-btn--active {
  border-color: var(--color-accent, #a78bfa);
  background: color-mix(in srgb, var(--color-accent, #a78bfa) 15%, transparent);
  color: var(--color-accent, #a78bfa);
}

.fx-zone-icon {
  width: 16px;
  height: 16px;
}

/* ── (escape-btn, fx-panel, fx-header, fx-grid, fx-btn, etc. — all unchanged) ── */
</style>
