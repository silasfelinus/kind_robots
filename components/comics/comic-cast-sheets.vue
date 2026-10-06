<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p class="kr-text-eyebrow">Cast</p>
        <p class="kr-text-black-xl">{{ studio.series?.title }}</p>
        <p class="kr-text-dim-sm">
          Model sheets: every locked angle side by side. Click a pose to open it
          full size; an empty angle opens its slot on the board.
        </p>
      </div>
      <span v-if="sheets.length" class="kr-text-dim-xs"
        >{{ lockedCount }} of {{ angleCount }} angles locked</span
      >
    </div>

    <p v-if="!sheets.length" class="kr-note">
      No model sheets yet. Cast sheets come from subject slots named
      <code>cast-&lt;character&gt;-&lt;angle&gt;</code> with a final pick; the
      Conductor importer files them for each locked turnaround.
    </p>

    <article
      v-for="sheet in sheets"
      :key="sheet.key"
      class="rounded-2xl border border-base-300 bg-base-200/60 p-3"
    >
      <header class="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div class="min-w-0">
          <p class="kr-text-eyebrow">{{ entityKind(sheet.entityId) }}</p>
          <p class="text-lg font-black leading-tight">{{ sheet.name }}</p>
        </div>
        <span
          class="badge badge-sm"
          :class="
            locked(sheet.cards) === sheet.cards.length
              ? 'badge-primary'
              : 'badge-ghost'
          "
          >{{ locked(sheet.cards) }}/{{ sheet.cards.length }} locked</span
        >
      </header>
      <p
        v-if="entityNotes(sheet.entityId)"
        class="kr-text-dim-sm mb-3 line-clamp-2"
      >
        {{ entityNotes(sheet.entityId) }}
      </p>

      <div
        class="grid gap-2 grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))]"
      >
        <button
          v-for="card in sheet.cards"
          :key="card.slotId"
          type="button"
          class="group flex flex-col gap-1 text-left"
          :title="cardTitle(card)"
          @click="open(card)"
        >
          <div
            class="relative w-full overflow-hidden rounded-xl border bg-base-100 transition group-hover:border-primary"
            :class="
              art(card) ? 'border-base-300' : 'border-dashed border-base-300'
            "
            :style="{ aspectRatio: aspect(card) }"
          >
            <img
              v-if="art(card)?.thumbUrl"
              :src="art(card)?.thumbUrl ?? undefined"
              :alt="cardTitle(card)"
              class="h-full w-full object-contain"
              :class="card.mirrored ? '-scale-x-100' : ''"
              loading="lazy"
              draggable="false"
            />
            <div v-else class="grid h-full place-items-center p-2 text-center">
              <icon name="kind-icon:image" class="kr-icon-4 opacity-30" />
              <span class="kr-text-dim-xs mt-1">Pick pending</span>
            </div>
            <span
              v-if="card.mirrored && art(card)"
              class="badge badge-xs absolute right-1 top-1 bg-base-100/90"
              title="This angle uses its pick mirrored"
              >mirrored</span
            >
          </div>
          <span class="truncate text-xs font-semibold">{{ card.label }}</span>
        </button>
      </div>

      <div v-if="sheet.extras.length" class="mt-4">
        <p class="kr-text-eyebrow mb-2">Variants</p>
        <div
          class="grid gap-2 grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))]"
        >
          <button
            v-for="card in sheet.extras"
            :key="card.slotId"
            type="button"
            class="group flex flex-col gap-1 text-left"
            :title="cardTitle(card)"
            @click="open(card)"
          >
            <div
              class="relative w-full overflow-hidden rounded-xl border border-base-300 bg-base-100 transition group-hover:border-primary"
              :style="{ aspectRatio: aspect(card) }"
            >
              <img
                v-if="art(card)?.thumbUrl"
                :src="art(card)?.thumbUrl ?? undefined"
                :alt="cardTitle(card)"
                class="h-full w-full object-contain"
                :class="card.mirrored ? '-scale-x-100' : ''"
                loading="lazy"
                draggable="false"
              />
              <div v-else class="grid h-full place-items-center p-2">
                <span class="kr-text-dim-xs">Pick pending</span>
              </div>
            </div>
            <span class="line-clamp-2 text-xs font-semibold">{{
              card.label
            }}</span>
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import { comicRenderAspect, type ComicCastCard } from '~/utils/comicCast'

const studio = useComicStudioStore()

const sheets = computed(() => studio.castSheets)
const angleCount = computed(() =>
  sheets.value.reduce((sum, sheet) => sum + sheet.cards.length, 0),
)
const lockedCount = computed(() =>
  sheets.value.reduce((sum, sheet) => sum + locked(sheet.cards), 0),
)

function locked(cards: ComicCastCard[]) {
  return cards.filter((card) => card.attemptId).length
}

function art(card: ComicCastCard) {
  return studio.attemptFor(card.attemptId)
}

function aspect(card: ComicCastCard) {
  const attempt = art(card)
  return comicRenderAspect(attempt?.width, attempt?.height, '2:3')
}

function entity(entityId: number | null) {
  return studio.entities.find((item) => item.id === entityId) ?? null
}

function entityKind(entityId: number | null) {
  return entity(entityId)?.kind ?? 'character'
}

function entityNotes(entityId: number | null) {
  return entity(entityId)?.notes?.trim() || ''
}

function cardTitle(card: ComicCastCard) {
  return `${card.label}${card.mirrored ? ' (mirrored)' : ''}`
}

function open(card: ComicCastCard) {
  if (card.attemptId) {
    studio.lightboxAttemptId = card.attemptId
    return
  }
  studio.selectedSlotId = card.slotId
  studio.mode = 'board'
}
</script>
