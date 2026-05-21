<!-- /components/code/code-palette.vue -->
<template>
  <aside class="flex min-h-0 flex-col overflow-hidden bg-base-100">
    <header class="border-b border-base-300 px-4 py-3">
      <div class="flex items-center justify-between gap-2">
        <h2
          class="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-base-content/60"
        >
          <icon name="kind-icon:toybox" class="h-4 w-4" />
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
    </header>

    <section class="min-h-0 flex-1 overflow-y-auto p-2">
      <div
        v-for="(definitions, category) in paletteGroups"
        :key="category"
        class="mb-4"
      >
        <h3
          class="mb-1.5 flex items-center justify-between px-1 text-[0.58rem] font-black uppercase tracking-widest text-base-content/40"
        >
          <span>{{ category }}</span>
          <span>{{ definitions.length }}</span>
        </h3>

        <div class="space-y-0.5">
          <button
            v-for="definition in definitions"
            :key="definition.kind"
            class="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all hover:bg-base-200"
            draggable="true"
            type="button"
            @dragstart="onDragStart($event, definition.kind)"
            @click="addNearTop(definition.kind)"
          >
            <!-- Icon badge using DaisyUI accent token -->
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-110"
              :class="accentIconBg(definition.accent)"
            >
              <icon :name="definition.icon" class="h-3.5 w-3.5" />
            </span>

            <span class="min-w-0 flex-1">
              <span
                class="block truncate text-xs font-bold text-base-content/90"
              >
                {{ definition.title }}
              </span>
              <span class="block truncate text-[0.62rem] text-base-content/50">
                {{ definition.subtitle }}
              </span>
            </span>

            <icon
              name="kind-icon:plus"
              class="h-3.5 w-3.5 shrink-0 text-base-content/20 transition group-hover:text-primary"
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

// All categories except Kind Models (those live in the workbench top-bar strip)
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

// Map DaisyUI accent tokens → solid icon badge classes.
// Full strings so Tailwind JIT scans them.
const accentIconBgMap: Record<string, string> = {
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  accent: 'bg-accent text-accent-content',
  info: 'bg-info text-info-content',
  success: 'bg-success text-success-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
}

function accentIconBg(accent: string) {
  return accentIconBgMap[accent] ?? 'bg-base-300 text-base-content'
}

function onDragStart(event: DragEvent, kind: CodeKind) {
  event.dataTransfer?.setData('kindrobots/code-kind', kind)
  event.dataTransfer?.setData('text/plain', kind)
  event.dataTransfer?.setDragImage(event.currentTarget as Element, 20, 20)
}

function addNearTop(kind: CodeKind) {
  const offset = codeStore.nodes.length * 28
  codeStore.addNode(kind, 120 + offset, 120 + offset)
}
</script>
