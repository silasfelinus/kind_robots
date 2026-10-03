<template>
  <div
    class="relative w-full overflow-hidden rounded-xl bg-neutral"
    :class="
      thumb ? 'aspect-[6.625/10.1875]' : 'aspect-[6.625/10.1875] shadow-lg'
    "
  >
    <div
      v-for="cell in cells"
      :key="cell.index"
      class="absolute"
      :style="cell.style"
      :data-comic-drop-page="page.id"
      :data-comic-drop-cell="cell.index"
      @dragover.prevent="dragOver = cell.index"
      @dragleave="dragOver = null"
      @drop.prevent="onDrop(cell.index)"
    >
      <div
        class="relative h-full w-full overflow-hidden bg-base-100 transition"
        :class="[
          thumb ? 'rounded-sm' : 'rounded-md',
          dragOver === cell.index ? 'ring-4 ring-primary' : '',
          cell.panel && studio.selectedPanelId === cell.panel.id && !thumb
            ? 'ring-4 ring-accent'
            : '',
        ]"
      >
        <button
          v-if="cell.panel"
          type="button"
          :draggable="!thumb"
          class="block h-full w-full"
          :aria-label="cell.slotTitle"
          @click="select(cell.panel.id)"
          @dragstart="studio.beginDrag({ type: 'panel', id: cell.panel.id })"
          @dragend="studio.endDrag()"
        >
          <img
            v-if="cell.art?.fullUrl || cell.art?.thumbUrl"
            :src="
              (thumb ? cell.art?.thumbUrl : cell.art?.fullUrl) ||
              cell.art?.thumbUrl ||
              ''
            "
            :alt="cell.slotTitle"
            class="h-full w-full object-cover"
            :style="{
              objectPosition: `${(cell.panel.focusX ?? 0.5) * 100}% ${(cell.panel.focusY ?? 0.5) * 100}%`,
            }"
            draggable="false"
            loading="lazy"
          />
          <span
            v-else
            class="grid h-full w-full place-items-center p-1 text-center text-[10px] font-semibold opacity-60"
            >{{ thumb ? '' : cell.slotTitle }}</span
          >
        </button>
        <button
          v-else-if="!thumb"
          type="button"
          class="grid h-full w-full place-items-center border-2 border-dashed border-base-300 text-xs opacity-70 hover:opacity-100"
          @click="studio.addPanel(page.id, cell.index)"
        >
          <span class="flex items-center gap-1"
            ><icon name="kind-icon:plus" class="kr-icon-4" /> Panel</span
          >
        </button>
        <div
          v-if="!thumb && cell.panel?.lettering?.length"
          class="pointer-events-none absolute inset-0 flex flex-col justify-between gap-1 p-2"
        >
          <p
            v-for="item in cell.panel.lettering"
            :key="item.id"
            class="max-w-[85%] whitespace-pre-wrap text-xs leading-tight shadow"
            :class="letteringClass(item.kind)"
          >
            {{ item.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import {
  comicPageCells,
  type ComicLayoutPage,
  type ComicLetteringKind,
} from '~/utils/comicLayouts'

const props = defineProps<{ page: ComicLayoutPage; thumb?: boolean }>()
const studio = useComicStudioStore()
const dragOver = ref<number | null>(null)
const gutter = computed(() => (props.thumb ? 0.6 : 0.8))

const cells = computed(() =>
  comicPageCells(props.page).map((cell, index) => {
    const panel = props.page.panels.find((item) => item.cell === index) ?? null
    const g = gutter.value
    return {
      index,
      panel,
      art: panel ? studio.panelArt(panel) : null,
      slotTitle: panel ? (studio.slotById(panel.slotId)?.title ?? 'Panel') : '',
      style: {
        left: `calc(${cell.x * 100}% + ${g}%)`,
        top: `calc(${cell.y * 100}% + ${g}%)`,
        width: `calc(${cell.w * 100}% - ${g * 2}%)`,
        height: `calc(${cell.h * 100}% - ${g * 2}%)`,
      },
    }
  }),
)

function select(panelId: string) {
  studio.selectedPageId = props.page.id
  studio.selectedPanelId = panelId
}

function onDrop(cell: number) {
  dragOver.value = null
  if (props.thumb) return
  studio.dropOnCell(props.page.id, cell)
}

function letteringClass(kind: ComicLetteringKind): string {
  if (kind === 'caption')
    return 'self-start rounded-sm border border-neutral bg-warning/90 px-1.5 py-1 font-serif text-neutral'
  if (kind === 'sfx')
    return 'self-center rotate-[-6deg] text-lg font-black uppercase text-error drop-shadow'
  if (kind === 'thought')
    return 'self-end rounded-[50%] border border-neutral bg-base-100 px-3 py-2 text-base-content'
  return 'self-end rounded-2xl border-2 border-neutral bg-base-100 px-2 py-1 font-semibold text-base-content'
}
</script>
