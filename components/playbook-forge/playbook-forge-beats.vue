<template>
  <div
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(8rem,0.8fr)_minmax(0,1.4fr)] gap-3 @5xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.6fr)] @5xl:grid-rows-[auto_minmax(0,1fr)] @5xl:gap-4"
  >
    <header
      class="flex min-w-0 flex-wrap items-end justify-between gap-3 @5xl:col-span-2"
    >
      <div class="min-w-0">
        <p class="pf-kicker text-secondary">
          Beats · {{ forge.existing?.title }}
        </p>
        <p class="pf-display mt-1 text-2xl @3xl:text-3xl">
          {{ studio.playbook.order.length }} beats
          <span class="text-base opacity-60"
            >· {{ studio.openNotes.length }} open notes ·
            {{ editedCount }} edited</span
          >
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-if="studio.game === 'ecotone'"
          type="button"
          data-nav
          class="pf-label btn btn-sm btn-ghost pf-focusable"
          title="Write a new beat that the game deals like an authored encounter"
          :disabled="!studio.loaded || studio.saving"
          @click="addBeat"
        >
          + New beat
        </button>
        <button
          type="button"
          data-nav
          class="pf-label btn btn-sm btn-ghost pf-focusable"
          title="Download every edit and open note as JSON for an agent to fold into the source"
          :disabled="!studio.loaded"
          @click="download"
        >
          <Icon name="kind-icon:download" class="size-4" /> Export
        </button>
        <button
          type="button"
          data-nav
          class="pf-label btn btn-sm btn-ghost pf-focusable"
          aria-label="Reload edits and notes"
          :disabled="studio.loading"
          @click="studio.load()"
        >
          <Icon name="kind-icon:refresh" class="size-4" />
        </button>
      </div>
      <p
        v-if="studio.message"
        class="basis-full text-xs"
        :class="studio.failed ? 'text-error' : 'text-success'"
        role="status"
      >
        {{ studio.message }}
      </p>
    </header>

    <section class="flex min-h-0 min-w-0 flex-col gap-2" aria-label="Beats">
      <div class="flex shrink-0 flex-wrap gap-1.5">
        <button
          v-for="(tab, i) in tabs"
          :key="tab.label"
          type="button"
          class="pf-chip pf-focusable"
          :class="
            forge.beatSection === tab.value
              ? 'border-primary text-primary'
              : 'border-base-content/20 opacity-80'
          "
          @click="forge.beatSection = tab.value"
        >
          {{ tab.label }}
          <span class="opacity-60">{{ tab.count }}</span>
          <span v-if="i === 0" class="sr-only">beats</span>
        </button>
      </div>
      <input
        v-model="forge.beatSearch"
        type="search"
        data-nav
        aria-label="Search beats"
        placeholder="Search beats"
        class="pf-field shrink-0 text-sm"
      />
      <ul
        ref="list"
        class="kr-scroll -mx-1 flex min-h-0 flex-col gap-1 px-1 py-1"
        aria-label="Beat list"
      >
        <li v-for="(key, i) in keys" :key="key">
          <button
            type="button"
            data-nav
            :data-autofocus="key === studio.selectedKey ? '' : undefined"
            class="pf-row pf-focusable min-h-[2.6rem] py-1"
            :class="key === studio.selectedKey ? 'pf-row-on' : ''"
            :data-key="key"
            @click="studio.selectedKey = key"
            @focus="studio.selectedKey = key"
          >
            <span class="w-6 shrink-0 text-right text-[0.65rem] opacity-50">{{
              i + 1
            }}</span>
            <span class="flex min-w-0 flex-1 flex-col text-left">
              <span class="truncate text-sm">{{ title(key) }}</span>
              <span class="pf-kicker truncate text-[0.55rem] opacity-60">{{
                kindOf(key)
              }}</span>
            </span>
            <span class="flex shrink-0 items-center gap-1 text-[0.65rem]">
              <span
                v-if="studio.flags(key).needsArt"
                class="size-2 rounded-full bg-base-content/30"
                title="No art yet"
              />
              <span
                v-else-if="studio.playbook.nodes[key]?.artUrl"
                class="size-2 rounded-full bg-success"
                title="Has art"
              />
              <span v-if="studio.flags(key).live" class="text-success"
                >LIVE</span
              >
              <span v-else-if="studio.flags(key).edited" class="text-warning"
                >EDIT</span
              >
              <span v-if="studio.flags(key).notes" class="text-info"
                >✎{{ studio.flags(key).notes }}</span
              >
              <span v-if="studio.flags(key).flagged" class="text-error">⚑</span>
            </span>
          </button>
        </li>
        <li v-if="!keys.length" class="p-3 text-sm opacity-60">
          No beat matches.
        </li>
      </ul>
    </section>

    <PlaybookForgeBeat />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { usePlaybookStore } from '~/stores/playbookStore'

const forge = usePlaybookForgeStore()
const studio = usePlaybookStore()

const tabs = computed(() => [
  {
    label: 'All',
    value: 'all' as const,
    count: studio.playbook.order.length,
  },
  ...studio.playbook.sections.map((section, index) => ({
    label: section.title,
    value: index,
    count: section.keys.length,
  })),
])

const keys = computed(() => {
  const book = studio.playbook
  const pool =
    forge.beatSection === 'all'
      ? book.order
      : (book.sections[forge.beatSection]?.keys ?? [])
  const query = forge.beatSearch.trim().toLowerCase()
  if (!query) return pool
  return pool.filter((key) => {
    const node = book.nodes[key]
    return [key, node?.title, node?.place]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const list = ref<HTMLElement | null>(null)

/** Bring the selected beat's row into view (a ledger link opens one deep in the list). */
async function revealSelected() {
  await nextTick()
  list.value
    ?.querySelector(`[data-key="${CSS.escape(studio.selectedKey)}"]`)
    ?.scrollIntoView({ block: 'nearest' })
}
onMounted(revealSelected)
watch(() => [studio.selectedKey, studio.loaded], revealSelected)

const editedCount = computed(() => Object.keys(studio.edits).length)

const title = (key: string) => studio.nodeFor(key)?.title ?? key
const kindOf = (key: string) => {
  const node = studio.playbook.nodes[key]
  return node ? `${studio.kindLabel(node.kind)} · ${node.place || key}` : key
}

async function addBeat() {
  const key = await studio.newBeat()
  if (key) studio.selectedKey = key
}

function download() {
  const blob = new Blob([studio.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${studio.game}-playbook-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
</script>
