<template>
  <article
    v-if="node"
    class="playbook-node group relative rounded-2xl border bg-base-100 shadow-sm transition"
    :class="[
      KIND_STYLE[node.kind].border,
      selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : '',
      dim ? 'opacity-35 hover:opacity-80' : '',
    ]"
  >
    <button
      type="button"
      class="flex w-full gap-3 rounded-2xl p-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      :aria-pressed="selected"
      @click="pick(node.key)"
    >
      <span
        class="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-base-300"
      >
        <EcotoneScene
          :kind="node.scene"
          :art="node.art ?? undefined"
          :label="node.title"
          class="absolute inset-0"
        />
        <span
          v-if="node.needsArt"
          class="absolute inset-x-0 bottom-0 bg-warning/90 px-1 text-center text-[10px] font-black uppercase tracking-wide text-warning-content"
          >Needs art</span
        >
      </span>
      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-1">
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
            :class="KIND_STYLE[node.kind].badge"
            >{{ KIND_STYLE[node.kind].label }}</span
          >
          <span class="font-mono text-[10px] text-base-content/50">{{
            node.key
          }}</span>
          <span
            v-for="day in dayLabels"
            :key="day"
            class="rounded-full bg-base-200 px-1.5 py-0.5 text-[10px] font-bold"
            >{{ day }}</span
          >
        </span>
        <span
          class="mt-0.5 block font-serif text-base font-black leading-tight"
        >
          {{ node.title }}
        </span>
        <span
          v-if="node.place"
          class="block truncate text-xs text-base-content/60"
          >{{ node.place }}</span
        >
        <span class="mt-1 flex flex-wrap items-center gap-1">
          <span
            v-for="lead in node.companions"
            :key="lead"
            class="rounded-full px-1.5 py-0.5 text-[10px] font-black"
            :class="LEAD_STYLE[lead]"
            :title="`Written for ${leadLabel(lead)}`"
            >{{ leadLabel(lead) }}</span
          >
          <span
            v-for="lensId in node.lenses"
            :key="lensId"
            class="rounded-full border border-base-content/20 px-1.5 py-0.5 text-[10px] font-bold text-base-content/70"
            :title="`Has a ${lensName(lensId)} variation`"
            >{{ lensName(lensId) }}</span
          >
        </span>
      </span>
      <span class="flex shrink-0 flex-col items-end gap-1">
        <span
          v-if="state.live"
          class="rounded-full bg-success px-1.5 py-0.5 text-[10px] font-black text-success-content"
          >Live edit</span
        >
        <span
          v-else-if="state.edited"
          class="rounded-full bg-info/20 px-1.5 py-0.5 text-[10px] font-black"
          >Draft edit</span
        >
        <span
          v-if="state.flagged"
          class="inline-flex items-center gap-0.5 rounded-full bg-error/15 px-1.5 py-0.5 text-[10px] font-black text-error"
          ><Icon name="kind-icon:flag" class="size-3" /> Flagged</span
        >
        <span
          v-if="state.notes"
          class="inline-flex items-center gap-0.5 rounded-full bg-base-200 px-1.5 py-0.5 text-[10px] font-black"
          ><Icon name="kind-icon:chat" class="size-3" /> {{ state.notes }}</span
        >
        <span
          v-if="state.requested"
          class="inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-1.5 py-0.5 text-[10px] font-black"
          ><Icon name="kind-icon:sparkles" class="size-3" /> Art asked</span
        >
      </span>
    </button>

    <ul
      v-if="!compact && node.kind !== 'fork' && node.choices.length"
      class="flex flex-col gap-1 border-t border-base-content/10 px-2.5 py-2"
    >
      <li
        v-for="choice in node.choices"
        :key="choice.id"
        class="flex items-start gap-2 text-xs"
        :class="choice.locked ? 'opacity-50' : ''"
      >
        <span
          aria-hidden="true"
          class="mt-px shrink-0 font-black text-base-content/35"
          >↳</span
        >
        <span class="min-w-0 flex-1">
          <span class="font-bold">{{ display(choice.label) }}</span>
          <span
            v-if="choice.check"
            class="ml-1 rounded bg-base-200 px-1 font-mono text-[10px]"
            >{{ choice.check.skill }} {{ choice.check.target }}</span
          >
          <span
            v-for="tag in choice.tags"
            :key="tag"
            class="ml-1 rounded bg-primary/10 px-1 text-[10px] font-bold text-primary"
            >{{ tag }}</span
          >
          <button
            v-if="choice.leadsTo && store.playbook.nodes[choice.leadsTo]"
            type="button"
            class="ml-1 inline-flex items-center gap-0.5 text-[10px] text-base-content/55 underline-offset-2 hover:underline"
            @click="pick(choice.leadsTo)"
          >
            <Icon name="kind-icon:arrow-right" class="size-3" />{{
              store.playbook.nodes[choice.leadsTo]?.title
            }}
          </button>
        </span>
      </li>
    </ul>

    <div
      v-if="!compact && node.kind === 'fork'"
      class="border-t border-base-content/10 p-2"
    >
      <p
        class="px-0.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-base-content/50"
      >
        White rabbits in the pool · up to 3 dealt face up
      </p>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1.5">
        <button
          v-for="id in node.pool"
          :key="id"
          type="button"
          class="flex items-center gap-2 rounded-xl border bg-base-200/60 p-1.5 text-left transition hover:border-primary"
          :class="[
            store.selectedKey === id
              ? 'border-primary'
              : 'border-base-content/10',
            store.filtersActive && !store.matches(id) ? 'opacity-35' : '',
          ]"
          @click="pick(id)"
        >
          <span
            class="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-base-300"
          >
            <EcotoneScene
              :kind="store.playbook.nodes[id]?.scene ?? 'meadow'"
              :art="store.playbook.nodes[id]?.art ?? undefined"
              :label="store.playbook.nodes[id]?.title ?? id"
              class="absolute inset-0"
            />
          </span>
          <span class="min-w-0">
            <span class="block truncate text-xs font-black">{{
              store.playbook.nodes[id]?.title
            }}</span>
            <span class="block truncate text-[10px] text-base-content/55"
              >{{ id }} · {{ store.playbook.nodes[id]?.place }}</span
            >
          </span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookStore } from '~/stores/playbookStore'
import { LENSES, type LeadId, type LensId } from '~/utils/ecotone/content'
import { leadLabel, type NodeKind } from '~/utils/playbook/ecotone'

const props = defineProps<{ nodeKey: string; compact?: boolean }>()
const emit = defineEmits<{ select: [key: string] }>()

const store = usePlaybookStore()
const node = computed(() => store.nodeFor(props.nodeKey))
const selected = computed(() => store.selectedKey === props.nodeKey)
const dim = computed(() => store.filtersActive && !store.matches(props.nodeKey))
const state = computed(() => store.flags(props.nodeKey))
const dayLabels = computed(() => [
  ...new Set(
    (node.value?.placements ?? [])
      .filter((p) => store.route === 'all' || p.route === store.route)
      .map((p) =>
        store.route === 'all'
          ? `${p.route === 'kinetic' ? 'Race' : 'Fair'} D${p.day}`
          : `Day ${p.day}, ${p.dayName}`,
      ),
  ),
])

function pick(key: string) {
  store.selectedKey = key
  emit('select', key)
}

function display(label: string) {
  return label.replaceAll('{companion}', '‹companion›')
}

function lensName(id: LensId) {
  return LENSES.find((l) => l.id === id)?.short ?? id
}

const KIND_STYLE: Record<
  NodeKind,
  { label: string; border: string; badge: string }
> = {
  opening: {
    label: 'Opening',
    border: 'border-violet-400/60',
    badge: 'bg-violet-500 text-white',
  },
  spine: {
    label: 'Story spine',
    border: 'border-emerald-500/50',
    badge: 'bg-emerald-600 text-white',
  },
  fork: {
    label: 'White rabbit',
    border: 'border-sky-400/60',
    badge: 'bg-sky-600 text-white',
  },
  encounter: {
    label: 'Random encounter',
    border: 'border-amber-400/60',
    badge: 'bg-amber-500 text-black',
  },
  crossroads: {
    label: 'Crossroads',
    border: 'border-orange-400/60',
    badge: 'bg-orange-500 text-white',
  },
  ending: {
    label: 'Ending storyline',
    border: 'border-rose-400/70 bg-rose-50/40',
    badge: 'bg-rose-600 text-white',
  },
}

const LEAD_STYLE: Record<LeadId, string> = {
  mara: 'bg-fuchsia-500/15 text-fuchsia-700',
  kit: 'bg-amber-500/20 text-amber-800',
  juniper: 'bg-emerald-500/15 text-emerald-700',
  cedar: 'bg-sky-500/15 text-sky-700',
  alone: 'bg-base-300 text-base-content/70',
}
</script>
