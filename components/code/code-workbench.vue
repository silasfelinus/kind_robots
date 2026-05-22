<!-- /components/code/code-workbench.vue -->
<template>
  <section
    class="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <header
      class="relative z-[80] flex flex-col gap-3 border-b border-base-300 bg-base-100/95 p-3 shadow-sm backdrop-blur sm:p-4 xl:flex-row xl:items-center xl:justify-between"
    >
      <div class="min-w-0 space-y-1">
        <h1
          class="flex items-center gap-2 text-2xl font-black text-primary sm:text-3xl"
        >
          <icon name="kind-icon:blocks" class="h-8 w-8" />
          Code Cards
        </h1>

        <p class="max-w-4xl text-sm text-base-content/70 sm:text-base">
          Snap creative tools together like digital tinkertoys. Text, images,
          models, characters, dreams, rewards, and scenarios can all become
          pieces in the machine.
        </p>

        <div class="flex flex-wrap gap-2 pt-1">
          <span
            class="badge rounded-2xl"
            :class="codeStore.isDirty ? 'badge-warning' : 'badge-success'"
          >
            {{ codeStore.isDirty ? 'Unsaved changes' : 'Saved' }}
          </span>

          <span class="badge badge-outline rounded-2xl">
            {{ codeStore.nodes.length }} cards
          </span>

          <span class="badge badge-outline rounded-2xl">
            {{ codeStore.connections.length }} links
          </span>

          <span
            v-if="codeStore.runStatus !== 'idle'"
            class="badge badge-info rounded-2xl"
          >
            {{ codeStore.runStatus }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          class="btn btn-sm rounded-2xl"
          :class="floatingPanel === 'toybox' ? 'btn-primary' : 'btn-outline'"
          type="button"
          @click="toggleFloatingPanel('toybox')"
        >
          <icon name="kind-icon:toybox" class="h-4 w-4" />
          <span class="hidden sm:inline">Toybox</span>
        </button>

        <button
          class="btn btn-sm rounded-2xl"
          :class="floatingPanel === 'library' ? 'btn-primary' : 'btn-outline'"
          type="button"
          @click="toggleFloatingPanel('library')"
        >
          <icon name="kind-icon:library" class="h-4 w-4" />
          <span class="hidden sm:inline">Library</span>
        </button>

        <button
          class="btn btn-sm rounded-2xl"
          :class="
            floatingPanel === 'templates' ? 'btn-primary' : 'btn-outline'
          "
          type="button"
          @click="toggleFloatingPanel('templates')"
        >
          <icon name="kind-icon:sparkles" class="h-4 w-4" />
          <span class="hidden sm:inline">Templates</span>
        </button>

<button
  class="btn btn-sm rounded-2xl"
  :class="
    floatingPanel === 'settings' ? 'btn-secondary' : 'btn-outline'
  "
  type="button"
  @click="toggleSettingsPanel"
>
  <icon name="kind-icon:settings" class="h-4 w-4" />
  <span class="hidden sm:inline">Settings</span>
</button>
        <div
          class="hidden items-center overflow-hidden rounded-2xl border border-base-300 bg-base-200 sm:flex"
        >
          <button
            class="btn btn-ghost btn-sm rounded-none"
            type="button"
            title="Zoom out"
            @click="codeStore.zoomOut()"
          >
            <icon name="kind-icon:minus" class="h-4 w-4" />
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-none px-3"
            type="button"
            title="Reset zoom"
            @click="codeStore.resetZoom()"
          >
            {{ codeStore.zoomPercent }}%
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-none"
            type="button"
            title="Zoom in"
            @click="codeStore.zoomIn()"
          >
            <icon name="kind-icon:plus" class="h-4 w-4" />
          </button>
        </div>

        <button
          class="btn btn-sm btn-outline rounded-2xl"
          type="button"
          @click="codeStore.runCurrentGraph()"
        >
          <icon name="kind-icon:play" class="h-4 w-4" />
          <span class="hidden sm:inline">Run</span>
        </button>

        <button
          class="btn btn-sm btn-outline rounded-2xl"
          type="button"
          @click="codeStore.clearBoard()"
        >
          <icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline">Clear</span>
        </button>
      </div>
    </header>

    <div class="relative min-h-0 flex-1 overflow-hidden">
      <main class="relative z-0 h-full min-h-0 overflow-hidden">
        <code-canvas />
      </main>

      <button
        v-if="floatingPanel !== 'closed'"
        class="absolute inset-0 z-[50] cursor-default bg-base-300/10 backdrop-blur-[1px]"
        type="button"
        aria-label="Close floating panel"
        @click="closeFloatingPanel"
      />

      <div
        v-if="kindModelDefs.length"
        class="pointer-events-none absolute inset-x-3 top-3 z-[60] flex justify-center"
      >
        <div
          class="pointer-events-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-100/90 p-2 shadow-2xl backdrop-blur"
        >
          <span
            class="hidden shrink-0 px-2 text-[10px] font-black uppercase tracking-widest text-base-content/40 sm:inline"
          >
            Models
          </span>

          <button
            v-for="def in kindModelDefs"
            :key="def.kind"
            class="group relative flex h-12 min-w-28 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black shadow-md transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl sm:min-w-36"
            :class="kindModelIconBg(def.kind)"
            type="button"
            @click="addKindModel(def.kind)"
          >
            <icon :name="def.icon" class="h-5 w-5 shrink-0" />

            <span class="truncate">
              {{ def.title }}
            </span>
          </button>
        </div>
      </div>

      <aside
        v-if="floatingPanel === 'toybox'"
        class="absolute bottom-3 left-3 top-20 z-[70] flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl lg:top-3 lg:w-80"
      >
        <div
          class="flex items-center justify-between border-b border-base-300 bg-base-100 p-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <icon name="kind-icon:toybox" class="h-5 w-5" />
            </span>

            <div class="min-w-0">
              <h2 class="truncate text-base font-black">
                Toybox
              </h2>

              <p class="truncate text-xs text-base-content/60">
                Drag cards into the machine.
              </p>
            </div>
          </div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            aria-label="Close toybox"
            @click="closeFloatingPanel"
          >
            <icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <code-palette />
        </div>
      </aside>

      <aside
        v-if="floatingPanel === 'library'"
        class="absolute bottom-3 right-3 top-20 z-[70] flex w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl lg:top-3 lg:w-96"
      >
        <div
          class="flex items-center justify-between border-b border-base-300 bg-base-100 p-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"
            >
              <icon name="kind-icon:library" class="h-5 w-5" />
            </span>

            <div class="min-w-0">
              <h2 class="truncate text-base font-black">
                Library
              </h2>

              <p class="truncate text-xs text-base-content/60">
                Saved graphs, snippets, and reusable nonsense.
              </p>
            </div>
          </div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            aria-label="Close library"
            @click="closeFloatingPanel"
          >
            <icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <code-library />
        </div>
      </aside>

      <aside
        v-if="floatingPanel === 'settings'"
        class="absolute bottom-3 right-3 top-20 z-[70] flex w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl lg:top-3 lg:w-96"
      >
        <div
          class="flex items-center justify-between border-b border-base-300 bg-base-100 p-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent"
            >
              <icon name="kind-icon:settings" class="h-5 w-5" />
            </span>

            <div class="min-w-0">
              <h2 class="truncate text-base font-black">
                Settings
              </h2>

              <p class="truncate text-xs text-base-content/60">
                Tune the selected card without summoning chaos.
              </p>
            </div>
          </div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            aria-label="Close settings"
            @click="closeFloatingPanel"
          >
            <icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <code-settings />
        </div>
      </aside>

      <aside
        v-if="floatingPanel === 'templates'"
        class="absolute bottom-3 right-3 top-20 z-[90] flex w-[calc(100%-1.5rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl lg:top-3 lg:w-[30rem]"
      >
        <div
          class="flex items-center justify-between border-b border-base-300 bg-base-100 p-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-info/10 text-info"
            >
              <icon name="kind-icon:sparkles" class="h-5 w-5" />
            </span>

            <div class="min-w-0">
              <h2 class="truncate text-base font-black">
                Templates
              </h2>

              <p class="truncate text-xs text-base-content/60">
                Premade machines for immediate tinkering.
              </p>
            </div>
          </div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            aria-label="Close templates"
            @click="closeFloatingPanel"
          >
            <icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          <button
            v-for="template in codeStore.templates"
            :key="template.id"
            class="flex w-full items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-base-100 hover:shadow-md"
            type="button"
            @click="loadTemplate(template.id)"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <icon :name="template.icon" class="h-6 w-6" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-black">
                {{ template.title }}
              </span>

              <span class="line-clamp-3 text-xs text-base-content/60">
                {{ template.description }}
              </span>
            </span>
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  useCodeStore,
  type CodeDefinition,
  type CodeKind,
} from '@/stores/codeStore'

type FloatingPanelMode =
  | 'closed'
  | 'toybox'
  | 'library'
  | 'templates'
  | 'settings'

const codeStore = useCodeStore()
const floatingPanel = ref<FloatingPanelMode>('closed')

const kindModelDefs = computed<CodeDefinition[]>(
  () => (codeStore.groupedDefinitions['Kind Models'] ?? []) as CodeDefinition[],
)

const accentIconBgMap: Record<string, string> = {
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  accent: 'bg-accent text-accent-content',
  info: 'bg-info text-info-content',
  success: 'bg-success text-success-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
}

function addKindModel(kind: CodeKind) {
  const offset = codeStore.nodes.length * 28
  codeStore.addNode(kind, 120 + offset, 120 + offset)
}

function kindModelIconBg(kind: string) {
  const def = codeStore.definitions.find((d) => d.kind === kind)
  const accent = def?.accent ?? 'primary'
  return accentIconBgMap[accent] ?? 'bg-base-300 text-base-content'
}

function toggleFloatingPanel(mode: FloatingPanelMode) {
  if (floatingPanel.value === mode) {
    closeFloatingPanel()
    return
  }

  floatingPanel.value = mode

  if (mode === 'library') {
    codeStore.openPanel('library')
    return
  }

  if (mode === 'settings') {
    if (codeStore.selectedNode) {
      codeStore.openSelectedNodeSettings()
      return
    }

    codeStore.closePanel()
    return
  }

  codeStore.closePanel()
}

function toggleSettingsPanel() {
  toggleFloatingPanel('settings')
}

function closeFloatingPanel() {
  floatingPanel.value = 'closed'
  codeStore.closePanel()
}

function loadTemplate(templateId: string) {
  codeStore.loadTemplate(templateId)
  closeFloatingPanel()
}

onMounted(() => {
  codeStore.initialize()
})
</script>