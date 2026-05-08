<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="activeCount > 0"
      class="effect-container"
      :class="{ 'effect-container--interactive': hasBlockingEffect }"
      :style="animationStore.layerStyle"
    >
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
        type="button"
        @click="clearAll"
      >
        <Icon name="kind-icon:close" class="h-5 w-5" />
        <span>clear all</span>
        <strong>{{ activeCount }}</strong>
      </button>
    </Transition>
  </Teleport>

  <section class="screen-fx-shell">
    <div class="fx-panel">
      <div class="fx-header">
        <div class="fx-title">
          <span class="fx-logo">✦</span>
          <div>
            <h2>Screen FX</h2>
            <p>Layer chaos responsibly.</p>
          </div>
        </div>

        <div class="fx-header-right">
          <span v-if="activeCount > 0" class="fx-active-badge">
            {{ activeCount }} active
          </span>
          <span class="fx-total-label">{{ effects.length }} effects</span>
        </div>
      </div>

      <div class="fx-zone-section">
        <div class="fx-zone-header">
          <div>
            <span class="fx-zone-title">Coverage zones</span>
            <p class="fx-zone-subtitle">
              Choose where animations are allowed to wander.
            </p>
          </div>

          <button
            v-if="anyZoneActive"
            class="fx-zone-reset"
            type="button"
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
            type="button"
            @click="animationStore.toggleZone(zone.id)"
          >
            <span class="fx-zone-icon-wrap">
              <Icon :name="zone.icon" class="fx-zone-icon" />
            </span>
            <span class="fx-zone-label">{{ zone.label }}</span>
            <span class="fx-zone-state">
              {{ animationStore.zones[zone.id] ? 'on' : 'off' }}
            </span>
          </button>
        </div>
      </div>

      <div class="fx-grid">
        <button
          v-for="effect in effects"
          :key="effect.id"
          class="fx-btn"
          :class="{
            'fx-btn--active': effect.isActive,
            'fx-btn--blocks': effect.blocksInput,
          }"
          :style="effect.isActive ? { '--ec': effect.color } : {}"
          type="button"
          :aria-pressed="effect.isActive"
          :aria-label="effect.label"
          @click="toggleEffect(effect.id)"
          @mouseenter="hoveredEffect = effect.id"
          @mouseleave="hoveredEffect = null"
        >
          <Transition name="tooltip">
            <div v-if="hoveredEffect === effect.id" class="fx-tooltip">
              <span>{{ effect.tooltip }}</span>
              <span v-if="effect.blocksInput" class="fx-tooltip-warn">
                captures clicks
              </span>
            </div>
          </Transition>

          <span v-if="effect.isActive" class="fx-pulse" />

          <span class="fx-icon-wrap">
            <Icon :name="effect.icon" class="fx-icon" />
          </span>

          <span class="fx-label">
            {{ effect.isActive ? effect.reveal : effect.label }}
          </span>

          <span v-if="effect.blocksInput" class="fx-block-chip">
            interactive
          </span>
        </button>
      </div>

      <div class="fx-footer">
        <span>Effects stack together.</span>
        <span>Several of these are absolutely unhinged. Good.</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'
import {
  useAnimationStore,
  type AnimationLayerZone,
} from '@/stores/animationStore'

const animationStore = useAnimationStore()

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
  zoneOptions.some((zone) => animationStore.zones[zone.id]),
)

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
  'pixel-explosion': resolveComponent('LazyPixelExplosion'),
  'ascii-aquarium': resolveComponent('LazyAsciiAquarium'),
  'pacbot-effect': resolveComponent('LazyPacbotEffect'),
  'pocket-gremlin': resolveComponent('LazyPocketGremlin'),
  'siege-engine': resolveComponent('LazySiegeEngine'),
}

const effects = ref<Effect[]>([
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
    tooltip: 'Summed sine waves, After Dark plasma 🌊',
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
    tooltip: 'After Dark tribute, the original screensaver 🍞',
    color: '#f97316',
    isActive: false,
  },

  {
    id: 'ascii-aquarium',
    label: 'Aquarium',
    reveal: 'Glub glub',
    icon: 'kind-icon:fish',
    tooltip: 'Click to feed, Move cursor to spook 🐠',
    color: '#06b6d4',
    isActive: false,
  },
  {
    id: 'pacbot-effect',
    label: 'Pac-Bot',
    reveal: 'Nom nom nom',
    icon: 'kind-icon:robot',
    tooltip:
      'Move to leave crumbs, Click for power, Dbl-click for crumb storm 🤖',
    color: '#eab308',
    isActive: false,
  },
  {
    id: 'pocket-gremlin',
    label: 'Gremlin',
    reveal: 'beep?',
    icon: 'kind-icon:ghost',
    tooltip: 'Click it to pet it, Ignore it at your peril 👾',
    color: '#a78bfa',
    isActive: false,
  },
  {
    id: 'siege-engine',
    label: 'Siege Engine',
    reveal: 'FIRE!!!',
    icon: 'kind-icon:flame',
    tooltip: 'Hold to charge, Release to launch 🪨',
    color: '#b45309',
    isActive: false,
  },
])

const hoveredEffect = ref<string | null>(null)

const activeCount = computed(
  () => effects.value.filter((effect) => effect.isActive).length,
)

const hasBlockingEffect = computed(() =>
  effects.value.some((effect) => effect.isActive && effect.blocksInput),
)

const activeComponents = computed(() =>
  effects.value
    .filter((effect) => effect.isActive)
    .map((effect) => ({ id: effect.id, component: componentsMap[effect.id] }))
    .filter((activeComponent) => activeComponent.component),
)

const toggleEffect = (id: string) => {
  const effect = effects.value.find((item) => item.id === id)
  if (!effect) return
  effect.isActive = !effect.isActive
}

const clearAll = () => {
  effects.value.forEach((effect) => {
    effect.isActive = false
  })
}
</script>

<style scoped>
.screen-fx-shell {
  position: relative;
  z-index: 70;
  width: 100%;
  min-height: 100%;
  padding: 0.75rem;
}

.effect-container {
  position: fixed;
  z-index: 40;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
}

.effect-container--interactive {
  pointer-events: auto;
}

.escape-btn {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, hsl(var(--er)) 45%, white 15%);
  border-radius: 999px;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(255, 255, 255, 0.22),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      hsl(var(--er)),
      color-mix(in srgb, hsl(var(--er)) 70%, black 30%)
    );
  color: hsl(var(--erc));
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  box-shadow:
    0 1.25rem 3rem rgba(0, 0, 0, 0.35),
    0 0 0 0.25rem rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.escape-btn:hover {
  transform: translateY(-2px) scale(1.03);
  filter: saturate(1.2);
  box-shadow:
    0 1.5rem 3.5rem rgba(0, 0, 0, 0.42),
    0 0 0 0.3rem rgba(255, 255, 255, 0.12);
}

.escape-btn:active {
  transform: translateY(0) scale(0.98);
}

.escape-btn strong {
  display: grid;
  min-width: 1.55rem;
  height: 1.55rem;
  place-items: center;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.24);
  font-size: 0.8rem;
}

.fx-panel {
  position: relative;
  z-index: 80;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 1rem;
  overflow: visible;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 16%, transparent);
  border-radius: 1.5rem;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, hsl(var(--p)) 18%, transparent),
      transparent 34rem
    ),
    radial-gradient(
      circle at bottom right,
      color-mix(in srgb, hsl(var(--a)) 16%, transparent),
      transparent 30rem
    ),
    color-mix(in srgb, hsl(var(--b2)) 92%, black 8%);
  padding: clamp(0.75rem, 2vw, 1.25rem);
  box-shadow:
    0 1.5rem 4rem rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.fx-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 12%, transparent);
  background: color-mix(in srgb, hsl(var(--b1)) 78%, transparent);
  padding: 0.85rem;
}

.fx-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.85rem;
}

.fx-title h2 {
  margin: 0;
  color: hsl(var(--bc));
  font-size: clamp(1.25rem, 3vw, 1.9rem);
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.045em;
}

.fx-title p {
  margin: 0.25rem 0 0;
  color: color-mix(in srgb, hsl(var(--bc)) 62%, transparent);
  font-size: 0.85rem;
  font-weight: 650;
}

.fx-logo {
  display: grid;
  width: 3rem;
  height: 3rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 1rem;
  background:
    radial-gradient(
      circle at 25% 25%,
      rgba(255, 255, 255, 0.4),
      transparent 28%
    ),
    linear-gradient(135deg, hsl(var(--p)), hsl(var(--a)));
  color: hsl(var(--pc));
  font-size: 1.5rem;
  box-shadow: 0 0.9rem 1.75rem
    color-mix(in srgb, hsl(var(--p)) 24%, transparent);
}

.fx-header-right {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.fx-active-badge,
.fx-total-label {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.fx-active-badge {
  border: 1px solid color-mix(in srgb, hsl(var(--su)) 42%, transparent);
  background: color-mix(in srgb, hsl(var(--su)) 20%, transparent);
  color: hsl(var(--suc));
}

.fx-total-label {
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 12%, transparent);
  background: color-mix(in srgb, hsl(var(--b3)) 65%, transparent);
  color: color-mix(in srgb, hsl(var(--bc)) 72%, transparent);
}

.fx-zone-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, hsl(var(--a)) 24%, transparent);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, hsl(var(--a)) 14%, transparent),
      transparent
    ),
    color-mix(in srgb, hsl(var(--b1)) 76%, transparent);
  padding: 0.9rem;
}

.fx-zone-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.fx-zone-title {
  display: block;
  color: hsl(var(--bc));
  font-size: 0.78rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fx-zone-subtitle {
  margin: 0.25rem 0 0;
  color: color-mix(in srgb, hsl(var(--bc)) 62%, transparent);
  font-size: 0.8rem;
  font-weight: 650;
}

.fx-zone-reset {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, hsl(var(--wa)) 35%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, hsl(var(--wa)) 12%, transparent);
  color: hsl(var(--wac));
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease;
}

.fx-zone-reset:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, hsl(var(--wa)) 55%, white 12%);
  background: color-mix(in srgb, hsl(var(--wa)) 22%, transparent);
}

.fx-zone-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.fx-zone-btn {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 4.25rem;
  align-items: center;
  gap: 0.65rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 13%, transparent);
  border-radius: 1.1rem;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(255, 255, 255, 0.1),
      transparent 34%
    ),
    color-mix(in srgb, hsl(var(--b2)) 82%, black 6%);
  color: hsl(var(--bc));
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.fx-zone-btn:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, hsl(var(--a)) 45%, transparent);
  background:
    radial-gradient(
      circle at 20% 20%,
      color-mix(in srgb, hsl(var(--a)) 18%, transparent),
      transparent 38%
    ),
    color-mix(in srgb, hsl(var(--b1)) 88%, transparent);
  box-shadow: 0 0.85rem 1.8rem rgba(0, 0, 0, 0.18);
}

.fx-zone-btn--active {
  border-color: color-mix(in srgb, hsl(var(--a)) 72%, white 8%);
  background:
    radial-gradient(
      circle at 20% 20%,
      color-mix(in srgb, hsl(var(--a)) 32%, transparent),
      transparent 40%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, hsl(var(--a)) 22%, transparent),
      color-mix(in srgb, hsl(var(--p)) 12%, transparent)
    ),
    color-mix(in srgb, hsl(var(--b1)) 88%, transparent);
  box-shadow:
    0 0.9rem 2rem color-mix(in srgb, hsl(var(--a)) 16%, transparent),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.fx-zone-icon-wrap {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border-radius: 0.9rem;
  background: color-mix(in srgb, hsl(var(--bc)) 9%, transparent);
  color: color-mix(in srgb, hsl(var(--bc)) 72%, transparent);
}

.fx-zone-btn--active .fx-zone-icon-wrap {
  background: color-mix(in srgb, hsl(var(--a)) 26%, transparent);
  color: hsl(var(--a));
}

.fx-zone-icon {
  width: 1.35rem;
  height: 1.35rem;
}

.fx-zone-label {
  min-width: 0;
  overflow: hidden;
  color: hsl(var(--bc));
  font-size: 0.9rem;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fx-zone-state {
  display: inline-flex;
  min-width: 2.45rem;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, hsl(var(--bc)) 8%, transparent);
  color: color-mix(in srgb, hsl(var(--bc)) 60%, transparent);
  padding: 0.25rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.fx-zone-btn--active .fx-zone-state {
  background: color-mix(in srgb, hsl(var(--a)) 28%, transparent);
  color: hsl(var(--a));
}

.fx-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.fx-btn {
  --ec: hsl(var(--p));
  position: relative;
  display: grid;
  min-height: 7.25rem;
  grid-template-rows: auto 1fr auto;
  place-items: center;
  gap: 0.45rem;
  overflow: visible;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 12%, transparent);
  border-radius: 1.25rem;
  background:
    radial-gradient(
      circle at 25% 15%,
      rgba(255, 255, 255, 0.13),
      transparent 34%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, hsl(var(--b1)) 88%, transparent),
      color-mix(in srgb, hsl(var(--b2)) 92%, black 8%)
    );
  color: hsl(var(--bc));
  padding: 0.9rem 0.65rem;
  text-align: center;
  box-shadow:
    0 0.7rem 1.5rem rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    filter 0.18s ease;
}

.fx-btn:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--ec) 46%, white 10%);
  background:
    radial-gradient(
      circle at 25% 15%,
      color-mix(in srgb, var(--ec) 18%, transparent),
      transparent 38%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, hsl(var(--b1)) 92%, transparent),
      color-mix(in srgb, hsl(var(--b2)) 88%, black 8%)
    );
  box-shadow:
    0 1rem 2.1rem rgba(0, 0, 0, 0.18),
    0 0 0 0.18rem color-mix(in srgb, var(--ec) 10%, transparent);
}

.fx-btn:active {
  transform: translateY(-1px) scale(0.985);
}

.fx-btn--active {
  border-color: color-mix(in srgb, var(--ec) 78%, white 8%);
  background:
    radial-gradient(
      circle at 20% 18%,
      color-mix(in srgb, var(--ec) 34%, transparent),
      transparent 42%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--ec) 18%, hsl(var(--b1)) 82%),
      color-mix(in srgb, hsl(var(--b2)) 86%, black 10%)
    );
  box-shadow:
    0 1rem 2.4rem color-mix(in srgb, var(--ec) 24%, transparent),
    0 0 0 0.18rem color-mix(in srgb, var(--ec) 18%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.13);
}

.fx-btn--blocks {
  border-style: dashed;
}

.fx-icon-wrap {
  position: relative;
  z-index: 2;
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 1rem;
  background: color-mix(in srgb, hsl(var(--bc)) 8%, transparent);
  color: color-mix(in srgb, hsl(var(--bc)) 72%, transparent);
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.fx-btn:hover .fx-icon-wrap {
  transform: scale(1.06) rotate(-2deg);
}

.fx-btn--active .fx-icon-wrap {
  background: color-mix(in srgb, var(--ec) 24%, transparent);
  color: var(--ec);
}

.fx-icon {
  width: 1.65rem;
  height: 1.65rem;
}

.fx-label {
  position: relative;
  z-index: 2;
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  color: hsl(var(--bc));
  font-size: 0.82rem;
  font-weight: 950;
  line-height: 1.08;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.fx-block-chip {
  position: relative;
  z-index: 2;
  border-radius: 999px;
  background: color-mix(in srgb, hsl(var(--wa)) 16%, transparent);
  color: hsl(var(--wac));
  padding: 0.2rem 0.5rem;
  font-size: 0.62rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.fx-pulse {
  position: absolute;
  inset: 0.45rem;
  z-index: 1;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--ec) 42%, transparent);
  opacity: 0.75;
  animation: fx-pulse 1.7s ease-in-out infinite;
  pointer-events: none;
}

.fx-tooltip {
  position: absolute;
  right: 0.45rem;
  bottom: calc(100% + 0.5rem);
  z-index: 20;
  display: flex;
  width: min(16rem, 80vw);
  flex-direction: column;
  gap: 0.35rem;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 14%, transparent);
  border-radius: 0.9rem;
  background: color-mix(in srgb, hsl(var(--b1)) 96%, black 4%);
  color: hsl(var(--bc));
  padding: 0.65rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 750;
  line-height: 1.25;
  text-align: left;
  box-shadow: 0 1rem 2.4rem rgba(0, 0, 0, 0.24);
}

.fx-tooltip-warn {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  background: color-mix(in srgb, hsl(var(--wa)) 18%, transparent);
  color: hsl(var(--wa));
  padding: 0.18rem 0.45rem;
  font-size: 0.65rem;
  font-weight: 950;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.fx-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 10%, transparent);
  background: color-mix(in srgb, hsl(var(--b1)) 68%, transparent);
  color: color-mix(in srgb, hsl(var(--bc)) 60%, transparent);
  padding: 0.75rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 750;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.96);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(0.3rem) scale(0.98);
}

@keyframes fx-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.98);
  }

  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
}

@media (min-width: 640px) {
  .fx-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fx-zone-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .fx-zone-btn {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

@media (min-width: 1024px) {
  .screen-fx-shell {
    padding: 1rem;
  }

  .fx-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .fx-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .fx-header {
    flex-direction: column;
  }

  .fx-header-right {
    justify-content: flex-start;
  }

  .fx-btn {
    min-height: 6.7rem;
  }

  .escape-btn {
    right: max(0.75rem, env(safe-area-inset-right));
    bottom: max(0.75rem, env(safe-area-inset-bottom));
    min-height: 2.75rem;
    padding: 0.65rem 0.85rem;
    font-size: 0.75rem;
  }
}
</style>
