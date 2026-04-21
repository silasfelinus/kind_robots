<template>
  <button
    class="net-icon-btn"
    :class="{ active: modelValue }"
    :aria-label="modelValue ? 'Close butterfly game' : 'Open butterfly game'"
    :title="modelValue ? 'Close butterfly game' : 'Catch butterflies'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="30"
      viewBox="0 0 72 88"
      class="net-icon-svg"
      aria-hidden="true"
    >
      <!-- handle -->
      <line
        x1="8"
        y1="76"
        x2="36"
        y2="46"
        stroke-width="5"
        stroke-linecap="round"
        class="handle"
      />
      <!-- hoop -->
      <ellipse
        cx="44"
        cy="34"
        rx="24"
        ry="20"
        fill="none"
        stroke-width="3.5"
        class="hoop"
      />
      <!-- net mesh lines (vertical) -->
      <g class="mesh" stroke-width="1.2" fill="none" opacity="0.75">
        <line x1="32" y1="34" x2="30" y2="70" />
        <line x1="44" y1="34" x2="44" y2="74" />
        <line x1="56" y1="34" x2="58" y2="70" />
        <line x1="38" y1="34" x2="37" y2="72" />
        <line x1="50" y1="34" x2="51" y2="72" />
        <!-- horizontal curves -->
        <path d="M22,38 Q44,62 66,38" />
        <path d="M24,46 Q44,68 64,46" />
        <path d="M27,54 Q44,72 61,54" />
        <path d="M31,62 Q44,74 57,62" />
      </g>
      <!-- net bag fill -->
      <path
        d="M22,34 Q44,76 66,34"
        fill="none"
        stroke-width="2"
        stroke-dasharray="none"
        class="bag-outline"
      />
    </svg>

    <!-- X mark when active -->
    <span class="close-x" aria-hidden="true">×</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.net-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s,
    transform 0.14s;
  color: inherit;
}

.net-icon-btn:hover {
  background: rgba(29, 158, 117, 0.1);
  border-color: rgba(29, 158, 117, 0.35);
  transform: scale(1.08);
}

.net-icon-btn.active {
  background: rgba(29, 158, 117, 0.14);
  border-color: #1d9e75;
}

.net-icon-svg {
  display: block;
  transition:
    opacity 0.18s,
    transform 0.18s;
}

.net-icon-btn.active .net-icon-svg {
  opacity: 0.35;
  transform: scale(0.85);
}

.handle {
  stroke: #7f77dd;
}

.hoop {
  stroke: #1d9e75;
}

.mesh {
  stroke: #5dcaa5;
}

.bag-outline {
  stroke: #0f6e56;
}

.close-x {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
  color: #0f6e56;
  opacity: 0;
  transition: opacity 0.18s;
  pointer-events: none;
}

.net-icon-btn.active .close-x {
  opacity: 1;
}

/* dark mode tints */
@media (prefers-color-scheme: dark) {
  .handle {
    stroke: #afa9ec;
  }
  .hoop {
    stroke: #5dcaa5;
  }
  .mesh {
    stroke: #9fe1cb;
  }
  .bag-outline {
    stroke: #5dcaa5;
  }
  .close-x {
    color: #5dcaa5;
  }
}
</style>
