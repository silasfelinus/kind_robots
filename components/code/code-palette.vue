<!-- /components/code/code-palette.vue -->
<template>
  <aside
    class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
  >
    <header class="border-b border-base-300 p-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="flex items-center gap-2 text-lg font-black text-secondary">
          <icon name="kind-icon:toybox" class="h-6 w-6" />
          Toybox
        </h2>

        <button
          class="btn btn-ghost btn-xs btn-circle lg:hidden"
          type="button"
          title="Close toybox"
          @click="codeStore.setMobileTray('closed')"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <p class="mt-1 text-xs text-base-content/60">
        Drag a card onto the canvas, or tap to add.
      </p>
    </header>

    <section class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-for="(definitions, category) in paletteGroups"
        :key="category"
        class="mb-4 space-y-2"
      >
        <h3
          class="flex items-center justify-between px-1 text-xs font-black uppercase tracking-wide text-base-content/50"
        >
          <span>{{ category }}</span>
          <span>{{ definitions.length }}</span>
        </h3>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="definition in definitions"
            :key="definition.kind"
            class="group flex w-full items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-base-100 hover:shadow-md"
            draggable="true"
            type="button"
            @dragstart="onDragStart($event, definition.kind)"
            @click="addNearTop(definition.kind)"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-base-100 transition group-hover:scale-105"
              :class="accentClass(definition.accent)"
            >
              <icon :name="definition.icon" class="h-6 w-6" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-black">
                {{ definition.title }}
              </span>

              <span class="block truncate text-xs text-base-content/60">
                {{ definition.subtitle }}
              </span>
            </span>

            <icon
              name="kind-icon:plus"
              class="h-4 w-4 shrink-0 text-base-content/30 transition group-hover:text-primary"
            />
          </button>
        </div>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  useCodeStore,
  type CodeDefinition,
  type CodeKind,
} from '@/stores/codeStore'

const codeStore = useCodeStore()

// All categories except Kind Models (those live in the top-bar tabs)
const paletteGroups = computed(() => {
  const groups: Record<string, CodeDefinition[]> = {}

  for (const [category, definitions] of Object.entries(
    codeStore.groupedDefinitions,
  )) {
    if (category === 'Kind Models') continue
    groups[category] = definitions
  }

  return groups
})

function onDragStart(event: DragEvent, kind: CodeKind) {
  event.dataTransfer?.setData('kindrobots/code-kind', kind)
  event.dataTransfer?.setData('text/plain', kind)
  event.dataTransfer?.setDragImage(event.currentTarget as Element, 24, 24)
}

function addNearTop(kind: CodeKind) {
  const offset = codeStore.nodes.length * 28
  const baseX = 120 + offset
  const baseY = 120 + offset

  codeStore.addNode(kind, baseX, baseY)
}

function accentClass(accent: string) {
  const classes: Record<string, string> = {
    primary: 'border-primary/40 text-primary',
    secondary: 'border-secondary/40 text-secondary',
    accent: 'border-accent/40 text-accent',
    info: 'border-info/40 text-info',
    warning: 'border-warning/40 text-warning',
    error: 'border-error/40 text-error',
    success: 'border-success/40 text-success',
  }

  return classes[accent] ?? 'border-base-300 text-base-content'
}
</script>
