<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <!-- Active effect layers — all children must have pointer-events: none (except smudge) -->
  <div class="effect-container">
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
    />
  </div>

  <!-- Floating escape button — z-index 9999, always above every effect -->
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

  <!-- ── FX Panel ──────────────────────────────────────────────────────────── -->
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
        <!-- Tooltip -->
        <Transition name="tooltip">
          <div v-if="hoveredEffect === effect.id" class="fx-tooltip">
            {{ effect.tooltip }}
            <span v-if="effect.blocksInput" class="fx-tooltip-warn"
              >⚠ captures clicks</span
            >
          </div>
        </Transition>

        <!-- Active ring pulse -->
        <div v-if="effect.isActive" class="fx-pulse" />

        <!-- Icon -->
        <div class="fx-icon-wrap">
          <Icon :name="effect.icon" class="fx-icon" />
        </div>

        <!-- Label -->
        <span class="fx-label" :class="{ 'fx-label--reveal': effect.isActive }">
          {{ effect.isActive ? effect.reveal : effect.label }}
        </span>
      </div>
    </div>

    <!-- Footer hint -->
    <div class="fx-footer">Effects layer on top of each other — mix freely</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Effect {
  id: string
  label: string
  reveal: string
  icon: string
  tooltip: string
  color: string // hex — used for active glow/border
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

// ─── Effect definitions ───────────────────────────────────────────────────────
// color: used for active border, glow, and bg tint
// icon:  verify these against your kind-icon set; swap any that don't resolve

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
  // ── Interactive (blocks input — escape button always accessible) ──────────
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
/* ── Escape button ─────────────────────────────────────────────────────────── */

.escape-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  backdrop-filter: blur(10px);
  pointer-events: auto;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.1s;
}
.escape-btn:hover {
  background: rgba(200, 30, 30, 0.8);
  border-color: rgba(255, 80, 80, 0.5);
  transform: scale(1.05);
}
.escape-btn:active {
  transform: scale(0.97);
}

/* ── Panel ─────────────────────────────────────────────────────────────────── */

.fx-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 8, 16, 0.6);
  backdrop-filter: blur(16px);
}

/* ── Header ─────────────────────────────────────────────────────────────────── */

.fx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.fx-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
}

.fx-logo {
  font-size: 18px;
  color: var(--color-accent, #a78bfa);
  animation: spin-slow 8s linear infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fx-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fx-active-badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--color-accent, #a78bfa);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.fx-total-label {
  font-size: 11px;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
}

/* ── Grid ──────────────────────────────────────────────────────────────────── */

.fx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 10px;
}

/* ── Button ────────────────────────────────────────────────────────────────── */

.fx-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px 12px;
  border-radius: 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.15s ease,
    box-shadow 0.18s ease;
  min-height: 96px;
  overflow: visible;
}

.fx-btn:hover {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.07);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.fx-btn:active {
  transform: translateY(-1px) scale(0.97);
}

/* Active state — uses --ec CSS variable set via inline style */
.fx-btn--active {
  border-color: var(--ec, var(--color-accent, #a78bfa));
  background: color-mix(
    in srgb,
    var(--ec, var(--color-accent, #a78bfa)) 14%,
    transparent
  );
  box-shadow:
    0 0 20px
      color-mix(
        in srgb,
        var(--ec, var(--color-accent, #a78bfa)) 30%,
        transparent
      ),
    0 0 6px
      color-mix(
        in srgb,
        var(--ec, var(--color-accent, #a78bfa)) 50%,
        transparent
      ),
    inset 0 0 14px
      color-mix(
        in srgb,
        var(--ec, var(--color-accent, #a78bfa)) 8%,
        transparent
      );
}

.fx-btn--active:hover {
  background: color-mix(
    in srgb,
    var(--ec, var(--color-accent, #a78bfa)) 22%,
    transparent
  );
  transform: translateY(-3px);
}

/* Blocks-input indicator */
.fx-btn--blocks::after {
  content: '⚠';
  position: absolute;
  top: 5px;
  right: 7px;
  font-size: 8px;
  opacity: 0.4;
  line-height: 1;
}

/* ── Pulse ring on active buttons ──────────────────────────────────────────── */

.fx-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 18px;
  border: 1.5px solid var(--ec, var(--color-accent, #a78bfa));
  animation: pulse-ring 2.5s ease-out infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  70% {
    opacity: 0;
    transform: scale(1.06);
  }
  100% {
    opacity: 0;
    transform: scale(1.06);
  }
}

/* ── Icon ──────────────────────────────────────────────────────────────────── */

.fx-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  transition:
    background 0.18s,
    transform 0.15s;
}

.fx-btn:hover .fx-icon-wrap {
  background: rgba(255, 255, 255, 0.1);
}

.fx-btn--active .fx-icon-wrap {
  background: color-mix(
    in srgb,
    var(--ec, var(--color-accent, #a78bfa)) 20%,
    transparent
  );
  transform: scale(1.08);
}

.fx-icon {
  width: 26px;
  height: 26px;
  color: rgba(255, 255, 255, 0.65);
  transition:
    color 0.18s,
    transform 0.15s;
}

.fx-btn:hover .fx-icon {
  color: rgba(255, 255, 255, 0.9);
}

.fx-btn--active .fx-icon {
  color: var(--ec, var(--color-accent, #a78bfa));
  filter: drop-shadow(0 0 6px var(--ec, var(--color-accent, #a78bfa)));
}

/* ── Label ─────────────────────────────────────────────────────────────────── */

.fx-label {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
  transition: color 0.18s;
  max-width: 80px;
}

.fx-btn:hover .fx-label {
  color: rgba(255, 255, 255, 0.8);
}

.fx-btn--active .fx-label {
  color: var(--ec, var(--color-accent, #a78bfa));
  font-style: italic;
}

/* ── Tooltip ───────────────────────────────────────────────────────────────── */

.fx-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.85);
  font-size: 11.5px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.fx-tooltip-warn {
  font-size: 10px;
  color: #fbbf24;
  letter-spacing: 0.04em;
}

/* Tooltip arrow */
.fx-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(10, 10, 20, 0.92);
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

.fx-footer {
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  padding-top: 2px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

/* ── Transitions ───────────────────────────────────────────────────────────── */

.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

/* ── Glow animation (used by Icon :class binding) ──────────────────────────── */
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow:
      0 0 14px rgba(255, 255, 255, 0.7),
      0 0 22px rgba(255, 115, 253, 0.6);
  }
}
.glow {
  animation: glow 1.5s infinite;
}
</style>
