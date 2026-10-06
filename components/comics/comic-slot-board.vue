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

      <section
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <p
          v-if="groups.length > 1"
          class="kr-text-eyebrow flex items-center gap-2"
        >
          {{ group.title }}
          <span class="badge badge-ghost badge-xs">{{
            group.cards.length
          }}</span>
        </p>
        <div
          class="grid items-start gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))]"
        >
          <button
            v-for="card in group.cards"
            :key="card.slot.id"
            type="button"
            draggable="true"
            class="group overflow-hidden rounded-2xl border bg-base-200 text-left transition hover:border-primary"
            :class="
              card.cover?.verdict === 'selected'
                ? 'border-primary'
                : 'border-base-300'
            "
            @click="studio.selectedSlotId = card.slot.id"
            @dragstart="studio.beginDrag({ type: 'slot', id: card.slot.id })"
            @dragend="studio.endDrag()"
          >
            <div
              class="relative bg-base-300"
              :style="{ aspectRatio: card.aspect }"
            >
              <img
                v-if="card.cover?.thumbUrl"
                :src="card.cover.thumbUrl"
                :alt="card.slot.title"
                class="h-full w-full object-contain"
                loading="lazy"
                draggable="false"
              />
              <span
                v-if="card.cover?.verdict === 'selected'"
                class="badge badge-primary badge-xs absolute left-1 top-1"
                >Final</span
              >
              <div v-else class="grid h-full place-items-center">
                <icon name="kind-icon:image" class="kr-icon-4 opacity-30" />
              </div>
            </div>
            <div class="space-y-1 p-2">
              <p class="truncate text-sm font-semibold">
                {{ card.slot.title }}
              </p>
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
      </section>
      <p v-if="!cards.length" class="kr-note">
        Nothing here yet. Add a subject to start rendering lanes side by side.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import { comicRenderAspect } from '~/utils/comicCast'

const studio = useComicStudioStore()

const cards = computed(() => {
  const list = studio.selectedEntity
    ? (studio.slotsByEntity.get(studio.selectedEntity.id) ?? [])
    : studio.subjectSlots
  return list.map((slot) => {
    const attempts = studio.attemptsFor(slot.id)
    const cover = studio.slotCover(slot.id)
    return {
      slot,
      cover,
      aspect: comicRenderAspect(cover?.width, cover?.height, slot.aspect),
      count: attempts.length,
      liked: attempts.filter(
        (attempt) =>
          attempt.verdict === 'liked' || attempt.verdict === 'selected',
      ).length,
    }
  })
})

const groups = computed(() => {
  if (studio.selectedEntity || !cards.value.length)
    return [{ key: 'all', title: '', cards: cards.value }]
  const byEntity = new Map<number | null, typeof cards.value>()
  for (const card of cards.value) {
    const list = byEntity.get(card.slot.entityId) ?? []
    list.push(card)
    byEntity.set(card.slot.entityId, list)
  }
  const order = new Map(
    studio.entities.map((entity, index) => [entity.id, index]),
  )
  return [...byEntity.entries()]
    .sort(
      ([a], [b]) =>
        (a === null ? 1e9 : (order.get(a) ?? 1e8)) -
        (b === null ? 1e9 : (order.get(b) ?? 1e8)),
    )
    .map(([entityId, list]) => ({
      key: String(entityId),
      title:
        studio.entities.find((entity) => entity.id === entityId)?.name ??
        'Unfiled',
      cards: list,
    }))
})

async function addSlot() {
  const entity = studio.selectedEntity
  if (!entity) return
  const slot = await studio.createSlot({ entityId: entity.id, kind: 'subject' })
  if (slot) studio.selectedSlotId = slot.id
}
</script>
