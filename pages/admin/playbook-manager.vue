<template>
  <main class="playbook-studio kr-surface gap-0">
    <header
      class="kr-toolbar flex-nowrap gap-3 border-b border-base-content/15 bg-[#070f15] px-4 py-3 sm:px-8"
    >
      <span class="flex min-w-0 items-center gap-3">
        <svg
          viewBox="0 0 40 40"
          class="size-9 shrink-0 text-primary"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z"
            fill="currentColor"
          />
        </svg>
        <span class="min-w-0 leading-tight">
          <span
            class="block text-sm font-black uppercase tracking-[.2em] text-primary sm:text-base"
            >Kind Robots</span
          >
          <span
            class="block text-xs font-bold uppercase tracking-[.24em] text-base-content/85"
            >Playbook Studio</span
          >
        </span>
      </span>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="inline-flex studio-pill-button"
          title="Download every edit and open note as JSON for an agent to fold into the source"
          :disabled="!store.loaded"
          @click="download"
        >
          <Icon name="kind-icon:download" class="size-4" />
          <span class="max-sm:sr-only">Export</span>
        </button>
        <button
          type="button"
          class="inline-flex studio-pill-button"
          aria-label="Reload edits and notes"
          :disabled="store.loading"
          @click="store.load()"
        >
          <span
            v-if="store.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
        </button>
      </div>
    </header>

    <p
      v-if="store.message"
      class="mx-4 mt-3 rounded-xl border px-3 py-1.5 text-sm sm:mx-8"
      :class="
        store.failed
          ? 'border-error/50 text-error'
          : 'border-success/40 text-success'
      "
      role="status"
    >
      {{ store.message }}
    </p>

    <div v-if="!ready" class="grid flex-1 place-items-center">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="!userStore.isAdmin"
      class="m-6 rounded-2xl border border-error/50 p-8 text-center"
    >
      <p class="text-lg font-black">Administrator access required</p>
      <p class="text-sm">
        The Playbook Studio is for the people writing the games.
      </p>
    </div>

    <template v-else>
      <div
        v-show="!sceneOpen"
        class="kr-panes gap-6 p-4 sm:p-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8"
      >
        <aside
          class="kr-pane-scroll studio-rail"
          :class="pane === 'stories' ? '' : 'max-lg:hidden'"
          aria-label="Your stories"
        >
          <button
            type="button"
            class="inline-flex studio-pill-button mb-4 lg:hidden"
            @click="pane = 'atlas'"
          >
            <Icon name="kind-icon:chevron-left" class="size-4" /> Back to the
            atlas
          </button>
          <h2 class="studio-heading px-2">Your stories</h2>
          <div class="mt-3 flex flex-col gap-1.5">
            <button
              v-for="game in gameRows"
              :key="game.id"
              type="button"
              class="rounded-xl border px-4 py-2.5 text-left transition"
              :class="
                store.game === game.id
                  ? 'border-primary/80 bg-[#1c3b33]'
                  : 'border-transparent hover:bg-base-200'
              "
              :aria-pressed="store.game === game.id"
              @click="pickGame(game.id)"
            >
              <span class="block font-bold">{{ game.title }}</span>
              <span
                class="block text-[11px] font-bold uppercase tracking-[.16em] text-base-content/65"
                >{{ game.count }}</span
              >
            </button>
          </div>

          <hr class="my-5 border-base-content/15" />
          <h2 class="studio-heading px-2">Collection</h2>
          <div class="mt-2 flex flex-col">
            <button
              v-for="(item, index) in collection"
              :key="item.id"
              type="button"
              class="rounded-lg px-2 py-2 text-left text-[15px] transition hover:text-primary"
              :class="
                item.active
                  ? 'font-bold text-base-content'
                  : 'text-base-content/75'
              "
              @click="pickCollection(item.pick)"
            >
              {{ String(index + 1).padStart(2, '0') }} {{ item.label }}
            </button>
          </div>

          <details
            class="mt-4 rounded-xl border border-base-content/15 px-3 py-2"
          >
            <summary
              class="cursor-pointer text-xs font-bold uppercase tracking-[.16em] text-base-content/80"
            >
              Refine
              <span v-if="store.filtersActive" class="text-primary"> · on</span>
            </summary>
            <div class="mt-3 flex flex-col gap-3 pb-1">
              <div>
                <p class="studio-subhead">Kind of beat</p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <button
                    v-for="kind in presentKinds"
                    :key="kind"
                    type="button"
                    class="studio-chip"
                    :class="store.kinds.includes(kind) ? 'is-on' : ''"
                    :aria-pressed="store.kinds.includes(kind)"
                    @click="toggleKind(kind)"
                  >
                    {{ store.kindLabel(kind) }} {{ kindCount(kind) }}
                  </button>
                </div>
              </div>
              <div v-if="store.days.length">
                <p class="studio-subhead">{{ store.playbook.dayLabel }}</p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="studio-chip"
                    :class="store.day === null ? 'is-on' : ''"
                    @click="store.day = null"
                  >
                    Any
                  </button>
                  <button
                    v-for="day in store.days"
                    :key="day"
                    type="button"
                    class="studio-chip"
                    :class="store.day === day ? 'is-on' : ''"
                    @click="store.day = day"
                  >
                    {{ day }}
                  </button>
                </div>
              </div>
              <div v-if="store.playbook.people.length">
                <p class="studio-subhead">{{ store.playbook.peopleLabel }}</p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="studio-chip"
                    :class="store.companion === null ? 'is-on' : ''"
                    @click="store.companion = null"
                  >
                    Anyone
                  </button>
                  <button
                    v-for="person in store.playbook.people"
                    :key="person.id"
                    type="button"
                    class="studio-chip"
                    :class="store.companion === person.id ? 'is-on' : ''"
                    @click="store.companion = person.id"
                  >
                    {{ person.label }}
                  </button>
                </div>
              </div>
              <div v-if="store.playbook.variations.length">
                <p class="studio-subhead">
                  {{ store.playbook.variationLabel }}
                </p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="studio-chip"
                    :class="store.lens === null ? 'is-on' : ''"
                    @click="store.lens = null"
                  >
                    Any
                  </button>
                  <button
                    v-for="variation in store.playbook.variations"
                    :key="variation.id"
                    type="button"
                    class="studio-chip"
                    :class="store.lens === variation.id ? 'is-on' : ''"
                    @click="store.lens = variation.id"
                  >
                    {{ variation.label }}
                  </button>
                </div>
              </div>
              <div v-if="store.view === 'list'">
                <p class="studio-subhead">Sort</p>
                <select
                  v-model="store.sort"
                  class="select select-sm mt-1 w-full"
                  aria-label="Sort the atlas by"
                >
                  <option value="story">Story order</option>
                  <option value="day">Day</option>
                  <option value="kind">Kind of beat</option>
                  <option value="companion">Most specific first</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <button
                v-if="store.filtersActive"
                type="button"
                class="studio-chip self-start"
                @click="store.clearFilters()"
              >
                Clear everything
              </button>
            </div>
          </details>

          <div
            class="mt-6 rounded-2xl border border-secondary/40 bg-[#123029] p-4"
          >
            <p
              class="text-[11px] font-bold uppercase tracking-[.18em] text-base-content/80"
            >
              Live story health
            </p>
            <p class="mt-1 flex items-baseline gap-2">
              <span class="font-serif text-3xl font-black">{{
                store.counts.requests
              }}</span>
              <span
                class="text-[11px] font-bold uppercase tracking-[.14em] text-base-content/80"
                >Art requests</span
              >
            </p>
            <p class="mt-1 text-xs text-base-content/70">
              {{ store.counts.needsArt }} need art ·
              {{ store.counts.open }} open notes · {{ store.counts.live }} live
              edits
            </p>
          </div>
          <NuxtLink
            to="/admin/art-review"
            class="mt-3 flex items-center justify-between rounded-xl border border-base-content/15 px-4 py-2.5 text-sm font-bold transition hover:border-primary"
          >
            Checkpoint review
            <Icon name="kind-icon:external-link" class="size-4 text-primary" />
          </NuxtLink>
        </aside>

        <section
          class="kr-pane-scroll @container"
          :class="pane === 'atlas' ? '' : 'max-lg:hidden'"
          aria-label="Playbook"
        >
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div class="min-w-0">
              <h2
                class="font-serif text-4xl font-black uppercase leading-none tracking-wide @3xl:text-6xl"
              >
                {{ store.view === 'list' ? 'Story Atlas' : 'Story Chain' }}
              </h2>
              <p class="mt-2 text-base text-base-content/80 @3xl:text-lg">
                Every beat. Every branch. Every beautiful, strange possibility.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select
                class="studio-select"
                aria-label="Game"
                :value="store.game"
                @change="pickGame(($event.target as HTMLSelectElement).value)"
              >
                <option
                  v-for="game in store.games"
                  :key="game.id"
                  :value="game.id"
                >
                  {{ game.title }}
                </option>
              </select>
              <select
                v-if="store.playbook.routes.length > 1"
                class="studio-select"
                aria-label="Route"
                :value="store.route"
                @change="setRoute(($event.target as HTMLSelectElement).value)"
              >
                <option value="all">All routes</option>
                <option
                  v-for="route in store.playbook.routes"
                  :key="route.id"
                  :value="route.id"
                >
                  {{ route.name.replace(/^The /, '') }}
                </option>
              </select>
              <select
                v-model="store.status"
                class="studio-select"
                aria-label="Status"
              >
                <option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <div
                class="flex rounded-full border border-base-content/25 p-0.5"
                role="tablist"
                aria-label="View"
              >
                <button
                  v-for="option in viewOptions"
                  :key="option.value"
                  type="button"
                  role="tab"
                  class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[.14em]"
                  :class="
                    store.view === option.value
                      ? 'bg-primary text-primary-content'
                      : 'text-base-content/75 hover:text-base-content'
                  "
                  :aria-selected="store.view === option.value"
                  @click="store.view = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <label
              class="flex min-w-48 flex-1 items-center gap-2 rounded-full border border-base-content/25 bg-base-200/60 px-4"
            >
              <Icon
                name="kind-icon:search"
                class="size-4 text-base-content/60"
              />
              <input
                v-model="store.search"
                type="search"
                class="w-full bg-transparent py-2 text-sm outline-none"
                placeholder="Search beats, choices and lines"
                aria-label="Search the playbook"
              />
            </label>
            <button
              type="button"
              class="inline-flex studio-pill-button lg:hidden"
              @click="pane = 'stories'"
            >
              Stories &amp; filters
            </button>
          </div>

          <template v-if="store.view === 'list'">
            <div
              class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-5"
            >
              <PlaybookAtlasCard
                v-for="key in store.listKeys"
                :key="key"
                :node-key="key"
                :index="store.playbook.order.indexOf(key)"
                @open="openScene"
              />
            </div>
            <p
              v-if="!store.listKeys.length"
              class="mt-6 rounded-2xl border border-base-content/15 p-6 text-center"
            >
              Nothing matches those filters.
            </p>
          </template>

          <template v-else>
            <div
              class="mt-6 grid gap-6"
              :class="store.routes.length > 1 ? '@5xl:grid-cols-2' : ''"
            >
              <div
                v-for="route in store.routes"
                :key="route.id"
                class="flex min-w-0 flex-col gap-2"
              >
                <h3 class="font-serif text-2xl font-black uppercase">
                  {{ route.name }}
                </h3>
                <p class="-mt-2 text-xs text-base-content/65">
                  {{ route.kind }}
                </p>
                <template v-for="(key, index) in route.steps" :key="key">
                  <p
                    v-if="route.headings[index]"
                    class="mt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary/85"
                  >
                    <span class="h-px flex-1 bg-primary/30" />
                    {{ route.headings[index] }}
                    <span class="h-px flex-1 bg-primary/30" />
                  </p>
                  <div class="relative pl-5">
                    <span
                      class="absolute bottom-[-0.5rem] left-[7px] top-0 w-0.5 bg-base-content/15"
                      :class="index === route.steps.length - 1 ? 'hidden' : ''"
                    />
                    <span
                      class="absolute left-0 top-5 size-4 rounded-full border-2 border-base-100"
                      :class="
                        KIND_DOT[store.playbook.nodes[key]?.kind ?? 'spine']
                      "
                    />
                    <PlaybookNode :node-key="key" @select="openScene" />
                  </div>
                </template>
              </div>
            </div>
            <template
              v-for="section in store.playbook.sections"
              :key="section.title"
            >
              <h3 class="mt-8 font-serif text-2xl font-black uppercase">
                {{ section.title }}
              </h3>
              <p class="text-xs text-base-content/65">{{ section.blurb }}</p>
              <div
                class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-4"
              >
                <PlaybookAtlasCard
                  v-for="key in section.keys"
                  :key="key"
                  :node-key="key"
                  :index="store.playbook.order.indexOf(key)"
                  @open="openScene"
                />
              </div>
            </template>
          </template>

          <p
            class="mt-8 text-[11px] font-bold uppercase tracking-[.2em] text-base-content/55"
          >
            Playbook / {{ store.view === 'list' ? 'Atlas' : 'Chain' }} ·
            {{ store.listKeys.length }} of {{ store.counts.nodes }} beats
          </p>
        </section>
      </div>

      <div
        v-if="sceneOpen"
        class="kr-panes gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(24rem,30rem)] lg:px-8"
      >
        <section
          class="kr-pane-scroll @container max-lg:hidden"
          aria-label="Scene"
        >
          <PlaybookScene @back="closeScene" @art="showArt" />
        </section>
        <aside
          class="kr-pane-scroll @container flex flex-col gap-5"
          aria-label="Selected beat"
        >
          <div class="lg:hidden">
            <PlaybookScene @back="closeScene" @art="showArt" />
          </div>
          <div class="studio-panel @container flex min-h-full flex-col">
            <PlaybookDetail ref="detail" />
          </div>
        </aside>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import {
  KIND_ORDER,
  usePlaybookStore,
  type PlaybookStatus,
} from '~/stores/playbookStore'
import { buildPlaybook, isPlaybookGame } from '~/utils/playbook/games'
import type { NodeKind } from '~/utils/playbook/types'

const userStore = useUserStore()
const store = usePlaybookStore()
const ready = ref(false)
// Playbook Studio (conductor weird-humboldt t-040): the Story Atlas, and a
// focused scene editor that opens over it. Phones switch the Atlas between
// its cards and the stories rail; the scene stacks its art over the editor.
const pane = ref<'stories' | 'atlas'>('atlas')
const sceneOpen = ref(false)
const detail = ref<{ showTab: (tab: 'art') => void } | null>(null)

const gameRows = computed(() =>
  store.games.map((game) => ({
    ...game,
    count: `${Object.keys(buildPlaybook(game.id).nodes).length} beats`,
  })),
)

const collection = computed(() => [
  {
    id: 'all',
    label: 'All beats',
    active: store.route === 'all' && store.section === null,
    pick: () => {
      setRoute('all')
      store.section = null
    },
  },
  ...(store.playbook.routes.length > 1 ? store.playbook.routes : []).map(
    (route) => ({
      id: `route:${route.id}`,
      label: route.name,
      active: store.route === route.id && store.section === null,
      pick: () => {
        setRoute(route.id)
        store.section = null
      },
    }),
  ),
  ...store.playbook.sections.map((section) => ({
    id: `section:${section.title}`,
    label: section.title,
    active: store.section === section.title,
    pick: () => {
      setRoute('all')
      store.section = section.title
    },
  })),
])

function pickCollection(pick: () => void) {
  pick()
  pane.value = 'atlas'
}

function openScene(key: string) {
  store.selectedKey = key
  sceneOpen.value = true
}

function closeScene() {
  sceneOpen.value = false
}

function showArt() {
  detail.value?.showTab('art')
}

const viewOptions = [
  { value: 'list' as const, label: 'Atlas' },
  { value: 'chain' as const, label: 'Chain' },
]
const statusOptions: { value: PlaybookStatus; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'needs-art', label: 'Needs art' },
  { value: 'requested', label: 'Art requested' },
  { value: 'flagged', label: 'Image flagged' },
  { value: 'notes', label: 'Has open comments' },
  { value: 'edited', label: 'Edited' },
]

const KIND_DOT: Record<NodeKind, string> = {
  opening: 'bg-violet-500',
  spine: 'bg-emerald-600',
  fork: 'bg-sky-600',
  encounter: 'bg-amber-500',
  crossroads: 'bg-orange-500',
  boss: 'bg-red-700',
  quest: 'bg-teal-600',
  follower: 'bg-fuchsia-600',
  thread: 'bg-indigo-600',
  ending: 'bg-rose-600',
}

const presentKinds = computed(() =>
  KIND_ORDER.filter((kind) => kindCount(kind) > 0),
)

function kindCount(kind: NodeKind) {
  return Object.values(store.playbook.nodes).filter((n) => n.kind === kind)
    .length
}

function toggleKind(kind: NodeKind) {
  store.kinds = store.kinds.includes(kind)
    ? store.kinds.filter((k) => k !== kind)
    : [...store.kinds, kind]
}

function setRoute(value: string) {
  store.route = value
  store.day = null
}

function pickGame(value: string) {
  if (isPlaybookGame(value)) void store.setGame(value)
  pane.value = 'atlas'
  sceneOpen.value = false
}

function download() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${store.game}-playbook-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await store.load()
})
</script>

<style src="../../assets/css/playbook-studio.css"></style>
