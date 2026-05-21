<!-- /components/code/code-canvas.vue -->
<template>
  <section
    class="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-slate-950 shadow-inner"
  >
    <div
      ref="canvasRef"
      data-code-canvas-scroll
      class="relative h-full min-h-[640px] w-full overflow-auto"
      @dragover.prevent
      @drop="onDrop"
      @click.self="clearCanvasSelection"
    >
      <div
        class="relative"
        :style="{
          width: `${codeStore.transformedCanvasBounds.width}px`,
          height: `${codeStore.transformedCanvasBounds.height}px`,
        }"
      >
        <div
          class="absolute left-0 top-0 origin-top-left"
          :style="canvasTransformStyle"
        >
          <div
            class="relative overflow-hidden rounded-2xl"
            :style="{
              width: `${codeStore.canvasBounds.width}px`,
              height: `${codeStore.canvasBounds.height}px`,
            }"
            @click.self="clearCanvasSelection"
          >
            <div
              v-if="codeStore.showCanvasGrid"
              class="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:28px_28px]"
            />

            <div
              v-if="codeStore.showCanvasGrid"
              class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,211,252,0.18)_1px,transparent_0)] [background-size:112px_112px]"
            />

            <div class="pointer-events-none absolute inset-0 opacity-20">
              <div
                class="absolute left-24 top-24 h-28 w-40 rounded-2xl border border-cyan-300/30"
              />
              <div
                class="absolute right-44 top-36 h-20 w-20 rounded-full border border-cyan-300/30"
              />
              <div
                class="absolute bottom-44 left-1/3 h-24 w-48 rounded-2xl border border-cyan-300/20"
              />
              <div
                class="absolute bottom-32 right-72 h-16 w-16 rounded-full border border-cyan-300/20"
              />
            </div>

            <svg
              class="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
              :width="codeStore.canvasBounds.width"
              :height="codeStore.canvasBounds.height"
            >
              <path
                v-for="connection in visibleConnections"
                :key="connection.id"
                :d="connection.path"
                class="fill-none stroke-[5] opacity-80 drop-shadow-sm"
                :class="connection.className"
                stroke-linecap="round"
              />

              <path
                v-for="connection in visibleConnections"
                :key="`${connection.id}-glow`"
                :d="connection.path"
                class="fill-none stroke-[11] opacity-20 blur-sm"
                :class="connection.className"
                stroke-linecap="round"
              />

              <circle
                v-for="connection in visibleConnections"
                :key="`${connection.id}-start`"
                :cx="connection.start.x"
                :cy="connection.start.y"
                r="5"
                class="fill-base-100 stroke-current stroke-2 opacity-90"
                :class="connection.className"
              />

              <circle
                v-for="connection in visibleConnections"
                :key="`${connection.id}-end`"
                :cx="connection.end.x"
                :cy="connection.end.y"
                r="6"
                class="fill-base-100 stroke-current stroke-2 opacity-90"
                :class="connection.className"
              />
            </svg>

            <code-node
              v-for="node in codeStore.nodes"
              :key="node.id"
              :node="node"
              class="absolute z-20"
              :style="{
                left: `${node.x}px`,
                top: `${node.y}px`,
              }"
            />

            <div
              v-if="!codeStore.nodes.length"
              class="absolute left-1/2 top-1/2 z-20 w-[min(88vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-dashed border-cyan-300/40 bg-slate-900/80 p-6 text-center text-slate-100 shadow-2xl backdrop-blur"
            >
              <div
                class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-200 shadow-lg"
              >
                <icon name="kind-icon:blocks" class="h-12 w-12" />
              </div>

              <h2 class="mt-4 text-xl font-black text-cyan-100">
                Drag cards here to build
              </h2>

              <p class="mt-2 text-sm text-cyan-100/70">
                Start with a text input, image upload, prompt, character, or
                model card. Snap outputs into matching inputs. Tiny brick
                wizardry, basically.
              </p>

              <div class="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  class="btn btn-sm rounded-2xl border-cyan-300/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400 hover:text-cyan-950"
                  type="button"
                  @click.stop="addStarterNode('text-input')"
                >
                  <icon name="kind-icon:chat" class="h-4 w-4" />
                  Text Input
                </button>

                <button
                  class="btn btn-sm rounded-2xl border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-100 hover:bg-fuchsia-400 hover:text-fuchsia-950"
                  type="button"
                  @click.stop="addStarterNode('stable-diffusion')"
                >
                  <icon name="kind-icon:paintbrush" class="h-4 w-4" />
                  Art Card
                </button>

                <button
                  class="btn btn-sm rounded-2xl border-amber-300/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400 hover:text-amber-950"
                  type="button"
                  @click.stop="codeStore.loadTemplate('art-maker')"
                >
                  <icon name="kind-icon:sparkles" class="h-4 w-4" />
                  Art Maker
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pointer-events-none absolute left-3 top-3 z-30">
      <div class="pointer-events-auto">
        <code-controls />
      </div>
    </div>

    <div
      class="pointer-events-none absolute bottom-3 left-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2"
    >
      <div
        v-if="codeStore.pendingConnection"
        class="pointer-events-auto flex items-center gap-2 rounded-2xl border border-info/40 bg-info/15 px-3 py-2 text-xs font-bold text-info-content shadow-lg backdrop-blur"
      >
        <icon name="kind-icon:link" class="h-4 w-4" />
        Pick a matching input socket.

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="codeStore.cancelConnection()"
        >
          Cancel
        </button>
      </div>

      <div
        v-else-if="codeStore.message"
        class="rounded-2xl border border-cyan-300/30 bg-slate-900/90 px-3 py-2 text-xs font-bold text-cyan-100 shadow-lg backdrop-blur"
      >
        {{ codeStore.message }}
      </div>
    </div>

    <div
      v-if="codeStore.showMiniMap"
      class="absolute bottom-3 right-3 z-30 hidden h-28 w-40 rounded-2xl border border-cyan-300/30 bg-slate-900/90 p-2 shadow-lg backdrop-blur md:block"
    >
      <div
        class="relative h-full w-full overflow-hidden rounded-xl border border-cyan-300/20 bg-slate-950"
      >
        <div
          v-for="node in codeStore.nodes"
          :key="`mini-${node.id}`"
          class="absolute h-2 w-3 rounded-full bg-cyan-300 shadow"
          :style="miniNodeStyle(node)"
        />

        <div
          class="absolute bottom-1 right-1 rounded-md bg-cyan-300/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-cyan-100"
        >
          {{ codeStore.zoomPercent }}%
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCodeStore, type CodeKind, type CodeNode } from '@/stores/codeStore'

const codeStore = useCodeStore()
const canvasRef = ref<HTMLElement | null>(null)

const nodeWidth = 280
const headerOffset = 56
const portGap = 34

const canvasTransformStyle = computed(() => {
  return {
    width: `${codeStore.canvasBounds.width}px`,
    height: `${codeStore.canvasBounds.height}px`,
    transform: `translate(${codeStore.panX}px, ${codeStore.panY}px) scale(${codeStore.zoom})`,
    transformOrigin: '0 0',
  }
})

const visibleConnections = computed(() => {
  return codeStore.connections
    .map((connection) => {
      const start = getOutputPoint(connection.fromNodeId, connection.fromPortId)
      const end = getInputPoint(connection.toNodeId, connection.toPortId)

      if (!start || !end) {
        return null
      }

      const distance = Math.max(90, Math.abs(end.x - start.x) * 0.5)
      const path = `M ${start.x} ${start.y} C ${start.x + distance} ${start.y}, ${end.x - distance} ${end.y}, ${end.x} ${end.y}`

      return {
        id: connection.id,
        start,
        end,
        path,
        className: codeStore.getConnectionClass(connection.type),
      }
    })
    .filter((connection): connection is NonNullable<typeof connection> =>
      Boolean(connection),
    )
})

function getPortIndex(
  nodeId: string,
  portId: string,
  direction: 'input' | 'output',
) {
  const node = codeStore.nodes.find((candidate) => candidate.id === nodeId)
  const definition = node ? codeStore.getDefinition(node.kind) : null
  const ports = direction === 'input' ? definition?.inputs : definition?.outputs

  return ports?.findIndex((port) => port.id === portId) ?? -1
}

function getOutputPoint(nodeId: string, portId: string) {
  const node = codeStore.nodes.find((candidate) => candidate.id === nodeId)
  const index = getPortIndex(nodeId, portId, 'output')

  if (!node || index < 0) {
    return null
  }

  return {
    x: node.x + nodeWidth,
    y: node.y + headerOffset + index * portGap + 18,
  }
}

function getInputPoint(nodeId: string, portId: string) {
  const node = codeStore.nodes.find((candidate) => candidate.id === nodeId)
  const index = getPortIndex(nodeId, portId, 'input')

  if (!node || index < 0) {
    return null
  }

  return {
    x: node.x,
    y: node.y + headerOffset + index * portGap + 18,
  }
}

function onDrop(event: DragEvent) {
  const kind = event.dataTransfer?.getData('kindrobots/code-kind') as CodeKind

  if (!kind || !canvasRef.value) {
    return
  }

  const rect = canvasRef.value.getBoundingClientRect()
  const rawX = event.clientX - rect.left + canvasRef.value.scrollLeft
  const rawY = event.clientY - rect.top + canvasRef.value.scrollTop
  const point = codeStore.toCanvasPoint(rawX, rawY)

  codeStore.addNode(kind, point.x, point.y)
}

function addStarterNode(kind: CodeKind) {
  const target = canvasRef.value

  if (!target) {
    codeStore.addNode(kind, 160, 160)
    return
  }

  const centerX = target.scrollLeft + target.clientWidth * 0.5
  const centerY = target.scrollTop + target.clientHeight * 0.5
  const point = codeStore.toCanvasPoint(centerX, centerY)

  codeStore.addNode(kind, point.x - 140, point.y - 80)
}

function clearCanvasSelection() {
  codeStore.selectNode(null)
}

async function fitCanvas() {
  if (!canvasRef.value) {
    codeStore.fitToView()
    return
  }

  codeStore.setViewport(canvasRef.value.clientWidth, canvasRef.value.clientHeight)

  codeStore.fitToView({
    width: canvasRef.value.clientWidth,
    height: canvasRef.value.clientHeight,
  })

  await nextTick()

  if (!codeStore.nodes.length) {
    return
  }

  const bounds = codeStore.nodeBounds

  canvasRef.value.scrollTo({
    left: Math.max(0, bounds.minX * codeStore.zoom - 120),
    top: Math.max(0, bounds.minY * codeStore.zoom - 120),
    behavior: 'smooth',
  })
}

function updateViewport() {
  if (!canvasRef.value) {
    return
  }

  codeStore.setViewport(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
}

function miniNodeStyle(node: CodeNode) {
  const bounds = codeStore.canvasBounds
  const x = Math.max(0, Math.min(92, (node.x / bounds.width) * 100))
  const y = Math.max(0, Math.min(92, (node.y / bounds.height) * 100))

  return {
    left: `${x}%`,
    top: `${y}%`,
  }
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>