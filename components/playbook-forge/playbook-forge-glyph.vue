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
