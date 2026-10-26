<template>
  <div class="flex flex-col gap-3">
    <ul class="flex flex-col gap-1.5" aria-label="Settings">
      <li v-for="key in keys" :key="key">
        <button
          type="button"
          data-nav
          data-adjust
          class="pf-row pf-focusable"
          :aria-label="`${KIT_SETTING_LABELS[key].label}: ${label(key)}`"
          @mouseenter="($event.currentTarget as HTMLElement).focus()"
          @click="step(key, 1)"
          @pf-adjust="step(key, ($event as CustomEvent<1 | -1>).detail)"
        >
          <span class="pf-label min-w-0 flex-1 truncate text-left text-sm">{{
            KIT_SETTING_LABELS[key].label
          }}</span>
          <span class="pf-value">
            <span class="pf-chev" aria-hidden="true" @click.stop="step(key, -1)"
              >◀</span
            >
            <span class="pf-display min-w-[6.5rem] text-center text-sm">{{
              label(key)
            }}</span>
            <span class="pf-chev" aria-hidden="true" @click.stop="step(key, 1)"
              >▶</span
            >
          </span>
        </button>
      </li>
    </ul>
    <p class="pk-prose pf-help text-sm">
      A sample line of story text, at the size and font you have chosen.
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm btn-ghost pf-focusable"
        @click="kit.playTrailer()"
      >
        <Icon name="kind-icon:play" class="size-4" />
        Replay trailer
      </button>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm btn-ghost pf-focusable"
        @click="kit.resetSettings()"
      >
        <Icon name="kind-icon:refresh" class="size-4" />
        Defaults
      </button>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm pf-focusable"
        :class="confirming ? 'btn-error' : 'btn-ghost text-error'"
        @click="forget"
      >
        {{ confirming ? 'Again to forget everything' : 'Forget progress' }}
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
  type KitSettings,
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

function label(key: KitSettingKey): string {
  return KIT_SETTING_LABELS[key].options[kit.settings[key]] ?? kit.settings[key]
}

function step(key: KitSettingKey, direction: number) {
  const options = KIT_SETTING_OPTIONS[key] as readonly string[]
  const at = options.indexOf(kit.settings[key])
  const next = options[(at + direction + options.length) % options.length]
  kit.setSetting(key, next as KitSettings[typeof key])
}

function forget() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  kit.resetProgress()
  confirming.value = false
}
</script>
