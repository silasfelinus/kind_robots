<template>
  <div v-if="panel && page" class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <p class="kr-text-black-base">Panel</p>
      <span class="kr-text-dim-xs">{{
        panel.cell === null ? 'off the page' : `cell ${panel.cell + 1}`
      }}</span>
    </div>

    <div
      class="overflow-hidden rounded-2xl bg-base-300"
      :class="art?.thumbUrl ? '' : 'grid aspect-[4/3] place-items-center'"
    >
      <img
        v-if="art?.thumbUrl"
        :src="art.thumbUrl"
        alt="Panel art"
        class="w-full object-cover"
      />
      <p v-else class="kr-text-dim-xs p-4 text-center">
        Drag a render here from the shelf, or render this panel's prompt below.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        v-if="panel.artAttemptId"
        type="button"
        class="kr-btn btn-ghost btn-xs"
        @click="studio.assignArt(panel.id, null)"
      >
        Use the slot's pick
      </button>
      <label class="flex flex-1 flex-col text-xs"
        >Focus left-right
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="panel.focusX ?? 0.5"
          class="range range-xs"
          @change="setFocus('x', $event)"
        />
      </label>
      <label class="flex flex-1 flex-col text-xs"
        >Focus top-bottom
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="panel.focusY ?? 0.5"
          class="range range-xs"
          @change="setFocus('y', $event)"
        />
      </label>
    </div>

    <section class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-1">
        <p class="kr-text-dim-xs mr-auto">Lettering</p>
        <button
          v-for="kind in letteringKinds"
          :key="kind"
          type="button"
          class="kr-btn btn-ghost btn-xs"
          @click="addLettering(kind)"
        >
          + {{ kind }}
        </button>
      </div>
      <div
        v-for="item in lettering"
        :key="item.id"
        class="flex items-start gap-2"
      >
        <span class="badge badge-sm mt-1">{{ item.kind }}</span>
        <textarea
          :value="item.text"
          class="kr-textarea min-h-10 flex-1 text-sm"
          :aria-label="`${item.kind} text`"
          @change="setLetteringText(item.id, $event)"
        />
        <button
          type="button"
          class="kr-btn btn-ghost btn-xs"
          title="Remove"
          @click="removeLettering(item.id)"
        >
          <icon name="kind-icon:close" class="kr-icon-4" />
        </button>
      </div>
    </section>

    <section class="flex flex-wrap gap-2">
      <button
        v-if="panel.cell !== null"
        type="button"
        class="kr-btn btn-outline btn-xs"
        @click="studio.splitCell(page.id, panel.cell, 'vertical')"
      >
        <icon name="kind-icon:scissors" class="kr-icon-4" /> Split side by side
      </button>
      <button
        v-if="panel.cell !== null"
        type="button"
        class="kr-btn btn-outline btn-xs"
        @click="studio.splitCell(page.id, panel.cell, 'horizontal')"
      >
        <icon name="kind-icon:scissors" class="kr-icon-4" /> Split top and
        bottom
      </button>
      <button
        v-if="mergeTarget !== null && panel.cell !== null"
        type="button"
        class="kr-btn btn-outline btn-xs"
        @click="studio.mergeCells(page.id, panel.cell, mergeTarget)"
      >
        <icon name="kind-icon:combine" class="kr-icon-4" /> Merge with neighbour
      </button>
      <select
        class="kr-select-sm"
        aria-label="Move to page"
        :value="page.id"
        @change="moveTo"
      >
        <option v-for="(item, index) in pages" :key="item.id" :value="item.id">
          Page {{ index + 1 }}
        </option>
      </select>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs text-error"
        @click="studio.removePanel(panel.id)"
      >
        <icon name="kind-icon:trash" class="kr-icon-4" /> Delete panel
      </button>
    </section>

    <details v-if="slot" class="rounded-2xl border border-base-300 p-2" open>
      <summary class="cursor-pointer text-sm font-semibold">
        Panel prompt and renders
      </summary>
      <div class="mt-2">
        <comic-slot-workbench :key="slot.id" :subject="slot" compact />
      </div>
    </details>
  </div>
  <div v-else class="grid min-h-40 place-items-center text-center">
    <p class="kr-text-dim-sm">
      Pick a panel on the page to edit its art, lettering and prompt.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import {
  COMIC_LETTERING_KINDS,
  COMIC_MAX_LETTERING,
  comicLayoutId,
  comicMergeableNeighbor,
  type ComicLettering,
  type ComicLetteringKind,
} from '~/utils/comicLayouts'

const studio = useComicStudioStore()
const letteringKinds = COMIC_LETTERING_KINDS

const page = computed(() => studio.selectedPage)
const panel = computed(() => studio.selectedPanel)
const pages = computed(() => studio.selectedIssue?.layout.pages ?? [])
const slot = computed(() => studio.slotById(panel.value?.slotId))
const art = computed(() => (panel.value ? studio.panelArt(panel.value) : null))
const lettering = computed<ComicLettering[]>(() => panel.value?.lettering ?? [])
const mergeTarget = computed(() =>
  page.value && panel.value?.cell !== null && panel.value?.cell !== undefined
    ? comicMergeableNeighbor(page.value, panel.value.cell)
    : null,
)

function setFocus(axis: 'x' | 'y', event: Event) {
  if (!panel.value) return
  const value = Number((event.target as HTMLInputElement).value)
  studio.updatePanelFocus(
    panel.value.id,
    axis === 'x' ? value : (panel.value.focusX ?? 0.5),
    axis === 'y' ? value : (panel.value.focusY ?? 0.5),
  )
}

function addLettering(kind: ComicLetteringKind) {
  if (!panel.value || lettering.value.length >= COMIC_MAX_LETTERING) return
  studio.updateLettering(panel.value.id, [
    ...lettering.value,
    { id: comicLayoutId('l'), kind, text: '' },
  ])
}

function setLetteringText(id: string, event: Event) {
  if (!panel.value) return
  const text = (event.target as HTMLTextAreaElement).value
  studio.updateLettering(
    panel.value.id,
    lettering.value.map((item) => (item.id === id ? { ...item, text } : item)),
  )
}

function removeLettering(id: string) {
  if (!panel.value) return
  studio.updateLettering(
    panel.value.id,
    lettering.value.filter((item) => item.id !== id),
  )
}

function moveTo(event: Event) {
  const target = (event.target as HTMLSelectElement).value
  if (panel.value && target && target !== page.value?.id) {
    studio.movePanel(panel.value.id, target, null)
    studio.selectedPageId = target
  }
}
</script>
