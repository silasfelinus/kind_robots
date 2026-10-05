<template>
  <div class="flex flex-col gap-4">
    <comic-slot-workbench
      v-if="studio.selectedSlot"
      :key="studio.selectedSlot.id"
      :subject="studio.selectedSlot"
    />

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="kr-text-eyebrow">
            {{ studio.selectedEntity ? studio.selectedEntity.kind : 'Series' }}
          </p>
          <p class="kr-text-black-xl">
            {{ studio.selectedEntity?.name ?? studio.series?.title }}
          </p>
        </div>
        <button
          v-if="studio.selectedEntity"
          type="button"
          class="kr-btn btn-primary btn-sm"
          @click="addSlot"
        >
          <icon name="kind-icon:plus" class="kr-icon-4" /> Add a subject
        </button>
      </div>

      <div
        v-if="cards.length"
        class="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))]"
      >
        <button
          v-for="card in cards"
          :key="card.slot.id"
          type="button"
          draggable="true"
          class="group overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition hover:border-primary"
          @click="studio.selectedSlotId = card.slot.id"
          @dragstart="studio.beginDrag({ type: 'slot', id: card.slot.id })"
          @dragend="studio.endDrag()"
        >
          <div class="aspect-[4/3] bg-base-300">
            <img
              v-if="card.cover?.thumbUrl"
              :src="card.cover.thumbUrl"
              :alt="card.slot.title"
              class="h-full w-full object-cover"
              loading="lazy"
              draggable="false"
            />
            <div v-else class="grid h-full place-items-center">
              <icon name="kind-icon:image" class="kr-icon-4 opacity-30" />
            </div>
          </div>
          <div class="space-y-1 p-2">
            <p class="truncate text-sm font-semibold">{{ card.slot.title }}</p>
            <p class="kr-text-dim-xs">
              {{ card.count }} render{{ card.count === 1 ? '' : 's'
              }}<span v-if="card.liked"> · {{ card.liked }} liked</span>
            </p>
            <span
              v-if="card.slot.status !== 'open'"
              class="badge badge-xs"
              :class="
                card.slot.status === 'rejected'
                  ? 'badge-error'
                  : 'badge-primary'
              "
              >{{ card.slot.status }}</span
            >
          </div>
        </button>
      </div>
      <p v-else class="kr-note">
        Nothing here yet. Add a subject to start rendering lanes side by side.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'

const studio = useComicStudioStore()

const cards = computed(() => {
  const list = studio.selectedEntity
    ? (studio.slotsByEntity.get(studio.selectedEntity.id) ?? [])
    : studio.subjectSlots
  return list.map((slot) => {
    const attempts = studio.attemptsFor(slot.id)
    return {
      slot,
      cover: studio.slotCover(slot.id),
      count: attempts.length,
      liked: attempts.filter(
        (attempt) =>
          attempt.verdict === 'liked' || attempt.verdict === 'selected',
      ).length,
    }
  })
})

async function addSlot() {
  const entity = studio.selectedEntity
  if (!entity) return
  const slot = await studio.createSlot({ entityId: entity.id, kind: 'subject' })
  if (slot) studio.selectedSlotId = slot.id
}
</script>
