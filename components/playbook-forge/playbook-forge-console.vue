<template>
  <section
    ref="root"
    class="pf-console @container relative flex h-full min-h-0 w-full flex-col overflow-clip bg-base-200 text-base-content"
    :class="`pf-device-${device}`"
    aria-label="Playbook Forge"
    @pointerdown="onPointer"
  >
    <div class="absolute inset-0 overflow-clip" aria-hidden="true">
      <div class="pf-backdrop">
        <transition-group name="pf-xfade">
          <img
            v-for="src in [backdrop]"
            :key="src"
            :src="src"
            alt=""
            class="pf-backdrop-art"
          />
        </transition-group>
      </div>
    </div>
    <div class="pf-vignette" aria-hidden="true" />
    <div class="pf-scan" aria-hidden="true" />

    <div class="pf-safe relative z-10 flex min-h-0 flex-1 flex-col">
      <header class="flex shrink-0 items-center gap-3 pb-3 @3xl:gap-6">
        <button
          type="button"
          class="pf-logo flex shrink-0 items-center gap-2"
          title="Title screen"
          @click="forge.go('title')"
        >
          <span class="pf-logo-mark" aria-hidden="true" />
          <span class="hidden leading-none @lg:block">
            <span class="pf-display block text-lg text-primary @3xl:text-2xl"
              >Playbook Forge</span
            >
            <span class="pf-kicker block opacity-60">Kind Robots</span>
          </span>
        </button>

        <nav
          v-if="tabbed"
          class="flex min-w-0 flex-1 items-center justify-center gap-1 @3xl:gap-2"
          aria-label="Loadout pages"
        >
          <PlaybookForgeGlyph
            :command="'prevTab'"
            :device="device"
            @press="run('prevTab')"
          />
          <span
            class="pf-display flex items-baseline gap-2 text-base @3xl:hidden"
          >
            {{ activeTab.label }}
            <span class="pf-kicker text-[0.6rem] opacity-60"
              >{{ activeIndex + 1 }}/{{ FORGE_TABS.length }}</span
            >
          </span>
          <div
            class="pf-tabs hidden min-w-0 items-center @3xl:flex"
            role="tablist"
          >
            <button
              v-for="entry in FORGE_TABS"
              :key="entry.id"
              type="button"
              role="tab"
              class="pf-tab"
              :class="forge.tab === entry.id ? 'pf-tab-on' : ''"
              :aria-selected="forge.tab === entry.id"
              tabindex="-1"
              @click="forge.setTab(entry.id)"
            >
              {{ entry.label }}
            </button>
          </div>
          <PlaybookForgeGlyph
            :command="'nextTab'"
            :device="device"
            @press="run('nextTab')"
          />
        </nav>
        <span v-else class="flex-1" />

        <button
          type="button"
          class="pf-icon-btn shrink-0"
          :title="fullscreen ? 'Leave full screen' : 'Full screen'"
          @click="toggleFullscreen"
        >
          <Icon
            :name="fullscreen ? 'kind-icon:close' : 'kind-icon:fullscreen'"
            class="size-5"
          />
        </button>
      </header>

      <p
        v-if="forge.persistWarning"
        class="pf-alert mb-2 shrink-0"
        role="alert"
      >
        {{ forge.persistWarning }}
      </p>

      <transition name="pf-screen" mode="out-in" @after-enter="focusFirst">
        <div :key="screenKey" class="flex min-h-0 flex-1 flex-col">
          <PlaybookForgeTitle v-if="forge.screen === 'title'" />
          <PlaybookForgeLibrary v-else-if="forge.screen === 'library'" />
          <PlaybookForgeIdea v-else-if="forge.screen === 'idea'" />
          <PlaybookForgeLaunch v-else-if="forge.screen === 'launch'" />
          <PlaybookForgeAssumptions
            v-else-if="forge.screen === 'assumptions'"
          />
          <PlaybookForgeLoadout v-else />
        </div>
      </transition>

      <PlaybookForgePrompts :device="device" @command="run" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import {
  KEY_COMMANDS,
  isTextEntry,
  moveFocus,
  newPadMemory,
  readPad,
  type ConsoleCommand,
  type InputDevice,
} from '~/utils/consoleInput'
import { FORGE_TABS } from '~/utils/playbookForge/factors'
import { GENRES } from '~/utils/playbookForge/presets'
import { EXISTING_PLAYBOOKS } from '~/utils/playbookForge/existing'

const forge = usePlaybookForgeStore()
const root = ref<HTMLElement | null>(null)
const device = ref<InputDevice>('keyboard')
const fullscreen = ref(false)
const montage = ref(0)
let frame = 0
let montageTimer: ReturnType<typeof setInterval> | null = null
const pad = newPadMemory()

const MONTAGE = EXISTING_PLAYBOOKS.map((entry) => entry.cover).filter((src) =>
  src.endsWith('.webp'),
)

const tabbed = computed(
  () => forge.screen === 'loadout' || forge.screen === 'analyze',
)
const activeIndex = computed(() =>
  Math.max(
    0,
    FORGE_TABS.findIndex((t) => t.id === forge.tab),
  ),
)
const activeTab = computed(() => FORGE_TABS[activeIndex.value]!)
const screenKey = computed(() =>
  tabbed.value ? `loadout-${forge.tab}` : forge.screen,
)

const backdrop = computed(() => {
  if (forge.existing) return forge.existing.cover
  if (forge.draft && forge.screen !== 'title') {
    const genre = GENRES.find((g) => g.id === forge.draft?.genre)
    if (genre) return genre.cover
  }
  return MONTAGE[montage.value % MONTAGE.length] ?? GENRES[0]!.cover
})

function adjustable(el: Element | null): HTMLElement | null {
  return el instanceof HTMLElement && el.dataset.adjust !== undefined
    ? el
    : null
}

function run(command: ConsoleCommand) {
  const active = document.activeElement
  if (command === 'back') {
    if (isTextEntry(active)) {
      ;(active as HTMLElement).blur()
      return
    }
    forge.back()
    return
  }
  if (command === 'prevTab' || command === 'nextTab') {
    if (tabbed.value) forge.cycleTab(command === 'nextTab' ? 1 : -1)
    return
  }
  if (command === 'start') {
    if (tabbed.value) forge.go('launch')
    return
  }
  if (command === 'details') {
    forge.go(forge.screen === 'assumptions' ? 'title' : 'assumptions')
    return
  }
  if (command === 'confirm') {
    if (active instanceof HTMLElement && root.value?.contains(active))
      active.click()
    else focusFirst()
    return
  }
  const target = adjustable(active)
  if (target && (command === 'left' || command === 'right')) {
    target.dispatchEvent(
      new CustomEvent('pf-adjust', { detail: command === 'right' ? 1 : -1 }),
    )
    return
  }
  if (root.value) moveFocus(root.value, command)
}

function onKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const command = KEY_COMMANDS[event.code]
  if (!command) return
  if (isTextEntry(document.activeElement) && event.code !== 'Escape') return
  if (event.code === 'Space' && document.activeElement?.tagName === 'BUTTON')
    return
  device.value = 'keyboard'
  event.preventDefault()
  run(command)
}

function onPointer(event: PointerEvent) {
  device.value = event.pointerType === 'touch' ? 'touch' : 'keyboard'
}

function pollPads(now: number) {
  const pads = navigator.getGamepads?.() ?? []
  for (const gamepad of pads) {
    if (!gamepad) continue
    const commands = readPad(gamepad, pad, now)
    if (commands.length) device.value = 'gamepad'
    for (const command of commands) run(command)
    break
  }
  frame = requestAnimationFrame(pollPads)
}

function focusFirst() {
  const el =
    root.value?.querySelector<HTMLElement>('[data-autofocus]') ??
    root.value?.querySelector<HTMLElement>('[data-nav]')
  el?.focus({ preventScroll: true })
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await root.value?.requestFullscreen()
  } catch {
    fullscreen.value = !!document.fullscreenElement
  }
}

function onFullscreen() {
  fullscreen.value = !!document.fullscreenElement
}

watch(screenKey, async () => {
  await nextTick()
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    focusFirst()
})

const route = useRoute()

onMounted(() => {
  forge.load()
  const analyze = route.query.analyze
  if (typeof analyze === 'string' && analyze) void forge.analyze(analyze)
  window.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFullscreen)
  frame = requestAnimationFrame(pollPads)
  montageTimer = setInterval(() => (montage.value += 1), 9000)
  setTimeout(focusFirst, 50)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFullscreen)
  cancelAnimationFrame(frame)
  if (montageTimer) clearInterval(montageTimer)
})
</script>

<style>
.pf-console {
  --pf-safe: clamp(16px, 3.6cqw, 64px);
  --pf-display:
    'Bahnschrift', 'DIN Alternate', 'DIN Condensed', 'Roboto Condensed',
    'Arial Narrow', ui-sans-serif, system-ui, sans-serif;
  --pf-glow:
    0 0 0 1px color-mix(in oklch, var(--color-primary) 70%, transparent),
    0 0 28px -4px color-mix(in oklch, var(--color-primary) 55%, transparent);
  font-size: clamp(15px, 0.55cqw + 12px, 19px);
  isolation: isolate;
}
.pf-console :is(.pf-display, .pf-kicker, .pf-tab, .pf-label) {
  font-family: var(--pf-display);
  text-transform: uppercase;
  font-stretch: condensed;
}
.pf-console .pf-display {
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
}
.pf-console .pf-kicker {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.32em;
}
.pf-console .pf-label {
  letter-spacing: 0.14em;
  font-weight: 600;
}
.pf-safe {
  padding: calc(var(--pf-safe) * 0.6) var(--pf-safe) calc(var(--pf-safe) * 0.5);
}
.pf-backdrop {
  position: absolute;
  inset: -4%;
  z-index: 0;
}
.pf-backdrop-art {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  filter: blur(14px) saturate(1.15) brightness(0.42);
  transform: scale(1.08);
  animation: pf-drift 40s ease-in-out infinite alternate;
}
.pf-vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(
      120% 90% at 30% 20%,
      transparent 0%,
      color-mix(in oklch, var(--color-base-200) 70%, transparent) 60%,
      var(--color-base-200) 100%
    ),
    linear-gradient(
      to top,
      var(--color-base-200) 0%,
      transparent 30%,
      transparent 75%,
      color-mix(in oklch, var(--color-base-200) 80%, transparent) 100%
    );
}
.pf-scan {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.06;
  background: repeating-linear-gradient(
    to bottom,
    rgb(255 255 255 / 0.5) 0 1px,
    transparent 1px 3px
  );
}
.pf-logo-mark {
  display: block;
  height: 2.1rem;
  width: 2.1rem;
  clip-path: polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%);
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent)
  );
  box-shadow: var(--pf-glow);
}
.pf-tab {
  position: relative;
  flex-shrink: 0;
  padding: 0.55rem 0.8rem;
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  font-weight: 700;
  color: color-mix(in oklch, var(--color-base-content) 55%, transparent);
  transition: color 160ms ease-out;
}
.pf-tab::after {
  content: '';
  position: absolute;
  inset: auto 0.8rem 0.15rem;
  height: 2px;
  transform: scaleX(0);
  background: var(--color-primary);
  box-shadow: 0 0 12px var(--color-primary);
  transition: transform 200ms ease-out;
}
.pf-tab:hover {
  color: var(--color-base-content);
}
.pf-tab-on {
  color: var(--color-base-content);
}
.pf-tab-on::after {
  transform: scaleX(1);
}
.pf-icon-btn {
  display: grid;
  place-items: center;
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 0.375rem;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 15%, transparent);
  background: color-mix(in oklch, var(--color-base-100) 60%, transparent);
}
.pf-icon-btn:hover,
.pf-icon-btn:focus-visible {
  box-shadow: var(--pf-glow);
  outline: none;
}
.pf-alert {
  border-left: 3px solid var(--color-warning);
  background: color-mix(in oklch, var(--color-warning) 12%, transparent);
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}
.pf-panel {
  position: relative;
  border: 1px solid
    color-mix(in oklch, var(--color-base-content) 12%, transparent);
  background: linear-gradient(
    160deg,
    color-mix(in oklch, var(--color-base-100) 82%, transparent),
    color-mix(in oklch, var(--color-base-200) 88%, transparent)
  );
  backdrop-filter: blur(10px);
}
.pf-panel::before,
.pf-panel::after {
  content: '';
  position: absolute;
  height: 14px;
  width: 14px;
  border-color: var(--color-primary);
  pointer-events: none;
}
.pf-panel::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid;
  border-left: 2px solid;
}
.pf-panel::after {
  bottom: -1px;
  right: -1px;
  border-bottom: 2px solid;
  border-right: 2px solid;
}
.pf-focusable {
  outline: none;
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    background-color 160ms ease-out;
}
.pf-focusable:focus-visible,
.pf-focusable:focus {
  box-shadow: var(--pf-glow);
  transform: scale(1.012);
}
.pf-xfade-enter-active,
.pf-xfade-leave-active {
  transition: opacity 1.4s ease;
}
.pf-xfade-enter-from,
.pf-xfade-leave-to {
  opacity: 0;
}
.pf-screen-enter-active,
.pf-screen-leave-active {
  transition:
    opacity 220ms ease-out,
    transform 260ms ease-out;
}
.pf-screen-enter-from {
  opacity: 0;
  transform: translateX(18px);
}
.pf-screen-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}
@keyframes pf-drift {
  from {
    transform: scale(1.08) translate(-1.5%, -1%);
  }
  to {
    transform: scale(1.14) translate(1.5%, 1%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pf-console *,
  .pf-console *::before,
  .pf-console *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
