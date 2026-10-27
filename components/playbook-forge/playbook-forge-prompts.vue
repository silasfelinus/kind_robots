<template>
  <footer
    v-if="device !== 'touch'"
    class="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t border-base-content/10 pt-3 @md:gap-x-5"
    aria-label="Controls"
  >
    <span
      v-for="prompt in prompts"
      :key="prompt.command + prompt.label"
      class="flex items-center gap-2"
    >
      <PlaybookForgeGlyph
        :command="prompt.command"
        :device="device"
        :label="prompt.label"
        @press="emit('command', prompt.command)"
      />
      <span class="pf-label hidden text-xs opacity-80 @md:inline">{{
        prompt.label
      }}</span>
    </span>
  </footer>
  <footer
    v-else
    class="flex shrink-0 items-center justify-between gap-3 border-t border-base-content/10 pt-2"
  >
    <button
      v-if="forge.screen !== 'title'"
      type="button"
      class="pf-label btn btn-ghost btn-sm"
      @click="emit('command', 'back')"
    >
      Back
    </button>
    <button
      v-if="
        forge.screen === 'loadout' ||
        forge.screen === 'analyze' ||
        forge.screen === 'ledger'
      "
      type="button"
      class="pf-label btn btn-primary btn-sm ml-auto"
      @click="emit('command', 'start')"
    >
      {{
        forge.screen === 'ledger'
          ? 'Plan'
          : forge.existing
            ? 'Review plan'
            : 'Launch'
      }}
    </button>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import type { ConsoleCommand, InputDevice } from '~/utils/consoleInput'

defineProps<{ device: InputDevice }>()
const emit = defineEmits<{ command: [ConsoleCommand] }>()
const forge = usePlaybookForgeStore()

const prompts = computed<{ command: ConsoleCommand; label: string }[]>(() => {
  switch (forge.screen) {
    case 'title':
      return [
        { command: 'confirm', label: 'Select' },
        { command: 'details', label: 'Assumptions' },
      ]
    case 'library':
    case 'idea':
      return [
        { command: 'confirm', label: 'Select' },
        { command: 'back', label: 'Back' },
      ]
    case 'beats':
      return [
        { command: 'confirm', label: 'Select' },
        { command: 'back', label: 'Ledger' },
      ]
    case 'kit':
      return [{ command: 'back', label: 'Back to the Forge' }]
    case 'catalog':
    case 'redshirts':
    case 'gestation':
      return [
        { command: 'confirm', label: 'Select' },
        { command: 'back', label: 'Back' },
      ]
    case 'ledger':
      return [
        { command: 'confirm', label: 'Select' },
        { command: 'details', label: 'Beats' },
        ...(forge.ledgerBook
          ? [{ command: 'left' as const, label: 'Art lane' }]
          : []),
        { command: 'start', label: 'Plan' },
        { command: 'back', label: 'Back' },
      ]
    case 'launch':
    case 'assumptions':
      return [
        { command: 'confirm', label: 'Select' },
        { command: 'left', label: 'Adjust' },
        { command: 'back', label: 'Back' },
      ]
    default:
      return [
        { command: 'left', label: 'Adjust' },
        { command: 'nextTab', label: 'Next page' },
        { command: 'details', label: 'Assumptions' },
        { command: 'start', label: forge.existing ? 'Review plan' : 'Launch' },
        { command: 'back', label: 'Back' },
      ]
  }
})
</script>
