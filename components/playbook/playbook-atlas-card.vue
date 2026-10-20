<template>
  <article
    v-if="node"
    class="group flex flex-col overflow-hidden rounded-2xl border bg-base-100 shadow-lg transition hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-2xl"
    :class="[
      selected
        ? 'border-primary ring-1 ring-primary'
        : 'border-base-content/15',
      dim ? 'opacity-35 hover:opacity-80' : '',
    ]"
  >
    <button
      type="button"
      class="flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
      :aria-pressed="selected"
      :aria-label="`Open ${node.title}`"
      @click="emit('open', node.key)"
    >
      <span
        class="relative m-2 mb-0 block aspect-[3/2] overflow-hidden rounded-xl"
      >
        <PlaybookArt
          :title="node.title"
          :scene="node.scene"
          :art="node.art"
          :art-url="node.artUrl"
          :kind="node.kind"
          :focus="portrait ? 'center 20%' : undefined"
          class="absolute inset-0 transition duration-700 group-hover:scale-[1.04]"
        />
        <span
          class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
        />
        <span
          class="absolute left-3 top-3 rounded-full border border-base-content/25 bg-base-300/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] backdrop-blur"
          >{{ pad(index + 1) }} / {{ store.kindLabel(node.kind) }}</span
        >
      </span>
      <span class="flex flex-1 flex-col px-4 pb-3 pt-3">
        <span
          class="line-clamp-2 font-serif text-lg font-black uppercase leading-tight tracking-wide"
          >{{ node.title }}</span
        >
        <span
          v-if="node.place"
          class="mt-1 line-clamp-1 text-sm text-base-content/70"
          >{{ node.place }}</span
        >
        <span class="mt-auto flex items-center gap-2 pt-4">
          <span class="size-2 shrink-0 rounded-full" :class="status.dot" />
          <span
            class="text-[11px] font-bold uppercase tracking-[.18em]"
            :class="status.text"
            >{{ status.label }}</span
          >
          <Icon
            name="kind-icon:external-link"
            class="ml-auto size-4 text-base-content/70 transition group-hover:text-primary"
          />
        </span>
      </span>
    </button>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookStore } from '~/stores/playbookStore'

// One beat in the Story Atlas (conductor weird-humboldt t-040): its art,
// a numbered kind pill, its title and place, and one status at a glance.
const props = defineProps<{ nodeKey: string; index: number }>()
const emit = defineEmits<{ open: [key: string] }>()

const store = usePlaybookStore()
const node = computed(() => store.nodeFor(props.nodeKey))
const selected = computed(() => store.selectedKey === props.nodeKey)
const dim = computed(() => store.filtersActive && !store.matches(props.nodeKey))
const portrait = computed(() =>
  ['follower', 'ending', 'boss'].includes(node.value?.kind ?? ''),
)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const status = computed(() => {
  const f = store.flags(props.nodeKey)
  if (selected.value)
    return { label: 'Selected', dot: 'bg-primary', text: 'text-primary' }
  if (f.live)
    return { label: 'Live edit', dot: 'bg-success', text: 'text-success' }
  if (f.edited)
    return { label: 'Draft edit', dot: 'bg-pink-400', text: 'text-pink-300' }
  if (f.flagged)
    return { label: 'Image flagged', dot: 'bg-error', text: 'text-error' }
  if (f.requested)
    return {
      label: 'Art requested',
      dot: 'bg-secondary',
      text: 'text-secondary',
    }
  if (f.needsArt)
    return { label: 'Needs art', dot: 'bg-warning', text: 'text-warning' }
  if (node.value?.kind === 'ending')
    return { label: 'Ending', dot: 'bg-violet-300', text: 'text-violet-200' }
  return { label: 'Ready', dot: 'bg-secondary', text: 'text-base-content/80' }
})
</script>
