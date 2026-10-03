<template>
  <div class="flex flex-col gap-3">
    <template v-if="studio.mode !== 'composer'">
      <button
        type="button"
        class="rounded-2xl border p-2 text-left text-sm font-semibold transition"
        :class="
          !studio.selectedEntityId && !studio.selectedSlotId
            ? 'border-primary bg-primary/10'
            : 'border-base-300 hover:border-primary'
        "
        @click="selectEntity(null)"
      >
        Everything
      </button>

      <div
        v-for="(entity, index) in studio.entities"
        :key="entity.id"
        class="rounded-2xl border border-base-300 bg-base-200"
      >
        <div class="flex items-center gap-2 p-2">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 text-left"
            @click="selectEntity(entity.id)"
          >
            <div
              class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-base-300"
            >
              <img
                v-if="portrait(entity.id, entity.portraitAttemptId)"
                :src="portrait(entity.id, entity.portraitAttemptId)!"
                :alt="entity.name"
                class="h-full w-full object-cover"
                draggable="false"
              />
            </div>
            <div class="min-w-0">
              <p
                class="truncate text-sm font-semibold"
                :class="{
                  'text-primary': studio.selectedEntityId === entity.id,
                }"
              >
                {{ entity.name }}
              </p>
              <p class="kr-text-dim-xs truncate">
                {{ entity.kind
                }}<span v-if="entity.secretUntil"> · secret</span>
              </p>
            </div>
          </button>
          <div class="flex flex-col">
            <button
              v-if="index > 0"
              type="button"
              class="kr-btn btn-ghost btn-xs"
              title="Move up"
              @click="studio.moveEntity(entity.id, -1)"
            >
              <icon name="kind-icon:arrow-up" class="kr-icon-4" />
            </button>
            <button
              v-if="index < studio.entities.length - 1"
              type="button"
              class="kr-btn btn-ghost btn-xs"
              title="Move down"
              @click="studio.moveEntity(entity.id, 1)"
            >
              <icon name="kind-icon:arrow-up" class="kr-icon-4 rotate-180" />
            </button>
          </div>
        </div>
        <ul
          v-if="studio.selectedEntityId === entity.id"
          class="space-y-1 border-t border-base-300 p-2"
        >
          <li
            v-for="(slot, slotIndex) in slotsOf(entity.id)"
            :key="slot.id"
            class="flex items-center gap-1"
          >
            <button
              type="button"
              class="min-w-0 flex-1 truncate rounded-xl px-2 py-1 text-left text-xs"
              :class="
                studio.selectedSlotId === slot.id
                  ? 'bg-primary/15 font-semibold text-primary'
                  : 'hover:bg-base-300'
              "
              @click="studio.selectedSlotId = slot.id"
            >
              {{ slot.title }}
            </button>
            <button
              v-if="slotIndex > 0"
              type="button"
              class="kr-btn btn-ghost btn-xs"
              title="Move up"
              @click="studio.moveSlot(slot.id, { delta: -1 })"
            >
              <icon name="kind-icon:arrow-up" class="kr-icon-4" />
            </button>
          </li>
        </ul>
      </div>

      <div
        v-if="unfiled.length"
        class="rounded-2xl border border-dashed border-base-300 p-2"
      >
        <p class="kr-text-dim-xs mb-1">Unfiled subjects</p>
        <button
          v-for="slot in unfiled"
          :key="slot.id"
          type="button"
          class="block w-full truncate rounded-xl px-2 py-1 text-left text-xs hover:bg-base-300"
          @click="studio.selectedSlotId = slot.id"
        >
          {{ slot.title }}
        </button>
      </div>

      <form class="flex gap-2" @submit.prevent="addEntity">
        <input
          v-model="newEntityName"
          class="kr-input-sm min-w-0 flex-1"
          placeholder="New character, faction..."
          aria-label="New entity name"
        />
        <select
          v-model="newEntityKind"
          class="kr-select-sm"
          aria-label="Entity kind"
        >
          <option v-for="kind in kinds" :key="kind" :value="kind">
            {{ kind }}
          </option>
        </select>
        <button
          type="submit"
          class="kr-btn btn-outline btn-sm"
          :disabled="!newEntityName.trim()"
        >
          <icon name="kind-icon:plus" class="kr-icon-4" />
        </button>
      </form>
    </template>

    <template v-else>
      <p class="kr-text-black-base">Art shelf</p>
      <p class="kr-text-dim-xs">
        Drag a render onto a panel, or onto an empty cell to start a panel from
        it. Finals first, then likes.
      </p>
      <select
        v-model="shelfEntity"
        class="kr-select-sm"
        aria-label="Filter shelf"
      >
        <option :value="null">Every subject</option>
        <option
          v-for="entity in studio.entities"
          :key="entity.id"
          :value="entity.id"
        >
          {{ entity.name }}
        </option>
      </select>
      <div class="grid gap-2 grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
        <comic-attempt-tile
          v-for="attempt in shelf"
          :key="attempt.id"
          :attempt="attempt"
          compact
        />
      </div>
      <p v-if="!shelf.length" class="kr-note">
        Like or pick renders on the board and they appear here.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import { COMIC_ENTITY_KINDS } from '~/utils/comicStudio'

const studio = useComicStudioStore()
const kinds = COMIC_ENTITY_KINDS
const newEntityName = ref('')
const newEntityKind = ref<string>('character')
const shelfEntity = ref<number | null>(null)

const unfiled = computed(() => studio.slotsByEntity.get(null) ?? [])
const shelf = computed(() =>
  studio.artShelf
    .filter((attempt) => {
      if (!shelfEntity.value) return true
      return studio.slotById(attempt.slotId)?.entityId === shelfEntity.value
    })
    .slice(0, 120),
)

function slotsOf(entityId: number) {
  return studio.slotsByEntity.get(entityId) ?? []
}

function portrait(
  entityId: number,
  portraitAttemptId: number | null,
): string | null {
  const chosen = studio.attemptFor(portraitAttemptId)
  if (chosen?.thumbUrl) return chosen.thumbUrl
  for (const slot of slotsOf(entityId)) {
    const cover = studio.slotCover(slot.id)
    if (cover?.thumbUrl) return cover.thumbUrl
  }
  return null
}

function selectEntity(id: number | null) {
  studio.selectedEntityId = id
  studio.selectedSlotId = null
}

async function addEntity() {
  const name = newEntityName.value.trim()
  if (!name) return
  const entity = await studio.createEntity(name, newEntityKind.value)
  if (entity) {
    newEntityName.value = ''
    studio.selectedSlotId = null
  }
}
</script>
