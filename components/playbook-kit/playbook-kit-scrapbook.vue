<template>
  <div class="flex flex-col gap-3">
    <p class="pk-dim text-xs opacity-75">
      {{ kept }} of {{ moments.length }} moments kept. Lived moments open full
      screen.
    </p>
    <div class="flex flex-wrap gap-1" role="group" aria-label="Filter moments">
      <button
        v-for="option in filters"
        :key="option.id"
        type="button"
        class="btn btn-xs rounded-full"
        :class="filter === option.id ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="filter === option.id"
        @click="filter = option.id"
      >
        {{ option.label }}
      </button>
    </div>
    <ul
      class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-2"
    >
      <li v-for="moment in shown" :key="moment.id">
        <button
          type="button"
          class="group relative block aspect-video w-full overflow-hidden rounded-xl border border-base-content/10 text-left disabled:cursor-default"
          :disabled="!kit.isUnlocked('moments', moment.id)"
          :aria-label="
            kit.isUnlocked('moments', moment.id)
              ? `Open ${moment.title}`
              : `Locked ${MOMENT_KIND_LABELS[moment.kind]} moment`
          "
          @click="kit.showMoment(moment.id)"
        >
          <PlaybookKitArt
            :art="moment.art"
            :tone="MOMENT_TONES[moment.kind]"
            icon="kind-icon:camera"
            class="absolute inset-0 transition-transform duration-500 group-enabled:group-hover:scale-105"
            :class="
              kit.isUnlocked('moments', moment.id)
                ? ''
                : 'blur-md grayscale brightness-50'
            "
          />
          <span
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 pt-5 text-white"
          >
            <span
              class="block text-[9px] uppercase tracking-[.16em] text-white/70"
            >
              {{ actLabel(moment.act) }} · {{ MOMENT_KIND_LABELS[moment.kind] }}
            </span>
            <span class="block truncate text-xs font-semibold">
              {{
                kit.isUnlocked('moments', moment.id)
                  ? moment.title
                  : 'Not yet lived'
              }}
            </span>
          </span>
          <Icon
            v-if="!kit.isUnlocked('moments', moment.id)"
            name="kind-icon:lock"
            class="absolute right-1.5 top-1.5 size-4 text-white/70"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import {
  MOMENT_KIND_LABELS,
  MOMENT_TONES,
  visibleMoments,
} from '~/utils/playbookKit/view'
import type { KitMomentKind, PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()
const filter = ref<'all' | 'kept' | KitMomentKind>('all')

const moments = computed(() => visibleMoments(props.spec, kit.settings))
const kept = computed(
  () => moments.value.filter((m) => kit.isUnlocked('moments', m.id)).length,
)
const filters = computed(() => [
  { id: 'all' as const, label: 'All' },
  { id: 'kept' as const, label: 'Kept' },
  ...[...new Set(moments.value.map((m) => m.kind))].map((kind) => ({
    id: kind,
    label: MOMENT_KIND_LABELS[kind],
  })),
])
const shown = computed(() =>
  moments.value.filter((m) =>
    filter.value === 'all'
      ? true
      : filter.value === 'kept'
        ? kit.isUnlocked('moments', m.id)
        : m.kind === filter.value,
  ),
)

const actLabel = (act: number) => `Act ${act}`
</script>
