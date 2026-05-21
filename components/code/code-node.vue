<!-- /components/code/code-node.vue -->
<template>
  <article
    ref="nodeRef"
    class="group w-70 select-none overflow-visible rounded-2xl border bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur transition"
    :class="[
      isSelected
        ? 'border-cyan-300 ring-2 ring-cyan-300/40'
        : 'border-slate-600/70 hover:border-cyan-300/60',
      isDragging ? 'scale-[1.02] opacity-90' : '',
    ]"
    @pointerdown.stop="bringForward"
    @dblclick.stop="openSettings"
  >
    <header
      class="relative cursor-grab rounded-t-2xl border-b border-slate-700/80 p-3 active:cursor-grabbing"
      :class="headerClass"
      @pointerdown.stop="startDrag"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-slate-950/60 shadow-inner"
          :class="iconClass"
        >
          <icon
            :name="definition?.icon ?? 'kind-icon:blocks'"
            class="h-7 w-7"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-base font-black">
              {{ node.title }}
            </h3>

            <span
              v-if="definition"
              class="rounded-full border px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide"
              :class="chipClass"
            >
              {{ definition.category }}
            </span>
          </div>

          <p class="mt-1 line-clamp-2 text-xs text-slate-200/75">
            {{ definition?.subtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs btn-circle text-slate-200 hover:bg-slate-800 hover:text-error"
          type="button"
          title="Remove card"
          @click.stop="codeStore.removeNode(node.id)"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <div
        v-if="isSelected"
        class="pointer-events-none absolute -inset-1 rounded-[1.25rem] border border-cyan-300/40 opacity-80"
      />
    </header>

    <div class="relative grid grid-cols-[1fr_1fr] gap-3 p-3">
      <section class="space-y-2">
        <p
          class="text-[0.62rem] font-black uppercase tracking-wide text-slate-400"
        >
          Inputs
        </p>

        <button
          v-for="(port, index) in definition?.inputs ?? []"
          :key="port.id"
          class="relative flex min-h-9 w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-left text-xs transition hover:border-cyan-300 hover:bg-cyan-300/10"
          type="button"
          :title="`Connect ${port.label}`"
          @click.stop="codeStore.completeConnection(node.id, port.id)"
        >
          <span
            class="absolute left-[-1.12rem] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 bg-slate-950 shadow-lg"
            :class="portClass(port.type)"
            :style="{ top: `${inputPortTop(index)}px` }"
          />

          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border bg-slate-900"
            :class="portClass(port.type)"
          >
            <icon :name="portIcon(port.type)" class="h-3.5 w-3.5" />
          </span>

          <span class="min-w-0 flex-1 truncate text-slate-100">
            {{ port.label }}
          </span>

          <span
            v-if="port.required"
            class="h-1.5 w-1.5 rounded-full bg-error"
            title="Required"
          />
        </button>

        <p
          v-if="!definition?.inputs.length"
          class="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-2 text-xs text-slate-500"
        >
          Starts here
        </p>
      </section>

      <section class="space-y-2">
        <p
          class="text-right text-[0.62rem] font-black uppercase tracking-wide text-slate-400"
        >
          Outputs
        </p>

        <button
          v-for="(port, index) in definition?.outputs ?? []"
          :key="port.id"
          class="relative flex min-h-9 w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-left text-xs transition hover:border-cyan-300 hover:bg-cyan-300/10"
          type="button"
          :title="`Start connection from ${port.label}`"
          @click.stop="codeStore.beginConnection(node.id, port.id)"
        >
          <span class="min-w-0 flex-1 truncate text-right text-slate-100">
            {{ port.label }}
          </span>

          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border bg-slate-900"
            :class="portClass(port.type)"
          >
            <icon :name="portIcon(port.type)" class="h-3.5 w-3.5" />
          </span>

          <span
            class="absolute right-[-1.12rem] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 bg-slate-950 shadow-lg"
            :class="portClass(port.type)"
            :style="{ top: `${outputPortTop(index)}px` }"
          />
        </button>
      </section>
    </div>

    <footer class="border-t border-slate-700/80 bg-slate-950/50 px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <p class="line-clamp-2 text-xs text-slate-400">
          {{ definition?.description }}
        </p>

        <button
          class="btn btn-ghost btn-xs rounded-xl text-cyan-100 hover:bg-cyan-300 hover:text-cyan-950"
          type="button"
          title="Open settings"
          @click.stop="openSettings"
        >
          <icon name="kind-icon:settings" class="h-4 w-4" />
        </button>

<p
  v-if="codeStore.runStreams[`${node.id}:text`]"
  class="line-clamp-3 text-xs text-cyan-100/80"
>
  {{ codeStore.runStreams[`${node.id}:text`] }}
</p>

      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useCodeStore,
  type CodeDataType,
  type CodeNode,
} from '@/stores/codeStore'

const props = defineProps<{
  node: CodeNode
}>()

const codeStore = useCodeStore()
const nodeRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

let dragOffsetX = 0
let dragOffsetY = 0

const definition = computed(() => codeStore.getDefinition(props.node.kind))
const isSelected = computed(() => codeStore.selectedNodeId === props.node.id)

const headerClass = computed(() => {
  const accent = definition.value?.accent ?? 'primary'

  const classes: Record<string, string> = {
    primary: 'bg-primary/25',
    secondary: 'bg-secondary/25',
    accent: 'bg-accent/25',
    info: 'bg-info/25',
    warning: 'bg-warning/25',
    error: 'bg-error/25',
    success: 'bg-success/25',
  }

  return classes[accent] ?? 'bg-primary/25'
})

const iconClass = computed(() => {
  const accent = definition.value?.accent ?? 'primary'

  const classes: Record<string, string> = {
    primary: 'border-primary/50 text-primary',
    secondary: 'border-secondary/50 text-secondary',
    accent: 'border-accent/50 text-accent',
    info: 'border-info/50 text-info',
    warning: 'border-warning/50 text-warning',
    error: 'border-error/50 text-error',
    success: 'border-success/50 text-success',
  }

  return classes[accent] ?? 'border-primary/50 text-primary'
})

const chipClass = computed(() => {
  const accent = definition.value?.accent ?? 'primary'

  const classes: Record<string, string> = {
    primary: 'border-primary/40 bg-primary/10 text-primary',
    secondary: 'border-secondary/40 bg-secondary/10 text-secondary',
    accent: 'border-accent/40 bg-accent/10 text-accent',
    info: 'border-info/40 bg-info/10 text-info',
    warning: 'border-warning/40 bg-warning/10 text-warning',
    error: 'border-error/40 bg-error/10 text-error',
    success: 'border-success/40 bg-success/10 text-success',
  }

  return classes[accent] ?? 'border-primary/40 bg-primary/10 text-primary'
})

function bringForward() {
  codeStore.selectNode(props.node.id)
}

function openSettings() {
  codeStore.selectNode(props.node.id, true)
}

function startDrag(event: PointerEvent) {
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

function onDrag(event: PointerEvent) {
  const canvas = nodeRef.value?.closest(
    '[data-code-canvas-scroll]',
  ) as HTMLElement | null

  if (!canvas) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const rawX = event.clientX - rect.left + canvas.scrollLeft
  const rawY = event.clientY - rect.top + canvas.scrollTop
  const point = codeStore.toCanvasPoint(rawX - dragOffsetX, rawY - dragOffsetY)

  codeStore.updateNodePosition(props.node.id, point.x, point.y)
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
}

function portClass(type: CodeDataType) {
  const accent = codeStore.getDataTypeAccent(type)

  const classes: Record<string, string> = {
    primary: 'border-primary text-primary shadow-primary/30',
    secondary: 'border-secondary text-secondary shadow-secondary/30',
    accent: 'border-accent text-accent shadow-accent/30',
    info: 'border-info text-info shadow-info/30',
    warning: 'border-warning text-warning shadow-warning/30',
    error: 'border-error text-error shadow-error/30',
    success: 'border-success text-success shadow-success/30',
  }

  return classes[accent] ?? 'border-primary text-primary shadow-primary/30'
}

function portIcon(type: CodeDataType) {
  const icons: Record<CodeDataType, string> = {
    text: 'kind-icon:chat',
    image: 'kind-icon:image',
    model: 'kind-icon:cube',
    video: 'kind-icon:video',
    character: 'kind-icon:character',
    dream: 'kind-icon:dream',
    pitch: 'kind-icon:lightbulb',
    prompt: 'kind-icon:prompt',
    bot: 'kind-icon:bot',
    reward: 'kind-icon:treasure',
    scenario: 'kind-icon:story',
    collection: 'kind-icon:gallery',
  }

  return icons[type] ?? 'kind-icon:circle'
}

function inputPortTop(index: number) {
  return 30 + index * 44
}

function outputPortTop(index: number) {
  return 30 + index * 44
}
</script>
