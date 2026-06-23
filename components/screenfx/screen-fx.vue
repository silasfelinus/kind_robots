<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <section class="screen-fx-shell">
    <div class="fx-panel">
      <div class="fx-header">
        <div class="fx-title">
          <span class="fx-logo">
            <Icon name="kind-icon:sparkles" class="h-7 w-7" />
          </span>
          <div>
            <h2>Screen FX</h2>
            <p>Layer chaos responsibly.</p>
          </div>
        </div>

        <div class="fx-header-right">
          <span
            v-if="animationStore.screenEffectCount > 0"
            class="fx-active-badge"
          >
            {{ animationStore.screenEffectCount }} active
          </span>
          <span class="fx-total-label">
            {{ animationStore.effects.length }} effects
          </span>
        </div>
      </div>

      <div class="fx-zone-section">
        <div class="fx-zone-header">
          <div>
            <span class="fx-zone-title">Coverage zones</span>
            <p class="fx-zone-subtitle">
              Choose where animations wander, and whether they go behind or in
              front of each surface.
            </p>
          </div>

          <button
            class="fx-zone-reset"
            type="button"
            @click="animationStore.resetSurfaces()"
          >
            reset
          </button>
        </div>

        <div class="fx-zone-grid">
          <div
            v-for="zone in zoneOptions"
            :key="zone.id"
            class="fx-zone-card"
            :class="{ 'fx-zone-card--active': zoneActive(zone.id) }"
            :title="zone.tooltip"
          >
            <span class="fx-zone-icon-wrap">
              <Icon :name="zone.icon" class="fx-zone-icon" />
            </span>

            <span class="fx-zone-label">{{ zone.label }}</span>

            <div
              class="fx-zone-segments"
              role="group"
              :aria-label="`${zone.label} placement`"
            >
              <button
                v-for="option in placementOptions"
                :key="option.value"
                class="fx-zone-segment"
                :class="{
                  'fx-zone-segment--active':
                    animationStore.getSurfacePlacement(zone.id) ===
                    option.value,
                  [`fx-zone-segment--${option.value}`]:
                    animationStore.getSurfacePlacement(zone.id) ===
                    option.value,
                }"
                type="button"
                :aria-pressed="
                  animationStore.getSurfacePlacement(zone.id) === option.value
                "
                :title="option.title(zone.label)"
                @click="
                  animationStore.setSurfacePlacement(zone.id, option.value)
                "
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="fx-grid">
        <button
          v-for="effect in animationStore.effects"
          :key="effect.id"
          class="fx-btn"
          :class="{
            'fx-btn--active': animationStore.isScreenEffectActive(effect.id),
            'fx-btn--blocks': effect.blocksInput,
          }"
          :style="
            animationStore.isScreenEffectActive(effect.id)
              ? { '--ec': effect.color }
              : {}
          "
          type="button"
          :aria-pressed="animationStore.isScreenEffectActive(effect.id)"
          :aria-label="effect.label"
          @click="animationStore.toggleScreenEffect(effect.id)"
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

          <span
            v-if="animationStore.isScreenEffectActive(effect.id)"
            class="fx-pulse"
          />

          <span class="fx-icon-wrap">
            <Icon :name="effect.icon" class="fx-icon" />
          </span>

          <span class="fx-label">
            {{
              animationStore.isScreenEffectActive(effect.id)
                ? effect.reveal
                : effect.label
            }}
          </span>

          <span v-if="effect.blocksInput" class="fx-block-chip">
            interactive
          </span>
        </button>
      </div>

      <div class="fx-footer">
        <span
          >Effects stack, combine freely, and follow you between pages.</span
        >
        <span>Several are absolutely unhinged. Good.</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  useAnimationStore,
  type AnimationEffectId,
  type FxRegion,
  type FxPlacementState,
} from '@/stores/animationStore'

const animationStore = useAnimationStore()

const hoveredEffect = ref<AnimationEffectId | null>(null)

const zoneOptions: {
  id: FxRegion
  label: string
  icon: string
  tooltip: string
}[] = [
  {
    id: 'header',
    label: 'Header',
    icon: 'kind-icon:layout-top',
    tooltip: 'The dashboard header bar',
  },
  {
    id: 'sheet',
    label: 'Sheet',
    icon: 'kind-icon:layout-left',
    tooltip: 'The workspace sheet sidebar',
  },
  {
    id: 'page',
    label: 'Page',
    icon: 'kind-icon:sparkle',
    tooltip: 'The main page content',
  },
  {
    id: 'hand',
    label: 'Hand',
    icon: 'kind-icon:layout-bottom',
    tooltip: 'The card hand along the bottom',
  },
]

function zoneActive(region: FxRegion): boolean {
  return animationStore.getSurfacePlacement(region) !== 'off'
}

const placementOptions: {
  value: FxPlacementState
  label: string
  title: (zone: string) => string
}[] = [
  {
    value: 'off',
    label: 'off',
    title: (zone) => `No effects on the ${zone.toLowerCase()}`,
  },
  {
    value: 'behind',
    label: 'behind',
    title: (zone) => `Render behind the ${zone.toLowerCase()} content`,
  },
  {
    value: 'front',
    label: 'front',
    title: (zone) => `Render in front of the ${zone.toLowerCase()}`,
  },
]
</script>

<style scoped>
.screen-fx-shell {
  position: relative;
  z-index: 70;
  width: 100%;
  min-height: 100%;
  padding: 0.75rem;
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
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.65rem;
}

.fx-zone-card {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.55rem;
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
  text-align: center;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.fx-zone-card--active {
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

.fx-zone-card--active .fx-zone-icon-wrap {
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

.fx-zone-segments {
  display: inline-flex;
  gap: 0;
  padding: 0.2rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, hsl(var(--bc)) 14%, transparent);
  background: color-mix(in srgb, hsl(var(--b3)) 70%, black 6%);
}

.fx-zone-segment {
  display: inline-flex;
  min-width: 3.1rem;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: color-mix(in srgb, hsl(var(--bc)) 52%, transparent);
  padding: 0.32rem 0.6rem;
  font-size: 0.64rem;
  font-weight: 950;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.fx-zone-segment:hover {
  color: hsl(var(--bc));
}

.fx-zone-segment--active {
  color: hsl(var(--pc));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.fx-zone-segment--off {
  background: color-mix(in srgb, hsl(var(--bc)) 30%, transparent);
  color: hsl(var(--b1));
}

.fx-zone-segment--behind {
  background: linear-gradient(
    135deg,
    hsl(var(--in)),
    color-mix(in srgb, hsl(var(--in)) 70%, black 12%)
  );
  color: hsl(var(--inc));
}

.fx-zone-segment--front {
  background: linear-gradient(
    135deg,
    hsl(var(--a)),
    color-mix(in srgb, hsl(var(--a)) 70%, black 12%)
  );
  color: hsl(var(--ac));
}

.fx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
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
}
</style>
