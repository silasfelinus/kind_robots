<!-- /components/coloring/coloring-book-manager.vue -->
<template>
  <section class="flex flex-col gap-4">
    <template v-if="!openDefinition">
      <header
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <div class="flex flex-col gap-1">
          <h2
            class="flex items-center gap-2 text-base font-black text-base-content"
          >
            <Icon name="kind-icon:paintbrush" class="h-5 w-5 text-primary" />
            Coloring Book
          </h2>
          <p class="text-sm text-base-content/70">
            Pick a page and start coloring. Your work saves itself — walk away
            mid-masterpiece with total confidence.
          </p>
        </div>
        <span v-if="loadError" class="text-sm font-semibold text-error">
          {{ loadError }}
        </span>
      </header>

      <div v-for="set in sets" :key="set.slug" class="flex flex-col gap-2">
        <div class="flex items-baseline gap-2">
          <h3 class="text-sm font-black text-base-content">{{ set.title }}</h3>
          <span class="badge badge-ghost badge-sm">
            {{ set.pages.length }} pages
          </span>
          <span
            v-if="set.access?.tier === 'free'"
            class="badge badge-success badge-sm"
          >
            Free
          </span>
        </div>
        <p v-if="set.description" class="text-xs text-base-content/60">
          {{ set.description }}
        </p>

        <div
          class="grid gap-3"
          style="
            grid-template-columns: repeat(
              auto-fill,
              minmax(min(200px, 100%), 1fr)
            );
          "
        >
          <button
            v-for="pageRef in set.pages"
            :key="pageRef.id"
            type="button"
            class="group flex flex-col gap-2 rounded-2xl border-2 border-base-300 bg-base-100 p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm"
            @click="openPage(set, pageRef)"
          >
            <div
              class="flex aspect-[17/22] items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-white"
            >
              <img
                v-if="pageRef.thumb"
                :src="pageRef.thumb"
                :alt="pageRef.title"
                class="h-full w-full object-cover"
              />
              <Icon
                v-else
                name="kind-icon:image"
                class="h-10 w-10 text-base-content/15"
              />
            </div>
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-sm font-bold text-base-content group-hover:text-primary"
              >
                {{ pageRef.title }}
              </span>
              <span
                v-if="isInProgress(set.slug, pageRef.id)"
                class="badge badge-primary badge-sm"
              >
                In progress
              </span>
            </div>
          </button>
        </div>
      </div>

      <div
        v-if="!sets.length && !loadError"
        class="flex min-h-28 items-center justify-center rounded-2xl border border-base-300 bg-base-200/60"
      >
        <span class="loading loading-spinner loading-md text-primary" />
      </div>
    </template>

    <template v-else>
      <header
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            @click="closePage"
          >
            <Icon name="mdi:arrow-left" class="h-4 w-4" />
            Library
          </button>
          <h2 class="text-sm font-black text-base-content">
            {{ openDefinition.title }}
          </h2>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            title="Undo last fill"
            @click="coloringStore.undo()"
          >
            <Icon name="mdi:undo" class="h-4 w-4" />
            Undo
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            title="Clear all fills"
            @click="coloringStore.resetPage()"
          >
            <Icon name="mdi:restore" class="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            title="Download your colored page as a PNG image"
            :disabled="isExporting"
            @click="saveImage"
          >
            <span
              v-if="isExporting"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:image" class="h-4 w-4" />
            Save image
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            title="Download your color assignments as JSON"
            @click="downloadAssignments"
          >
            <Icon name="mdi:download" class="h-4 w-4" />
            Save file
          </button>
        </div>
      </header>

      <div
        class="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]"
      >
        <coloring-canvas
          ref="canvasRef"
          :page="openDefinition"
          :fills="coloringStore.currentPage?.fills ?? {}"
          :fill-ops="coloringStore.currentPage?.fillOps ?? []"
          :palette-resolver="coloringStore.resolveColorValue"
          @region-click="onRegionClick"
          @fill-request="onFillRequest"
        />

        <aside
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <p
            class="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-base-content/60"
          >
            <Icon name="kind-icon:palette" class="h-3.5 w-3.5" />
            Palette
          </p>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in coloringStore.currentPalette"
              :key="color.id"
              type="button"
              class="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
              :class="
                coloringStore.currentPage?.activeColorId === color.id
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-base-300'
              "
              :style="{ backgroundColor: color.value }"
              :title="color.name"
              @click="coloringStore.setActiveColor(color.id)"
            />
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-base-300 text-base-content/50 transition-colors hover:border-primary hover:text-primary"
              title="Paint blank (eraser)"
              @click="coloringStore.setActiveColor(BLANK_COLOR_ID)"
            >
              <Icon name="mdi:eraser" class="h-4 w-4" />
            </button>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="newColorValue"
              type="color"
              class="h-9 w-12 cursor-pointer rounded-lg border border-base-300 bg-base-100"
              title="Pick a custom color"
            />
            <button
              type="button"
              class="btn btn-outline btn-sm flex-1 rounded-2xl"
              @click="addCustomColor"
            >
              <Icon name="mdi:plus" class="h-4 w-4" />
              Add color
            </button>
          </div>

          <div
            v-if="groupNames.length"
            class="flex flex-col gap-1.5 border-t border-base-300 pt-3"
          >
            <p
              class="text-xs font-black uppercase tracking-wide text-base-content/60"
            >
              Fill a whole group
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="group in groupNames"
                :key="group"
                type="button"
                class="badge badge-ghost cursor-pointer border-base-300 hover:border-primary/40 hover:text-primary"
                @click="coloringStore.paintGroup(group)"
              >
                {{ group }}
              </button>
            </div>
          </div>

          <p class="mt-auto text-xs text-base-content/40">
            Tap a region to fill it with the selected color. Everything saves
            locally as you go.
          </p>
        </aside>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useColoringStore } from '@/stores/coloringStore'
import { BLANK_COLOR_ID } from '@/stores/helpers/coloring'
import { downloadPageBlob } from '@/stores/helpers/coloringExport'
import type {
  ColoringPageDefinition,
  ColoringSetManifest,
  ColoringSetPageRef,
} from '@/stores/helpers/coloring'

// Sets are discovered from data/coloring-book/sets/index.json so new sets
// (coloring-book t-006/t-007 and beyond) can ship without a code change.
// Falls back to the sampler alone if the index is missing or malformed.
const FALLBACK_SET_SLUGS = ['sampler']
const DATA_BASE = '/data/coloring-book/sets'

const coloringStore = useColoringStore()

const sets = ref<ColoringSetManifest[]>([])
const loadError = ref('')
const openDefinition = ref<ColoringPageDefinition | null>(null)
const newColorValue = ref('#e05c5c')
const canvasRef = ref<{ exportImage: () => Promise<Blob> } | null>(null)
const isExporting = ref(false)

const groupNames = computed<string[]>(() => {
  const regions = openDefinition.value?.regions ?? []
  return [
    ...new Set(
      regions
        .map((region) => region.group)
        .filter((group): group is string => !!group),
    ),
  ]
})

function isInProgress(setSlug: string, pageId: string): boolean {
  return coloringStore.inProgressPageIds.includes(`${setSlug}/${pageId}`)
}

async function loadSetSlugs(): Promise<string[]> {
  try {
    const index = await $fetch<{ sets: string[] }>(`${DATA_BASE}/index.json`)
    return Array.isArray(index?.sets) && index.sets.length
      ? index.sets
      : FALLBACK_SET_SLUGS
  } catch {
    return FALLBACK_SET_SLUGS
  }
}

async function loadSets() {
  loadError.value = ''

  try {
    const slugs = await loadSetSlugs()
    const loaded = await Promise.all(
      slugs.map((slug) =>
        $fetch<ColoringSetManifest>(`${DATA_BASE}/${slug}/manifest.json`),
      ),
    )

    sets.value = loaded
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'Failed to load coloring sets.'
  }
}

async function openPage(set: ColoringSetManifest, pageRef: ColoringSetPageRef) {
  loadError.value = ''

  try {
    const definition = await $fetch<ColoringPageDefinition>(
      `${DATA_BASE}/${set.slug}/${pageRef.file}`,
    )

    coloringStore.openPage(definition)
    openDefinition.value = definition
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'Failed to load the page.'
  }
}

function closePage() {
  coloringStore.closePage()
  openDefinition.value = null
}

function onRegionClick(regionId: string) {
  coloringStore.paintRegion(regionId)
}

function onFillRequest(coords: { x: number; y: number }) {
  coloringStore.applyFillOp(coords.x, coords.y)
}

function addCustomColor() {
  coloringStore.addColor('My Color', newColorValue.value)
}

async function saveImage() {
  if (!canvasRef.value || isExporting.value) return

  isExporting.value = true

  try {
    const blob = await canvasRef.value.exportImage()
    downloadPageBlob(blob, openDefinition.value?.id ?? 'coloring')
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'Image export failed.'
  } finally {
    isExporting.value = false
  }
}

function downloadAssignments() {
  const json = coloringStore.exportAssignments()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${openDefinition.value?.id.replace('/', '-') ?? 'coloring'}-colors.json`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  void loadSets()
})
</script>
