<template>
  <section
    class="kr-panel space-y-3 p-4"
    aria-label="Butterfly Gallery preset editor"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="kr-text-black-lg">Sorting presets</h2>
        <p class="kr-text-dim-xs">
          Choose which bins appear and attach reusable generation actions.
        </p>
      </div>
      <button
        type="button"
        class="kr-btn btn-ghost btn-sm"
        @click="presetStore.resetToDefaults()"
      >
        Reset
      </button>
    </div>

    <p
      v-if="!presetStore.persistenceAvailable"
      class="kr-note kr-note-warning text-sm"
    >
      Presets work for this visit, but browser storage is unavailable.
    </p>

    <div class="space-y-2">
      <article
        v-for="bin in presetStore.bins"
        :key="bin.id"
        class="rounded-xl border border-base-300 p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <input
            :value="bin.label"
            class="kr-input-sm min-w-40 flex-1"
            :aria-label="`Label for ${bin.label}`"
            @change="renameBin(bin, ($event.target as HTMLInputElement).value)"
          />
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              :checked="bin.enabled"
              @change="
                presetStore.setEnabled(
                  bin.id,
                  ($event.target as HTMLInputElement).checked,
                )
              "
            />
            Visible
          </label>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-2">
          <select
            class="kr-select-sm"
            :value="actionKind(bin)"
            :aria-label="`Generation action for ${bin.label}`"
            @change="
              setActionKind(
                bin,
                ($event.target as HTMLSelectElement).value as ActionKind,
              )
            "
          >
            <option value="none">No generation action</option>
            <option value="add-lora">Add LoRA</option>
            <option value="replace-lora">Replace LoRA</option>
            <option value="switch-checkpoint">Switch checkpoint</option>
            <option value="append-prompt">Append prompt</option>
            <option value="replace-prompt">Replace prompt</option>
            <option value="add-variant">Add variant</option>
            <option value="request-replacement">Request replacement</option>
          </select>

          <input
            v-if="actionNeedsValue(actionKind(bin))"
            :value="actionValue(bin)"
            class="kr-input-sm min-w-48 flex-1"
            :placeholder="actionPlaceholder(actionKind(bin))"
            :aria-label="`Action value for ${bin.label}`"
            @change="
              setActionValue(bin, ($event.target as HTMLInputElement).value)
            "
          />
        </div>
      </article>
    </div>

    <ButterflyGalleryBatchControls />
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useButterflyGalleryPresetStore } from '@/stores/butterflyGalleryPresetStore'
import type {
  ButterflyCustomBinPreset,
  ButterflyGenerationAction,
} from '@/stores/helpers/butterflyGalleryBinPresets'

const presetStore = useButterflyGalleryPresetStore()

type ActionKind = ButterflyGenerationAction['kind'] | 'none'

onMounted(() => presetStore.initialize())

function actionKind(bin: ButterflyCustomBinPreset): ActionKind {
  return bin.actions[0]?.kind ?? 'none'
}

function actionNeedsValue(kind: ActionKind): boolean {
  return [
    'add-lora',
    'replace-lora',
    'switch-checkpoint',
    'append-prompt',
    'replace-prompt',
  ].includes(kind)
}

function actionPlaceholder(kind: ActionKind): string {
  if (kind === 'add-lora') return 'LoRA resource'
  if (kind === 'replace-lora') return 'old LoRA → new LoRA'
  if (kind === 'switch-checkpoint') return 'Checkpoint resource'
  return 'Prompt text'
}

function actionValue(bin: ButterflyCustomBinPreset): string {
  const action = bin.actions[0]
  if (!action) return ''
  if (action.kind === 'add-lora' || action.kind === 'switch-checkpoint')
    return action.resource
  if (action.kind === 'replace-lora') return `${action.from} → ${action.to}`
  if (action.kind === 'append-prompt' || action.kind === 'replace-prompt')
    return action.text
  return ''
}

function makeAction(kind: ActionKind, value = ''): ButterflyGenerationAction[] {
  if (kind === 'none') return []
  if (kind === 'add-variant' || kind === 'request-replacement')
    return [{ kind }]
  if (kind === 'add-lora') return [{ kind, resource: value }]
  if (kind === 'switch-checkpoint') return [{ kind, resource: value }]
  if (kind === 'append-prompt' || kind === 'replace-prompt')
    return [{ kind, text: value }]
  const [from = '', to = ''] = value.split('→').map((part) => part.trim())
  return [{ kind: 'replace-lora', from, to }]
}

function setActionKind(bin: ButterflyCustomBinPreset, kind: ActionKind): void {
  presetStore.setActions(bin.id, makeAction(kind))
}

function setActionValue(bin: ButterflyCustomBinPreset, value: string): void {
  presetStore.setActions(bin.id, makeAction(actionKind(bin), value))
}

function renameBin(bin: ButterflyCustomBinPreset, label: string): void {
  const trimmed = label.trim()
  if (!trimmed || trimmed === bin.label) return
  presetStore.upsertPreset({ ...bin, label: trimmed }, bin.actions)
}
</script>
