<template>
  <main class="kr-surface gap-2 p-2 sm:p-3">
    <header
      class="kr-toolbar flex-wrap items-center gap-2 rounded-2xl border border-base-content/10 bg-base-100 px-2 py-1.5 shadow-sm"
    >
      <div
        class="flex w-full min-w-0 gap-1.5 overflow-x-auto pb-0.5"
        role="radiogroup"
        aria-label="Game"
      >
        <button
          v-for="game in store.games"
          :key="game.id"
          type="button"
          role="radio"
          class="group relative h-14 w-36 shrink-0 overflow-hidden rounded-xl border-2 text-left shadow-sm transition sm:h-16 sm:w-44"
          :class="
            store.game === game.id
              ? 'border-primary shadow-md'
              : 'border-transparent opacity-75 hover:opacity-100'
          "
          :aria-checked="store.game === game.id"
          @click="pickGame(game.id)"
        >
          <img
            :src="game.cover"
            alt=""
            class="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span
            class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
          />
          <span
            class="absolute inset-x-2 bottom-1.5 font-serif text-sm font-black leading-tight text-white drop-shadow"
            >{{ game.title }}</span
          >
        </button>
      </div>
      <div
        v-if="routeOptions.length > 1"
        class="flex flex-wrap gap-1 rounded-xl bg-base-200 p-1"
        role="tablist"
        aria-label="Route"
      >
        <button
          v-for="option in routeOptions"
          :key="option.value"
          type="button"
          role="tab"
          class="rounded-lg px-2.5 py-1 text-xs font-black"
          :class="
            store.route === option.value
              ? 'bg-primary text-primary-content'
              : 'hover:bg-base-100'
          "
          :aria-selected="store.route === option.value"
          @click="setRoute(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <div
        class="flex gap-1 rounded-xl bg-base-200 p-1"
        role="tablist"
        aria-label="View"
      >
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          role="tab"
          class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black"
          :class="
            store.view === option.value
              ? 'bg-secondary text-secondary-content'
              : 'hover:bg-base-100'
          "
          :aria-selected="store.view === option.value"
          @click="store.view = option.value"
        >
          <Icon :name="option.icon" class="size-3.5" />{{ option.label }}
        </button>
      </div>
      <label
        class="flex min-w-40 flex-1 items-center gap-1.5 rounded-xl border border-base-content/15 bg-base-100 px-2"
      >
        <Icon name="kind-icon:search" class="size-4 text-base-content/50" />
        <input
          v-model="store.search"
          type="search"
          class="w-full bg-transparent py-1 text-sm outline-none"
          placeholder="Search beats, choices and lines"
          aria-label="Search the playbook"
        />
      </label>
      <p class="text-xs text-base-content/70 max-md:hidden">
        {{ store.counts.nodes }} beats · {{ store.counts.needsArt }} need art ·
        {{ store.counts.edited }} edited ({{ store.counts.live }} live) ·
        {{ store.counts.open }} open notes
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        title="Download every edit and open note as JSON for an agent to fold into the source"
        :disabled="!store.loaded"
        @click="download"
      >
        <Icon name="kind-icon:download" class="size-4" />
        <span class="max-sm:sr-only">Export</span>
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
        aria-label="Reload edits and notes"
        :disabled="store.loading"
        @click="store.load()"
      >
        <span v-if="store.loading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-4" />
      </button>
      <div
        class="flex w-full gap-1 rounded-xl bg-base-200 p-1 lg:hidden"
        role="tablist"
        aria-label="Pane"
      >
        <button
          v-for="option in paneOptions"
          :key="option.value"
          type="button"
          role="tab"
          class="flex-1 rounded-lg px-2 py-1 text-xs font-black"
          :class="
            pane === option.value
              ? 'bg-base-100 shadow'
              : 'text-base-content/70'
          "
          :aria-selected="pane === option.value"
          @click="pane = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <p
      v-if="store.message"
      class="rounded-xl px-3 py-1.5 text-sm"
      :class="store.failed ? 'bg-error/15 text-error' : 'bg-success/15'"
      role="status"
    >
      {{ store.message }}
    </p>

    <div v-if="!ready" class="grid flex-1 place-items-center">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="!userStore.isAdmin"
      class="kr-note kr-note-error p-8 text-center"
    >
      <p class="text-lg font-black">Administrator access required</p>
      <p class="text-sm">
        The Playbook Manager is for the people writing the game.
      </p>
    </div>

    <div
      v-else
      class="kr-panes gap-3 lg:grid-cols-[220px_minmax(0,1fr)_minmax(340px,440px)] 2xl:grid-cols-[240px_minmax(0,1fr)_minmax(420px,520px)]"
    >
      <aside
        class="kr-pane-scroll rounded-2xl border border-base-content/10 bg-base-100 p-3"
        :class="pane === 'filters' ? '' : 'max-lg:hidden'"
        aria-label="Filters"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black">Sort and filter</h2>
          <button
            v-if="store.filtersActive"
            type="button"
            class="btn btn-ghost btn-xs"
            @click="store.clearFilters()"
          >
            Clear
          </button>
        </div>

        <h3 class="mt-3 text-[11px] font-black uppercase tracking-wider">
          Kind of beat
        </h3>
        <div class="mt-1 flex flex-col gap-1">
          <button
            v-for="kind in presentKinds"
            :key="kind"
            type="button"
            class="flex items-center gap-2 rounded-lg px-2 py-1 text-left text-xs font-bold"
            :class="
              store.kinds.includes(kind)
                ? 'bg-primary/15 text-primary'
                : 'hover:bg-base-200'
            "
            :aria-pressed="store.kinds.includes(kind)"
            @click="toggleKind(kind)"
          >
            <span class="size-2.5 rounded-full" :class="KIND_DOT[kind]" />
            {{ store.kindLabel(kind) }}
            <span class="ml-auto text-base-content/50">{{
              kindCount(kind)
            }}</span>
          </button>
        </div>

        <h3 class="mt-3 text-[11px] font-black uppercase tracking-wider">
          {{ store.playbook.dayLabel }}
        </h3>
        <div class="mt-1 flex flex-wrap gap-1">
          <button
            type="button"
            class="rounded-full px-2 py-0.5 text-xs font-bold"
            :class="
              store.day === null
                ? 'bg-primary text-primary-content'
                : 'bg-base-200'
            "
            @click="store.day = null"
          >
            Any
          </button>
          <button
            v-for="day in store.days"
            :key="day"
            type="button"
            class="rounded-full px-2 py-0.5 text-xs font-bold"
            :class="
              store.day === day
                ? 'bg-primary text-primary-content'
                : 'bg-base-200'
            "
            @click="store.day = day"
          >
            {{ day }}
          </button>
        </div>

        <template v-if="store.playbook.people.length">
          <h3 class="mt-3 text-[11px] font-black uppercase tracking-wider">
            {{ store.playbook.peopleLabel }}
          </h3>
          <div class="mt-1 flex flex-wrap gap-1">
            <button
              type="button"
              class="rounded-full px-2 py-0.5 text-xs font-bold"
              :class="
                store.companion === null
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200'
              "
              @click="store.companion = null"
            >
              Anyone
            </button>
            <button
              v-for="person in store.playbook.people"
              :key="person.id"
              type="button"
              class="rounded-full px-2 py-0.5 text-xs font-bold"
              :class="
                store.companion === person.id
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200'
              "
              @click="store.companion = person.id"
            >
              {{ person.label }}
            </button>
          </div>
        </template>

        <h3 class="mt-3 text-[11px] font-black uppercase tracking-wider">
          {{ store.playbook.variationLabel }}
        </h3>
        <div class="mt-1 flex flex-wrap gap-1">
          <button
            type="button"
            class="rounded-full px-2 py-0.5 text-xs font-bold"
            :class="
              store.lens === null
                ? 'bg-primary text-primary-content'
                : 'bg-base-200'
            "
            @click="store.lens = null"
          >
            Any
          </button>
          <button
            v-for="variation in store.playbook.variations"
            :key="variation.id"
            type="button"
            class="rounded-full px-2 py-0.5 text-xs font-bold"
            :class="
              store.lens === variation.id
                ? 'bg-primary text-primary-content'
                : 'bg-base-200'
            "
            @click="store.lens = variation.id"
          >
            {{ variation.label }}
          </button>
        </div>

        <h3 class="mt-3 text-[11px] font-black uppercase tracking-wider">
          Status
        </h3>
        <div class="mt-1 flex flex-col gap-1">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            class="rounded-lg px-2 py-1 text-left text-xs font-bold"
            :class="
              store.status === option.value
                ? 'bg-primary/15 text-primary'
                : 'hover:bg-base-200'
            "
            @click="store.status = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <template v-if="store.view === 'list'">
          <h3 class="mt-3 text-[11px] font-black uppercase tracking-wider">
            Sort list by
          </h3>
          <select
            v-model="store.sort"
            class="select select-bordered select-sm mt-1 w-full"
            aria-label="Sort list by"
          >
            <option value="story">Story order</option>
            <option value="day">Day</option>
            <option value="kind">Kind of beat</option>
            <option value="companion">Most specific companion first</option>
            <option value="title">Title</option>
          </select>
        </template>
      </aside>

      <section
        class="kr-pane-scroll @container rounded-2xl bg-base-200/60 p-3"
        :class="pane === 'playbook' ? '' : 'max-lg:hidden'"
        aria-label="Playbook"
      >
        <template v-if="store.view === 'chain'">
          <div
            class="grid gap-4"
            :class="store.routes.length > 1 ? '@5xl:grid-cols-2' : ''"
          >
            <div
              v-for="route in store.routes"
              :key="route.id"
              class="flex min-w-0 flex-col gap-2"
            >
              <h2 class="font-serif text-xl font-black">{{ route.name }}</h2>
              <p class="-mt-2 text-xs text-base-content/60">{{ route.kind }}</p>
              <template v-for="(key, index) in route.steps" :key="key">
                <p
                  v-if="route.headings[index]"
                  class="mt-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.2em] text-base-content/55"
                >
                  <span class="h-px flex-1 bg-base-content/15" />
                  {{ route.headings[index] }}
                  <span class="h-px flex-1 bg-base-content/15" />
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
                  <PlaybookNode :node-key="key" @select="pane = 'beat'" />
                </div>
              </template>
            </div>
          </div>
          <template
            v-for="section in store.playbook.sections"
            :key="section.title"
          >
            <h2 class="mt-6 font-serif text-xl font-black">
              {{ section.title }}
            </h2>
            <p class="text-xs text-base-content/60">{{ section.blurb }}</p>
            <div
              class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-3"
            >
              <PlaybookNode
                v-for="key in section.keys"
                :key="key"
                :node-key="key"
                tile
                @select="pane = 'beat'"
              />
            </div>
          </template>
        </template>
        <template v-else>
          <p class="mb-2 text-xs font-bold text-base-content/60">
            {{ store.listKeys.length }} of {{ store.counts.nodes }} beats
          </p>
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3"
          >
            <PlaybookNode
              v-for="key in store.listKeys"
              :key="key"
              :node-key="key"
              tile
              @select="pane = 'beat'"
            />
          </div>
          <p
            v-if="!store.listKeys.length"
            class="rounded-xl bg-base-100 p-4 text-center text-sm"
          >
            Nothing matches those filters.
          </p>
        </template>
      </section>

      <aside
        class="kr-pane-scroll @container rounded-2xl border border-base-content/10 bg-base-100"
        :class="pane === 'beat' ? '' : 'max-lg:hidden'"
        aria-label="Selected beat"
      >
        <PlaybookDetail />
      </aside>
    </div>
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
import { isPlaybookGame } from '~/utils/playbook/games'
import type { NodeKind } from '~/utils/playbook/types'

const userStore = useUserStore()
const store = usePlaybookStore()
const ready = ref(false)
const pane = ref<'filters' | 'playbook' | 'beat'>('playbook')

const routeOptions = computed(() =>
  store.playbook.routes.length > 1
    ? [
        { value: 'all', label: 'All routes' },
        ...store.playbook.routes.map((route) => ({
          value: route.id,
          label: route.name.replace(/^The /, ''),
        })),
      ]
    : [],
)
const viewOptions = [
  { value: 'chain' as const, label: 'Chain', icon: 'kind-icon:git-branch' },
  { value: 'list' as const, label: 'Gallery', icon: 'kind-icon:image' },
]
const paneOptions = [
  { value: 'filters' as const, label: 'Filters' },
  { value: 'playbook' as const, label: 'Playbook' },
  { value: 'beat' as const, label: 'Beat' },
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
  pane.value = 'playbook'
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
