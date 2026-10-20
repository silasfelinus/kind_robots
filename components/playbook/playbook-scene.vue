<template>
  <div v-if="node" class="flex flex-col gap-4">
    <div>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-[.16em] text-base-content/80 hover:text-primary"
        @click="emit('back')"
      >
        <Icon name="kind-icon:chevron-left" class="size-4" /> All scenes
      </button>
      <h2
        class="mt-2 font-serif text-3xl font-black uppercase leading-[1.02] tracking-wide @2xl:text-5xl"
      >
        {{ node.title }}
      </h2>
      <p
        class="mt-2 text-xs font-bold uppercase tracking-[.18em] text-primary @2xl:text-sm"
      >
        {{ breadcrumb }}
      </p>
    </div>

    <div
      class="rounded-[1.4rem] border border-primary/60 bg-base-200 p-2 shadow-2xl"
    >
      <div
        class="relative overflow-hidden rounded-2xl"
        :class="
          portrait
            ? 'aspect-[4/5] max-h-[36rem]'
            : 'aspect-[4/3] @xl:aspect-video'
        "
      >
        <PlaybookArt
          :title="node.title"
          :scene="node.scene"
          :art="node.art"
          :art-url="node.artUrl"
          :kind="node.kind"
          :focus="portrait ? 'center 20%' : undefined"
          class="absolute inset-0"
        />
        <span
          class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/10"
        />
        <span
          class="absolute left-3 top-3 flex flex-wrap gap-1.5 @2xl:left-5 @2xl:top-5"
        >
          <span class="inline-flex studio-pill">{{ node.key }}</span>
          <span v-if="node.variations.length" class="inline-flex studio-pill"
            >{{ node.variations.length }}
            {{ node.variations.length === 1 ? 'variant' : 'variants' }}</span
          >
          <span
            v-if="node.needsArt"
            class="inline-flex studio-pill border-warning/70! text-warning!"
            >Needs art</span
          >
        </span>
        <div
          class="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 @2xl:p-8"
        >
          <p
            v-if="quote"
            class="line-clamp-3 font-serif text-base leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.9)] @xl:text-xl @2xl:text-3xl"
          >
            “{{ quote }}”
          </p>
          <p class="text-xs font-bold text-primary @2xl:text-sm">
            {{ visual }} · {{ candidates }}
            {{ candidates === 1 ? 'art candidate' : 'art candidates' }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="studio-gold-button text-xs"
              @click="emit('art')"
            >
              {{ node.needsArt ? 'Request art' : 'View art options' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="node.placements.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="(placement, index) in node.placements"
        :key="index"
        class="rounded-full border border-base-content/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-base-content/75"
        >{{ placement.routeName }} · {{ store.playbook.dayLabel }}
        {{ placement.day }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookStore } from '~/stores/playbookStore'

// The Studio's scene card (conductor weird-humboldt t-040): back to the
// Atlas, the beat's title and breadcrumb, and its art framed in gold with a
// line from the beat and how many art candidates it has.
const emit = defineEmits<{ back: []; art: [] }>()

const store = usePlaybookStore()
const node = computed(() => store.selected)
const portrait = computed(() =>
  ['follower', 'ending', 'boss'].includes(node.value?.kind ?? ''),
)

const breadcrumb = computed(() => {
  const n = node.value
  if (!n) return ''
  const game = store.games.find((g) => g.id === store.game)?.title ?? ''
  const where = n.placements[0]
  const parts = [
    game,
    where
      ? `${store.playbook.dayLabel} ${String(where.day).padStart(2, '0')}`
      : '',
    where?.routeName ?? store.kindLabel(n.kind),
  ]
  return parts.filter(Boolean).join(' / ')
})

/** The first sentence of the beat, as the line over its picture. */
const quote = computed(() => {
  const first = node.value?.body[0]?.replace(/\*/g, '').trim() ?? ''
  const sentence = first.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? first
  return sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence
})

const visual = computed(() => {
  const n = node.value
  if (!n) return ''
  if (n.artUrl) return 'Selected visual: painted art'
  if (n.scene) return 'Selected visual: drawn scene'
  return 'No art yet'
})

const candidates = computed(() =>
  node.value
    ? store
        .notesFor(node.value.key)
        .filter((n) => !n.resolved && ['image', 'art-request'].includes(n.kind))
        .length
    : 0,
)
</script>
