<template>
  <Transition name="modal">
    <div v-if="butterfly" class="modal-backdrop" @click.self="$emit('release')">
      <div
        class="modal-card"
        role="dialog"
        :aria-label="`Captured: ${butterfly.name}`"
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

        <div class="modal-rarity">
          #{{ String(butterfly.rarity).padStart(3, '0') }}
        </div>
        <h2 class="modal-name">{{ butterfly.name }}</h2>
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
            <span class="stat-label">top color</span>
            <span
              class="stat-swatch"
              :style="{ background: butterfly.wingTopColor }"
            />
          </div>
          <div class="stat">
            <span class="stat-label">bottom color</span>
            <span
              class="stat-swatch"
              :style="{ background: butterfly.wingBottomColor }"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-release" @click="$emit('release')">
            release · add to gallery
          </button>
          <button class="btn-cancel" @click="$emit('cancel')">let it go</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { RuntimeButterfly } from './butterfly-sprite.vue'

defineProps<{
  butterfly: RuntimeButterfly | null
}>()

defineEmits<{
  /** confirm capture → add to user gallery */
  release: []
  /** discard capture → butterfly returns to field */
  cancel: []
}>()
</script>

<style scoped>
.modal-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 52, 44, 0.18);
  backdrop-filter: blur(2px);
  z-index: 300;
}

.modal-card {
  background: var(--color-background-primary, #fff);
  border-radius: 16px;
  border: 1px solid #9fe1cb;
  padding: 24px 28px 20px;
  min-width: 240px;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(15, 110, 86, 0.12);
}

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
  text-transform: lowercase;
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

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-release {
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

.btn-release:hover {
  background: #e1f5ee;
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

/* transitions */
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
