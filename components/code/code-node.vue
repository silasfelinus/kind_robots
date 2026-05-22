<!-- /components/code/code-node.vue -->
<template>
  <article
    ref="nodeRef"
    class="group w-70 select-none overflow-visible rounded-2xl border bg-slate-900 text-slate-100 shadow-xl backdrop-blur transition-all duration-150"
    :class="[
      nodeStateClass,
      accentShadowClass,
      isDragging ? 'scale-[1.04] opacity-95 rotate-[0.4deg] shadow-2xl' : '',
    ]"
    @pointerdown.stop="bringForward"
    @dblclick.stop="openSettings"
  >
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header
      class="relative cursor-grab rounded-t-2xl border-b border-white/10 px-3 py-2.5 active:cursor-grabbing"
      :class="accentHeaderClass"
      @pointerdown.stop="startDrag"
    >
      <div class="flex items-center gap-3">
        <!-- Icon badge -->
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg ring-1 ring-white/20"
          :class="accentIconClass"
        >
          <icon
            :name="definition?.icon ?? 'kind-icon:blocks'"
            class="h-5 w-5"
          />
        </div>

        <div class="min-w-0 flex-1">
          <h3
            class="truncate text-sm font-black leading-tight text-white drop-shadow"
          >
            {{ node.title }}
          </h3>
          <p class="mt-0.5 truncate text-[0.65rem] text-white/65">
            {{ definition?.subtitle }}
          </p>
        </div>

        <!-- Status + close -->
        <div class="flex shrink-0 items-center gap-1">
          <span
            v-if="isRunning"
            class="flex h-5 w-5 items-center justify-center rounded-full bg-black/25"
            title="Running"
          >
            <icon
              name="kind-icon:spinner"
              class="h-3.5 w-3.5 animate-spin text-white"
            />
          </span>
          <span
            v-else-if="isErrored"
            class="flex h-5 w-5 items-center justify-center rounded-full bg-error/40"
            title="Error"
          >
            <icon
              name="kind-icon:alert"
              class="h-3.5 w-3.5 text-error-content"
            />
          </span>
          <span
            v-else-if="hasResult"
            class="flex h-5 w-5 items-center justify-center rounded-full bg-success/40"
            title="Done"
          >
            <icon
              name="kind-icon:check"
              class="h-3.5 w-3.5 text-success-content"
            />
          </span>

          <button
            class="btn btn-ghost btn-xs btn-circle text-white/50 hover:bg-black/30 hover:text-white"
            type="button"
            title="Remove card"
            @click.stop="codeStore.removeNode(node.id)"
          >
            <icon name="kind-icon:x" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Category pill -->
      <div class="mt-2">
        <span
          class="rounded-full bg-black/25 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-wider text-white/75"
        >
          {{ definition?.category ?? node.kind }}
        </span>
      </div>

      <!-- Selected ring -->
      <div
        v-if="isSelected"
        class="pointer-events-none absolute -inset-px rounded-t-2xl ring-2 ring-cyan-300/70"
      />
    </header>

    <!-- ── Port body ──────────────────────────────────────────────────── -->
    <div
      class="relative grid grid-cols-[1fr_1fr] gap-3 bg-slate-900/95 px-3 py-3"
    >
      <!-- Inputs -->
      <section class="space-y-1.5">
        <p
          class="text-[0.58rem] font-black uppercase tracking-widest text-slate-500"
        >
          Inputs
        </p>

        <button
          v-for="(port, index) in definition?.inputs ?? []"
          :key="port.id"
          class="relative flex min-h-8 w-full items-center gap-1.5 rounded-xl border border-slate-700/70 bg-slate-950/80 px-2 py-1 text-left transition hover:border-cyan-400/50 hover:bg-slate-800/80"
          type="button"
          :title="`Connect ${port.label}`"
          @click.stop="codeStore.completeConnection(node.id, port.id)"
        >
          <span
            class="absolute left-[-0.85rem] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-slate-950 shadow-md transition-transform hover:scale-125"
            :class="portSocketClass(port.type)"
            :style="{ top: `${inputPortTop(index)}px` }"
          />
          <span
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded-md border"
            :class="portBadgeClass(port.type)"
          >
            <icon :name="portIcon(port.type)" class="h-2.5 w-2.5" />
          </span>
          <span class="min-w-0 flex-1 truncate text-[0.68rem] text-slate-300">{{
            port.label
          }}</span>
          <span
            v-if="port.required"
            class="h-1 w-1 rounded-full bg-error"
            title="Required"
          />
        </button>

        <p
          v-if="!definition?.inputs.length"
          class="rounded-xl border border-dashed border-slate-700/50 bg-slate-950/50 px-2 py-1.5 text-[0.62rem] text-slate-500"
        >
          Entry point
        </p>
      </section>

      <!-- Outputs -->
      <section class="space-y-1.5">
        <p
          class="text-right text-[0.58rem] font-black uppercase tracking-widest text-slate-500"
        >
          Outputs
        </p>

        <button
          v-for="(port, index) in definition?.outputs ?? []"
          :key="port.id"
          class="relative flex min-h-8 w-full items-center gap-1.5 rounded-xl border border-slate-700/70 bg-slate-950/80 px-2 py-1 text-left transition hover:border-cyan-400/50 hover:bg-slate-800/80"
          type="button"
          :title="`Start connection from ${port.label}`"
          @click.stop="codeStore.beginConnection(node.id, port.id)"
        >
          <span
            class="min-w-0 flex-1 truncate text-right text-[0.68rem] text-slate-300"
            >{{ port.label }}</span
          >
          <span
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded-md border"
            :class="portBadgeClass(port.type)"
          >
            <icon :name="portIcon(port.type)" class="h-2.5 w-2.5" />
          </span>
          <span
            class="absolute right-[-0.85rem] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-slate-950 shadow-md transition-transform hover:scale-125"
            :class="portSocketClass(port.type)"
            :style="{ top: `${outputPortTop(index)}px` }"
          />
        </button>
      </section>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────────────── -->
    <footer
      class="rounded-b-2xl border-t border-slate-700/50 bg-slate-950/70 px-3 py-2"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <p v-if="errorMessage" class="line-clamp-2 text-[0.65rem] text-error">
            <icon name="kind-icon:alert" class="mr-1 inline h-3 w-3" />{{
              errorMessage
            }}
          </p>
          <p
            v-else-if="streamingText"
            class="line-clamp-2 whitespace-pre-wrap text-[0.65rem] text-cyan-200/90"
          >
            {{ streamingText
            }}<span
              v-if="isRunning"
              class="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-cyan-300 align-middle"
            />
          </p>
          <p v-else class="line-clamp-2 text-[0.62rem] text-slate-500">
            {{ definition?.description }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs rounded-xl text-slate-500 hover:bg-slate-700 hover:text-white"
          type="button"
          title="Open settings"
          @click.stop="openSettings"
        >
          <icon name="kind-icon:settings" class="h-3.5 w-3.5" />
        </button>
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

const props = defineProps<{ node: CodeNode }>()

const codeStore = useCodeStore()
const nodeRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let dragOffsetX = 0
let dragOffsetY = 0

const definition = computed(() => codeStore.getDefinition(props.node.kind))
const accent = computed(() => definition.value?.accent ?? 'primary')
const isSelected = computed(() => codeStore.selectedNodeId === props.node.id)
const isRunning = computed(
  () => codeStore.activeRunNodeIds?.has(props.node.id) ?? false,
)
const runResult = computed(() => codeStore.runResults[props.node.id])
const hasResult = computed(() => Boolean(runResult.value?.success))
const isErrored = computed(() =>
  Boolean(runResult.value && !runResult.value.success && !isRunning.value),
)
const errorMessage = computed(() =>
  isErrored.value ? (runResult.value?.message ?? '') : '',
)
const streamingText = computed(
  () => codeStore.runStreams?.[`${props.node.id}:text`] ?? '',
)

// ── Accent → DaisyUI colour maps ─────────────────────────────────────────────
// Keep full class strings (not interpolated) so Tailwind JIT can scan them.

const headerMap: Record<string, string> = {
  primary: 'bg-gradient-to-br from-primary/70 to-primary/45',
  secondary: 'bg-gradient-to-br from-secondary/70 to-secondary/45',
  accent: 'bg-gradient-to-br from-accent/70 to-accent/45',
  info: 'bg-gradient-to-br from-info/70 to-info/45',
  success: 'bg-gradient-to-br from-success/70 to-success/45',
  warning: 'bg-gradient-to-br from-warning/70 to-warning/45',
  error: 'bg-gradient-to-br from-error/70 to-error/45',
}

const iconMap: Record<string, string> = {
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  accent: 'bg-accent text-accent-content',
  info: 'bg-info text-info-content',
  success: 'bg-success text-success-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
}

const borderMap: Record<string, string> = {
  primary: 'border-primary/55',
  secondary: 'border-secondary/55',
  accent: 'border-accent/55',
  info: 'border-info/55',
  success: 'border-success/55',
  warning: 'border-warning/55',
  error: 'border-error/55',
}

const shadowMap: Record<string, string> = {
  primary: 'shadow-primary/20',
  secondary: 'shadow-secondary/20',
  accent: 'shadow-accent/20',
  info: 'shadow-info/20',
  success: 'shadow-success/20',
  warning: 'shadow-warning/20',
  error: 'shadow-error/20',
}

const accentHeaderClass = computed(
  () => headerMap[accent.value] ?? headerMap.primary,
)
const accentIconClass = computed(() => iconMap[accent.value] ?? iconMap.primary)
const accentShadowClass = computed(
  () => shadowMap[accent.value] ?? shadowMap.primary,
)

const nodeStateClass = computed(() => {
  if (isRunning.value)
    return 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-400/30'
  if (isErrored.value)
    return 'border-error ring-2 ring-error/40 shadow-error/20'
  if (isSelected.value)
    return 'border-cyan-300 ring-2 ring-cyan-300/40 shadow-cyan-300/20'
  return borderMap[accent.value] ?? borderMap.primary
})

// ── Port styling ──────────────────────────────────────────────────────────────
const portSocketMap: Record<string, string> = {
  primary: 'border-primary shadow-primary/40',
  secondary: 'border-secondary shadow-secondary/40',
  accent: 'border-accent shadow-accent/40',
  info: 'border-info shadow-info/40',
  success: 'border-success shadow-success/40',
  warning: 'border-warning shadow-warning/40',
  error: 'border-error shadow-error/40',
}

const portBadgeMap: Record<string, string> = {
  primary: 'border-primary/40 bg-primary/15 text-primary',
  secondary: 'border-secondary/40 bg-secondary/15 text-secondary',
  accent: 'border-accent/40 bg-accent/15 text-accent',
  info: 'border-info/40 bg-info/15 text-info',
  success: 'border-success/40 bg-success/15 text-success',
  warning: 'border-warning/40 bg-warning/15 text-warning',
  error: 'border-error/40 bg-error/15 text-error',
}

function portSocketClass(type: CodeDataType) {
  return (
    portSocketMap[codeStore.getDataTypeAccent(type)] ?? portSocketMap.primary
  )
}
function portBadgeClass(type: CodeDataType) {
  return portBadgeMap[codeStore.getDataTypeAccent(type)] ?? portBadgeMap.primary
}

function portIcon(type: CodeDataType) {
  const icons: Record<CodeDataType, string> = {
    text: 'kind-icon:comment',
    image: 'kind-icon:image',
    model: 'kind-icon:cube',
    video: 'kind-icon:video',
    character: 'kind-icon:mask',
    dream: 'kind-icon:moon',
    pitch: 'kind-icon:brain',
    prompt: 'kind-icon:prompt',
    bot: 'kind-icon:robot-color',
    reward: 'kind-icon:treasure',
    scenario: 'kind-icon:path',
    collection: 'kind-icon:paintbrush',
  }
  return icons[type] ?? 'kind-icon:circle'
}

function inputPortTop(index: number) {
  return 30 + index * 44
}
function outputPortTop(index: number) {
  return 30 + index * 44
}

// ── Interaction ───────────────────────────────────────────────────────────────
function bringForward() {
  codeStore.selectNode(props.node.id)
}
function openSettings() {
  codeStore.selectNode(props.node.id, true)
}

function startDrag(event: PointerEvent) {
  const target = nodeRef.value
  if (!target) return
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
  if (!canvas) return
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
</script>
