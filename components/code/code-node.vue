<!-- /components/code/code-node.vue -->
<template>
  <article
    ref="nodeRef"
    class="w-[280px] select-none rounded-2xl border bg-base-200 shadow-lg transition"
    :class="[
      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-base-300',
      isDragging ? 'scale-[1.02] opacity-90' : '',
    ]"
    @pointerdown.stop="bringForward"
  >
    <header
      class="cursor-grab rounded-t-2xl border-b border-base-300 bg-base-100 p-3 active:cursor-grabbing"
      @pointerdown.stop="startDrag"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-base-200"
          :class="accentClass(definition?.accent)"
        >
          <icon :name="definition?.icon ?? 'kind-icon:blocks'" class="h-7 w-7" />
        </div>

        <div class="min-w-0 flex-1">
          <h3 class="truncate text-base font-black">
            {{ node.title }}
          </h3>

          <p class="truncate text-xs text-base-content/60">
            {{ definition?.subtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs btn-circle"
          type="button"
          @click.stop="codeStore.removeNode(node.id)"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <div class="grid grid-cols-2 gap-3 p-3">
      <section class="space-y-2">
        <h4 class="text-[0.65rem] font-black uppercase tracking-wide text-base-content/50">
          Inputs
        </h4>

        <button
          v-for="port in definition?.inputs ?? []"
          :key="port.id"
          class="flex w-full items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-2 text-left text-xs transition hover:border-secondary hover:bg-secondary hover:text-secondary-content"
          type="button"
          @click.stop="codeStore.completeConnection(node.id, port.id)"
        >
          <span class="h-3 w-3 shrink-0 rounded-full border-2 border-current bg-base-200" />
          <span class="min-w-0 flex-1 truncate">
            {{ port.label }}
          </span>
        </button>

        <p
          v-if="!definition?.inputs.length"
          class="rounded-xl border border-dashed border-base-300 p-2 text-xs text-base-content/50"
        >
          No inputs
        </p>
      </section>

      <section class="space-y-2">
        <h4 class="text-right text-[0.65rem] font-black uppercase tracking-wide text-base-content/50">
          Outputs
        </h4>

        <button
          v-for="port in definition?.outputs ?? []"
          :key="port.id"
          class="flex w-full items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-2 text-left text-xs transition hover:border-primary hover:bg-primary hover:text-primary-content"
          type="button"
          @click.stop="codeStore.beginConnection(node.id, port.id)"
        >
          <span class="min-w-0 flex-1 truncate text-right">
            {{ port.label }}
          </span>
          <span class="h-3 w-3 shrink-0 rounded-full border-2 border-current bg-base-200" />
        </button>
      </section>
    </div>

    <footer class="border-t border-base-300 px-3 py-2">
      <p class="line-clamp-2 text-xs text-base-content/60">
        {{ definition?.description }}
      </p>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCodeStore, type CodeNode } from '@/stores/codeStore'

const props = defineProps<{
  node: CodeNode
}>()

const codeStore = useCodeStore()
const nodeRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

const definition = computed(() => codeStore.getDefinition(props.node.kind))
const isSelected = computed(() => codeStore.selectedNodeId === props.node.id)

let dragOffsetX = 0
let dragOffsetY = 0

const bringForward = () => {
  codeStore.selectNode(props.node.id)
}

const startDrag = (event: PointerEvent) => {
  const target = nodeRef.value

  if (!target) {
    return
  }

  isDragging.value = true
  codeStore.selectNode(props.node.id)

  const rect = target.getBoundingClientRect()
  dragOffsetX = event.clientX - rect.left
  dragOffsetY = event.clientY - rect.top

  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag)
}

const onDrag = (event: PointerEvent) => {
  const canvas = nodeRef.value?.closest('section')

  if (!canvas) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const scrollLeft = canvas.scrollLeft
  const scrollTop = canvas.scrollTop

  const x = event.clientX - rect.left + scrollLeft - dragOffsetX
  const y = event.clientY - rect.top + scrollTop - dragOffsetY

  codeStore.updateNodePosition(props.node.id, x, y)
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
}

const accentClass = (accent?: string) => {
  const classes: Record<string, string> = {
    primary: 'border-primary/40 text-primary',
    secondary: 'border-secondary/40 text-secondary',
    accent: 'border-accent/40 text-accent',
    info: 'border-info/40 text-info',
    warning: 'border-warning/40 text-warning',
  }

  return accent ? classes[accent] ?? 'border-base-300 text-base-content' : 'border-base-300 text-base-content'
}
</script>