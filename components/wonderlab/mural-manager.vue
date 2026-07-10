<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4">
      <div
        class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-primary/10"
          >
            <Icon name="kind-icon:paintbrush" class="h-8 w-8 text-primary" />
          </div>

          <div class="min-w-0">
            <h1 class="text-2xl font-black text-primary">Mural Color Studio</h1>

            <p class="mt-1 max-w-3xl text-sm text-base-content/65">
              Color the mural plan by section, fill whole groups with one saved
              color, then override the exact shapes that need their own paint.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            class="btn btn-sm btn-ghost rounded-xl"
            type="button"
            @click="coloringStore.undo()"
          >
            <Icon name="mdi:undo" class="h-4 w-4" />
            Undo
          </button>

          <button
            class="btn btn-sm btn-ghost rounded-xl"
            type="button"
            @click="coloringStore.resetPage()"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            Reset
          </button>

          <button
            class="btn btn-sm btn-ghost rounded-xl"
            type="button"
            title="Download the colored mural plan as a PNG image"
            :disabled="isExporting || !pageDefinition"
            @click="saveImage"
          >
            <span
              v-if="isExporting"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:image" class="h-4 w-4" />
            Save image
          </button>

          <div
            class="rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-sm"
          >
            <span class="font-bold text-base-content/60">Active:</span>
            <span class="ml-2 font-black text-primary">
              {{ activeColor?.name || 'None' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="!pageDefinition"
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <section
      v-else
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)_minmax(280px,360px)]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-4">
          <h2 class="text-lg font-black">Saved Colors</h2>
          <p class="mt-1 text-sm text-base-content/60">
            Pick one, then click a section or flood a group.
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <div class="grid gap-2">
            <div
              v-for="color in coloringStore.currentPalette"
              :key="color.id"
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border p-2 transition"
              :class="
                activeColorId === color.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-base-300 bg-base-200'
              "
            >
              <button
                class="flex min-w-0 items-center gap-3 rounded-xl p-1 text-left hover:bg-base-100/60"
                type="button"
                @click="coloringStore.setActiveColor(color.id)"
              >
                <span
                  class="h-8 w-8 shrink-0 rounded-xl border border-base-300 shadow-inner"
                  :style="{ backgroundColor: color.value }"
                />
                <span class="min-w-0">
                  <span class="block truncate text-sm font-black">
                    {{ color.name }}
                  </span>
                  <span class="block font-mono text-xs text-base-content/55">
                    {{ color.value }}
                  </span>
                </span>
              </button>

              <button
                class="btn btn-ghost btn-xs self-center rounded-xl"
                type="button"
                :disabled="!isCustomColor(color.id)"
                :title="
                  isCustomColor(color.id)
                    ? 'Remove saved color'
                    : 'Base palette colors stay available'
                "
                @click="coloringStore.removeColor(color.id)"
              >
                <Icon name="kind-icon:trash" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <form
          class="shrink-0 border-t border-base-300 p-3"
          @submit.prevent="addColor"
        >
          <div class="grid gap-2">
            <input
              v-model="newColorName"
              class="input input-bordered input-sm bg-base-200"
              type="text"
              placeholder="Color name"
            />

            <div class="grid grid-cols-[1fr_auto] gap-2">
              <input
                v-model="newColorValue"
                class="input input-bordered input-sm bg-base-200 font-mono"
                type="text"
                placeholder="#55a9b5"
              />

              <input
                v-model="newColorValue"
                class="h-8 w-12 cursor-pointer rounded-xl border border-base-300 bg-base-200"
                type="color"
                aria-label="Pick saved color"
              />
            </div>

            <button
              class="btn btn-sm btn-primary rounded-xl text-white"
              type="submit"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Save Color
            </button>
          </div>
        </form>
      </aside>

      <main
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div
          class="rounded-2xl border border-base-300 bg-base-200 p-3 shadow-inner"
        >
          <coloring-canvas
            ref="canvasRef"
            :page="pageDefinition"
            :fills="coloringStore.currentPage?.fills ?? {}"
            :selected-region-ids="
              coloringStore.currentPage?.selectedRegionIds ?? []
            "
            :stroke-width="5"
            :palette-resolver="coloringStore.resolveColorValue"
            @region-click="paintSection"
          />
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p
              class="text-xs font-bold uppercase tracking-wide text-base-content/45"
            >
              Sections
            </p>
            <p class="mt-1 text-3xl font-black text-primary">
              {{ pageDefinition.regions?.length ?? 0 }}
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p
              class="text-xs font-bold uppercase tracking-wide text-base-content/45"
            >
              Groups
            </p>
            <p class="mt-1 text-3xl font-black text-secondary">
              {{ groups.length }}
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p
              class="text-xs font-bold uppercase tracking-wide text-base-content/45"
            >
              Saved colors
            </p>
            <p class="mt-1 text-3xl font-black text-accent">
              {{ coloringStore.currentPalette.length }}
            </p>
          </div>
        </div>
      </main>

      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-4">
          <h2 class="text-lg font-black">Sections & Groups</h2>
          <p class="mt-1 text-sm text-base-content/60">
            Use groups for shared paint IDs, then click exact sections for
            overrides.
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <section
            v-if="selectedSection"
            class="mb-3 rounded-2xl border border-primary/30 bg-primary/10 p-3"
          >
            <p
              class="text-xs font-bold uppercase tracking-wide text-primary/70"
            >
              Selected section
            </p>
            <h3 class="mt-1 text-lg font-black text-primary">
              {{ selectedSection.label }}
            </h3>
            <p class="mt-1 text-sm text-base-content/65">
              Group: {{ groupLabel(selectedSection.group) }}
            </p>

            <button
              class="btn btn-sm btn-primary mt-3 rounded-xl text-white"
              type="button"
              @click="coloringStore.paintRegion(selectedSection.id)"
            >
              Paint selected with active color
            </button>
          </section>

          <div class="grid gap-3">
            <article
              v-for="group in groups"
              :key="group.id"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-black">{{ group.label }}</h3>
                  <p class="mt-1 text-xs text-base-content/55">
                    {{ group.sections.length }} sections ·
                    {{ group.mixed ? 'mixed colors' : 'one color' }}
                  </p>
                </div>

                <button
                  class="btn btn-xs btn-secondary rounded-xl text-white"
                  type="button"
                  @click="coloringStore.paintGroup(group.id)"
                >
                  Fill group
                </button>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="section in group.sections"
                  :key="section.id"
                  class="badge cursor-pointer border transition"
                  :class="
                    selectedSectionId === section.id
                      ? 'badge-primary'
                      : 'badge-ghost hover:badge-outline'
                  "
                  type="button"
                  @click="coloringStore.selectRegion(section.id)"
                >
                  {{ section.label }}
                </button>
              </div>
            </article>
          </div>
        </div>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useColoringStore } from '@/stores/coloringStore'
import { loadMuralPageDefinition } from '@/stores/muralStore'
import { downloadPageBlob } from '@/stores/helpers/coloringExport'
import { runMuralMigration } from '@/stores/helpers/muralMigration'
import type {
  ColoringPageDefinition,
  ColoringRegion,
} from '@/stores/helpers/coloring'

interface MuralGroupView {
  id: string
  label: string
  sections: ColoringRegion[]
  mixed: boolean
}

const coloringStore = useColoringStore()

const pageDefinition = ref<ColoringPageDefinition | null>(null)
const newColorName = ref('')
const newColorValue = ref('#55a9b5')
const canvasRef = ref<{ exportImage: () => Promise<Blob> } | null>(null)
const isExporting = ref(false)

const activeColorId = computed(
  () => coloringStore.currentPage?.activeColorId ?? null,
)

const activeColor = computed(() => {
  return (
    coloringStore.currentPalette.find(
      (color) => color.id === activeColorId.value,
    ) ?? null
  )
})

const selectedSectionId = computed(
  () => coloringStore.currentPage?.selectedRegionIds[0] ?? null,
)

const selectedSection = computed<ColoringRegion | null>(() => {
  if (!selectedSectionId.value) return null
  return (
    pageDefinition.value?.regions?.find(
      (region) => region.id === selectedSectionId.value,
    ) ?? null
  )
})

const groups = computed<MuralGroupView[]>(() => {
  const regions = pageDefinition.value?.regions ?? []
  const fills = coloringStore.currentPage?.fills ?? {}
  const order: string[] = []
  const lookup = new Map<string, ColoringRegion[]>()

  for (const region of regions) {
    const groupId = region.group ?? 'misc'

    if (!lookup.has(groupId)) {
      lookup.set(groupId, [])
      order.push(groupId)
    }

    lookup.get(groupId)?.push(region)
  }

  return order.map((groupId) => {
    const sections = lookup.get(groupId) ?? []
    const firstFill = sections[0] ? fills[sections[0].id] : undefined

    return {
      id: groupId,
      label: groupLabel(groupId),
      sections,
      mixed: sections.some((section) => fills[section.id] !== firstFill),
    }
  })
})

function groupLabel(groupId: string | undefined): string {
  return (groupId ?? 'misc')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isCustomColor(colorId: string): boolean {
  return !pageDefinition.value?.palette.some((color) => color.id === colorId)
}

function paintSection(sectionId: string): void {
  coloringStore.paintRegion(sectionId)
  coloringStore.selectRegion(sectionId)
}

function addColor(): void {
  coloringStore.addColor(newColorName.value, newColorValue.value)
  newColorName.value = ''
}

async function saveImage(): Promise<void> {
  if (!canvasRef.value || isExporting.value) return

  isExporting.value = true

  try {
    const blob = await canvasRef.value.exportImage()
    downloadPageBlob(blob, pageDefinition.value?.id ?? 'mural')
  } catch (error) {
    console.warn('[mural] image export failed:', error)
  } finally {
    isExporting.value = false
  }
}

onMounted(async () => {
  const definition = await loadMuralPageDefinition()

  // One-time legacy kindRobotsMuralState translation (old key left in place).
  runMuralMigration(definition)

  coloringStore.openPage(definition)
  pageDefinition.value = definition
})
</script>
