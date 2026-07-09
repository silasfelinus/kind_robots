<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <header
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-primary/10"
          >
            <Icon name="kind-icon:paintbrush" class="h-8 w-8 text-primary" />
          </div>

          <div class="min-w-0">
            <h1 class="text-2xl font-black text-primary">
              Mural Color Studio
            </h1>

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
            @click="muralStore.resetMural"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            Reset
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

    <section
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
              v-for="color in muralStore.colors"
              :key="color.id"
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border p-2 transition"
              :class="
                muralStore.activeColorId === color.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-base-300 bg-base-200'
              "
            >
              <button
                class="flex min-w-0 items-center gap-3 rounded-xl p-1 text-left hover:bg-base-100/60"
                type="button"
                @click="muralStore.setActiveColor(color.id)"
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
                :disabled="muralStore.colors.length <= 1"
                @click="muralStore.removeSavedColor(color.id)"
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

            <button class="btn btn-sm btn-primary rounded-xl text-white" type="submit">
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
          <svg
            class="h-auto w-full rounded-2xl bg-base-100"
            viewBox="0 0 960 540"
            role="img"
            aria-labelledby="mural-title mural-description"
          >
            <title id="mural-title">Paintable fence mural coloring plan</title>
            <desc id="mural-description">
              A simplified mural with a portal spirit, catbus, robots,
              butterflies, soot sprites, and grouped colorable sections.
            </desc>

            <path
              v-for="section in muralStore.sections"
              :key="section.id"
              :d="section.d"
              :fill="muralStore.getColorValue(section.colorId)"
              :stroke="
                section.id === muralStore.selectedSectionId
                  ? activeColor?.value || '#171312'
                  : '#171312'
              "
              :stroke-width="section.id === muralStore.selectedSectionId ? 8 : 5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="cursor-pointer transition hover:brightness-110"
              :class="
                section.id === muralStore.selectedSectionId
                  ? 'drop-shadow-lg'
                  : ''
              "
              @click="paintSection(section.id)"
            />

            <path
              d="M139 211L156 226M215 211L199 226M169 274H201M592 300H777M565 358C576 386 612 386 621 361M677 365C687 392 725 392 734 364M784 358C793 382 829 382 837 357"
              fill="none"
              stroke="#171312"
              stroke-width="6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-base-content/45">
              Sections
            </p>
            <p class="mt-1 text-3xl font-black text-primary">
              {{ muralStore.sections.length }}
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-base-content/45">
              Groups
            </p>
            <p class="mt-1 text-3xl font-black text-secondary">
              {{ muralStore.groups.length }}
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-base-content/45">
              Saved colors
            </p>
            <p class="mt-1 text-3xl font-black text-accent">
              {{ muralStore.colors.length }}
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
            <p class="text-xs font-bold uppercase tracking-wide text-primary/70">
              Selected section
            </p>
            <h3 class="mt-1 text-lg font-black text-primary">
              {{ selectedSection.label }}
            </h3>
            <p class="mt-1 text-sm text-base-content/65">
              Group: {{ groupLabel(selectedSection.groupId) }}
            </p>

            <button
              class="btn btn-sm btn-primary mt-3 rounded-xl text-white"
              type="button"
              @click="muralStore.setSectionColor(selectedSection.id)"
            >
              Paint selected with active color
            </button>
          </section>

          <div class="grid gap-3">
            <article
              v-for="group in muralStore.groups"
              :key="group.id"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-black">{{ group.label }}</h3>
                  <p class="mt-1 text-xs text-base-content/55">
                    {{ group.sectionIds.length }} sections ·
                    {{ group.colorId === 'mixed' ? 'mixed colors' : 'one color' }}
                  </p>
                </div>

                <button
                  class="btn btn-xs btn-secondary rounded-xl text-white"
                  type="button"
                  @click="muralStore.setGroupColor(group.id)"
                >
                  Fill group
                </button>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="section in sectionsForGroup(group.id)"
                  :key="section.id"
                  class="badge cursor-pointer border transition"
                  :class="
                    section.id === muralStore.selectedSectionId
                      ? 'badge-primary'
                      : 'badge-ghost hover:badge-outline'
                  "
                  type="button"
                  @click="muralStore.selectSection(section.id)"
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
import { useMuralStore, type MuralSection } from '@/stores/muralStore'

const muralStore = useMuralStore()

const newColorName = ref('')
const newColorValue = ref('#55a9b5')

const activeColor = computed(() => muralStore.activeColor)
const selectedSection = computed(() => muralStore.selectedSection)

function paintSection(sectionId: string): void {
  muralStore.setSectionColor(sectionId)
}

function sectionsForGroup(groupId: string): MuralSection[] {
  return muralStore.sections.filter((section) => section.groupId === groupId)
}

function groupLabel(groupId: string): string {
  return (
    muralStore.groups.find((group) => group.id === groupId)?.label ?? groupId
  )
}

function addColor(): void {
  muralStore.addSavedColor(newColorName.value, newColorValue.value)
  newColorName.value = ''
}

onMounted(() => {
  muralStore.initialize()
})
</script>
