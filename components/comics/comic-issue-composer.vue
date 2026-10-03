<template>
  <div class="flex flex-col gap-3">
    <div class="kr-toolbar flex-wrap gap-2">
      <select
        :value="issue?.id ?? ''"
        class="kr-select-sm"
        aria-label="Issue"
        @change="onIssueChange"
      >
        <option v-for="item in studio.issues" :key="item.id" :value="item.id">
          #{{ item.number }} {{ item.title }}
        </option>
      </select>
      <button
        type="button"
        class="kr-btn btn-ghost btn-sm"
        @click="studio.createIssue()"
      >
        <icon name="kind-icon:plus" class="kr-icon-4" /> Issue
      </button>
      <select
        v-model="newPageLayout"
        class="kr-select-sm"
        aria-label="Layout for the new page"
      >
        <option
          v-for="template in layouts"
          :key="template.key"
          :value="template.key"
        >
          {{ template.label }}
        </option>
      </select>
      <button
        type="button"
        class="kr-btn btn-primary btn-sm"
        :disabled="!issue"
        @click="studio.addPage(newPageLayout)"
      >
        <icon name="kind-icon:plus" class="kr-icon-4" /> Page
      </button>
      <button
        type="button"
        class="kr-btn btn-ghost btn-sm"
        :disabled="!studio.canUndo"
        @click="studio.undoLayout()"
      >
        <icon name="kind-icon:undo" class="kr-icon-4" /> Undo
      </button>
      <span class="kr-text-dim-xs ml-auto">{{ saveLabel }}</span>
    </div>

    <div
      v-if="issue && issue.layout.pages.length"
      class="flex gap-2 overflow-x-auto pb-2"
    >
      <div
        v-for="(pageItem, index) in issue.layout.pages"
        :key="pageItem.id"
        class="w-20 shrink-0"
        @dragover.prevent
        @drop.prevent="studio.dropOnPage(pageItem.id)"
      >
        <button
          type="button"
          draggable="true"
          class="block w-full rounded-xl border-2 p-0.5 transition"
          :class="
            studio.selectedPage?.id === pageItem.id
              ? 'border-primary'
              : 'border-transparent hover:border-base-300'
          "
          :aria-label="`Page ${index + 1}`"
          @click="selectPage(pageItem.id)"
          @dragstart="studio.beginDrag({ type: 'page', id: pageItem.id })"
          @dragend="studio.endDrag()"
        >
          <comic-page-canvas :page="pageItem" thumb />
        </button>
        <div class="mt-1 flex items-center justify-between">
          <button
            v-if="index > 0"
            type="button"
            class="kr-btn btn-ghost btn-xs"
            title="Move earlier"
            @click="studio.movePage(pageItem.id, index - 1)"
          >
            <icon name="kind-icon:arrow-left" class="kr-icon-4" />
          </button>
          <span class="text-[10px] font-semibold">{{ index + 1 }}</span>
          <button
            v-if="index < issue.layout.pages.length - 1"
            type="button"
            class="kr-btn btn-ghost btn-xs"
            title="Move later"
            @click="studio.movePage(pageItem.id, index + 1)"
          >
            <icon name="kind-icon:arrow-right" class="kr-icon-4" />
          </button>
        </div>
      </div>
    </div>

    <template v-if="page">
      <div class="flex flex-wrap items-center gap-2">
        <p class="kr-text-black-base">Page {{ pageNumber }}</p>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="template in layouts"
            :key="template.key"
            type="button"
            class="kr-btn btn-xs"
            :class="
              page.layoutKey === template.key ? 'btn-primary' : 'btn-ghost'
            "
            @click="studio.setPageLayout(page.id, template.key)"
          >
            {{ template.label }}
          </button>
        </div>
        <button
          type="button"
          class="kr-btn btn-ghost btn-xs ml-auto text-error"
          @click="confirmRemove = true"
        >
          <icon name="kind-icon:trash" class="kr-icon-4" /> Remove page
        </button>
      </div>
      <div
        v-if="confirmRemove"
        class="kr-note kr-note-warning flex flex-wrap items-center justify-between gap-2"
      >
        <span
          >Remove page {{ pageNumber }}? Its panel subjects stay on the
          board.</span
        >
        <div class="flex gap-2">
          <button
            type="button"
            class="kr-btn btn-error btn-sm"
            @click="removePage"
          >
            Remove
          </button>
          <button
            type="button"
            class="kr-btn btn-ghost btn-sm"
            @click="confirmRemove = false"
          >
            Keep
          </button>
        </div>
      </div>
      <div class="mx-auto w-full max-w-xl">
        <comic-page-canvas :page="page" />
      </div>
      <section
        v-if="overflow.length"
        class="rounded-2xl border border-dashed border-warning p-2"
        @dragover.prevent
        @drop.prevent="studio.dropOnPage(page.id)"
      >
        <p class="kr-text-dim-xs mb-2">
          Off the page: these panels did not fit the current layout. Drag one
          onto a cell.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="panel in overflow"
            :key="panel.id"
            type="button"
            draggable="true"
            class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-200 p-1 pr-2 text-xs"
            @click="studio.selectedPanelId = panel.id"
            @dragstart="studio.beginDrag({ type: 'panel', id: panel.id })"
            @dragend="studio.endDrag()"
          >
            <img
              v-if="studio.panelArt(panel)?.thumbUrl"
              :src="studio.panelArt(panel)!.thumbUrl!"
              alt=""
              class="h-10 w-10 rounded-lg object-cover"
              draggable="false"
            />
            {{ studio.slotById(panel.slotId)?.title ?? 'Panel' }}
          </button>
        </div>
      </section>
    </template>
    <p v-else-if="issue" class="kr-note">
      This issue has no pages yet. Pick a layout and add one.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import { COMIC_LAYOUTS } from '~/utils/comicLayouts'

const studio = useComicStudioStore()
const layouts = COMIC_LAYOUTS
const newPageLayout = ref('three-tier')
const confirmRemove = ref(false)

const issue = computed(() => studio.selectedIssue)
const page = computed(() => studio.selectedPage)
const pageNumber = computed(
  () =>
    (issue.value?.layout.pages.findIndex(
      (item) => item.id === page.value?.id,
    ) ?? -1) + 1,
)
const overflow = computed(
  () => page.value?.panels.filter((panel) => panel.cell === null) ?? [],
)
const saveLabel = computed(
  () =>
    ({
      idle: 'Saved',
      pending: 'Unsaved changes',
      saving: 'Saving...',
      error: 'Save failed',
    })[studio.layoutSaveState],
)

function onIssueChange(event: Event) {
  studio.selectedIssueId =
    Number((event.target as HTMLSelectElement).value) || null
  studio.selectedPageId = null
  studio.selectedPanelId = null
}

function selectPage(pageId: string) {
  studio.selectedPageId = pageId
  studio.selectedPanelId = null
  confirmRemove.value = false
}

function removePage() {
  if (page.value) studio.removePage(page.value.id)
  confirmRemove.value = false
}
</script>
