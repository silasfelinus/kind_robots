<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-2"
    :aria-label="`Designs: ${tabLabel}`"
  >
    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <p class="pf-kicker mr-auto text-secondary">
        Designs · {{ tabLabel }}
        <span class="opacity-60"
          >· {{ painted }} painted, {{ prompted }} prompted,
          {{ cards.length - painted - prompted }} to write</span
        >
      </p>
      <input
        v-model="search"
        type="search"
        class="pf-field w-40 py-1 text-xs"
        placeholder="Find a design"
        aria-label="Find a design"
      />
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm btn-ghost pf-focusable"
        @click="forge.openCatalog()"
      >
        Catalogue
      </button>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm btn-primary pf-focusable"
        @click="startNew"
      >
        + New design
      </button>
    </div>

    <div class="kr-scroll -mx-1 min-h-0 flex-1 px-1 py-1">
      <form
        v-if="editing"
        class="pf-panel mb-3 grid gap-2 p-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
        aria-label="Edit design"
        @submit.prevent="save"
      >
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Kind">
            <button
              v-for="kind in kinds"
              :key="kind.id"
              type="button"
              class="pf-chip pf-focusable"
              :class="
                editing.kind === kind.id
                  ? 'border-primary text-primary'
                  : 'border-base-content/20 opacity-80'
              "
              :aria-pressed="editing.kind === kind.id"
              @click="editing.kind = kind.id"
            >
              {{ kind.label }}
            </button>
          </div>
          <input
            v-model="editing.title"
            maxlength="120"
            class="pf-field text-sm"
            placeholder="Name it"
            aria-label="Design name"
          />
          <textarea
            v-model="editing.note"
            rows="3"
            maxlength="1200"
            class="pf-field text-sm"
            placeholder="What it is, where it goes, why it matters"
            aria-label="Design note"
          />
          <p v-if="editing.source" class="text-[0.7rem] opacity-60">
            {{ editing.source }}
          </p>
        </div>
        <div class="flex flex-col gap-2">
          <textarea
            v-model="editing.prompt"
            rows="6"
            maxlength="1200"
            class="pf-field text-sm leading-snug"
            placeholder="The picture in plain prose: who is there, where, what is happening, the light and mood. No titles or lettering."
            aria-label="Art prompt"
          />
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button
              v-if="isSaved"
              type="button"
              class="pf-label btn btn-sm btn-ghost text-error"
              @click="remove"
            >
              Delete
            </button>
            <button
              type="button"
              class="pf-label btn btn-sm btn-ghost"
              @click="editing = null"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="pf-label btn btn-sm btn-secondary"
              :disabled="!editing.title.trim()"
            >
              Save
            </button>
            <button
              type="button"
              class="pf-label btn btn-sm btn-primary"
              :disabled="!editing.title.trim() || !editing.prompt?.trim()"
              title="Save, then render the prompt on Krea 2"
              @click="saveAndRender"
            >
              Save and render
            </button>
          </div>
        </div>
      </form>

      <p v-if="!cards.length && !editing" class="pf-help text-sm">
        Nothing on this page yet. Add a design with a prompt, or pull
        Characters, Locations, Scenarios and Facets from the Catalogue.
      </p>

      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-3"
        aria-label="Design cards"
      >
        <li v-for="card in shown" :key="card.id" class="flex flex-col gap-1">
          <PlaybookForgeArtCard
            :title="card.title"
            :label="cardLabel(card)"
            :subtitle="card.subtitle"
            :image-url="card.imageUrl"
            :prompt="card.prompt"
            :badge="badge(card)"
            :empty-text="
              card.origin === 'beat'
                ? 'No authored prompt yet.'
                : 'Write a prompt to render it.'
            "
            @select="open(card)"
          />
          <button
            v-if="
              card.origin === 'design' &&
              card.prompt &&
              !card.imageUrl &&
              !card.design?.jobId
            "
            type="button"
            class="pf-label btn btn-xs btn-ghost self-start"
            @click="forge.renderDesign(card.design!.id)"
          >
            Render
          </button>
        </li>
      </ul>
      <button
        v-if="filtered.length > shown.length"
        type="button"
        class="pf-label btn btn-sm btn-ghost mt-3"
        @click="limit += 60"
      >
        Show {{ Math.min(60, filtered.length - shown.length) }} more of
        {{ filtered.length - shown.length }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { ADDITION_KINDS } from '~/utils/playbookForge/adjust'
import {
  TAB_DESIGNS,
  newDesignId,
  type Design,
  type DesignCard,
} from '~/utils/playbookForge/designs'
import { FORGE_TABS } from '~/utils/playbookForge/factors'

// The design board: the plan page's art first. Built beats show their
// painting or authored prompt and open in Beats; designs are written,
// edited and rendered here.

const forge = usePlaybookForgeStore()
const search = ref('')
const limit = ref(60)
const editing = ref<Design | null>(null)

const tabLabel = computed(
  () => FORGE_TABS.find((t) => t.id === forge.tab)?.label ?? 'Pitch',
)
const kinds = computed(() =>
  ADDITION_KINDS.filter((k) =>
    (TAB_DESIGNS[forge.tab] as readonly string[]).includes(k.id),
  ),
)
const cards = computed(() => forge.designCards)
const painted = computed(() => cards.value.filter((c) => c.imageUrl).length)
const prompted = computed(
  () => cards.value.filter((c) => !c.imageUrl && c.prompt).length,
)
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q
    ? cards.value.filter((c) =>
        `${c.title} ${c.subtitle} ${c.prompt ?? ''}`.toLowerCase().includes(q),
      )
    : cards.value
})
const shown = computed(() => filtered.value.slice(0, limit.value))
const isSaved = computed(
  () =>
    !!editing.value && forge.designs.some((d) => d.id === editing.value!.id),
)

watch(
  () => forge.tab,
  () => {
    limit.value = 60
    editing.value = null
  },
)

function cardLabel(card: DesignCard) {
  return card.origin === 'beat' ? card.kind : `design · ${card.kind}`
}

function badge(card: DesignCard) {
  if (card.origin !== 'design') return ''
  const job = forge.designJobs[card.design!.id]
  if (job) return job
  if (card.design?.jobId && !card.imageUrl) return 'Queued'
  return 'Design'
}

function startNew() {
  editing.value = {
    id: newDesignId(),
    kind: kinds.value[0]?.id ?? 'other',
    title: '',
    note: '',
    prompt: '',
  }
}

function open(card: DesignCard) {
  if (card.origin === 'design' && card.design) {
    editing.value = { ...card.design }
    return
  }
  if (card.beatKey && forge.existing)
    void forge.openBeats(forge.existing.slug, card.beatKey)
}

function save() {
  if (!editing.value?.title.trim()) return
  forge.saveDesign({
    ...editing.value,
    title: editing.value.title.trim(),
    note: editing.value.note.trim(),
    prompt: editing.value.prompt?.trim() || undefined,
  })
  editing.value = null
}

function saveAndRender() {
  const id = editing.value?.id
  save()
  if (id) void forge.renderDesign(id)
}

function remove() {
  if (editing.value) forge.removeDesign(editing.value.id)
  editing.value = null
}

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  void forge.refreshDesignJobs()
  timer = setInterval(() => {
    if (forge.designs.some((d) => d.jobId && !d.imageUrl))
      void forge.refreshDesignJobs()
  }, 30000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>
