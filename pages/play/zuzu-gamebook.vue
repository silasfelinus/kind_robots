<template>
  <main class="kr-surface">
    <div v-if="!store.loaded" class="kr-stage items-center justify-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <template v-else>
      <div
        class="kr-toolbar mx-auto w-[calc(100%-1.5rem)] max-w-[1476px] flex-nowrap justify-between gap-x-3 rounded-2xl bg-base-100/95 px-3 py-1 shadow-sm sm:w-[calc(100%-3rem)] sm:px-4 lg:w-[calc(100%-4rem)]"
      >
        <div class="flex min-w-0 items-baseline gap-3">
          <p class="shrink-0 font-serif text-lg font-black tracking-wide">
            ZUZU<span class="hidden sm:inline">
              <span class="text-warning">/</span> KOALA ASSASSIN</span
            >
          </p>
          <p
            class="hidden truncate text-[11px] font-bold uppercase tracking-[.22em] opacity-60 sm:block"
          >
            {{ current.chapter }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span
            class="rounded-md bg-base-200 px-3 py-1.5 text-xs font-bold"
            aria-label="Resources"
          >
            <span class="text-rose-400">♥ {{ store.run.health }}/12</span>
            <span class="opacity-40"> · </span>
            <span class="text-sky-400">✦ {{ store.run.resolve }}/4</span>
          </span>
          <button
            type="button"
            class="btn btn-sm"
            :class="showSheet ? 'btn-warning' : 'btn-outline'"
            :aria-expanded="showSheet"
            aria-controls="zuzu-sheet"
            @click="showSheet = !showSheet"
          >
            <icon name="kind-icon:book-open" class="size-4" /><span
              class="sm:hidden"
              >Sheet</span
            ><span class="hidden sm:inline">Character sheet</span>
          </button>
          <button
            v-if="store.recoverable"
            type="button"
            class="btn btn-ghost btn-sm max-sm:px-2"
            title="Restore previous journey"
            @click="recover"
          >
            <span aria-hidden="true">↶</span>
            <span class="sr-only sm:not-sr-only">Restore</span>
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm max-sm:px-2"
            title="New journey"
            @click="restart"
          >
            <icon name="kind-icon:refresh" class="size-4 sm:hidden" />
            <span class="max-sm:sr-only">New journey</span>
          </button>
        </div>
      </div>

      <div
        class="kr-panes mx-auto w-full max-w-[1500px] grid-cols-1 px-3 pb-3 sm:px-6 lg:px-8 lg:pb-5"
        :class="showSheet ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : ''"
      >
        <div
          ref="pane"
          class="kr-pane-scroll rounded-2xl"
          :class="showSheet ? 'hidden lg:block' : ''"
        >
          <article
            class="flex min-h-full flex-col gap-4 md:gap-6"
            :data-short-wide="shortWide ? '' : undefined"
            :class="
              layout === 'right'
                ? 'md:flex-row'
                : 'md:grid md:grid-rows-[minmax(9rem,1fr)_auto]'
            "
          >
            <figure
              class="relative isolate shrink-0 overflow-hidden rounded-2xl border border-warning/20 bg-stone-950 shadow-2xl md:flex md:aspect-auto md:items-center md:justify-center md:[container-type:size]"
              :class="plateClass"
            >
              <img
                :src="platePath(art)"
                class="absolute inset-0 hidden size-full scale-110 object-cover opacity-90 blur-2xl brightness-75 md:block"
                alt=""
                aria-hidden="true"
              />
              <div
                class="relative size-full overflow-hidden md:shadow-2xl md:ring-1 md:ring-black/50"
                :class="frameClass"
              >
                <img
                  :src="platePath(art)"
                  class="absolute inset-0 size-full object-cover"
                  :style="{ objectPosition: art.focus ?? 'center' }"
                  :alt="art.alt"
                  :width="PLATE_SIZE[shape].width"
                  :height="PLATE_SIZE[shape].height"
                />
              </div>
            </figure>

            <div
              class="flex flex-col gap-6 rounded-2xl border border-warning/20 bg-base-200 px-5 py-5 shadow-xl sm:px-8"
              :class="
                layout === 'top'
                  ? 'md:grid md:grid-cols-[minmax(0,7fr)_minmax(18rem,5fr)] md:items-start md:gap-10'
                  : 'md:min-w-0 md:flex-1 md:justify-center'
              "
            >
              <div>
                <p class="text-xs uppercase tracking-[.28em] text-warning">
                  Section
                  {{ String(store.run.visited.length).padStart(3, '0') }}
                </p>
                <h2
                  ref="heading"
                  tabindex="-1"
                  class="mt-1 font-serif text-2xl font-black leading-tight outline-none sm:text-3xl"
                >
                  {{ current.title }}
                </h2>
                <p
                  class="zuzu-prose mt-4 max-w-3xl font-serif text-lg leading-[1.75] text-base-content xl:text-xl"
                >
                  <template v-for="(part, i) in prose" :key="i">
                    <em v-if="part.em">{{ part.text }}</em>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </p>
                <p
                  v-if="art.fit === 'stand-in'"
                  class="mt-3 text-xs opacity-55"
                >
                  This section shows the nearest existing plate while its own
                  illustration is painted.
                </p>
                <section
                  v-if="store.run.lastRoll"
                  class="zuzu-roll mt-5 border-y border-base-content/15 py-4"
                  aria-live="polite"
                  aria-label="Last dice result"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p
                        class="text-xs font-black uppercase tracking-[.22em] opacity-65"
                      >
                        {{ store.run.lastRoll.label }} CHECK
                      </p>
                      <p class="mt-1 text-sm">
                        <strong>{{ store.run.lastRoll.total }}</strong> vs
                        {{ store.run.lastRoll.target }} ·
                        <span
                          :class="
                            store.run.lastRoll.success
                              ? 'text-success'
                              : 'text-error'
                          "
                          >{{
                            store.run.lastRoll.success ? 'SUCCESS' : 'SETBACK'
                          }}</span
                        >
                      </p>
                    </div>
                    <div
                      :key="store.rollSerial"
                      class="flex items-center gap-2"
                      aria-hidden="true"
                    >
                      <span
                        v-for="(die, index) of store.run.lastRoll.dice"
                        :key="index"
                        class="zuzu-die zuzu-die-face grid size-12 place-items-center rounded-lg border-2 border-amber-900 bg-amber-100 font-serif text-2xl font-black text-stone-900 shadow-lg"
                        >{{ die }}</span
                      >
                      <span class="ml-2 text-sm opacity-70"
                        >+ {{ store.run.lastRoll.modifier }}</span
                      >
                    </div>
                  </div>
                </section>
              </div>
              <div class="min-w-0">
                <section
                  v-if="store.run.pendingLoot?.length"
                  class="rounded-xl border border-warning/40 bg-base-300 p-4 sm:p-6"
                  aria-label="Full pack, choose what to keep"
                  aria-live="polite"
                >
                  <h3 class="font-serif text-xl font-bold">
                    Your pack is full
                  </h3>
                  <p class="mt-2 text-sm">
                    You found <strong>{{ store.run.pendingLoot[0] }}</strong
                    >. Replace one carried item or leave this find behind.
                  </p>
                  <p
                    v-if="store.run.pendingLoot.length > 1"
                    class="mt-1 text-xs opacity-65"
                  >
                    {{ store.run.pendingLoot.length - 1 }} more find(s) to
                    consider.
                  </p>
                  <div class="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      v-for="(item, index) in store.run.items"
                      :key="index"
                      type="button"
                      class="btn btn-outline btn-sm justify-start"
                      @click="store.claimLoot(index)"
                    >
                      Replace {{ item }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm justify-start"
                      @click="store.claimLoot(null)"
                    >
                      Leave {{ store.run.pendingLoot[0] }} behind
                    </button>
                  </div>
                </section>
                <div
                  v-else-if="current.battle && store.run.battle"
                  class="zuzu-battle rounded-xl border border-error/30 bg-base-300 p-4 sm:p-6"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p class="text-xs uppercase tracking-[.2em] opacity-60">
                        CONFRONTATION · ROUND {{ store.run.battle.turn }}
                      </p>
                      <h3 class="font-serif text-xl font-bold">
                        {{ current.battle.name }}
                      </h3>
                    </div>
                    <span class="text-sm font-bold text-error"
                      >Foe HP {{ store.run.battle.hp }}/{{
                        current.battle.hp
                      }}</span
                    >
                  </div>
                  <progress
                    class="progress progress-error mt-3 w-full"
                    :value="store.run.battle.hp"
                    :max="current.battle.hp"
                    aria-label="Enemy health"
                  />
                  <p class="mt-3 text-sm opacity-80" aria-live="polite">
                    {{ store.run.battle.log }}
                  </p>
                  <p class="mt-3 text-sm font-semibold text-warning">
                    The foe circles and prepares to strike. Choose your
                    approach.
                  </p>
                  <div class="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      v-for="(move, index) in moves"
                      :key="move.action"
                      type="button"
                      :aria-keyshortcuts="String(index + 1)"
                      class="zuzu-move group rounded-xl border border-base-content/20 bg-base-100 p-3 text-left transition hover:border-warning hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning"
                      :disabled="
                        move.action === 'quiet-draw' && store.run.resolve < 2
                      "
                      @click="store.battle(move.action)"
                    >
                      <strong class="block text-base"
                        ><span class="mr-2 font-serif text-warning">{{
                          index + 1
                        }}</span
                        >{{ move.label }}</strong
                      ><span class="mt-1 block text-xs opacity-65">{{
                        move.help
                      }}</span>
                    </button>
                  </div>
                </div>
                <template v-else-if="current.ending">
                  <div
                    class="rounded-xl border border-warning/30 bg-warning/10 p-5"
                  >
                    <p
                      class="text-xs font-black uppercase tracking-[.2em] text-warning"
                    >
                      {{ current.ending }} ending discovered
                    </p>
                    <p class="mt-2 font-serif text-lg">
                      One story ends. Others are hidden in the dust.
                    </p>
                    <p class="mt-2 text-sm opacity-75">
                      Found {{ store.discovered.length }} of
                      {{ ENDING_IDS.length }} endings.
                    </p>
                    <PlaybookRunReview
                      game="zuzu-gamebook"
                      :run="store.run"
                      :ending="current.ending"
                    />
                    <button
                      class="btn btn-warning mt-4"
                      type="button"
                      @click="restart"
                    >
                      Walk another road
                    </button>
                  </div>
                </template>
                <section v-else aria-label="Story choices">
                  <h3
                    class="mb-3 text-xs font-black uppercase tracking-[.26em] opacity-65"
                  >
                    What will Zuzu do?
                  </h3>
                  <div class="grid gap-2">
                    <button
                      v-for="(choice, index) in choices"
                      :key="choice.id"
                      type="button"
                      :disabled="!!lockReason(store.run, choice)"
                      :aria-keyshortcuts="
                        index < 9 ? String(index + 1) : undefined
                      "
                      class="zuzu-choice group flex min-h-12 items-center gap-4 rounded-xl border border-base-content/20 bg-base-100 px-4 py-2.5 text-left transition hover:border-warning hover:bg-base-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning disabled:cursor-not-allowed disabled:opacity-45"
                      @click="store.choose(choice.id)"
                    >
                      <span
                        class="grid size-9 shrink-0 place-items-center rounded-lg border border-warning/50 font-serif font-bold text-warning"
                        >{{ index + 1 }}</span
                      >
                      <span class="flex-1"
                        ><span class="block font-semibold leading-snug">{{
                          choice.label
                        }}</span
                        ><span
                          v-if="lockReason(store.run, choice)"
                          class="mt-1 block text-xs opacity-75"
                          >{{ lockReason(store.run, choice) }}</span
                        ></span
                      >
                      <icon
                        name="kind-icon:arrow-right"
                        class="size-4 shrink-0 opacity-35 group-hover:opacity-100"
                      />
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </article>
        </div>

        <aside
          v-if="showSheet"
          id="zuzu-sheet"
          class="kr-pane-scroll rounded-2xl border border-warning/25 bg-base-200 p-5 shadow-xl"
        >
          <div class="flex items-center justify-between">
            <h2 class="font-serif text-2xl font-bold">The Wanderer</h2>
            <button
              class="btn btn-ghost btn-xs"
              type="button"
              aria-label="Close character sheet"
              @click="showSheet = false"
            >
              ✕
            </button>
          </div>
          <p class="mt-2 text-sm opacity-70">
            Zuzu · Koala ronin · Road of Dust
          </p>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-base-300 p-3">
              <p class="text-xs opacity-60">Health</p>
              <p class="text-xl font-black text-rose-400">
                {{ store.run.health }} / 12
              </p>
            </div>
            <div class="rounded-lg bg-base-300 p-3">
              <p class="text-xs opacity-60">Resolve</p>
              <p class="text-xl font-black text-sky-400">
                {{ store.run.resolve }} / 4
              </p>
            </div>
          </div>
          <h3
            class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
          >
            Attributes
          </h3>
          <dl class="mt-3 space-y-2 text-sm">
            <div
              v-for="(value, attribute) of store.run.attributes"
              :key="attribute"
              class="flex justify-between border-b border-base-content/10 pb-2"
            >
              <dt class="capitalize">{{ attribute }}</dt>
              <dd class="font-bold">+{{ value }}</dd>
            </div>
          </dl>
          <h3
            class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
          >
            Equipment and pack
          </h3>
          <p class="mt-2 text-xs opacity-70">Kasa · Poncho · Katana (worn)</p>
          <ul class="mt-3 space-y-2 text-sm">
            <li
              v-for="(item, i) of store.run.items"
              :key="item + i"
              class="rounded-md border border-base-content/15 p-2 capitalize"
            >
              ◆ {{ item }}
            </li>
            <li
              v-for="slot in Math.max(0, 5 - store.run.items.length)"
              :key="'empty' + slot"
              class="rounded-md border border-dashed border-base-content/15 p-2 opacity-35"
            >
              Empty slot
            </li>
          </ul>
          <h3
            class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
          >
            Special arts
          </h3>
          <ul class="mt-2 space-y-2 text-sm">
            <li>
              <strong>Still Wind</strong> · +2 to a Sense/Shadow check (planned)
            </li>
            <li><strong>Quiet Draw</strong> · powerful strike, 2 Resolve</li>
            <li><strong>Last Kindness</strong> · protect an ally (planned)</li>
          </ul>
          <h3
            class="mt-6 text-xs font-bold uppercase tracking-[.22em] opacity-60"
          >
            Journal
          </h3>
          <p v-if="!store.run.flags.length" class="mt-2 text-sm opacity-75">
            The road has not yet left its marks.
          </p>
          <template v-else>
            <p v-if="notes.deeds.length" class="mt-2 text-sm">
              <span class="opacity-60">Deeds:</span>
              <template v-for="(deed, i) in notes.deeds" :key="deed.text">
                <span v-if="i"> · </span>
                <span :class="deed.dark ? 'italic text-error' : ''">{{
                  deed.text
                }}</span>
              </template>
            </p>
            <p v-if="notes.debts.length" class="mt-2 text-sm">
              <span class="opacity-60">Owed by:</span>
              {{ notes.debts.join(' · ') }}
            </p>
            <p v-if="notes.learned.length" class="mt-2 text-sm">
              <span class="opacity-60">Learned:</span>
              {{ notes.learned.join(' · ') }}
            </p>
          </template>
          <p class="mt-4 text-xs opacity-60">
            Sections travelled: {{ store.run.visited.length }} · Endings
            discovered: {{ store.discovered.length }}
          </p>
        </aside>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  scene,
  type BattleAction,
  ENDING_IDS,
  lockReason,
  visibleChoices,
} from '~/utils/zuzuGamebook/adventure'
import {
  PLATE_SIZE,
  plateLayout,
  platePath,
  sectionPlate,
} from '~/utils/zuzuGamebook/art'
import { journal } from '~/utils/zuzuGamebook/journal'
import { emphasis } from '~/utils/zuzuGamebook/prose'
import { useZuzuGamebookStore } from '~/stores/zuzuGamebookStore'

const store = useZuzuGamebookStore()
const showSheet = ref(false)
const current = computed(() => scene(store.run.sceneId))
const art = computed(() => sectionPlate(current.value))
const shape = computed(() => art.value.shape ?? 'wide')
// Silas, 2026-10-11: "Just keep a single horizontal view above or portrait to the right ... It should be one clean
// page of display." Phones stack the plate above the text; from lg up the section fits the pane, the plate fills
// whatever room the text leaves. The picture keeps close to its own shape inside that room (a wide plate may crop
// to 12:5 at most) and a blur of itself fills the rest, so a short screen never slices it to a strip.
// Silas, 2026-10-16: on a landscape tablet a plate above the text left no room
// for the choices. A wide, short screen sets every plate to the right.
const shortWide = ref(false)
const portraitTablet = ref(false)
const layout = computed(() =>
  shortWide.value
    ? 'right'
    : portraitTablet.value
      ? 'top'
      : plateLayout(art.value),
)
const plateClass = computed(() => [
  shape.value === 'wide'
    ? 'aspect-video'
    : shape.value === 'tall'
      ? 'aspect-[4/5]'
      : 'aspect-square',
  layout.value === 'top' ? '' : 'md:order-last md:w-[min(44%,38rem)]',
  // Phones stack the plate above the text; it keeps to a third of the screen
  // so the section starts above the fold.
  'max-md:max-h-[34svh]',
])
const frameClass = computed(() => {
  // Beside the text on a short screen, any plate fills its column.
  if (shortWide.value) return 'md:size-full'
  if (shape.value === 'wide')
    return layout.value === 'right'
      ? 'md:size-full'
      : 'md:h-[100cqh] md:w-[min(100cqw,240cqh)]'
  // A tall or square plate above the text keeps its own shape, centred on a
  // blur of itself, instead of being cropped to a strip.
  if (layout.value === 'top')
    return shape.value === 'tall'
      ? 'md:h-[100cqh] md:w-[min(100cqw,80cqh)]'
      : 'md:h-[100cqh] md:w-[min(100cqw,100cqh)]'
  return shape.value === 'tall'
    ? 'md:w-full md:h-[min(100cqh,128cqw)]'
    : 'md:w-full md:h-[min(100cqh,100cqw)]'
})
const prose = computed(() => emphasis(current.value.text))
const choices = computed(() => visibleChoices(store.run, current.value))
const notes = computed(() => journal(store.run.flags))
const moves: { action: BattleAction; label: string; help: string }[] = [
  {
    action: 'strike',
    label: '⚔ Strike',
    help: 'Steel check · 3 damage on a hit',
  },
  {
    action: 'guard',
    label: '◈ Guard',
    help: 'Sense check · block and expose foe for a counter',
  },
  {
    action: 'feint',
    label: '↝ Feint',
    help: 'Shadow check · expose defenses, 3 damage, blunt retaliation',
  },
  {
    action: 'quiet-draw',
    label: '✦ Quiet Draw',
    help: '2 Resolve · 5 damage on a hit',
  },
]
function restart() {
  if (
    window.confirm(
      'Start a new journey? Your current route is saved in a recovery slot and discovered endings stay in your ledger.',
    )
  )
    store.restart()
}
function recover() {
  if (
    window.confirm(
      'Restore your previous journey? This journey will be kept in the recovery slot.',
    )
  )
    store.recover()
}
const pane = ref<HTMLElement | null>(null)
const heading = ref<HTMLElement | null>(null)
watch(
  () => store.run.sceneId,
  async () => {
    await nextTick()
    pane.value?.scrollTo({ top: 0 })
    heading.value?.focus({ preventScroll: true })
  },
)
function onKey(event: KeyboardEvent) {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    showSheet.value ||
    store.run.pendingLoot?.length
  )
    return
  if ((event.target as HTMLElement | null)?.closest('input, textarea, select'))
    return
  const n = Number(event.key)
  if (!Number.isInteger(n) || n < 1) return
  if (current.value.battle && store.run.battle) {
    const move = moves[n - 1]
    if (!move || (move.action === 'quiet-draw' && store.run.resolve < 2)) return
    event.preventDefault()
    store.battle(move.action)
    return
  }
  const choice = choices.value[n - 1]
  if (!choice || current.value.ending || lockReason(store.run, choice)) return
  event.preventDefault()
  store.choose(choice.id)
}
let shortWideQuery: MediaQueryList | null = null
let portraitTabletQuery: MediaQueryList | null = null
function syncShortWide(): void {
  shortWide.value = !!shortWideQuery?.matches
  portraitTablet.value = !!portraitTabletQuery?.matches
}

onMounted(() => {
  shortWideQuery = window.matchMedia(
    '(min-width: 1024px) and (max-height: 820px)',
  )
  portraitTabletQuery = window.matchMedia(
    '(min-width: 768px) and (orientation: portrait)',
  )
  syncShortWide()
  shortWideQuery.addEventListener('change', syncShortWide)
  portraitTabletQuery.addEventListener('change', syncShortWide)
  store.load()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  shortWideQuery?.removeEventListener('change', syncShortWide)
  portraitTabletQuery?.removeEventListener('change', syncShortWide)
})
useSeoMeta(
  gameLinkPreviewMeta('zuzu-gamebook', useRuntimeConfig().public.appBaseUrl) ??
    {},
)
useHead({ title: 'Zuzu: Koala Assassin · The Bell That Never Rang' })
</script>

<style scoped>
.zuzu-die {
  animation: zuzu-roll 0.55s cubic-bezier(0.14, 0.74, 0.36, 1.25) both;
  transform-origin: 50% 50%;
}
.zuzu-die:nth-child(2) {
  animation-delay: 0.08s;
}
@keyframes zuzu-roll {
  0% {
    transform: translateY(-23px) rotate(-110deg) scale(0.65);
    opacity: 0.25;
  }
  65% {
    transform: translateY(5px) rotate(12deg) scale(1.12);
    opacity: 1;
  }
  100% {
    transform: translateY(0) rotate(0) scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .zuzu-die {
    animation: none;
  }
}

/* Wide but short (a landscape tablet): the plate sits right and the text
   steps down a size so the choices stay in view (Silas, 2026-10-16). */
article[data-short-wide] > figure {
  width: min(34%, 30rem);
}

article[data-short-wide] .zuzu-battle {
  padding: 0.75rem 1rem;
}

article[data-short-wide] .zuzu-battle > * + * {
  margin-top: 0.5rem;
}

article[data-short-wide] .zuzu-move {
  padding: 0.5rem 0.75rem;
}

article[data-short-wide] .zuzu-prose {
  margin-top: 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
}

article[data-short-wide] .zuzu-choice + .zuzu-choice {
  margin-top: -0.125rem;
}

article[data-short-wide] .zuzu-choice {
  min-height: 2.25rem;
  padding-block: 0.25rem;
}

article[data-short-wide] > div {
  gap: 0.75rem;
  padding-block: 1rem;
}

article[data-short-wide] .zuzu-roll {
  margin-top: 0.25rem;
  padding-block: 0.25rem;
}

article[data-short-wide] .zuzu-die-face {
  width: 2rem;
  height: 2rem;
  font-size: 1.125rem;
}

article[data-short-wide] h2 {
  font-size: 1.5rem;
  line-height: 2rem;
}
</style>
