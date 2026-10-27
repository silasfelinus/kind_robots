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

        <div
          v-if="
            forge.existing &&
            ['ledger', 'gallery', 'redshirts', 'beats', 'kit'].includes(
              forge.screen,
            )
          "
          class="flex min-w-0 flex-1 items-center gap-3"
          aria-label="Selected playbook"
        >
          <img
            :src="forge.existing.cover"
            :alt="`${forge.existing.title} key art`"
            class="h-16 w-24 shrink-0 rounded-md border border-primary/40 object-cover shadow-lg @3xl:h-20 @3xl:w-36"
          />
          <div class="hidden min-w-0 @md:block">
            <p class="pf-kicker text-[0.6rem] text-secondary">Now forging</p>
            <p class="pf-display truncate text-lg text-primary @3xl:text-2xl">
              {{ forge.existing.title }}
            </p>
            <p class="truncate text-xs opacity-70">
              {{
                forge.screen === 'redshirts'
                  ? 'Redshirt story atlas'
                  : forge.screen === 'ledger'
                    ? 'Production ledger'
                  : forge.screen === 'gallery'
                    ? 'Visual story atlas'
                    : forge.screen === 'beats'
                      ? 'Story editor'
                      : 'Rehearsal'
              }}
            </p>
          </div>
        </div>
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

        <NuxtLink
          to="/admin/playbook-reviews"
          class="pf-icon-btn shrink-0"
          title="Browse completed playthrough reviews"
          aria-label="Run reviews"
        >
          <Icon name="kind-icon:star" class="size-5" />
        </NuxtLink>

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
          <PlaybookForgeLedger v-else-if="forge.screen === 'ledger'" />
          <PlaybookForgeGallery v-else-if="forge.screen === 'gallery'" />
          <PlaybookForgeRedshirts v-else-if="forge.screen === 'redshirts'" />
          <PlaybookForgeBeats v-else-if="forge.screen === 'beats'" />
          <PlaybookForgeKit v-else-if="forge.screen === 'kit'" />
          <PlaybookForgeGestation v-else-if="forge.screen === 'gestation'" />
          <PlaybookForgeCatalog v-else-if="forge.screen === 'catalog'" />
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
    else if (forge.screen === 'ledger' && forge.existing)
      void forge.analyze(forge.existing.slug)
    return
  }
  if (command === 'details') {
    if (forge.screen === 'ledger' && forge.existing)
      void forge.openBeats(forge.existing.slug)
    else if (forge.screen === 'gallery' && forge.existing)
      void forge.openBeats(forge.existing.slug, forge.galleryFocus ?? undefined)
    else forge.go(forge.screen === 'assumptions' ? 'title' : 'assumptions')
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
  // The Kit preview is its own console; the Studio editor has text fields.
  if (forge.screen === 'kit') return
  if (forge.screen === 'beats' && event.code !== 'Escape') return
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
  if (forge.screen === 'kit') {
    frame = requestAnimationFrame(pollPads)
    return
  }
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
  const ledger = route.query.ledger
  const beats = route.query.beats
  const kitGame = route.query.kit
  const studioGame = route.query.game
  const gallery = route.query.gallery
  const redshirts = route.query.redshirts
  if (redshirts !== undefined) forge.openRedshirts()
  else if (typeof analyze === 'string' && analyze) void forge.analyze(analyze)
  else if (typeof ledger === 'string' && ledger) void forge.openLedger(ledger)
  else if (typeof gallery === 'string' && gallery)
    void forge.openGallery(
      gallery,
      undefined,
      typeof route.query.key === 'string' ? route.query.key : undefined,
    )
  else if (typeof beats === 'string' && beats)
    void forge.openBeats(
      beats,
      typeof route.query.key === 'string' ? route.query.key : undefined,
    )
  else if (typeof kitGame === 'string') forge.openKit(kitGame || '')
  else if (typeof studioGame === 'string' && studioGame) {
    const entry = EXISTING_PLAYBOOKS.find((e) => e.studio === studioGame)
    if (entry) void forge.openBeats(entry.slug)
  }
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
