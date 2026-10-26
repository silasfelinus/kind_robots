<template>
  <div
    v-if="moment"
    ref="root"
    class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/92 p-3 text-white @2xl:p-8"
    role="dialog"
    aria-modal="true"
    :aria-label="moment.title"
    tabindex="-1"
    @keydown.left="step(-1)"
    @keydown.right="step(1)"
  >
    <div
      class="relative aspect-[21/9] w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
    >
      <PlaybookKitArt
        :art="moment.art"
        :tone="MOMENT_TONES[moment.kind]"
        icon="kind-icon:camera"
        with-brief
        :pan="kit.settings.motion !== 'reduced'"
        class="absolute inset-0"
      />
    </div>
    <div class="flex w-full max-w-3xl flex-col items-center gap-1 text-center">
      <p class="text-[10px] uppercase tracking-[.25em] text-white/60">
        {{ actTitle(spec, moment.act) }} · {{ MOMENT_KIND_LABELS[moment.kind] }}
      </p>
      <p class="pk-display text-xl font-bold @2xl:text-2xl">
        {{ moment.title }}
      </p>
      <p class="pk-prose text-white/85">{{ moment.caption }}</p>
      <p v-if="names.length" class="text-xs text-white/55">
        {{ names.join(' · ') }}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square text-white"
        title="Previous moment"
        :disabled="kept.length < 2"
        @click="step(-1)"
      >
        <Icon name="kind-icon:arrow-right" class="size-5 rotate-180" />
      </button>
      <button
        type="button"
        class="btn btn-sm rounded-xl"
        @click="kit.showMoment(null)"
      >
        Close
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square text-white"
        title="Next moment"
        :disabled="kept.length < 2"
        @click="step(1)"
      >
        <Icon name="kind-icon:arrow-right" class="size-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import {
  MOMENT_KIND_LABELS,
  MOMENT_TONES,
  actTitle,
  subjectNames,
  visibleMoments,
} from '~/utils/playbookKit/view'
import type { PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()
const root = ref<HTMLDivElement | null>(null)

const kept = computed(() =>
  visibleMoments(props.spec, kit.settings).filter((m) =>
    kit.isUnlocked('moments', m.id),
  ),
)
const moment = computed(
  () => kept.value.find((m) => m.id === kit.lightbox) ?? null,
)
const names = computed(() =>
  moment.value ? subjectNames(props.spec, moment.value.about) : [],
)

function step(by: number) {
  const list = kept.value
  const at = list.findIndex((m) => m.id === kit.lightbox)
  if (at < 0 || list.length < 2) return
  kit.showMoment(list[(at + by + list.length) % list.length]!.id)
}

onMounted(() => root.value?.focus())
</script>
