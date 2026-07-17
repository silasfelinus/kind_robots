<!-- /components/conductor/packmaker-pack-editor.vue -->
<!--
  Pack editor (conductor packmaker/t-009). Builds or edits a pack manifest:
  either hand-set some or all entries, or describe the pack in a sentence and
  let the LLM draft a full scaffold (via /api/suggest, 'packmaker' sheet) to
  review and adjust before saving. Saving only writes the local draft manifest
  (packStore.savePackManifest) — items are generated later, one by one, from
  the generator panel; nothing here touches the database.
-->
<template>
  <div
    class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200/40 p-4"
  >
    <div class="flex items-center justify-between gap-2">
      <h4 class="text-sm font-black text-base-content">
        {{ editingExisting ? `Edit pack: ${draft.title}` : 'New pack' }}
      </h4>
      <button class="btn btn-ghost btn-xs rounded-xl" @click="emit('close')">
        Close
      </button>
    </div>

    <!-- LLM scaffold -->
    <div
      class="flex flex-col gap-2 rounded-xl border border-secondary/30 bg-base-100 p-3"
    >
      <label class="text-xs font-bold text-base-content/70">
        Describe the pack and let the model draft a scaffold
      </label>
      <textarea
        v-model="scaffoldPrompt"
        rows="2"
        class="textarea textarea-bordered w-full text-sm"
        placeholder="e.g. A noir detective pack set in a rain-soaked coastal city — moody locations, morally grey characters"
      />
      <div class="flex items-center gap-2">
        <button
          class="btn btn-secondary btn-xs rounded-xl"
          :disabled="scaffolding"
          @click="onScaffold"
        >
          <span v-if="scaffolding" class="loading loading-spinner loading-xs" />
          Generate scaffold
        </button>
        <span
          v-if="scaffoldMessage"
          class="text-xs font-semibold"
          :class="scaffoldOk ? 'text-success' : 'text-error'"
          >{{ scaffoldMessage }}</span
        >
      </div>
      <p class="text-xs text-base-content/40">
        The draft loads below for review — nothing is saved or generated until
        you say so.
      </p>
    </div>

    <!-- Pack fields -->
    <div class="grid gap-2 sm:grid-cols-2">
      <label class="form-control">
        <span class="label-text text-xs font-bold">Title</span>
        <input
          v-model="draft.title"
          type="text"
          class="input input-bordered input-sm"
          @input="syncIdFromTitle"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs font-bold">Id (slug)</span>
        <input
          v-model="draft.id"
          type="text"
          class="input input-bordered input-sm font-mono"
          :disabled="editingExisting"
          @input="idTouched = true"
        />
      </label>
      <label class="form-control sm:col-span-2">
        <span class="label-text text-xs font-bold">Description</span>
        <textarea
          v-model="draft.description"
          rows="2"
          class="textarea textarea-bordered textarea-sm"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs font-bold">Price hook</span>
        <select
          v-model="draft.price.hook"
          class="select select-bordered select-sm"
        >
          <option value="free">free</option>
          <option value="one-time">one-time</option>
          <option value="dlc">dlc</option>
        </select>
      </label>
    </div>

    <!-- Items -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-base-content/70"
          >Items ({{ draft.items.length }})</span
        >
        <button class="btn btn-ghost btn-xs rounded-xl" @click="addItem">
          <Icon name="kind-icon:plus" class="size-3.5" />
          Add item
        </button>
      </div>

      <details
        v-for="(item, index) in draft.items"
        :key="index"
        class="rounded-xl border border-base-300 bg-base-100"
      >
        <summary
          class="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2"
        >
          <span class="badge badge-xs rounded-lg badge-ghost">{{
            item.type
          }}</span>
          <span class="text-sm font-bold">{{
            item.draftPayload.title || item.id || `item ${index + 1}`
          }}</span>
          <button
            class="btn btn-ghost btn-xs ml-auto rounded-lg text-error"
            title="Remove this item"
            @click.prevent="draft.items.splice(index, 1)"
          >
            Remove
          </button>
        </summary>
        <div class="grid gap-2 p-3 pt-1 sm:grid-cols-2">
          <label class="form-control">
            <span class="label-text text-xs font-bold">Type</span>
            <select
              v-model="item.type"
              class="select select-bordered select-sm"
              @change="item.itemShape = defaultShapeFor(item.type)"
            >
              <option value="location">location</option>
              <option value="genre">genre</option>
              <option value="character">character</option>
              <option value="reward">reward</option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Shape</span>
            <select
              v-model="item.itemShape"
              class="select select-bordered select-sm"
            >
              <option
                v-for="shape in shapesFor(item.type)"
                :key="shape"
                :value="shape"
              >
                {{ shape }}
              </option>
            </select>
          </label>
          <label class="form-control sm:col-span-2">
            <span class="label-text text-xs font-bold">Title</span>
            <input
              v-model="item.draftPayload.title"
              type="text"
              class="input input-bordered input-sm"
              @input="item.id = slugify(item.draftPayload.title)"
            />
          </label>
          <label class="form-control sm:col-span-2">
            <span class="label-text text-xs font-bold">Description</span>
            <textarea
              v-model="item.draftPayload.description"
              rows="2"
              class="textarea textarea-bordered textarea-sm"
            />
          </label>
          <label class="form-control sm:col-span-2">
            <span class="label-text text-xs font-bold">Art prompt</span>
            <textarea
              v-model="item.draftPayload.artPrompt"
              rows="2"
              class="textarea textarea-bordered textarea-sm"
            />
          </label>
          <label class="form-control sm:col-span-2">
            <span class="label-text text-xs font-bold"
              >Text generation prompt</span
            >
            <textarea
              v-model="item.draftPayload.generationPrompt"
              rows="2"
              class="textarea textarea-bordered textarea-sm"
            />
          </label>
        </div>
      </details>
    </div>

    <!-- Save -->
    <div class="flex items-center gap-2">
      <button class="btn btn-primary btn-sm rounded-2xl" @click="onSave">
        {{ editingExisting ? 'Save changes' : 'Create pack' }}
      </button>
      <span
        v-if="saveMessage"
        class="text-xs font-semibold"
        :class="saveOk ? 'text-success' : 'text-error'"
        >{{ saveMessage }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { usePackStore } from '@/stores/packStore'
import { slugify } from '@/utils/slugify'
import type {
  PackItemShape,
  PackItemType,
  PackManifest,
  PackManifestItem,
} from '@/stores/seeds/packManifests'

const props = defineProps<{
  /** Pack to edit; omit to start a fresh manifest. */
  pack?: PackManifest | null
}>()

const emit = defineEmits<{
  close: []
  /** Fired with the saved pack's id so the parent can select it. */
  saved: [packId: string]
}>()

const packStore = usePackStore()

const editingExisting = ref(Boolean(props.pack))
const idTouched = ref(false)

function emptyItem(): PackManifestItem {
  return {
    id: '',
    type: 'location',
    itemShape: 'dream',
    draftPayload: {
      title: '',
      description: '',
      generationPrompt: '',
      artPrompt: '',
    },
  }
}

function emptyDraft(): PackManifest {
  return {
    schemaVersion: 1,
    id: '',
    title: '',
    description: '',
    owner: 'silas',
    visibility: 'draft',
    price: { hook: 'free' },
    items: [emptyItem()],
  }
}

// Deep-copy so edits never mutate the seed/imported manifest until save.
const draft = reactive<PackManifest>(
  props.pack
    ? (JSON.parse(JSON.stringify(props.pack)) as PackManifest)
    : emptyDraft(),
)

const scaffoldPrompt = ref('')
const scaffolding = ref(false)
const scaffoldMessage = ref('')
const scaffoldOk = ref(false)
const saveMessage = ref('')
const saveOk = ref(false)

function defaultShapeFor(type: PackItemType): PackItemShape {
  switch (type) {
    case 'location':
      return 'dream'
    case 'genre':
      return 'facet'
    case 'character':
      return 'character'
    case 'reward':
      return 'reward'
  }
}

// Characters may be lore-only Dreams; other types have one canonical shape.
function shapesFor(type: PackItemType): PackItemShape[] {
  return type === 'character' ? ['character', 'dream'] : [defaultShapeFor(type)]
}

function syncIdFromTitle(): void {
  if (!editingExisting.value && !idTouched.value) {
    draft.id = slugify(draft.title)
  }
}

function addItem(): void {
  draft.items.push(emptyItem())
}

async function onScaffold(): Promise<void> {
  scaffolding.value = true
  scaffoldMessage.value = ''
  try {
    const result = await packStore.generatePackScaffold(scaffoldPrompt.value)
    scaffoldOk.value = result.success
    if (!result.success) {
      scaffoldMessage.value = result.message
      return
    }
    Object.assign(draft, result.manifest)
    idTouched.value = true
    scaffoldMessage.value = `Drafted "${result.manifest.title}" — review and adjust below.`
  } finally {
    scaffolding.value = false
  }
}

function onSave(): void {
  // Backfill item ids from titles so hand-built entries validate.
  for (const item of draft.items) {
    if (!item.id && item.draftPayload.title) {
      item.id = slugify(item.draftPayload.title)
    }
  }
  if (!editingExisting.value) {
    draft.id = draft.id || slugify(draft.title)
  }
  const result = packStore.savePackManifest(
    JSON.parse(JSON.stringify(draft)) as PackManifest,
  )
  saveOk.value = result.success
  saveMessage.value = result.message
  if (result.success) emit('saved', draft.id)
}
</script>
