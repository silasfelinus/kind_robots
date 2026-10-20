<template>
  <article
    v-if="node"
    class="playbook-node group relative overflow-hidden rounded-2xl border-2 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    :class="[
      KIND_STYLE[node.kind].border,
      selected
        ? 'ring-4 ring-primary/70 ring-offset-2 ring-offset-base-200'
        : '',
      dim ? 'opacity-35 hover:opacity-80' : '',
    ]"
  >
    <button
      type="button"
      class="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
      :aria-pressed="selected"
      @click="pick(node.key)"
    >
      <span
        class="relative block overflow-hidden"
        :class="
          tile
            ? 'aspect-[4/3]'
            : node.scene || node.artUrl
              ? 'aspect-[16/7]'
              : 'aspect-[16/5]'
        "
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
          class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10"
        />
        <span class="absolute inset-x-2 top-2 flex items-start gap-1">
          <span class="flex min-w-0 flex-1 flex-wrap gap-1">
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow"
              :class="KIND_STYLE[node.kind].badge"
              >{{ store.kindLabel(node.kind) }}</span
            >
            <span
              v-for="day in dayLabels"
              :key="day"
              class="rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur"
              >{{ day }}</span
            >
          </span>
          <span class="flex shrink-0 flex-col items-end gap-1">
            <span
              v-if="node.needsArt"
              class="rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-black uppercase text-warning-content shadow"
              >Needs art</span
            >
            <span
              v-if="state.live"
              class="rounded-full bg-success px-1.5 py-0.5 text-[10px] font-black text-success-content shadow"
              >Live edit</span
            >
            <span
              v-else-if="state.edited"
              class="rounded-full bg-info px-1.5 py-0.5 text-[10px] font-black text-info-content shadow"
              >Draft edit</span
            >
            <span
              v-if="state.flagged"
              class="inline-flex items-center gap-0.5 rounded-full bg-error px-1.5 py-0.5 text-[10px] font-black text-error-content shadow"
              ><Icon name="kind-icon:flag" class="size-3" /> Flagged</span
            >
            <span
              v-if="state.requested"
              class="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-black text-secondary-content shadow"
              ><Icon name="kind-icon:sparkles" class="size-3" /> Art asked</span
            >
            <span
              v-if="state.notes"
              class="inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-black text-white backdrop-blur"
              ><Icon name="kind-icon:chat" class="size-3" />
              {{ state.notes }}</span
            >
          </span>
        </span>
        <span class="absolute inset-x-0 bottom-0 p-3 text-white">
          <span
            class="block font-serif font-black leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,.8)]"
            :class="tile ? 'text-base' : 'text-xl @lg:text-2xl'"
          >
            {{ node.title }}
          </span>
          <span
            v-if="node.place"
            class="mt-0.5 block truncate text-xs text-white/80 drop-shadow"
            >{{ node.place }}</span
          >
        </span>
      </span>
      <span
        v-if="node.companions.length || node.lenses.length || !tile"
        class="flex flex-wrap items-center gap-1 px-3 pt-2"
        :class="tile ? 'pb-2.5' : ''"
      >
        <span
          v-if="!tile"
          class="mr-auto font-mono text-[10px] text-base-content/45"
          >{{ node.key }}</span
        >
        <span
          v-for="lead in node.companions"
          :key="lead"
          class="rounded-full px-1.5 py-0.5 text-[10px] font-black"
          :class="personStyle(lead)"
          :title="`${store.playbook.peopleLabel}: ${personLabel(lead)}`"
          >{{ personLabel(lead) }}</span
        >
        <span
          v-for="lensId in node.lenses"
          :key="lensId"
          class="rounded-full border border-base-content/20 px-1.5 py-0.5 text-[10px] font-bold text-base-content/70"
          :title="`${store.playbook.variationLabel}: ${lensName(lensId)}`"
          >{{ lensName(lensId) }}</span
        >
        <span
          v-if="tile && node.choices.length"
          class="ml-auto text-[10px] font-bold text-base-content/50"
          >{{ node.choices.length }}
          {{ node.choices.length === 1 ? 'choice' : 'choices' }}</span
        >
      </span>
    </button>

    <ul
      v-if="!tile && node.kind !== 'fork' && node.choices.length"
      class="flex flex-col gap-1 px-3 pb-2.5 pt-1.5"
    >
      <li
        v-for="choice in node.choices"
        :key="choice.id"
        class="flex flex-wrap items-start gap-x-2 gap-y-1 rounded-lg px-1 py-0.5 text-xs hover:bg-base-200/70"
        :class="choice.locked ? 'opacity-50' : ''"
      >
        <span
          aria-hidden="true"
          class="mt-px shrink-0 font-black text-base-content/35"
          >↳</span
        >
        <span class="min-w-[min(100%,14rem)] flex-1">
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
        </span>
        <button
          v-if="choice.leadsTo && store.playbook.nodes[choice.leadsTo]"
          type="button"
          class="ml-auto flex max-w-full shrink-0 items-center gap-1.5 rounded-lg text-[10px] font-bold text-base-content/65 hover:text-primary"
          @click="pick(choice.leadsTo)"
        >
          <Icon name="kind-icon:arrow-right" class="size-3 shrink-0" />
          <span class="truncate">{{
            store.playbook.nodes[choice.leadsTo]?.title
          }}</span>
          <span
            class="relative h-6 w-9 shrink-0 overflow-hidden rounded-md shadow-sm"
          >
            <PlaybookArt
              :title="store.playbook.nodes[choice.leadsTo]?.title ?? ''"
              :scene="store.playbook.nodes[choice.leadsTo]?.scene"
              :art="store.playbook.nodes[choice.leadsTo]?.art"
              :art-url="store.playbook.nodes[choice.leadsTo]?.artUrl"
              :kind="store.playbook.nodes[choice.leadsTo]?.kind"
              class="absolute inset-0"
            />
          </span>
        </button>
      </li>
    </ul>

    <div v-if="!tile && node.kind === 'fork'" class="px-3 pb-3 pt-1.5">
      <p
        class="pb-1.5 text-[10px] font-bold uppercase tracking-wider text-base-content/50"
      >
        {{ store.kindLabel('fork') }} · the cards it can deal
      </p>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))] gap-1.5"
      >
        <button
          v-for="id in node.pool"
          :key="id"
          type="button"
          class="group/card relative aspect-[4/3] overflow-hidden rounded-xl border-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          :class="[
            store.selectedKey === id ? 'border-primary' : 'border-transparent',
            store.filtersActive && !store.matches(id) ? 'opacity-35' : '',
          ]"
          @click="pick(id)"
        >
          <PlaybookArt
            :title="store.playbook.nodes[id]?.title ?? id"
            :scene="store.playbook.nodes[id]?.scene"
            :art="store.playbook.nodes[id]?.art"
            :art-url="store.playbook.nodes[id]?.artUrl"
            :kind="store.playbook.nodes[id]?.kind"
            class="absolute inset-0 transition duration-500 group-hover/card:scale-105"
          />
          <span
            class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
          />
          <span
            v-if="store.playbook.nodes[id]?.needsArt"
            class="absolute right-1 top-1 rounded-full bg-warning px-1 text-[9px] font-black uppercase text-warning-content"
            >Art</span
          >
          <span
            class="absolute inset-x-0 bottom-0 p-1.5 text-[11px] font-black leading-tight text-white drop-shadow"
            >{{ store.playbook.nodes[id]?.title }}</span
          >
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookStore } from '~/stores/playbookStore'
import type { NodeKind } from '~/utils/playbook/types'

// `tile` is the gallery form: picture and title only, choices in the detail.
const props = defineProps<{ nodeKey: string; tile?: boolean }>()
const emit = defineEmits<{ select: [key: string] }>()

const store = usePlaybookStore()
const node = computed(() => store.nodeFor(props.nodeKey))
const selected = computed(() => store.selectedKey === props.nodeKey)
const dim = computed(() => store.filtersActive && !store.matches(props.nodeKey))
const state = computed(() => store.flags(props.nodeKey))
const portrait = computed(() =>
  ['follower', 'ending', 'boss'].includes(node.value?.kind ?? ''),
)
const multiRoute = computed(() => store.playbook.routes.length > 1)
const dayLabels = computed(() => [
  ...new Set(
    (node.value?.placements ?? [])
      .filter((p) => store.route === 'all' || p.route === store.route)
      .map((p) =>
        multiRoute.value && store.route === 'all'
          ? `${p.routeName.replace(/^The /, '').split(' ')[0]} ${store.playbook.dayLabel.charAt(0)}${p.day}`
          : p.dayName,
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

function lensName(id: string) {
  return store.playbook.variations.find((v) => v.id === id)?.label ?? id
}

function personLabel(id: string) {
  return store.playbook.people.find((p) => p.id === id)?.label ?? id
}

const PERSON_STYLES = [
  'bg-fuchsia-500/15 text-fuchsia-700',
  'bg-amber-500/20 text-amber-800',
  'bg-emerald-500/15 text-emerald-700',
  'bg-sky-500/15 text-sky-700',
  'bg-base-300 text-base-content/70',
  'bg-lime-500/20 text-lime-800',
  'bg-rose-500/15 text-rose-700',
  'bg-indigo-500/15 text-indigo-700',
]

function personStyle(id: string) {
  const index = store.playbook.people.findIndex((p) => p.id === id)
  return PERSON_STYLES[Math.max(0, index) % PERSON_STYLES.length]
}

const KIND_STYLE: Record<NodeKind, { border: string; badge: string }> = {
  opening: {
    border: 'border-violet-400/60',
    badge: 'bg-violet-500 text-white',
  },
  spine: {
    border: 'border-emerald-500/50',
    badge: 'bg-emerald-600 text-white',
  },
  fork: { border: 'border-sky-400/60', badge: 'bg-sky-600 text-white' },
  encounter: {
    border: 'border-amber-400/60',
    badge: 'bg-amber-500 text-black',
  },
  crossroads: {
    border: 'border-orange-400/60',
    badge: 'bg-orange-500 text-white',
  },
  boss: { border: 'border-red-500/60', badge: 'bg-red-700 text-white' },
  quest: { border: 'border-teal-500/60', badge: 'bg-teal-600 text-white' },
  follower: {
    border: 'border-fuchsia-400/60',
    badge: 'bg-fuchsia-600 text-white',
  },
  thread: { border: 'border-indigo-400/60', badge: 'bg-indigo-600 text-white' },
  ending: {
    border: 'border-rose-400/70 bg-rose-50/40',
    badge: 'bg-rose-600 text-white',
  },
}
</script>
