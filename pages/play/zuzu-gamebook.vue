<template>
  <main class="kr-surface relative">
    <div v-if="!store.loaded" class="kr-stage items-center justify-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <template v-else>
      <header-page-bar>
        <div
          class="flex min-w-0 flex-1 items-center justify-between gap-1.5 @lg:gap-2"
          data-testid="zuzu-gamebook-hud"
        >
          <p
            class="hidden min-w-0 truncate text-[11px] font-bold uppercase tracking-[.22em] text-base-content/60 @xl:block"
            :title="current.chapter"
          >
            {{ current.chapter }}
          </p>
          <div class="ml-auto flex shrink-0 items-center gap-1.5 @lg:gap-2">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              data-testid="zuzu-gamebook-ledger-menu"
              :aria-expanded="ledgerOpen"
              @click="ledgerOpen = true"
            >
              <icon name="kind-icon:book-open" class="size-4" />
              <span class="hidden @3xl:inline">The Bell Ledger</span>
              <span class="@3xl:hidden">Ledger</span>
            </button>
            <span
              class="rounded-md bg-base-200 px-2 py-1 text-xs font-bold @lg:px-3"
              aria-label="Resources"
            >
              <span class="text-error">♥ {{ store.run.health }}/12</span>
              <span class="opacity-40"> · </span>
              <span class="text-info">✦ {{ store.run.resolve }}/4</span>
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
                class="@3xl:hidden"
                >Sheet</span
              ><span class="hidden @3xl:inline">Character sheet</span>
            </button>
            <button
              v-if="store.recoverable"
              type="button"
              class="btn btn-ghost btn-sm px-2 @3xl:px-3"
              title="Restore previous journey"
              @click="recover"
            >
              <span aria-hidden="true">↶</span>
              <span class="sr-only @3xl:not-sr-only">Restore</span>
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm px-2 @3xl:px-3"
              title="New journey"
              @click="restart"
            >
              <icon name="kind-icon:refresh" class="size-4 @3xl:hidden" />
              <span class="sr-only @3xl:not-sr-only">New journey</span>
            </button>
          </div>
        </div>
      </header-page-bar>

      <section
        v-if="ledgerOpen"
        class="fixed inset-0 z-40 flex min-h-0 flex-col gap-3 bg-base-100 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bell-ledger-heading"
        data-testid="zuzu-gamebook-ledger"
      >
        <header
          class="flex shrink-0 items-center justify-between gap-3 border-b border-warning/30 pb-3"
        >
          <div>
            <p
              class="text-[10px] font-black uppercase tracking-[.25em] text-warning"
            >
              Zuzu · The Bell That Never Rang
            </p>
            <h2
              id="bell-ledger-heading"
              class="font-serif text-2xl font-black sm:text-4xl"
            >
              The Bell Ledger
            </h2>
          </div>
          <button
            type="button"
            class="btn btn-warning btn-sm"
            @click="ledgerOpen = false"
          >
            <icon name="kind-icon:arrow-left" class="size-4" />
            Continue reading
          </button>
        </header>
        <div class="kr-scroll min-h-0 flex-1 overflow-y-auto">
          <div
            class="grid gap-4 @container lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
          >
            <section
              class="overflow-hidden rounded-2xl border border-warning/25 bg-base-200"
            >
              <img
                src="/zuzu-gamebook/scenes/waterhole.webp"
                alt="The western road where Zuzu's journeys began"
                class="max-h-48 w-full object-cover sm:max-h-64"
              />
              <div class="space-y-3 p-4">
                <p class="font-serif text-lg font-bold">
                  The road remembers the roads you took.
                </p>
                <div class="grid grid-cols-2 gap-2 text-center">
                  <div class="rounded-xl bg-base-300 p-3">
                    <strong class="block text-2xl">{{
                      rememberedScenes.length
                    }}</strong>
                    <span class="text-xs">Unique scenes walked</span>
                  </div>
                  <div class="rounded-xl bg-base-300 p-3">
                    <strong class="block text-2xl"
                      >{{ store.discovered.length }}/{{
                        ENDING_IDS.length
                      }}</strong
                    >
                    <span class="text-xs">Endings uncovered</span>
                  </div>
                </div>
                <p class="text-sm">
                  Current chapter: <strong>{{ current.chapter }}</strong>
                </p>
                <p v-if="notes.deeds.length" class="text-sm">
                  <strong>Deeds:</strong>
                  {{ notes.deeds.map((deed) => deed.text).join(' · ') }}
                </p>
                <p v-if="notes.debts.length" class="text-sm">
                  <strong>Debts:</strong> {{ notes.debts.join(' · ') }}
                </p>
                <p v-if="notes.learned.length" class="text-sm">
                  <strong>Learned:</strong> {{ notes.learned.join(' · ') }}
                </p>
                <button
                  type="button"
                  class="btn btn-outline btn-sm w-full"
                  @click="restart"
                >
                  <icon name="kind-icon:refresh" class="size-4" />
                  Begin a new journey
                </button>
                <button
                  v-if="store.recoverable"
                  type="button"
                  class="btn btn-ghost btn-sm w-full"
                  @click="recover"
                >
                  Restore previous journey
                </button>
              </div>
            </section>
            <div class="min-w-0 space-y-4">
              <section
                class="rounded-2xl border border-warning/25 bg-base-200 p-4"
              >
                <h3 class="font-serif text-xl font-bold">Endings</h3>
                <p class="mb-3 text-xs opacity-70">
                  Unfound endings stay secret until the story reveals them.
                </p>
                <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <li
                    v-for="(ending, index) in ENDING_IDS"
                    :key="ending"
                    class="rounded-lg border border-base-content/15 p-2 text-xs"
                    :class="
                      store.discovered.includes(ending)
                        ? 'bg-warning/15'
                        : 'bg-base-300/60 opacity-60'
                    "
                  >
                    <icon
                      :name="
                        store.discovered.includes(ending)
                          ? 'kind-icon:book-open'
                          : 'kind-icon:lock'
                      "
                      class="mb-1 size-4"
                    />
                    <span class="block font-bold">
                      {{
                        store.discovered.includes(ending)
                          ? ending
                          : 'Unknown ending ' + (index + 1)
                      }}
                    </span>
                  </li>
                </ul>
              </section>
              <section
                class="rounded-2xl border border-warning/25 bg-base-200 p-4"
              >
                <h3 class="font-serif text-xl font-bold">Illustrated trail</h3>
                <p class="mb-3 text-xs opacity-70">
                  Recent scenes from this journey. Earlier discoveries remain in
                  your saved route.
                </p>
                <p v-if="!recentTrail.length" class="text-sm opacity-70">
                  Your story is just beginning.
                </p>
                <ol v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <li
                    v-for="entry in recentTrail"
                    :key="entry.id"
                    class="overflow-hidden rounded-xl border border-base-content/15 bg-base-300"
                  >
                    <img
                      :src="entry.art"
                      :alt="entry.title"
                      class="aspect-video w-full object-cover"
                    />
                    <p class="p-2 text-xs font-bold">{{ entry.title }}</p>
                  </li>
                </ol>
              </section>
            </div>
          </div>
        </div>
      </section>

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
                  ? 'md:grid md:items-start md:gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(22rem,5fr)] xl:gap-10'
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
                  <KrChoiceHand
                    class="zuzu-hand mt-2"
                    :choices="moveCards"
                    :deal-key="'battle:' + store.run.sceneId"
                    testid-prefix="zuzu-move"
                    @play="playMove"
                  />
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
                <section
                  v-else
                  aria-label="Story choices"
                  class="zuzu-hand flex flex-col gap-1"
                >
                  <KrChoiceHand
                    v-for="(row, rowIndex) in choiceRows"
                    :key="rowIndex"
                    :choices="row"
                    :question="rowIndex ? '' : 'What will Zuzu do?'"
                    :deal-key="
                      store.run.visited.length + ':' + store.run.sceneId
                    "
                    testid-prefix="zuzu-choice"
                    @play="playChoice"
                  />
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
  fightCue,
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
import type { Attribute, Choice } from '~/utils/zuzuGamebook/types'
import { useZuzuGamebookStore } from '~/stores/zuzuGamebookStore'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const store = useZuzuGamebookStore()
const showSheet = ref(false)
const ledgerOpen = ref(false)
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
const rememberedScenes = computed(() => [...new Set(store.run.visited)])
const recentTrail = computed(() =>
  rememberedScenes.value
    .slice(-12)
    .reverse()
    .map((id) => {
      const entry = scene(id)
      return { id, title: entry.title, art: platePath(sectionPlate(entry)) }
    }),
)
const moves: {
  action: BattleAction
  icon: string
  label: string
  cost: string
  help: string
}[] = [
  {
    action: 'strike',
    icon: '⚔',
    label: 'Strike',
    cost: 'Steel check',
    help: '3 damage on a hit',
  },
  {
    action: 'guard',
    icon: '◈',
    label: 'Guard',
    cost: 'Sense check',
    help: 'Block and expose foe for a counter',
  },
  {
    action: 'feint',
    icon: '↝',
    label: 'Feint',
    cost: 'Shadow check',
    help: 'Expose defenses, 3 damage, blunt retaliation',
  },
  {
    action: 'quiet-draw',
    icon: '✦',
    label: 'Quiet Draw',
    cost: '2 Resolve',
    help: '5 damage on a hit',
  },
]
const moveCards = computed<KrHandChoice[]>(() =>
  moves.map((move, index) => ({
    id: move.action,
    label: move.label,
    chip: move.cost,
    shortcut: String(index + 1),
    hint: move.help,
    icon: move.icon,
    disabled: move.action === 'quiet-draw' && store.run.resolve < 2,
  })),
)
function playMove(card: KrHandChoice) {
  const move = moves.find((entry) => entry.action === card.id)
  if (move && moveCards.value.includes(card)) store.battle(move.action)
}

const ATTRIBUTE_ICON: Record<Attribute, string> = {
  steel: '⚔',
  sense: '◈',
  shadow: '↝',
  mercy: '✿',
}
// The card shows where the choice leads: a check shows the road it hopes for.
/** The plate of where a choice leads, unless it's the plate already on
 *  stage; the hand keeps any plate to a single card. */
function destinationPlate(choice: Choice): string | null {
  try {
    const plate = platePath(
      sectionPlate(scene(choice.check?.success ?? choice.to)),
    )
    return plate === platePath(art.value) ? null : plate
  } catch {
    return null
  }
}
function splitRules(label: string): { title: string; note?: string } {
  const match = /^(.+?)\s*\(([^()]+)\)\s*$/.exec(label)
  return match?.[1] ? { title: match[1], note: match[2] } : { title: label }
}
const handChoices = computed<KrHandChoice[]>(() =>
  choices.value.map((choice, index) => {
    const { title, note } = splitRules(choice.label)
    const check = choice.check
    const locked = lockReason(store.run, choice)
    const risk = locked ? null : fightCue(store.run, choice)
    const details = [
      ...(check
        ? [`Roll 2d6 + ${check.attribute} against ${check.target}`]
        : []),
      ...(risk?.details ?? []),
    ]
    return {
      id: choice.id,
      label: title,
      chip: [note, risk?.chip].filter(Boolean).join(' · ') || undefined,
      shortcut: index < 9 ? String(index + 1) : undefined,
      hint: locked ?? risk?.hint,
      details: details.length ? details : undefined,
      disabled: !!locked,
      image: destinationPlate(choice),
      icon: check ? ATTRIBUTE_ICON[check.attribute] : '◆',
    }
  }),
)
// Long lists deal as two short rows so every card keeps a readable width.
const choiceRows = computed(() => {
  const cards = handChoices.value
  const perRow = shortWide.value ? 6 : 4
  if (cards.length <= perRow) return [cards]
  const size = Math.ceil(cards.length / Math.ceil(cards.length / perRow))
  return Array.from({ length: Math.ceil(cards.length / size) }, (_, row) =>
    cards.slice(row * size, row * size + size),
  )
})
function playChoice(card: KrHandChoice) {
  if (handChoices.value.includes(card)) store.choose(card.id)
}
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
  if (ledgerOpen.value) {
    if (event.key === 'Escape') ledgerOpen.value = false
    return
  }
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

.zuzu-hand {
  --hand-accent: var(--color-warning);
  --hand-accent-2: color-mix(in oklab, var(--color-warning) 45%, #9a3412);
  --hand-band: #0c0a09;
  --hand-band-ink: #f5ead2;
  --hand-card-max: 8.5rem;
  --hand-text-scale: 1.1;
}
.zuzu-hand :deep(.krh-title strong),
.zuzu-hand :deep(.krh-detail strong) {
  font-family: ui-serif, Georgia, serif;
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

article[data-short-wide] .zuzu-hand {
  --hand-card-max: 7rem;
}

article[data-short-wide] .zuzu-prose {
  margin-top: 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
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
