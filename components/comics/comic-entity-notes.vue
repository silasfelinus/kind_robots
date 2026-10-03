<template>
  <div class="flex flex-col gap-4">
    <section
      v-if="slot"
      class="flex flex-col gap-2 rounded-2xl border border-base-300 p-3"
    >
      <p class="kr-text-black-base">This subject</p>
      <label class="flex flex-col gap-1 text-xs"
        >Filed under
        <select
          :value="slot.entityId ?? ''"
          class="kr-select-sm"
          @change="moveSlot"
        >
          <option value="">Unfiled</option>
          <option
            v-for="item in studio.entities"
            :key="item.id"
            :value="item.id"
          >
            {{ item.name }}
          </option>
        </select>
      </label>
      <button type="button" class="kr-btn btn-ghost btn-xs" @click="duplicate">
        <icon name="kind-icon:copy" class="kr-icon-4" /> Duplicate prompt as a
        new subject
      </button>
      <button
        v-if="!confirmArchiveSlot"
        type="button"
        class="kr-btn btn-ghost btn-xs text-error"
        @click="confirmArchiveSlot = true"
      >
        <icon name="kind-icon:trash" class="kr-icon-4" /> Archive subject
      </button>
      <div v-else class="kr-note kr-note-warning flex flex-col gap-2 text-xs">
        <span
          >Archive "{{ slot.title }}"? Its renders stay in the ArtImage
          gallery.</span
        >
        <div class="flex gap-2">
          <button
            type="button"
            class="kr-btn btn-error btn-xs"
            @click="archiveSlot"
          >
            Archive
          </button>
          <button
            type="button"
            class="kr-btn btn-ghost btn-xs"
            @click="confirmArchiveSlot = false"
          >
            Keep
          </button>
        </div>
      </div>
    </section>

    <section v-if="entity" class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <input
          v-model="draft.name"
          class="kr-input min-w-0 flex-1 font-bold"
          aria-label="Name"
        />
        <select v-model="draft.kind" class="kr-select-sm" aria-label="Kind">
          <option v-for="kind in kinds" :key="kind" :value="kind">
            {{ kind }}
          </option>
        </select>
      </div>
      <label class="flex flex-col gap-1 text-xs"
        >Secret until (keep this out of pages before the reveal)
        <input
          v-model="draft.secretUntil"
          class="kr-input-sm"
          placeholder="e.g. end of issue 3"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs"
        >Notes
        <textarea v-model="draft.notes" class="kr-textarea min-h-48 text-sm" />
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="kr-btn btn-primary btn-sm"
          :disabled="!dirty"
          @click="save"
        >
          Save notes
        </button>
        <button
          v-if="portraitCandidate"
          type="button"
          class="kr-btn btn-ghost btn-sm"
          @click="usePortrait"
        >
          <icon name="kind-icon:image" class="kr-icon-4" /> Use this subject's
          pick as portrait
        </button>
      </div>
      <button
        v-if="!confirmArchive"
        type="button"
        class="kr-btn btn-ghost btn-xs self-start text-error"
        @click="confirmArchive = true"
      >
        Archive {{ entity.name }}
      </button>
      <div v-else class="kr-note kr-note-warning flex flex-col gap-2 text-xs">
        <span>Archive {{ entity.name }}? Its subjects become unfiled.</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="kr-btn btn-error btn-xs"
            @click="archiveEntity"
          >
            Archive
          </button>
          <button
            type="button"
            class="kr-btn btn-ghost btn-xs"
            @click="confirmArchive = false"
          >
            Keep
          </button>
        </div>
      </div>
    </section>

    <section v-else-if="!slot" class="flex flex-col gap-2">
      <p class="kr-text-black-base">{{ studio.series?.title }}</p>
      <p class="kr-text-dim-xs">
        Pick a character, faction or place on the left to see its subjects and
        notes. Series notes, style and lanes live under Notes.
      </p>
      <button
        type="button"
        class="kr-btn btn-outline btn-sm self-start"
        @click="studio.mode = 'notes'"
      >
        Open series notes
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import type { ComicEntityDto } from '~/types/comicStudio'
import { COMIC_ENTITY_KINDS } from '~/utils/comicStudio'

const studio = useComicStudioStore()
const kinds = COMIC_ENTITY_KINDS
const confirmArchive = ref(false)
const confirmArchiveSlot = ref(false)

const slot = computed(() => studio.selectedSlot)
const entity = computed(
  () =>
    studio.entities.find(
      (item) => item.id === (slot.value?.entityId ?? studio.selectedEntityId),
    ) ?? null,
)

function fromEntity(item: ComicEntityDto | null) {
  return {
    name: item?.name ?? '',
    kind: item?.kind ?? 'character',
    notes: item?.notes ?? '',
    secretUntil: item?.secretUntil ?? '',
  }
}
const draft = reactive(fromEntity(entity.value))
watch(entity, (item) => {
  Object.assign(draft, fromEntity(item))
  confirmArchive.value = false
})
watch(slot, () => {
  confirmArchiveSlot.value = false
})

const dirty = computed(() => {
  const original = fromEntity(entity.value)
  return (Object.keys(original) as Array<keyof typeof original>).some(
    (key) => draft[key] !== original[key],
  )
})
const portraitCandidate = computed(() =>
  slot.value ? studio.slotCover(slot.value.id) : null,
)

function save() {
  if (!entity.value) return
  void studio.saveEntity(entity.value.id, {
    name: draft.name,
    kind: draft.kind,
    notes: draft.notes,
    secretUntil: draft.secretUntil,
  })
}

function usePortrait() {
  if (entity.value && portraitCandidate.value) {
    void studio.saveEntity(entity.value.id, {
      portraitAttemptId: portraitCandidate.value.id,
    })
  }
}

function archiveEntity() {
  if (entity.value)
    void studio.saveEntity(entity.value.id, { isArchived: true })
  confirmArchive.value = false
}

function moveSlot(event: Event) {
  if (!slot.value) return
  const value = (event.target as HTMLSelectElement).value
  void studio.moveSlot(slot.value.id, {
    entityId: value ? Number(value) : null,
  })
}

async function duplicate() {
  if (!slot.value) return
  const copy = await studio.createSlot({
    entityId: slot.value.entityId,
    kind: 'subject',
    copyFromSlotId: slot.value.id,
  })
  if (copy) studio.selectedSlotId = copy.id
}

function archiveSlot() {
  if (slot.value) void studio.saveSlot(slot.value.id, { isArchived: true })
  confirmArchiveSlot.value = false
}
</script>
