<template>
  <article
    v-if="concept"
    class="pf-panel kr-scroll flex min-h-0 flex-col gap-4 p-3 @5xl:p-5"
    :aria-label="concept.title"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <button
          type="button"
          class="pf-kicker mb-1 text-[0.6rem] text-secondary @5xl:hidden"
          @click="$emit('back')"
        >
          ◀ Concepts
        </button>
        <p class="pf-kicker text-[0.6rem] opacity-70">
          {{ concept.status }} · last grown {{ concept.latestDate }} ·
          {{ concept.latest.mode }}
        </p>
        <p class="pf-display mt-1 text-2xl">{{ concept.title }}</p>
        <p class="mt-1 text-sm opacity-80">
          {{ concept.latest.genrePillar }}
        </p>
      </div>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm btn-primary pf-focusable"
        title="Open this pitch as a Forge draft: its genre’s loadout plus the counts it names"
        @click="forge.forgePitch(concept.conceptId)"
      >
        Forge this
      </button>
    </div>

    <p class="text-base leading-relaxed">{{ concept.latest.hook }}</p>

    <dl class="grid gap-3 text-sm @3xl:grid-cols-2">
      <div
        v-for="field in fields"
        :key="field.label"
        class="flex flex-col gap-0.5"
      >
        <dt class="pf-kicker text-[0.6rem] text-secondary">
          {{ field.label }}
        </dt>
        <dd class="leading-snug opacity-90">{{ field.value }}</dd>
      </div>
    </dl>

    <section class="flex flex-col gap-2" aria-label="Designs">
      <p class="pf-kicker text-[0.6rem] text-secondary">
        Designs · {{ concept.latest.designs.length }}
      </p>
      <ul
        v-if="concept.latest.designs.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-2"
      >
        <li v-for="d in concept.latest.designs" :key="d.title">
          <PlaybookForgeArtCard
            :title="d.title"
            :label="d.kind"
            :prompt="d.prompt"
            @select="forge.forgePitch(concept.conceptId)"
          />
        </li>
      </ul>
      <p v-else class="text-xs opacity-70">
        No design prompts yet. The next development writes them (key art, hero,
        villain, a place, a turning point); or Forge this and add your own.
      </p>
    </section>

    <section
      v-if="concept.latest.signatureSystems.length"
      class="flex flex-col gap-1"
    >
      <p class="pf-kicker text-[0.6rem] text-secondary">Signature systems</p>
      <ul
        class="flex list-disc flex-col gap-1 pl-5 text-sm leading-snug opacity-90"
      >
        <li v-for="system in concept.latest.signatureSystems" :key="system">
          {{ system }}
        </li>
      </ul>
    </section>

    <section v-if="counts.length" class="flex flex-col gap-1">
      <p class="pf-kicker text-[0.6rem] text-secondary">Cast and production</p>
      <ul class="flex flex-wrap gap-1.5">
        <li
          v-for="count in counts"
          :key="count"
          class="pf-chip border-base-content/20 text-xs"
        >
          {{ count }}
        </li>
      </ul>
    </section>

    <section class="grid gap-3 @3xl:grid-cols-3">
      <div
        v-for="list in memoryLists"
        :key="list.label"
        class="flex flex-col gap-1"
      >
        <p class="pf-kicker text-[0.6rem] text-secondary">
          {{ list.label }}
        </p>
        <ul class="flex flex-col gap-1 text-xs leading-snug opacity-85">
          <li v-for="line in list.lines" :key="line">{{ line }}</li>
          <li v-if="!list.lines.length" class="opacity-60">None yet.</li>
        </ul>
      </div>
    </section>

    <section class="flex flex-col gap-1">
      <p class="pf-kicker text-[0.6rem] text-secondary">
        Lineage · {{ concept.versions.length }}
        {{ concept.versions.length === 1 ? 'version' : 'versions' }}
      </p>
      <ol
        class="flex flex-col gap-1.5 border-l border-base-content/20 pl-3 text-xs"
      >
        <li
          v-for="version in [...concept.versions].reverse()"
          :key="version.date + version.slug"
        >
          <span class="font-semibold">{{ version.date }}</span>
          <span class="pf-kicker ml-1 text-[0.55rem] opacity-70">{{
            version.mode
          }}</span>
          <span class="block leading-snug opacity-80">{{
            version.evolution
          }}</span>
        </li>
      </ol>
    </section>

    <section
      class="flex flex-col gap-2"
      aria-label="Notes for the next development"
    >
      <p class="pf-kicker text-[0.6rem] text-secondary">
        Notes for the next development
      </p>
      <ul v-if="concept.notes.length" class="flex flex-col gap-1.5">
        <li
          v-for="(note, i) in concept.notes"
          :key="note.at + i"
          class="border-l-2 py-0.5 pl-2 text-sm"
          :class="
            note.status === 'open'
              ? 'border-primary'
              : 'border-base-content/20 opacity-70'
          "
        >
          <span class="block leading-snug">{{ note.note }}</span>
          <span class="text-[0.65rem] opacity-60"
            >{{ note.by || 'Silas' }} · {{ String(note.at).slice(0, 10) }} ·
            {{
              note.status === 'addressed' && note.addressedIn
                ? `answered in ${note.addressedIn}`
                : note.status
            }}</span
          >
        </li>
      </ul>
      <p v-if="concept.latest.nextQuestions.length" class="text-xs opacity-70">
        Its open questions: {{ concept.latest.nextQuestions.join(' · ') }}
      </p>
      <textarea
        v-model="draftNote"
        rows="3"
        maxlength="4000"
        class="pf-field text-sm leading-snug"
        placeholder="What should the next version keep, change, cut or try?"
        aria-label="Note for the next development"
      />
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs opacity-70" role="status">
          {{ forge.gestationStatus }}
        </p>
        <button
          type="button"
          class="pf-label btn btn-sm btn-primary"
          :disabled="forge.busy || !draftNote.trim()"
          @click="post"
        >
          Leave the note
        </button>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'

// One gestating concept: its latest pitch, cast and production counts,
// editorial memory, lineage, and the notes for its next development.

defineEmits<{ back: [] }>()
const forge = usePlaybookForgeStore()
const draftNote = ref('')
const concept = computed(() => forge.gestationFocused)

const fields = computed(() => {
  const p = concept.value?.latest
  if (!p) return []
  return [
    { label: 'The gap it fills', value: p.genreGap },
    { label: 'Audience', value: p.audience },
    { label: 'World', value: p.worldScope },
    { label: 'Emotional promise', value: p.emotionalPromise },
    { label: 'Core loop', value: p.coreLoop },
    { label: 'Unique mechanic', value: p.uniqueMechanic },
    { label: 'Opening choices', value: p.openingChoices },
    { label: 'This version', value: p.evolution },
  ].filter((field) => field.value)
})

const counts = computed(() => {
  const p = concept.value?.latest
  if (!p) return []
  const label = (key: string) => key.replace(/_/g, ' ')
  return [
    ...Object.entries(p.cast).map(([k, v]) => `${v} ${label(k)}`),
    ...Object.entries(p.production)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${label(k)}`),
  ]
})

const memoryLists = computed(() => {
  const c = concept.value
  if (!c) return []
  return [
    {
      label: 'Keep',
      lines: c.strengths.length
        ? c.strengths
        : [c.latest.preserve].filter(Boolean),
    },
    {
      label: 'Avoid',
      lines: c.guardrails.length
        ? c.guardrails
        : [c.latest.challenge].filter(Boolean),
    },
    { label: 'Next moves', lines: c.nextMoves },
  ]
})

async function post() {
  const c = concept.value
  if (!c) return
  if (await forge.postGestationNote(c.conceptId, draftNote.value))
    draftNote.value = ''
}
</script>
