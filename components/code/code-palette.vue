<!-- /components/code/code-palette.vue -->
<template>
  <aside class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 shadow-sm">
    <div class="border-b border-base-300 p-4">
      <h2 class="flex items-center gap-2 text-lg font-black text-secondary">
        <icon name="kind-icon:toybox" class="h-6 w-6" />
        Toybox
      </h2>

      <p class="mt-1 text-xs text-base-content/60">
        Drag a card onto the board.
      </p>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-for="(definitions, category) in codeStore.groupedDefinitions"
        :key="category"
        class="mb-4 space-y-2"
      >
        <h3 class="px-1 text-xs font-black uppercase tracking-wide text-base-content/50">
          {{ category }}
        </h3>

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
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-base-100"
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
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useCodeStore, type CodeKind } from '@/stores/codeStore'

const codeStore = useCodeStore()

const onDragStart = (event: DragEvent, kind: CodeKind) => {
  event.dataTransfer?.setData('kindrobots/code-kind', kind)
  event.dataTransfer?.setData('text/plain', kind)
  event.dataTransfer?.setDragImage(event.currentTarget as Element, 24, 24)
}

const addNearTop = (kind: CodeKind) => {
  const offset = codeStore.nodes.length * 28
  codeStore.addNode(kind, 80 + offset, 90 + offset)
}

const accentClass = (accent: string) => {
  const classes: Record<string, string> = {
    primary: 'border-primary/40 text-primary',
    secondary: 'border-secondary/40 text-secondary',
    accent: 'border-accent/40 text-accent',
    info: 'border-info/40 text-info',
    warning: 'border-warning/40 text-warning',
  }

  return classes[accent] ?? 'border-base-300 text-base-content'
}
</script>