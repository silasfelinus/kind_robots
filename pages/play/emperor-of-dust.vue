<template>
  <main
    class="kr-surface eod relative bg-base-200 text-base-content"
    :class="[
      `eod-reading-${court.preferences.readingSize}`,
      `eod-font-${court.preferences.readingFont}`,
      court.preferences.readingWidth === 'wide' ? 'eod-wide' : '',
      court.preferences.contrast === 'high' ? 'eod-high-contrast' : '',
      court.preferences.motion === 'reduced' ? 'eod-motion-reduced' : '',
    ]"
    data-theme="emperor"
    data-layout="console-fixed"
  >
    <div
      v-if="!court.loaded || !run"
      class="grid min-h-96 place-items-center"
      aria-hidden="true"
    />
    <div
      v-else
      class="flex h-full min-h-0 w-full flex-col gap-2 overflow-clip px-2 py-2 sm:px-4"
    >
      <p
        v-if="court.storageWarning"
        class="kr-note kr-note-error p-3 text-sm"
        role="alert"
      >
        {{ court.storageWarning }}
      </p>

      <header-page-bar console-theme="emperor">
        <div
          ref="bar"
          class="eod eod-bar @container flex min-w-0 flex-1 items-center gap-1.5"
          role="group"
          aria-label="Fortress"
          @pointerover="fitTips"
          @focusin="fitTips"
        >
          <button
            type="button"
            class="eod-chip tooltip-bottom tooltip-warning flex shrink-0 items-center gap-1.5 px-2 py-1"
            :class="ledgerOpen ? '' : 'tooltip'"
            :data-tip="
              ledgerOpen
                ? 'Hide the court ledger'
                : 'The court ledger: day, brass and the five fortress factions'
            "
            :aria-expanded="ledgerOpen"
            aria-controls="eod-ledger"
            @click="ledgerOpen = !ledgerOpen"
          >
            <Icon
              name="kind-icon:crown"
              class="hidden h-6 w-6 shrink-0 @md:block"
            />
            <span class="hidden text-left @4xl:block">
              <span class="eod-display block text-sm leading-tight text-warning"
                >Emperor of Dust</span
              >
              <span
                class="block text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75"
                >{{ dayLine }}</span
              >
            </span>
            <span
              class="text-[11px] font-bold uppercase tracking-wider @4xl:hidden"
              >{{ over ? 'Ended' : `Day ${run.day}` }}</span
            >
            <span
              class="ml-1 grid h-4 w-4 place-items-center rounded-full border-2 border-warning"
              aria-hidden="true"
            >
              <span class="h-1 w-1 rounded-full bg-warning" />
            </span>
            <strong class="eod-display text-base leading-none">{{
              run.brass
            }}</strong>
            <span class="sr-only">brass</span>
            <Icon
              :name="
                ledgerOpen ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="h-3.5 w-3.5 opacity-70"
            />
          </button>

          <nav class="flex min-w-0 flex-1 gap-1" aria-label="Fortress rooms">
            <button
              v-for="room in rooms"
              :key="room.id"
              type="button"
              class="eod-tab tooltip tooltip-bottom relative flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap px-1 py-1.5 text-xs font-semibold uppercase tracking-wider @6xl:px-2"
              :data-tip="room.hint"
              :aria-label="
                room.label + (room.badge ? `, ${room.badge} waiting` : '')
              "
              :aria-current="activeRoom === room.id ? 'page' : undefined"
              @click="enter(room.id)"
            >
              <Icon :name="room.icon" class="h-4 w-4 shrink-0" />
              <span class="hidden min-w-0 truncate @6xl:block">{{
                room.label
              }}</span>
              <span
                v-if="room.badge"
                class="badge badge-error badge-xs absolute -right-0.5 -top-1 @6xl:static"
                aria-hidden="true"
                >{{ room.badge }}</span
              >
            </button>
          </nav>

          <button
            type="button"
            class="eod-chip relative z-10 flex shrink-0 items-center gap-1 px-2 py-1.5 text-sm text-warning"
            aria-label="Game settings"
            title="Reading and display settings"
            @click="settingsOpen = true"
          >
            <Icon name="kind-icon:settings" class="h-5 w-5" />
            <span class="hidden @6xl:inline">Settings</span>
          </button>
          <ul
            class="hidden shrink-0 gap-1 @3xl:flex"
            aria-label="Fortress support"
          >
            <li v-for="faction in LOCAL_FACTION_DEFS" :key="faction.id">
              <button
                type="button"
                class="eod-chip tooltip tooltip-bottom w-12 px-1.5 py-1"
                :data-tip="`${faction.name}: ${run.local[faction.id]} of ${LOCAL_MAX}. Wants ${faction.wants.toLowerCase()}`"
                @click="ledgerOpen = true"
              >
                <span class="flex items-center justify-between gap-1">
                  <Icon
                    :name="LOCAL_FACTION_ICONS[faction.id]"
                    class="h-3.5 w-3.5 text-warning"
                  />
                  <span class="sr-only">{{ faction.name }}</span>
                  <strong
                    class="text-xs"
                    :class="run.local[faction.id] <= 3 ? 'text-error' : ''"
                    >{{ run.local[faction.id] }}</strong
                  >
                </span>
                <span
                  class="mt-1 block h-1 overflow-hidden rounded-full bg-base-content/15"
                  aria-hidden="true"
                >
                  <span
                    class="block h-full rounded-full"
                    :class="
                      run.local[faction.id] <= 3 ? 'bg-error' : 'bg-warning'
                    "
                    :style="{
                      width: (100 * run.local[faction.id]) / LOCAL_MAX + '%',
                    }"
                  />
                </span>
              </button>
            </li>
          </ul>
        </div>
      </header-page-bar>

      <div
        v-if="ledgerOpen"
        class="eod-frame @container relative z-20 shrink-0 px-1.5 pb-1.5 sm:px-2"
      >
        <EmperorFortressLedger id="eod-ledger" :run="run" :day-line="dayLine" />
      </div>

      <div
        class="eod-frame eod-stage relative isolate flex min-h-0 flex-1 flex-col overflow-hidden"
        :style="stageStyle"
      >
        <div
          v-if="activeRoom !== 'briefing'"
          class="flex shrink-0 items-start gap-3 px-2 pt-2 sm:px-4 sm:pt-3"
        >
          <span
            class="eod-medallion hidden h-11 w-11 shrink-0 place-items-center rounded-full sm:grid"
            aria-hidden="true"
          >
            <Icon :name="currentRoom.icon" class="h-5 w-5 text-warning" />
          </span>
          <div class="shrink-0">
            <h2
              class="eod-plate eod-display inline-block whitespace-nowrap px-2 py-0.5 text-sm sm:px-3 sm:text-xl"
            >
              {{ currentRoom.title }}
            </h2>
            <p class="eod-tagline mt-1 hidden max-w-md text-sm italic lg:block">
              {{ currentRoom.tagline }}
            </p>
          </div>
          <div
            id="eod-room-tools"
            class="ml-auto flex min-w-0 items-center justify-end self-center"
          />
        </div>
        <div
          ref="stage"
          class="@container min-h-0 flex-1 p-2 sm:p-3"
          :class="
            activeRoom === 'briefing' ||
            activeRoom === 'throne' ||
            activeRoom === 'quests'
              ? 'overflow-hidden'
              : 'kr-scroll overscroll-contain'
          "
        >
          <section
            v-if="over && activeRoom !== 'chronicle'"
            class="kr-panel space-y-3 p-5"
          >
            <p
              class="text-xs font-semibold uppercase tracking-widest text-warning"
            >
              Fifty days · the ending
            </p>
            <h2 class="font-serif text-3xl font-bold">{{ ending?.title }}</h2>
            <p class="font-serif text-lg">{{ ending?.text }}</p>
            <div v-if="run.memorials.length" class="rounded-xl bg-base-200 p-3">
              <p class="text-sm font-semibold">Remembered by name</p>
              <ul class="mt-1 text-sm">
                <li
                  v-for="memorial in run.memorials"
                  :key="memorial.followerId"
                >
                  {{ followerName(memorial.followerId) }}, Day
                  {{ memorial.day }}
                </li>
              </ul>
            </div>
            <EmperorFortressEpilogue
              v-if="ending"
              class="@container"
              :run="run"
              :ending="ending.id"
            />
            <PlaybookRunReview
              v-if="ending"
              game="emperor-of-dust"
              :run="run"
              :ending="ending.id"
            />
            <p class="text-sm opacity-75">
              Rewind to any dawn from the Chronicle to try another road, or
              begin again.
            </p>
          </section>
          <template v-else>
            <EmperorFortressBriefing
              v-if="activeRoom === 'briefing'"
              :run="run"
              @next="enter('throne')"
            />
            <EmperorFortressThrone
              v-else-if="activeRoom === 'throne'"
              :run="run"
              @next="enter('quests')"
            />
            <EmperorFortressQuests
              v-else-if="activeRoom === 'quests'"
              :run="run"
            />
            <EmperorFortressBarracks
              v-else-if="activeRoom === 'barracks'"
              :key="'barracks-' + run.day"
              :run="run"
            />
            <EmperorFortressMarket
              v-else-if="activeRoom === 'market'"
              :run="run"
            />
            <EmperorFortressMapRoom
              v-else-if="activeRoom === 'map'"
              :run="run"
            />
          </template>
          <EmperorFortressChronicle
            v-if="activeRoom === 'chronicle'"
            :run="run"
            @new-run="enter('throne')"
          />
        </div>
      </div>
    </div>

    <EmperorFortressPreferences
      v-if="settingsOpen"
      @close="settingsOpen = false"
    />
    <EmperorFortressIntro
      v-if="court.loaded && court.introOpen"
      :active="!splashing"
      @done="finishIntroduction"
    />
    <EmperorFortressSplash
      v-if="splashing"
      :ready="court.loaded"
      @done="splashing = false"
    />
    <EmperorFortressDawn
      v-if="showDawn && court.lastReport"
      :report="court.lastReport"
      :run="court.run"
      @close="showDawn = false"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { LAST_DAY } from '~/utils/emperorOfDust/fortress/content'
import { COURT_ONBOARDING_FLAG } from '~/utils/emperorOfDust/fortress/onboarding'
import {
  actOf,
  audiencesToday,
  isOver,
} from '~/utils/emperorOfDust/fortress/engine'
import { endingOf } from '~/utils/emperorOfDust/fortress/endings'
import {
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
} from '~/utils/emperorOfDust/fortress/factions'
import { followerDef } from '~/utils/emperorOfDust/fortress/followers'
import {
  LOCAL_FACTION_ICONS,
  ROOMS,
  roomArtUrl,
  roomDef,
} from '~/utils/emperorOfDust/fortress/rooms'
import type { RoomId } from '~/utils/emperorOfDust/fortress/rooms'
import { tipShift } from '~/utils/emperorOfDust/fortress/tipFit'

const court = useEmperorFortressStore()
const run = computed(() => court.run)
const over = computed(() => !!run.value && isOver(run.value))
const ending = computed(() =>
  run.value && over.value ? endingOf(run.value) : undefined,
)
const followerName = (id: string) => followerDef(id)?.name ?? id
const activeRoom = ref<RoomId>('briefing')
const showDawn = ref(false)
const splashing = ref(true)
const settingsOpen = ref(false)
const stage = ref<HTMLElement | null>(null)

const unheard = computed(() =>
  run.value
    ? audiencesToday(run.value).filter(
        (audience) => !run.value!.audiencesHeard.includes(audience.id),
      ).length
    : 0,
)
const expiring = computed(() =>
  run.value && !over.value
    ? run.value.board.filter((entry) => entry.lastDay === run.value!.day).length
    : 0,
)
const rooms = computed(() =>
  ROOMS.map((room) => {
    const badge =
      (room.id === 'throne'
        ? unheard.value
        : room.id === 'quests'
          ? expiring.value
          : 0) || undefined
    const waiting =
      room.id === 'throne' && badge
        ? ` · ${badge} petitioner${badge === 1 ? '' : 's'} waiting`
        : room.id === 'quests' && badge
          ? ` · ${badge} quest${badge === 1 ? ' expires' : 's expire'} tonight`
          : room.id === 'quests' && !unheard.value && !over.value
            ? ' · the day can end here'
            : ''
    return { ...room, badge, hint: room.label + waiting }
  }),
)
const currentRoom = computed(() => roomDef(activeRoom.value))
const stageStyle = computed(() => {
  const art = roomArtUrl(activeRoom.value)
  return art ? { '--eod-room-art': `url(${art})` } : {}
})
const ACT_NAMES = ['I', 'II', 'III', 'IV', 'V']
const actName = (act: number) => ACT_NAMES[act - 1] ?? String(act)
const dayLine = computed(() =>
  !run.value || over.value
    ? 'The reign is over'
    : `Act ${actName(actOf(Math.min(run.value.day, LAST_DAY)))} · Day ${run.value.day} / ${LAST_DAY}`,
)
const ledgerOpen = ref(false)

// Keep every header tooltip inside the header (see tipFit.ts): a tip centred on an edge tab
// widened the shell's scroll range, so scrolling a tab into view slid the fortress sideways.
const bar = ref<HTMLElement | null>(null)
function fitTips() {
  const header = bar.value
  if (!header) return
  const bound = header.getBoundingClientRect()
  for (const el of header.querySelectorAll<HTMLElement>('[data-tip]')) {
    const tipWidth = parseFloat(getComputedStyle(el, '::before').width)
    const anchor = el.getBoundingClientRect()
    if (!tipWidth || !anchor.width) continue
    el.style.setProperty(
      '--tt-trans',
      `${tipShift(anchor.left, anchor.width, tipWidth, bound.left, bound.right)}px`,
    )
  }
}
let barObserver: ResizeObserver | undefined
watch(bar, (header) => {
  barObserver?.disconnect()
  if (!header || typeof ResizeObserver === 'undefined') return
  barObserver = new ResizeObserver(() => fitTips())
  barObserver.observe(header)
})
watch(
  [rooms, ledgerOpen, () => run.value?.brass, () => run.value?.day],
  () => void nextTick(fitTips),
)
onBeforeUnmount(() => barObserver?.disconnect())

function enter(room: RoomId) {
  activeRoom.value = room
  stage.value?.scrollTo({ top: 0 })
}

function finishIntroduction() {
  const firstAudience =
    run.value?.day === 1 &&
    run.value.roster.length === 0 &&
    run.value.flags.includes(COURT_ONBOARDING_FLAG)
  court.closeIntro()
  if (firstAudience) enter('throne')
}

watch(
  () => court.lastReport,
  (report) => {
    if (!report) return
    showDawn.value = true
    activeRoom.value = 'briefing'
  },
)

onMounted(() => {
  court.load()
  void document.fonts?.ready.then(fitTips)
  if (!document.getElementById('eod-display-font')) {
    const link = document.createElement('link')
    link.id = 'eod-display-font'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&display=swap'
    document.head.appendChild(link)
  }
})

useSeoMeta(
  gameLinkPreviewMeta(
    'emperor-of-dust',
    useRuntimeConfig().public.appBaseUrl,
  ) ?? {},
)
useHead({ title: 'Emperor of Dust' })
</script>

<style>
.eod .eod-reading {
  font-family: Georgia, ui-serif, serif;
  font-size: clamp(1.125rem, 1rem + 0.65cqw, 1.5rem);
  line-height: 1.53;
  letter-spacing: 0.005em;
}
.eod .eod-choice-reading {
  font-size: clamp(1rem, 0.925rem + 0.36cqw, 1.2rem);
  line-height: 1.42;
}
.eod-reading-large .eod-reading {
  font-size: clamp(1.3rem, 1.15rem + 0.7cqw, 1.75rem);
}
.eod-reading-extra-large .eod-reading {
  font-size: clamp(1.5rem, 1.35rem + 0.8cqw, 2rem);
}
.eod-reading-large .eod-choice-reading {
  font-size: clamp(1.125rem, 1rem + 0.5cqw, 1.4rem);
}
.eod-reading-extra-large .eod-choice-reading {
  font-size: clamp(1.25rem, 1.15rem + 0.6cqw, 1.65rem);
}
.eod-font-sans .eod-reading {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-style: normal;
}
.eod-high-contrast .kr-panel {
  background-color: var(--color-base-100);
  color: var(--color-base-content);
}
.eod-high-contrast .eod-reading,
.eod-high-contrast .eod-choice-reading {
  opacity: 1;
  text-shadow: none;
}
.eod-motion-reduced .eod-intro-backdrop {
  animation: none !important;
}
.eod-motion-reduced .eod-scene-enter-active,
.eod-motion-reduced .eod-scene-leave-active,
.eod-motion-reduced .eod-figure-enter-active,
.eod-motion-reduced .eod-figure-leave-active {
  transition: none !important;
}
@container (min-width: 64rem) {
  .eod-wide .eod-briefing {
    grid-template-columns: minmax(28rem, 1.15fr) minmax(0, 0.85fr);
  }
}
.eod {
  --eod-gilt: oklch(72% 0.1 78);
  --eod-gilt-dim: color-mix(in oklch, var(--eod-gilt) 45%, transparent);
  --eod-ink: var(--color-base-100);
}

.eod .eod-display,
.eod h2.font-serif,
.eod h3.font-serif {
  font-family: 'Cinzel', ui-serif, Georgia, serif;
  letter-spacing: 0.05em;
}

.eod .eod-frame {
  border: 1px solid var(--eod-gilt-dim);
  border-radius: 0.5rem;
  background: var(--eod-ink);
  box-shadow:
    inset 0 0 0 3px color-mix(in oklch, var(--color-base-200) 80%, transparent),
    inset 0 0 0 4px color-mix(in oklch, var(--eod-gilt) 22%, transparent),
    0 6px 18px oklch(0% 0 0 / 0.35);
}

.eod .eod-chip {
  border: 1px solid var(--eod-gilt-dim);
  border-radius: 0.375rem;
  background: var(--color-base-200);
}

/* Header tooltips are shifted to stay inside the bar (fitTips); the tail stays on its button. */
.eod-bar [data-tip]::before {
  max-width: min(20rem, calc(100cqw - 0.75rem));
}

.eod-bar .tooltip-bottom::after {
  transform: translateX(-50%) translateY(var(--tt-pos, -0.25rem)) rotate(180deg);
}

.eod .eod-tab {
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: color-mix(in oklch, var(--color-base-content) 80%, transparent);
  transition:
    background-color 0.15s,
    color 0.15s;
}

.eod .eod-tab:hover {
  color: var(--color-warning);
  background: color-mix(in oklch, var(--eod-gilt) 10%, transparent);
}

.eod .eod-tab[aria-current='page'] {
  color: var(--color-warning-content);
  border-color: var(--eod-gilt);
  background: linear-gradient(
    to bottom,
    oklch(82% 0.11 82),
    oklch(66% 0.11 70)
  );
}

.eod .eod-stage {
  background-color: var(--color-base-200);
  background-image:
    linear-gradient(
      to bottom,
      oklch(14% 0.02 255 / 0.55),
      oklch(14% 0.02 255 / 0.15) 30%,
      oklch(14% 0.02 255 / 0.65)
    ),
    var(--eod-room-art, none),
    radial-gradient(
      ellipse at 30% 25%,
      oklch(62% 0.13 62 / 0.55),
      transparent 60%
    ),
    radial-gradient(
      ellipse at 80% 90%,
      oklch(42% 0.14 30 / 0.45),
      transparent 55%
    ),
    linear-gradient(to bottom, oklch(26% 0.04 60), oklch(16% 0.025 255));
  background-size: cover;
  background-position: center;
}

/* A scene figure fills whatever height the room's card leaves; with too
   little room for a readable figure it steps aside instead of a sliver. */
.eod .eod-figure-box {
  container-type: size;
}

@container (max-height: 6rem) {
  .eod .eod-figure-box .eod-figure {
    visibility: hidden;
  }
}

.eod .eod-figure {
  filter: drop-shadow(0 10px 18px oklch(0% 0 0 / 0.6));
  mask-image:
    linear-gradient(to right, transparent, black 14%, black 86%, transparent),
    linear-gradient(to bottom, transparent, black 10%, black 85%, transparent);
  mask-composite: intersect;
}

.eod .eod-board {
  border: 1px solid var(--eod-gilt-dim);
  border-radius: 0.5rem;
  background:
    repeating-linear-gradient(
      90deg,
      oklch(0% 0 0 / 0.08) 0 2px,
      transparent 2px 46px
    ),
    linear-gradient(to bottom, oklch(42% 0.06 55), oklch(33% 0.05 50));
  box-shadow:
    inset 0 0 0 6px oklch(26% 0.04 50),
    inset 0 0 0 7px var(--eod-gilt-dim),
    inset 0 0 24px oklch(0% 0 0 / 0.45);
}

.eod .eod-notice {
  position: relative;
  min-height: 7.5rem;
  border-radius: 2px;
  color: oklch(28% 0.03 55);
  background:
    radial-gradient(ellipse at 30% 20%, oklch(96% 0.03 85), transparent 70%),
    oklch(88% 0.045 80);
  box-shadow:
    0 6px 12px oklch(0% 0 0 / 0.45),
    inset 0 0 18px oklch(60% 0.06 60 / 0.35);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.eod .eod-notice:hover {
  transform: translateY(-2px) rotate(0deg);
}

.eod .eod-notice-picked {
  transform: rotate(0deg) scale(1.03);
  outline: 2px solid var(--eod-gilt);
  outline-offset: 3px;
}

.eod .eod-pin {
  position: absolute;
  top: 0.35rem;
  left: 50%;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
  transform: translateX(-50%);
  background: radial-gradient(
    circle at 35% 35%,
    oklch(70% 0.17 27),
    oklch(42% 0.15 27)
  );
  box-shadow: 0 1px 2px oklch(0% 0 0 / 0.5);
}

.eod .eod-price {
  border: 1px solid var(--eod-gilt);
  border-radius: 0.375rem;
  color: var(--color-warning-content);
  background: linear-gradient(
    to bottom,
    oklch(80% 0.11 80),
    oklch(64% 0.11 68)
  );
}

.eod .eod-price:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.eod .eod-banner {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%);
  border-top: 3px solid var(--eod-gilt);
  color: var(--color-base-content);
  background: linear-gradient(
    to bottom,
    color-mix(in oklch, var(--eod-banner) 90%, white 6%),
    color-mix(in oklch, var(--eod-banner) 80%, black 20%)
  );
  --eod-banner: oklch(40% 0.03 255);
}

.eod .eod-banner-hostile {
  --eod-banner: oklch(45% 0.16 27);
}

.eod .eod-banner-wary {
  --eod-banner: oklch(55% 0.11 70);
}

.eod .eod-banner-neutral {
  --eod-banner: oklch(42% 0.04 240);
}

.eod .eod-banner-friendly {
  --eod-banner: oklch(46% 0.09 150);
}

.eod .eod-banner-allied {
  --eod-banner: oklch(52% 0.12 150);
}

.eod .eod-banner-gone {
  --eod-banner: oklch(30% 0.01 255);
  opacity: 0.5;
  text-decoration: line-through;
}

.eod .eod-banner-fog {
  --eod-banner: oklch(32% 0.015 255);
  opacity: 0.55;
}

.eod .eod-banner-focused {
  filter: drop-shadow(0 0 5px var(--eod-gilt));
}

.eod .eod-medallion {
  border: 1px solid var(--eod-gilt);
  background: radial-gradient(
    circle,
    var(--color-base-100),
    var(--color-base-200)
  );
  box-shadow:
    0 0 0 3px var(--color-base-200),
    0 0 0 4px var(--eod-gilt-dim);
}

.eod .eod-plate {
  border: 1px solid var(--eod-gilt-dim);
  border-radius: 0.25rem;
  background: linear-gradient(to right, var(--eod-ink), var(--color-base-200));
  color: var(--color-base-content);
}

.eod .eod-tagline {
  color: color-mix(in oklch, var(--color-base-content) 82%, transparent);
  text-shadow: 0 1px 3px oklch(0% 0 0 / 0.8);
}

.eod .eod-finish {
  border: 1px solid var(--eod-gilt);
  border-radius: 0.375rem;
  font-family: 'Cinzel', ui-serif, Georgia, serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-warning-content);
  background: linear-gradient(
    to bottom,
    oklch(80% 0.11 80),
    oklch(62% 0.11 66)
  );
}

.eod .eod-finish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.eod .eod-finish:hover:not(:disabled) {
  filter: brightness(1.08);
}

.eod .kr-panel {
  border: 1px solid var(--eod-gilt-dim);
  border-radius: 0.5rem;
  background: var(--eod-ink);
  box-shadow:
    inset 0 0 0 3px color-mix(in oklch, var(--color-base-200) 70%, transparent),
    inset 0 0 0 4px color-mix(in oklch, var(--eod-gilt) 18%, transparent);
}

.eod .btn-warning {
  border-color: var(--eod-gilt);
  background: linear-gradient(
    to bottom,
    oklch(80% 0.11 80),
    oklch(64% 0.11 68)
  );
  color: var(--color-warning-content);
}

.eod .btn-outline {
  border-color: var(--eod-gilt-dim);
  color: var(--color-base-content);
}

.eod .btn-outline:hover:not(:disabled) {
  border-color: var(--eod-gilt);
  background: color-mix(in oklch, var(--eod-gilt) 15%, transparent);
  color: var(--color-warning);
}
</style>
