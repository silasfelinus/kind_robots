<template>
  <button
    v-if="device !== 'touch'"
    type="button"
    tabindex="-1"
    class="pf-glyph"
    :class="
      device === 'gamepad'
        ? `pf-glyph-pad pf-glyph-${pad.tone}`
        : 'pf-glyph-key'
    "
    :title="label"
    @click="emit('press')"
  >
    {{ device === 'gamepad' ? pad.text : key }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConsoleCommand, InputDevice } from '~/utils/consoleInput'

const props = defineProps<{
  command: ConsoleCommand
  device: InputDevice
  label?: string
}>()
const emit = defineEmits<{ press: [] }>()

const PAD: Record<ConsoleCommand, { text: string; tone: string }> = {
  confirm: { text: 'A', tone: 'a' },
  back: { text: 'B', tone: 'b' },
  details: { text: 'Y', tone: 'y' },
  start: { text: '☰', tone: 'menu' },
  prevTab: { text: 'LB', tone: 'bumper' },
  nextTab: { text: 'RB', tone: 'bumper' },
  up: { text: '▲', tone: 'dpad' },
  down: { text: '▼', tone: 'dpad' },
  left: { text: '◀', tone: 'dpad' },
  right: { text: '▶', tone: 'dpad' },
}

const KEY: Record<ConsoleCommand, string> = {
  confirm: 'Enter',
  back: 'Esc',
  details: 'Y',
  start: 'F',
  prevTab: 'Q',
  nextTab: 'E',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

const pad = computed(() => PAD[props.command])
const key = computed(() => KEY[props.command])
</script>

<style>
.pf-glyph {
  display: inline-grid;
  place-items: center;
  min-width: 1.7rem;
  height: 1.7rem;
  padding: 0 0.4rem;
  font-family: var(--pf-display, ui-sans-serif);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  user-select: none;
}
.pf-glyph-key {
  border-radius: 0.3rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 35%, transparent);
  border-bottom-width: 3px;
  background: color-mix(in oklch, var(--color-base-100) 80%, transparent);
  color: var(--color-base-content);
}
.pf-glyph-pad {
  border-radius: 999px;
  color: #0b0d12;
  min-width: 1.7rem;
}
.pf-glyph-a {
  background: #5fd068;
}
.pf-glyph-b {
  background: #f0605a;
}
.pf-glyph-y {
  background: #f5c84c;
}
.pf-glyph-menu,
.pf-glyph-dpad {
  background: color-mix(in oklch, var(--color-base-content) 85%, transparent);
}
.pf-glyph-bumper {
  border-radius: 0.45rem;
  padding: 0 0.55rem;
  background: color-mix(in oklch, var(--color-base-content) 85%, transparent);
}
</style>
