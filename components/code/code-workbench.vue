<!-- /components/code/code-workbench.vue -->
<template>
  <section
    class="flex h-full min-h-175 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <header
      class="relative z-20 flex flex-col gap-3 border-b border-base-300 bg-base-100/95 p-3 shadow-sm backdrop-blur sm:p-4 xl:flex-row xl:items-center xl:justify-between"
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
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          class="btn btn-sm rounded-2xl lg:hidden"
          :class="
            codeStore.mobileTrayMode === 'toybox'
              ? 'btn-primary'
              : 'btn-outline'
          "
          type="button"
          @click="toggleMobileTray('toybox')"
        >
          <icon name="kind-icon:toybox" class="h-4 w-4" />
          Toybox
        </button>

        <button
          class="btn btn-sm rounded-2xl lg:hidden"
          :class="
            codeStore.mobileTrayMode === 'quick-plays'
              ? 'btn-secondary'
              : 'btn-outline'
          "
          type="button"
          @click="toggleMobileTray('quick-plays')"
        >
          <icon name="kind-icon:cards" class="h-4 w-4" />
          Plays
        </button>

        <button
          class="btn btn-sm rounded-2xl"
          :class="codeStore.showToybox ? 'btn-primary' : 'btn-outline'"
          type="button"
          @click="codeStore.toggleToybox()"
        >
          <icon name="kind-icon:toybox" class="h-4 w-4" />
          <span class="hidden sm:inline"> Toybox </span>
        </button>

        <div class="dropdown dropdown-end">
          <button
            tabindex="0"
            class="btn btn-sm rounded-2xl border-base-300 bg-base-200"
            type="button"
          >
            <icon name="kind-icon:sparkles" class="h-4 w-4" />
            Templates
          </button>

          <div
            tabindex="0"
            class="dropdown-content z-50 mt-2 w-80 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
          >
            <button
              v-for="template in codeStore.templates"
              :key="template.id"
              class="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-base-200"
              type="button"
              @click="codeStore.loadTemplate(template.id)"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              >
                <icon :name="template.icon" class="h-5 w-5" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-black">
                  {{ template.title }}
                </span>

                <span class="line-clamp-2 text-xs text-base-content/60">
                  {{ template.description }}
                </span>
              </span>
            </button>
          </div>
        </div>

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
          @click="codeStore.clearBoard()"
        >
          <icon name="kind-icon:trash" class="h-4 w-4" />
          <span class="hidden sm:inline"> Clear </span>
        </button>
      </div>
    </header>

    <div
      class="relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]"
    >
      <aside
        v-if="codeStore.showToybox"
        class="hidden min-h-0 border-r border-base-300 bg-base-100 lg:block"
      >
        <code-palette />
      </aside>

      <main class="relative min-h-0 overflow-hidden">
        <code-canvas />
      </main>

      <aside
        v-if="showDesktopSettings"
        class="hidden min-h-0 w-90 border-l border-base-300 bg-base-100 xl:block"
      >
        <section class="flex h-full flex-col">
          <header class="border-b border-base-300 p-4">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-black text-primary">
                  {{ codeStore.selectedNode?.title || 'Node Settings' }}
                </h2>

                <p class="truncate text-xs text-base-content/60">
                  {{
                    codeStore.selectedDefinition?.subtitle ||
                    'Configure this card.'
                  }}
                </p>
              </div>

              <button
                class="btn btn-ghost btn-sm btn-circle"
                type="button"
                @click="codeStore.closeSelectedNodeSettings()"
              >
                <icon name="kind-icon:x" class="h-4 w-4" />
              </button>
            </div>
          </header>

          <code-settings />
        </section>
      </aside>

      <div
        v-if="codeStore.mobileTrayMode !== 'closed'"
        class="fixed inset-x-0 bottom-0 z-50 max-h-[78dvh] overflow-hidden rounded-t-2xl border border-base-300 bg-base-100 shadow-2xl lg:hidden"
      >
        <div
          class="flex items-center justify-between border-b border-base-300 p-3"
        >
          <div class="flex items-center gap-2">
            <icon :name="mobileTrayIcon" class="h-5 w-5 text-primary" />

            <h2 class="font-black">
              {{ mobileTrayTitle }}
            </h2>
          </div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            @click="codeStore.setMobileTray('closed')"
          >
            <icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="max-h-[calc(78dvh-3.5rem)] overflow-y-auto p-3">
          <code-palette
            v-if="
              codeStore.mobileTrayMode === 'toybox' ||
              codeStore.mobileTrayMode === 'quick-plays'
            "
          />

          <code-settings v-else-if="codeStore.mobileTrayMode === 'settings'" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCodeStore, type CodeMobileTrayMode } from '@/stores/codeStore'

const codeStore = useCodeStore()

const showDesktopSettings = computed(() => {
  return (
    codeStore.panelMode === 'node-settings' && Boolean(codeStore.selectedNode)
  )
})

const mobileTrayTitle = computed(() => {
  if (codeStore.mobileTrayMode === 'quick-plays') return 'Quick Plays'
  if (codeStore.mobileTrayMode === 'settings') return 'Settings'
  return 'Toybox'
})

const mobileTrayIcon = computed(() => {
  if (codeStore.mobileTrayMode === 'quick-plays') return 'kind-icon:cards'
  if (codeStore.mobileTrayMode === 'settings') return 'kind-icon:settings'
  return 'kind-icon:toybox'
})

function toggleMobileTray(mode: CodeMobileTrayMode) {
  if (codeStore.mobileTrayMode === mode) {
    codeStore.setMobileTray('closed')
    return
  }

  codeStore.setMobileTray(mode)
}

onMounted(() => {
  codeStore.initialize()
})
</script>
