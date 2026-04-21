<!-- /components/butterfly/butterfly-modal.vue -->
<template>
  <Transition name="modal">
    <!-- ── discovery congratulations ──────────────────────────────────────── -->
    <div
      v-if="butterflyStore.discoveryButterfly"
      key="discovery"
      class="modal-backdrop"
      @click.self="butterflyStore.clearDiscovery()"
    >
      <div
        class="modal-card discovery-card"
        role="dialog"
        aria-label="New species discovered"
        @click.stop
      >
        <div class="discovery-glow" aria-hidden="true" />

        <div class="modal-wings" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="96"
            height="72"
            viewBox="0 0 36 28"
          >
            <ellipse
              cx="9"
              cy="10"
              rx="9"
              ry="6"
              :fill="butterflyStore.discoveryButterfly.wingTopColor"
              opacity="0.95"
            />
            <ellipse
              cx="27"
              cy="10"
              rx="9"
              ry="6"
              :fill="butterflyStore.discoveryButterfly.wingTopColor"
              opacity="0.95"
            />
            <ellipse
              cx="8"
              cy="18"
              rx="7"
              ry="5"
              :fill="butterflyStore.discoveryButterfly.wingBottomColor"
              opacity="0.88"
            />
            <ellipse
              cx="28"
              cy="18"
              rx="7"
              ry="5"
              :fill="butterflyStore.discoveryButterfly.wingBottomColor"
              opacity="0.88"
            />
            <ellipse
              cx="18"
              cy="14"
              rx="2"
              ry="6"
              fill="#2c2c2a"
              opacity="0.85"
            />
            <line
              x1="17"
              y1="8"
              x2="13"
              y2="3"
              stroke="#2c2c2a"
              stroke-width="0.9"
            />
            <line
              x1="19"
              y1="8"
              x2="23"
              y2="3"
              stroke="#2c2c2a"
              stroke-width="0.9"
            />
            <circle cx="13" cy="3" r="1" fill="#2c2c2a" />
            <circle cx="23" cy="3" r="1" fill="#2c2c2a" />
          </svg>
        </div>

        <div class="discovery-label">new species discovered</div>
        <h2 class="modal-name">
          {{
            butterflyStore.discoveryButterfly.name ??
            butterflyStore.discoveryButterfly.id
          }}
        </h2>
        <p class="modal-message">
          "{{ butterflyStore.discoveryButterfly.message }}"
        </p>
        <p class="discovery-body">
          This butterfly has never been seen before. It's been added to the
          field guide and your collection.
        </p>

        <div class="modal-actions">
          <button
            class="btn-confirm btn-discovery"
            @click="butterflyStore.clearDiscovery()"
          >
            wonderful
          </button>
        </div>
      </div>
    </div>

    <!-- ── standard capture card ──────────────────────────────────────────── -->
    <div
      v-else-if="butterfly"
      key="capture"
      class="modal-backdrop"
      @click.self="$emit('cancel')"
    >
      <div
        class="modal-card"
        role="dialog"
        :aria-label="`Captured: ${butterfly.name ?? butterfly.id}`"
        @click.stop
      >
        <div class="modal-wings" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="60"
            viewBox="0 0 36 28"
          >
            <ellipse
              cx="9"
              cy="10"
              rx="9"
              ry="6"
              :fill="butterfly.wingTopColor"
              opacity="0.92"
            />
            <ellipse
              cx="27"
              cy="10"
              rx="9"
              ry="6"
              :fill="butterfly.wingTopColor"
              opacity="0.92"
            />
            <ellipse
              cx="8"
              cy="18"
              rx="7"
              ry="5"
              :fill="butterfly.wingBottomColor"
              opacity="0.82"
            />
            <ellipse
              cx="28"
              cy="18"
              rx="7"
              ry="5"
              :fill="butterfly.wingBottomColor"
              opacity="0.82"
            />
            <ellipse
              cx="18"
              cy="14"
              rx="2"
              ry="6"
              fill="#2c2c2a"
              opacity="0.85"
            />
            <line
              x1="17"
              y1="8"
              x2="13"
              y2="3"
              stroke="#2c2c2a"
              stroke-width="0.9"
            />
            <line
              x1="19"
              y1="8"
              x2="23"
              y2="3"
              stroke="#2c2c2a"
              stroke-width="0.9"
            />
            <circle cx="13" cy="3" r="1" fill="#2c2c2a" />
            <circle cx="23" cy="3" r="1" fill="#2c2c2a" />
          </svg>
        </div>

        <div v-if="butterfly.rarity" class="modal-rarity">
          #{{ String(butterfly.rarity).padStart(3, '0') }}
        </div>

        <h2 class="modal-name">{{ butterfly.name ?? butterfly.id }}</h2>
        <p class="modal-message">"{{ butterfly.message }}"</p>

        <div class="modal-stats">
          <div class="stat">
            <span class="stat-label">speed</span>
            <span class="stat-val">{{ butterfly.speed }}×</span>
          </div>
          <div class="stat">
            <span class="stat-label">wing freq</span>
            <span class="stat-val"
              >{{ butterfly.wingSpeed.toFixed(2) }} hz</span
            >
          </div>
          <div class="stat">
            <span class="stat-label">top</span>
            <span
              class="stat-swatch"
              :style="{ background: butterfly.wingTopColor }"
            />
          </div>
          <div class="stat">
            <span class="stat-label">bottom</span>
            <span
              class="stat-swatch"
              :style="{ background: butterfly.wingBottomColor }"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-confirm" @click="$emit('confirm')">
            add to gallery
          </button>
          <button class="btn-cancel" @click="$emit('cancel')">let it go</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useButterflyStore } from '~/stores/butterflyStore'
import type { Butterfly } from '~/stores/helpers/butterflyHelper'

defineProps<{
  butterfly: Butterfly | null
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()

const butterflyStore = useButterflyStore()
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 52, 44, 0.18);
  backdrop-filter: blur(2px);
  z-index: 9300;
  cursor: default;
}

.modal-card {
  position: relative;
  overflow: hidden;
  background: var(--color-background-primary, #fff);
  border-radius: 16px;
  border: 1px solid #9fe1cb;
  padding: 24px 28px 20px;
  min-width: 240px;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(15, 110, 86, 0.12);
}

/* ── discovery variant ──────────────────────────────────────────────────────── */

.discovery-card {
  border-color: #fac775;
  box-shadow: 0 8px 40px rgba(239, 159, 39, 0.2);
}

.discovery-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 25%,
    rgba(250, 199, 117, 0.22) 0%,
    transparent 68%
  );
  pointer-events: none;
}

.discovery-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #ba7517;
  margin-bottom: 6px;
}

.discovery-body {
  font-size: 12px;
  color: var(--color-text-secondary, #666);
  line-height: 1.6;
  margin-bottom: 16px;
}

/* ── shared card elements ───────────────────────────────────────────────────── */

.modal-wings {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.modal-rarity {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: #5dcaa5;
  margin-bottom: 4px;
}

.modal-name {
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text-primary, #1a1a18);
  margin-bottom: 8px;
  line-height: 1.2;
}

.modal-message {
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  line-height: 1.55;
  margin-bottom: 16px;
  font-style: italic;
}

.modal-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 18px;
}

.stat {
  background: var(--color-background-secondary, #f5f5f3);
  border-radius: 8px;
  padding: 8px 10px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 10px;
  color: var(--color-text-secondary, #888);
  letter-spacing: 0.04em;
}

.stat-val {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #222);
}

.stat-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: block;
}

/* ── actions ────────────────────────────────────────────────────────────────── */

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-confirm {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1.5px solid #1d9e75;
  background: transparent;
  color: #0f6e56;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-confirm:hover {
  background: #e1f5ee;
}

.btn-discovery {
  border-color: #ba7517;
  color: #854f0b;
}

.btn-discovery:hover {
  background: #faeeda;
}

.btn-cancel {
  width: 100%;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-tertiary, rgba(0, 0, 0, 0.12));
  background: transparent;
  color: var(--color-text-secondary, #888);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover {
  background: var(--color-background-secondary, #f5f5f3);
}

/* ── transitions ────────────────────────────────────────────────────────────── */

.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: inherit;
}
</style>
