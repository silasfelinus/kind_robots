<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="spec.id === 'deepheart'"
      class="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label="Deepheart scrapbook sections"
    >
      <button
        type="button"
        role="tab"
        class="btn btn-sm"
        :class="view === 'court' ? 'btn-primary' : 'btn-ghost'"
        :aria-selected="view === 'court'"
        data-testid="dh-scrapbook-court"
        @click="view = 'court'"
      >
        Court connections
      </button>
      <button
        type="button"
        role="tab"
        class="btn btn-sm"
        :class="view === 'moments' ? 'btn-primary' : 'btn-ghost'"
        :aria-selected="view === 'moments'"
        data-testid="dh-scrapbook-moments"
        @click="view = 'moments'"
      >
        Lived moments
      </button>
    </div>
    <DeepheartCourtFlowchart
      v-if="spec.id === 'deepheart' && view === 'court'"
    />
    <template v-if="spec.id !== 'deepheart' || view === 'moments'">
      <p class="pk-dim text-xs opacity-75">
        {{ kept }} of {{ moments.length }} moments kept. Lived moments open full
        screen.
      </p>
      <div
        class="flex flex-wrap gap-1"
        role="group"
        aria-label="Filter moments"
      >
        <button
          v-for="option in filters"
          :key="option.id"
          type="button"
          data-nav
          class="pf-tab btn-xs"
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
            data-nav
            class="pf-focusable group relative block aspect-video w-full overflow-hidden border border-base-content/10 text-left disabled:cursor-default"
            :disabled="!kit.isUnlocked('moments', moment.id)"
            :aria-label="
              kit.isUnlocked('moments', moment.id)
                ? `Open ${moment.title}`
                : `Locked ${MOMENT_KIND_LABELS[moment.kind]} moment`
            "
            @click="kit.showMoment(moment.id)"
          >
            <PlaybookKitArt
              :art="
                discoveryArt(
                  spec,
                  moment.art,
                  kit.isUnlocked('moments', moment.id),
                )
              "
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
              <span class="pf-kicker block text-[0.55rem] text-white/70">
                {{ actLabel(moment.act) }} ·
                {{ MOMENT_KIND_LABELS[moment.kind] }}
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import {
  MOMENT_KIND_LABELS,
  MOMENT_TONES,
  visibleMoments,
  discoveryArt,
} from '~/utils/playbookKit/view'
import type { KitMomentKind, PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()
const filter = ref<'all' | 'kept' | KitMomentKind>('all')
const view = ref<'court' | 'moments'>('court')

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
