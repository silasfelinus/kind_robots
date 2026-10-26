<template>
  <section
    class="pk-shell kr-panes @container relative grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-0 bg-base-300 text-base-content"
    :class="settingClasses"
    :aria-label="spec.title"
  >
    <header
      class="kr-toolbar pk-glass flex-nowrap gap-1.5 border-b border-base-content/10 bg-base-100/80 px-2 py-1.5 backdrop-blur @lg:px-3"
    >
      <button
        type="button"
        class="flex min-w-0 shrink items-center gap-2 rounded-xl px-1 py-0.5 text-left hover:bg-base-content/5"
        :title="`Play the ${spec.title} trailer`"
        @click="kit.playTrailer()"
      >
        <PlaybookKitArt
          :art="spec.keyArt"
          tone="primary"
          icon="kind-icon:sparkles"
          class="size-8 shrink-0 rounded-lg @lg:size-9"
        />
        <span class="hidden min-w-0 leading-tight @md:block">
          <span class="pk-display block truncate text-sm font-bold">{{
            spec.title
          }}</span>
          <span
            class="pk-dim block truncate text-[10px] uppercase tracking-[.18em] opacity-70"
            >{{ spec.tagline }}</span
          >
        </span>
      </button>
      <ul
        v-if="spec.meters.length"
        class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden @lg:justify-center @lg:gap-1.5"
        aria-label="Meters"
      >
        <li
          v-for="meter in spec.meters"
          :key="meter.id"
          class="flex shrink-0 items-center gap-1.5 rounded-full border border-base-content/10 bg-base-200/70 px-1 py-0.5 text-xs @lg:px-2"
          :title="`${meter.label}: ${meterValue(meter)} of ${meter.max}`"
        >
          <span class="pk-dim hidden truncate opacity-75 @6xl:inline">{{
            meter.label
          }}</span>
          <span
            class="hidden h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-base-content/15 @5xl:block"
          >
            <span
              class="block h-full rounded-full bg-primary transition-all"
              :style="{ width: meterPercent(meter) }"
            />
          </span>
          <span class="font-bold tabular-nums">{{ meterValue(meter) }}</span>
        </li>
      </ul>
      <span v-else class="flex-1" />
      <slot name="toolbar" />
      <nav
        class="flex shrink-0 items-center gap-0.5"
        aria-label="Playbook panes"
      >
        <button
          v-for="entry in panes"
          :key="entry.id"
          type="button"
          class="btn btn-ghost btn-sm gap-1 px-1 @lg:px-2"
          :class="kit.pane === entry.id ? 'btn-active text-primary' : ''"
          :aria-pressed="kit.pane === entry.id"
          :aria-controls="kit.pane === entry.id ? 'pk-pane' : undefined"
          :title="entry.label"
          @click="kit.togglePane(entry.id)"
        >
          <Icon :name="entry.icon" class="size-4" />
          <span class="hidden text-xs @[88rem]:inline">{{ entry.label }}</span>
          <span
            v-if="entry.count"
            class="pk-dim hidden text-[10px] tabular-nums opacity-70 @3xl:inline"
            >{{ entry.count }}</span
          >
        </button>
      </nav>
    </header>

    <div class="relative flex min-h-0 overflow-hidden">
      <div class="kr-pane min-w-0 flex-1">
        <p
          v-if="kit.storageWarning"
          class="kr-note kr-note-error m-2 p-2 text-xs"
          role="alert"
        >
          {{ kit.storageWarning }}
        </p>
        <div class="kr-pane-scroll">
          <slot />
        </div>
      </div>

      <aside
        v-if="active"
        id="pk-pane"
        class="kr-pane pk-glass absolute inset-0 z-20 border-l border-base-content/10 bg-base-100/95 backdrop-blur @3xl:static @3xl:w-[min(26rem,42%)] @3xl:shrink-0"
        :aria-label="active.label"
      >
        <div
          class="kr-toolbar flex-nowrap border-b border-base-content/10 px-3 py-2"
        >
          <Icon :name="active.icon" class="size-4 text-primary" />
          <span class="pk-display text-sm font-bold">{{ active.label }}</span>
          <span
            v-if="active.count"
            class="pk-dim text-xs tabular-nums opacity-70"
            >{{ active.count }}</span
          >
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square ml-auto"
            title="Close"
            @click="kit.closePane()"
          >
            <Icon name="kind-icon:close" class="size-4" />
          </button>
        </div>
        <div class="kr-pane-scroll p-3">
          <PlaybookKitCast v-if="active.id === 'cast'" :spec="spec" />
          <PlaybookKitFactions
            v-else-if="active.id === 'factions'"
            :spec="spec"
            :meter-values="meterValues"
          />
          <PlaybookKitSecrets
            v-else-if="active.id === 'secrets'"
            :spec="spec"
          />
          <PlaybookKitScrapbook
            v-else-if="active.id === 'scrapbook'"
            :spec="spec"
          />
          <PlaybookKitEndings
            v-else-if="active.id === 'endings'"
            :spec="spec"
          />
          <PlaybookKitSettings v-else :spec="spec" />
        </div>
      </aside>

      <PlaybookKitMoment v-if="kit.lightbox" :spec="spec" />
    </div>

    <PlaybookKitTrailer v-if="kit.trailerOpen" :spec="spec" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { usePlaybookKitStore, type KitPane } from '~/stores/playbookKitStore'
import { visibleMoments } from '~/utils/playbookKit/view'
import type { KitMeter, PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{
  spec: PlaybookKitSpec
  meterValues?: Record<string, number>
}>()

const kit = usePlaybookKitStore()

const settingClasses = computed(() => [
  `pk-text-${kit.settings.textSize}`,
  `pk-font-${kit.settings.font}`,
  kit.settings.contrast === 'high' ? 'pk-contrast-high' : '',
  kit.settings.motion === 'reduced' ? 'pk-motion-reduced' : '',
])

function meterValue(meter: KitMeter): number {
  return props.meterValues?.[meter.id] ?? meter.start
}

function meterPercent(meter: KitMeter): string {
  const span = meter.max - meter.min
  return `${Math.round(((meterValue(meter) - meter.min) / span) * 100)}%`
}

const panes = computed(() => {
  const found = (record: Record<string, string>, ids: string[]) =>
    `${ids.filter((id) => record[id]).length}/${ids.length}`
  const moments = visibleMoments(props.spec, kit.settings).map((m) => m.id)
  const entries: {
    id: KitPane
    label: string
    icon: string
    count: string
    show: boolean
  }[] = [
    {
      id: 'cast',
      label: 'Cast',
      icon: 'kind-icon:users',
      count: '',
      show: true,
    },
    {
      id: 'factions',
      label: 'Factions',
      icon: 'kind-icon:shield',
      count: '',
      show: props.spec.factions.length > 0,
    },
    {
      id: 'secrets',
      label: 'Secrets',
      icon: 'kind-icon:eye',
      count: found(
        kit.progress.reveals,
        props.spec.reveals.map((r) => r.id),
      ),
      show: props.spec.reveals.length > 0,
    },
    {
      id: 'scrapbook',
      label: 'Scrapbook',
      icon: 'kind-icon:camera',
      count: found(kit.progress.moments, moments),
      show: true,
    },
    {
      id: 'endings',
      label: 'Endings',
      icon: 'kind-icon:star',
      count: found(
        kit.progress.endings,
        props.spec.endings.map((e) => e.id),
      ),
      show: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'kind-icon:settings',
      count: '',
      show: true,
    },
  ]
  return entries.filter((entry) => entry.show)
})

const active = computed(
  () => panes.value.find((entry) => entry.id === kit.pane) ?? null,
)

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape' || kit.trailerOpen) return
  if (kit.lightbox) kit.showMoment(null)
  else kit.closePane()
}

onMounted(() => {
  kit.open(props.spec.id)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(
  () => props.spec.id,
  (id) => kit.open(id),
)
</script>

<style>
.pk-shell {
  --pk-text-scale: 1;
  --pk-font: ui-serif, Georgia, 'Times New Roman', serif;
}
.pk-shell.pk-text-large {
  --pk-text-scale: 1.15;
}
.pk-shell.pk-text-extra-large {
  --pk-text-scale: 1.32;
}
.pk-shell.pk-font-sans {
  --pk-font: ui-sans-serif, system-ui, sans-serif;
}
.pk-shell .pk-prose {
  font-family: var(--pk-font);
  font-size: calc(1rem * var(--pk-text-scale));
  line-height: 1.6;
}
.pk-shell .pk-display {
  font-family: var(--pk-font);
  letter-spacing: 0.01em;
}
.pk-shell.pk-contrast-high .pk-dim {
  opacity: 1;
}
.pk-shell.pk-contrast-high .pk-glass {
  background-color: var(--color-base-100);
  backdrop-filter: none;
}
.pk-shell.pk-motion-reduced *,
.pk-shell.pk-motion-reduced *::before,
.pk-shell.pk-motion-reduced *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
}
</style>
