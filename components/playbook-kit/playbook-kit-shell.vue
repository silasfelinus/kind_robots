<template>
  <section
    class="pf-console pk-shell @container relative flex h-full min-h-0 w-full flex-col overflow-clip bg-base-200 text-base-content"
    :class="settingClasses"
    :data-theme="spec.theme ?? 'forge'"
    :aria-label="spec.title"
    @pointerdown="onPointer"
  >
    <div class="absolute inset-0 overflow-clip" aria-hidden="true">
      <div class="pf-backdrop">
        <PlaybookKitArt
          :art="spec.keyArt"
          tone="primary"
          icon="kind-icon:sparkles"
          class="pf-backdrop-art"
        />
      </div>
    </div>
    <div class="pf-vignette" aria-hidden="true" />
    <div class="pf-scan" aria-hidden="true" />

    <div class="pf-safe relative z-10 flex min-h-0 flex-1 flex-col">
      <header-page-bar :console-theme="spec.theme ?? 'forge'">
        <div
          class="pf-console pk-bar @container flex min-w-0 flex-1 items-center gap-2"
          :class="settingClasses"
          data-testid="playbook-kit-bar"
          @pointerdown="onPointer"
        >
          <button
            type="button"
            class="flex min-w-0 shrink-0 items-center gap-2 text-left"
            :title="`${spec.title} — ${spec.tagline} · Play the trailer`"
            :aria-label="`Play the ${spec.title} trailer`"
            @click="kit.playTrailer()"
          >
            <PlaybookKitArt
              :art="spec.keyArt"
              tone="primary"
              icon="kind-icon:sparkles"
              class="pk-crest size-8 shrink-0"
            />
            <span
              class="pf-display hidden max-w-48 truncate text-base text-primary @3xl:block"
              >{{ spec.title }}</span
            >
          </button>

          <ul
            v-if="spec.meters.length"
            class="hidden shrink-0 items-center gap-1.5 @md:flex"
            aria-label="Meters"
          >
            <li
              v-for="meter in spec.meters"
              :key="meter.id"
              class="pk-meter"
              :title="`${meter.label}: ${meterValue(meter)} of ${meter.max}`"
            >
              <span class="sr-only">{{ meter.label }}</span>
              <span class="pk-meter-bar hidden @4xl:block">
                <span :style="{ width: meterPercent(meter) }" />
              </span>
              <span class="pf-display text-base tabular-nums">{{
                meterValue(meter)
              }}</span>
            </li>
          </ul>

          <div class="flex min-w-0 flex-1 items-center">
            <slot name="bar-actions" />
          </div>

          <nav
            class="pk-tabs flex min-w-0 shrink items-center gap-0.5"
            aria-label="Playbook panes"
          >
            <PlaybookForgeGlyph
              command="prevTab"
              :device="device"
              class="hidden @5xl:inline-grid"
              @press="cycle(-1)"
            />
            <button
              v-for="entry in panes"
              :key="entry.id"
              type="button"
              class="pf-tab flex items-center gap-1.5"
              :class="kit.pane === entry.id ? 'pf-tab-on' : ''"
              :aria-pressed="kit.pane === entry.id"
              :aria-controls="kit.pane === entry.id ? 'pk-pane' : undefined"
              :aria-label="entry.label"
              :title="
                entry.count ? `${entry.label} ${entry.count}` : entry.label
              "
              @click="kit.togglePane(entry.id)"
            >
              <Icon :name="entry.icon" class="size-4" />
              <span
                v-if="entry.count"
                class="hidden text-[0.65rem] tabular-nums opacity-70 @5xl:inline"
                >{{ entry.count }}</span
              >
            </button>
            <PlaybookForgeGlyph
              command="nextTab"
              :device="device"
              class="hidden @5xl:inline-grid"
              @press="cycle(1)"
            />
          </nav>
          <button
            type="button"
            class="pf-icon-btn pk-bar-btn hidden shrink-0 @lg:grid"
            :title="fullscreen ? 'Leave full screen' : 'Full screen'"
            @click="toggleFullscreen"
          >
            <Icon
              :name="fullscreen ? 'kind-icon:close' : 'kind-icon:fullscreen'"
              class="size-5"
            />
          </button>
        </div>
      </header-page-bar>

      <p v-if="kit.storageWarning" class="pf-alert mb-2 shrink-0" role="alert">
        {{ kit.storageWarning }}
      </p>

      <div
        class="kr-panes relative gap-4"
        :class="
          active
            ? 'grid-cols-1 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]'
            : 'grid-cols-1'
        "
      >
        <div class="kr-pane min-w-0">
          <div class="kr-pane-scroll">
            <slot />
          </div>
        </div>

        <aside
          v-if="active"
          id="pk-pane"
          ref="paneEl"
          class="kr-pane pf-panel absolute inset-0 z-20 @4xl:static"
          :aria-label="active.label"
        >
          <div
            class="kr-toolbar flex-nowrap border-b border-base-content/10 px-4 py-3"
          >
            <Icon :name="active.icon" class="size-5 text-primary" />
            <span class="pf-display text-lg">{{ active.label }}</span>
            <span
              v-if="active.count"
              class="pf-kicker text-[0.6rem] tabular-nums opacity-70"
              >{{ active.count }}</span
            >
            <button
              type="button"
              class="pf-icon-btn ml-auto"
              title="Close"
              @click="kit.closePane()"
            >
              <Icon name="kind-icon:close" class="size-4" />
            </button>
          </div>
          <div class="kr-pane-scroll p-4">
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

      <footer
        v-if="device !== 'touch'"
        class="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t border-base-content/10 pt-3 @md:gap-x-5"
        aria-label="Controls"
      >
        <span
          v-for="prompt in prompts"
          :key="prompt.label"
          class="flex items-center gap-2"
        >
          <PlaybookForgeGlyph
            :command="prompt.command"
            :device="device"
            :label="prompt.label"
            @press="prompt.run()"
          />
          <span class="pf-label hidden text-xs opacity-80 @md:inline">{{
            prompt.label
          }}</span>
        </span>
      </footer>
    </div>

    <PlaybookKitTrailer v-if="kit.trailerOpen" :spec="spec" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePlaybookKitStore, type KitPane } from '~/stores/playbookKitStore'
import {
  isTextEntry,
  moveFocus,
  newPadMemory,
  readPad,
  type ConsoleCommand,
  type InputDevice,
} from '~/utils/consoleInput'
import { visibleMoments } from '~/utils/playbookKit/view'
import type { KitMeter, PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{
  spec: PlaybookKitSpec
  meterValues?: Record<string, number>
}>()

const kit = usePlaybookKitStore()
const paneEl = ref<HTMLElement | null>(null)
const device = ref<InputDevice>('keyboard')
const fullscreen = ref(false)
const pad = newPadMemory()
let frame = 0

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

const prompts = computed<
  { command: ConsoleCommand; label: string; run: () => void }[]
>(() => [
  { command: 'nextTab', label: 'Panes', run: () => cycle(1) },
  ...(active.value
    ? [
        {
          command: 'confirm' as const,
          label: 'Select',
          run: () => run('confirm'),
        },
        { command: 'back' as const, label: 'Close', run: () => run('back') },
      ]
    : []),
  { command: 'start', label: 'Trailer', run: () => kit.playTrailer() },
])

function cycle(direction: 1 | -1) {
  const ids = panes.value.map((entry) => entry.id)
  const at = kit.pane ? ids.indexOf(kit.pane) : direction > 0 ? -1 : 0
  kit.openPane(ids[(at + direction + ids.length) % ids.length]!)
}

function run(command: ConsoleCommand) {
  if (kit.trailerOpen) return
  if (command === 'back') {
    if (kit.lightbox) kit.showMoment(null)
    else kit.closePane()
    return
  }
  if (command === 'prevTab' || command === 'nextTab') {
    cycle(command === 'nextTab' ? 1 : -1)
    return
  }
  if (command === 'start') {
    kit.playTrailer()
    return
  }
  const pane = paneEl.value
  if (!pane || command === 'details') return
  const focused = document.activeElement
  const inPane = focused instanceof HTMLElement && pane.contains(focused)
  if (command === 'confirm') {
    if (inPane) focused.click()
    return
  }
  if (
    inPane &&
    (command === 'left' || command === 'right') &&
    focused.dataset.adjust !== undefined
  ) {
    focused.dispatchEvent(
      new CustomEvent('pf-adjust', { detail: command === 'right' ? 1 : -1 }),
    )
    return
  }
  moveFocus(pane, command)
}

const KEYS: Record<string, ConsoleCommand> = {
  KeyQ: 'prevTab',
  KeyE: 'nextTab',
  Escape: 'back',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

function onKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (isTextEntry(document.activeElement)) return
  const command = KEYS[event.code]
  if (!command) return
  if (
    event.code.startsWith('Arrow') &&
    !paneEl.value?.contains(document.activeElement)
  )
    return
  device.value = 'keyboard'
  event.preventDefault()
  run(command)
}

function onPointer(event: PointerEvent) {
  device.value = event.pointerType === 'touch' ? 'touch' : 'keyboard'
}

function pollPads(now: number) {
  for (const gamepad of navigator.getGamepads?.() ?? []) {
    if (!gamepad) continue
    const commands = readPad(gamepad, pad, now)
    if (commands.length) device.value = 'gamepad'
    for (const command of commands)
      if (
        kit.pane ||
        command === 'prevTab' ||
        command === 'nextTab' ||
        command === 'back'
      )
        run(command)
    break
  }
  frame = requestAnimationFrame(pollPads)
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {
    fullscreen.value = !!document.fullscreenElement
  }
}

function onFullscreen() {
  fullscreen.value = !!document.fullscreenElement
}

watch(
  () => kit.pane,
  () =>
    requestAnimationFrame(() =>
      paneEl.value
        ?.querySelector<HTMLElement>('[data-nav]')
        ?.focus({ preventScroll: true }),
    ),
)

onMounted(() => {
  kit.open(props.spec.id)
  window.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFullscreen)
  frame = requestAnimationFrame(pollPads)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFullscreen)
  cancelAnimationFrame(frame)
})
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
  font-family: var(--pf-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}
.pk-shell .pf-tab {
  padding: 0.45rem 0.4rem;
}
@container (min-width: 48rem) {
  .pk-shell .pf-tab {
    padding: 0.55rem 0.8rem;
  }
}
.pk-bar.pf-console {
  font-size: 1rem;
  isolation: auto;
}
.pk-bar .pk-tabs {
  overflow-x: auto;
  scrollbar-width: none;
}
.pk-bar .pk-tabs::-webkit-scrollbar {
  display: none;
}
.pk-bar .pf-tab {
  padding: 0.45rem 0.4rem;
}
.pk-bar .pf-tab::after {
  inset-inline: 0.4rem;
}
.pk-bar .pk-bar-btn {
  height: 2.25rem;
  width: 2.25rem;
}
.pk-bar .pk-crest {
  clip-path: polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%);
}
.pk-bar .pk-meter {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.5rem;
  border-left: 2px solid var(--color-secondary);
  background: color-mix(in oklch, var(--color-base-100) 55%, transparent);
}
.pk-bar .pk-meter-bar {
  position: relative;
  height: 0.35rem;
  width: 3.5rem;
  background: color-mix(in oklch, var(--color-base-content) 14%, transparent);
}
.pk-bar .pk-meter-bar > span {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--color-secondary);
  box-shadow: 0 0 10px var(--color-secondary);
}
.pk-shell .pk-card {
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 12%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 70%, transparent);
}
.pk-shell.pk-contrast-high .pk-dim {
  opacity: 1;
}
.pk-shell.pk-contrast-high :is(.pf-panel, .pk-card) {
  background: var(--color-base-100);
  backdrop-filter: none;
}
.pk-shell.pk-motion-reduced *,
.pk-shell.pk-motion-reduced *::before,
.pk-shell.pk-motion-reduced *::after,
.pk-bar.pk-motion-reduced *,
.pk-bar.pk-motion-reduced *::before,
.pk-bar.pk-motion-reduced *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
}
</style>
