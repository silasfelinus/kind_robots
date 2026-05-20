<!-- /components/code/code-canvas.vue -->
<template>
  <section
    ref="canvasRef"
    class="relative min-h-0 flex-1 overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-inner"
    @dragover.prevent
    @drop="onDrop"
    @click.self="codeStore.selectNode(null)"
  >
    <div
      class="relative"
      :style="{
        width: `${codeStore.canvasBounds.width}px`,
        height: `${codeStore.canvasBounds.height}px`,
      }"
    >
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--bc)/0.12)_1px,transparent_0)] [background-size:28px_28px]" />

      <svg
        class="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        :width="codeStore.canvasBounds.width"
        :height="codeStore.canvasBounds.height"
      >
        <path
          v-for="connection in visibleConnections"
          :key="connection.id"
          :d="connection.path"
          class="fill-none stroke-primary stroke-[4] opacity-70 drop-shadow-sm"
          stroke-linecap="round"
        />

        <circle
          v-for="connection in visibleConnections"
          :key="`${connection.id}-dot`"
          :cx="connection.end.x"
          :cy="connection.end.y"
          r="5"
          class="fill-primary opacity-90"
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
        class="absolute left-8 top-8 max-w-lg rounded-2xl border border-dashed border-base-300 bg-base-200/80 p-6 text-base-content/70"
      >
        <div class="flex items-center gap-3 text-xl font-black text-primary">
          <icon name="kind-icon:blocks" class="h-8 w-8" />
          Start building
        </div>

        <p class="mt-2 text-sm">
          Drag cards from the toybox, then connect output pegs to matching input sockets. The fancy spaghetti comes later. For now, premium noodles.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCodeStore, type CodeKind } from '@/stores/codeStore'

const codeStore = useCodeStore()
const canvasRef = ref<HTMLElement | null>(null)

const nodeWidth = 280
const headerOffset = 56
const portGap = 34

const getPortIndex = (nodeId: string, portId: string, direction: 'input' | 'output') => {
  const node = codeStore.nodes.find((candidate) => candidate.id === nodeId)
  const definition = node ? codeStore.getDefinition(node.kind) : null
  const ports = direction === 'input' ? definition?.inputs : definition?.outputs

  return ports?.findIndex((port) => port.id === portId) ?? -1
}

const getOutputPoint = (nodeId: string, portId: string) => {
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

const getInputPoint = (nodeId: string, portId: string) => {
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

const visibleConnections = computed(() => {
  return codeStore.connections
    .map((connection) => {
      const start = getOutputPoint(connection.fromNodeId, connection.fromPortId)
      const end = getInputPoint(connection.toNodeId, connection.toPortId)

      if (!start || !end) {
        return null
      }

      const distance = Math.max(80, Math.abs(end.x - start.x) * 0.5)
      const path = `M ${start.x} ${start.y} C ${start.x + distance} ${start.y}, ${end.x - distance} ${end.y}, ${end.x} ${end.y}`

      return {
        id: connection.id,
        start,
        end,
        path,
      }
    })
    .filter((connection): connection is NonNullable<typeof connection> => Boolean(connection))
})

const onDrop = (event: DragEvent) => {
  const kind = event.dataTransfer?.getData('kindrobots/code-kind') as CodeKind

  if (!kind || !canvasRef.value) {
    return
  }

  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left + canvasRef.value.scrollLeft
  const y = event.clientY - rect.top + canvasRef.value.scrollTop

  codeStore.addNode(kind, x, y)
}
</script>