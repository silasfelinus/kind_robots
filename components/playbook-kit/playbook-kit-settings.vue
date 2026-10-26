<template>
  <div class="flex flex-col gap-3">
    <fieldset v-for="key in keys" :key="key" class="flex flex-col gap-1">
      <legend class="mb-1 text-xs font-semibold opacity-80">
        {{ KIT_SETTING_LABELS[key].label }}
      </legend>
      <div class="join w-full">
        <button
          v-for="option in KIT_SETTING_OPTIONS[key]"
          :key="option"
          type="button"
          class="btn join-item btn-sm flex-1"
          :class="
            kit.settings[key] === option
              ? 'btn-primary'
              : 'btn-ghost border-base-content/15'
          "
          :aria-pressed="kit.settings[key] === option"
          @click="kit.setSetting(key, option)"
        >
          {{ KIT_SETTING_LABELS[key].options[option] }}
        </button>
      </div>
    </fieldset>
    <p
      class="pk-prose rounded-xl border border-base-content/10 bg-base-200/50 p-2 text-sm"
    >
      A sample line of story text, at the size and font you have chosen.
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        @click="kit.playTrailer()"
      >
        <Icon name="kind-icon:play" class="size-4" />
        Replay trailer
      </button>
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        @click="kit.resetSettings()"
      >
        <Icon name="kind-icon:refresh" class="size-4" />
        Default settings
      </button>
      <button
        type="button"
        class="btn btn-sm"
        :class="confirming ? 'btn-error' : 'btn-ghost text-error'"
        @click="forget"
      >
        {{
          confirming
            ? 'Tap again to forget everything'
            : 'Forget scrapbook, secrets and endings'
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import {
  KIT_SETTING_LABELS,
  KIT_SETTING_OPTIONS,
  type KitSettingKey,
} from '~/utils/playbookKit/settings'
import type { PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()
const confirming = ref(false)

const keys = computed(() =>
  (Object.keys(KIT_SETTING_OPTIONS) as KitSettingKey[]).filter(
    (key) => key !== 'romance' || props.spec.cast.some((c) => c.romance),
  ),
)

function forget() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  kit.resetProgress()
  confirming.value = false
}
</script>
