<!-- /components/conductor/project-pitch-board.vue -->
<!--
  A lightweight, self-contained drafting board for project proposals / prompts.
  Entries persist to localStorage keyed by project slug + noun, so a visitor can
  brainstorm pitches and prompt ideas, edit them, and reorder their thinking
  without any backend. Used by the coloring-book flagship for "proposed pitches"
  and "add/edit proposals and prompts".
-->
<template>
  <section class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <div class="mb-3 flex items-center gap-2">
      <Icon :name="icon" class="size-5 text-primary" />
      <h3
        class="text-sm font-black uppercase tracking-wide text-base-content/70"
      >
        {{ title }}
      </h3>
      <span class="badge badge-ghost badge-sm ml-auto rounded-lg">{{
        items.length
      }}</span>
    </div>

    <!-- New entry -->
    <form class="mb-4 space-y-2" @submit.prevent="add">
      <input
        v-model="draftTitle"
        type="text"
        :placeholder="`${nounCapitalized} title`"
        class="input input-bordered input-sm w-full rounded-xl"
      />
      <textarea
        v-model="draftBody"
        :placeholder="bodyPlaceholder"
        class="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
        rows="2"
      />
      <div class="flex justify-end">
        <button
          type="submit"
          class="btn btn-primary btn-sm gap-1 rounded-xl"
          :disabled="!draftTitle.trim() && !draftBody.trim()"
        >
          <Icon name="kind-icon:plus" class="size-4" />
          Add {{ noun }}
        </button>
      </div>
    </form>

    <!-- List -->
    <div v-if="items.length" class="space-y-2">
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-2xl border border-base-300 bg-base-200/60 p-3"
      >
        <div v-if="editingId === item.id" class="space-y-2">
          <input
            v-model="editTitle"
            type="text"
            class="input input-bordered input-sm w-full rounded-xl"
          />
          <textarea
            v-model="editBody"
            class="textarea textarea-bordered w-full rounded-xl text-sm"
            rows="3"
          />
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg"
              @click="editingId = null"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary btn-xs rounded-lg"
              @click="saveEdit(item.id)"
            >
              Save
            </button>
          </div>
        </div>
        <div v-else class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <p v-if="item.title" class="text-sm font-bold text-base-content">
              {{ item.title }}
            </p>
            <p
              v-if="item.body"
              class="whitespace-pre-wrap text-sm text-base-content/70"
            >
              {{ item.body }}
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg"
              title="Edit"
              @click="startEdit(item)"
            >
              <Icon name="kind-icon:edit" class="size-3.5" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg text-base-content/40 hover:text-error"
              title="Remove"
              @click="remove(item.id)"
            >
              <Icon name="kind-icon:x" class="size-3.5" />
            </button>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="text-sm text-base-content/40">
      {{ emptyText }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type BoardItem = { id: string; title: string; body: string }

const props = withDefaults(
  defineProps<{
    slug: string
    /** Singular noun for entries, e.g. "proposal" or "prompt". */
    noun?: string
    title?: string
    icon?: string
    bodyPlaceholder?: string
    emptyText?: string
  }>(),
  {
    noun: 'proposal',
    title: 'Proposals',
    icon: 'kind-icon:sparkles',
    bodyPlaceholder: 'Describe the idea...',
    emptyText: 'No entries yet — add the first one.',
  },
)

const storageKey = computed(() => `project-board:${props.slug}:${props.noun}`)
const nounCapitalized = computed(
  () => props.noun.charAt(0).toUpperCase() + props.noun.slice(1),
)

const items = ref<BoardItem[]>([])
const draftTitle = ref('')
const draftBody = ref('')
const editingId = ref<string | null>(null)
const editTitle = ref('')
const editBody = ref('')

// Stable, no-Date/Random id (those are unavailable in some contexts; a counter
// plus content hash is deterministic enough for a local draft list).
let counter = 0
function nextId(): string {
  counter += 1
  return `${props.slug}-${props.noun}-${counter}-${items.value.length}`
}

function load() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(storageKey.value)
    items.value = raw ? (JSON.parse(raw) as BoardItem[]) : []
  } catch {
    items.value = []
  }
}
function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey.value, JSON.stringify(items.value))
  } catch {
    /* private mode / quota — drafts stay in-memory */
  }
}

watch(items, persist, { deep: true })
watch(storageKey, load)
onMounted(load)

function add() {
  if (!draftTitle.value.trim() && !draftBody.value.trim()) return
  items.value.unshift({
    id: nextId(),
    title: draftTitle.value.trim(),
    body: draftBody.value.trim(),
  })
  draftTitle.value = ''
  draftBody.value = ''
}
function startEdit(item: BoardItem) {
  editingId.value = item.id
  editTitle.value = item.title
  editBody.value = item.body
}
function saveEdit(id: string) {
  const item = items.value.find((i) => i.id === id)
  if (item) {
    item.title = editTitle.value.trim()
    item.body = editBody.value.trim()
  }
  editingId.value = null
}
function remove(id: string) {
  items.value = items.value.filter((i) => i.id !== id)
}
</script>
