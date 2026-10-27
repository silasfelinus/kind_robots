<template>
  <aside
    class="pf-panel kr-scroll flex min-h-0 flex-col gap-4 p-3 @5xl:p-4"
    :aria-label="entry ? `Beat: ${entry.title}` : 'Section notes'"
  >
    <template v-if="entry">
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          data-nav
          class="pf-label btn btn-ghost btn-xs pf-focusable"
          @click="forge.focusEntry(null)"
        >
          ◀ {{ forge.galleryTile?.label }}
        </button>
        <button
          type="button"
          data-nav
          class="pf-label btn btn-ghost btn-xs pf-focusable"
          title="Edit the scene text, choices and variations"
          @click="
            forge.existing && forge.openBeats(forge.existing.slug, entry.key)
          "
        >
          Edit the writing
        </button>
      </div>

      <div class="pf-art-card-frame pf-gallery-hero">
        <img
          v-if="shown"
          :src="shown"
          alt=""
          class="pf-art-card-img object-contain"
        />
        <span v-else-if="activeVariant" class="pf-art-card-empty text-sm">
          {{ activeVariant.label }} portrait is still unpainted.
        </span>
        <PlaybookArt
          v-else-if="entry.scene"
          :title="entry.title"
          :scene="entry.scene"
          :art="entry.art"
          :kind="entry.kind"
          class="absolute inset-0"
        />
        <span v-else class="pf-art-card-empty">
          <span class="pf-kicker text-[0.6rem] opacity-70">{{
            STATUS_LABEL[status]
          }}</span>
          <span class="text-xs opacity-70">{{
            entry.prompt
              ? 'Review the prompt below, then render it.'
              : 'Nothing to paint from yet: write the prompt below, or ask the agents for one.'
          }}</span>
        </span>
      </div>

      <div>
        <p class="pf-kicker text-[0.6rem] opacity-70">
          {{ STATUS_LABEL[status]
          }}<template v-if="entry.place"> · {{ entry.place }}</template>
        </p>
        <p class="pf-display text-xl leading-tight">{{ entry.title }}</p>
      </div>

      <section v-if="entry.artVariants.length" aria-label="Identity forms">
        <p class="pf-kicker mb-2 text-secondary">
          Identity forms · choose a trading card
        </p>
        <ul class="grid grid-cols-3 gap-2">
          <li v-for="variant in entry.artVariants" :key="variant.id">
            <button
              type="button"
              data-nav
              class="pf-art-card pf-focusable block w-full"
              :class="selectedForm === variant.id ? 'pf-art-card-on' : ''"
              :aria-pressed="selectedForm === variant.id"
              @click="
                selectedForm = selectedForm === variant.id ? null : variant.id
              "
            >
              <span class="pf-art-card-frame block">
                <img
                  v-if="variant.imageUrl"
                  :src="variant.imageUrl"
                  :alt="variant.label"
                  class="pf-art-card-img"
                />
                <span v-else class="pf-art-card-empty text-xs"
                  >Art pending</span
                >
              </span>
              <span class="pf-label block px-1 py-2 text-left text-xs">{{
                variant.label
              }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="activeVariant?.stats"
        class="space-y-2"
        aria-label="Character form statistics"
      >
        <p class="pf-kicker text-secondary">
          {{ activeVariant.label }} · stats
        </p>
        <ul class="grid grid-cols-2 gap-2">
          <li
            v-for="[name, value] in Object.entries(activeVariant.stats)"
            :key="name"
            class="pf-help rounded p-2"
          >
            <div class="flex justify-between gap-1 text-xs">
              <span class="capitalize">{{ name }}</span
              ><strong>{{ value }}</strong>
            </div>
            <div class="mt-1 h-1 overflow-hidden rounded bg-base-content/10">
              <span
                class="block h-full bg-primary"
                :style="{ width: `${Math.min(100, value * 20)}%` }"
              />
            </div>
          </li>
        </ul>
      </section>

      <section
        v-if="
          entry.body.length || entry.variations.length || entry.choices.length
        "
        class="space-y-3"
        aria-label="Authored character details"
      >
        <p class="pf-kicker text-secondary">Story bible · authored material</p>
        <p
          v-for="(line, i) in entry.body"
          :key="i"
          class="text-sm leading-relaxed whitespace-pre-line"
        >
          {{ line }}
        </p>
        <div v-if="entry.variations.length" class="space-y-2">
          <details
            v-for="variation in entry.variations"
            :key="`${variation.axis}:${variation.key}`"
            class="pf-help rounded-md p-2"
            :open="
              selectedForm === variation.key ||
              (!selectedForm && variation.key === 'student')
            "
          >
            <summary class="pf-label cursor-pointer text-sm">
              {{ variation.label }}
            </summary>
            <p class="mt-2 text-sm leading-relaxed whitespace-pre-line">
              {{ variation.text }}
            </p>
          </details>
        </div>
        <div v-if="entry.choices.length" class="space-y-2">
          <p class="pf-kicker text-[0.6rem] opacity-70">
            Choices and consequences
          </p>
          <article
            v-for="choice in entry.choices"
            :key="choice.id"
            class="pf-help rounded-md p-2 text-sm"
          >
            <p class="font-semibold">{{ choice.label }}</p>
            <p v-if="choice.effect">{{ choice.effect }}</p>
            <p v-if="choice.success?.text">{{ choice.success.text }}</p>
            <p v-if="choice.failure?.text">{{ choice.failure.text }}</p>
          </article>
        </div>
      </section>

      <section v-if="renders.length" aria-label="Renders">
        <p class="pf-kicker mb-1 text-[0.6rem] text-secondary">
          Renders · {{ renders.length }}
        </p>
        <ul class="grid grid-cols-4 gap-1.5">
          <li v-for="r in renders" :key="r.jobId">
            <button
              type="button"
              class="pf-art-card-frame block w-full"
              :class="preview === r.src && r.src ? 'pf-art-card-on' : ''"
              :title="`Job ${r.jobId} · ${r.status}`"
              :disabled="!r.src"
              @click="preview = preview === r.src ? null : r.src"
            >
              <img v-if="r.src" :src="r.src" alt="" class="pf-art-card-img" />
              <span v-else class="pf-art-card-empty text-[0.55rem]">{{
                r.status.toLowerCase()
              }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2" aria-label="Art prompt">
        <div class="flex items-baseline justify-between gap-2">
          <p class="pf-kicker text-[0.6rem] text-secondary">Art prompt</p>
          <p class="text-[0.65rem] opacity-60">
            {{
              entry.prompt
                ? prompt.trim() === entry.prompt
                  ? 'As authored in the game'
                  : 'Edited here'
                : 'None authored yet'
            }}
          </p>
        </div>
        <textarea
          v-model="prompt"
          rows="6"
          class="pf-field text-sm leading-snug"
          aria-label="Art prompt"
          placeholder="Describe the picture in plain prose: who is there, where, what is happening, the light and the mood. No titles or lettering."
        />
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            data-nav
            class="pf-label btn btn-primary btn-sm pf-focusable"
            :disabled="forge.busy || !prompt.trim()"
            @click="forge.renderEntry(entry.key, prompt)"
          >
            {{
              forge.galleryBook?.artPipeline
                ? 'Save for the next art round'
                : entry.state === 'delivered'
                  ? 'Re-render this prompt'
                  : 'Render this prompt'
            }}
          </button>
          <button
            v-if="prompt.trim() && prompt.trim() !== entry.prompt"
            type="button"
            data-nav
            class="pf-label btn btn-ghost btn-sm pf-focusable"
            title="Leave this prompt as a note for the writers to fold into the game"
            :disabled="forge.busy"
            @click="
              forge.galleryNote(
                entry.key,
                'comment',
                `Prompt proposal: ${prompt.trim()}`,
              )
            "
          >
            Propose as the prompt
          </button>
          <button
            v-if="!entry.prompt"
            type="button"
            data-nav
            class="pf-label btn btn-ghost btn-sm pf-focusable"
            :disabled="forge.busy"
            @click="forge.askPrompt(entry.key)"
          >
            Ask the agents to write it
          </button>
        </div>
      </section>
    </template>

    <template v-else-if="forge.galleryTile">
      <div class="pf-art-card-frame pf-gallery-hero">
        <img
          v-if="forge.galleryTile.cover"
          :src="forge.galleryTile.cover"
          alt=""
          class="pf-art-card-img"
        />
        <PlaybookArt
          v-else-if="forge.galleryTile.scene"
          :title="forge.galleryTile.label"
          :scene="forge.galleryTile.scene"
          class="absolute inset-0"
        />
        <span v-else class="pf-art-card-empty text-xs">No art yet</span>
      </div>
      <div>
        <p class="pf-kicker text-[0.6rem] text-secondary">
          {{
            forge.galleryTarget?.type === 'person'
              ? forge.galleryBook?.peopleLabel || 'Person'
              : 'Section'
          }}
        </p>
        <p class="pf-display text-2xl leading-tight">
          {{ forge.galleryTile.label }}
        </p>
      </div>
      <ul class="grid grid-cols-2 gap-1.5 text-sm" aria-label="Where it stands">
        <li
          v-for="row in standing"
          :key="row.label"
          class="pf-help flex items-baseline justify-between gap-2 py-1"
        >
          <span class="opacity-80">{{ row.label }}</span>
          <span class="pf-display tabular-nums" :class="row.tone">{{
            row.count
          }}</span>
        </li>
      </ul>
      <p v-if="missing.length" class="text-xs leading-snug opacity-80">
        Not painted yet: {{ missing.slice(0, 8).join(', ')
        }}<template v-if="missing.length > 8">
          and {{ missing.length - 8 }} more</template
        >. Pick any to review its prompt, or submit them all from the header.
      </p>
    </template>

    <section class="flex flex-col gap-2" aria-label="Notes">
      <p class="pf-kicker text-[0.6rem] text-secondary">
        {{
          entry
            ? 'Notes on this beat'
            : `Notes on ${forge.galleryTile?.label ?? 'this section'}`
        }}
        · {{ notes.filter((n) => !n.resolved).length }} open
      </p>
      <textarea
        v-model="comment"
        rows="3"
        class="pf-field text-sm"
        :aria-label="entry ? 'Comment on this beat' : 'Comment on this section'"
        placeholder="A note for the next development…"
      />
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          data-nav
          class="pf-label btn btn-secondary btn-sm pf-focusable"
          :disabled="forge.busy || !comment.trim() || !noteKey"
          @click="send('comment')"
        >
          Comment
        </button>
        <button
          v-if="entry"
          type="button"
          data-nav
          class="pf-label btn btn-ghost btn-sm pf-focusable"
          title="Ask for this picture to be made again, with your reason"
          :disabled="forge.busy || !comment.trim()"
          @click="send('flag')"
        >
          Flag for a new picture
        </button>
      </div>
      <p v-if="forge.status" class="text-xs opacity-80" role="status">
        {{ forge.status }}
      </p>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="note in notes"
          :key="note.id"
          class="pf-help flex items-start gap-2 text-sm"
          :class="note.resolved ? 'opacity-50' : ''"
        >
          <span class="min-w-0 flex-1">
            <span class="pf-kicker text-[0.55rem] opacity-70"
              >{{ NOTE_LABEL[note.kind] }} ·
              {{ new Date(note.createdAt).toLocaleDateString() }}</span
            >
            <span class="block whitespace-pre-line leading-snug">{{
              note.body
            }}</span>
          </span>
          <button
            type="button"
            class="shrink-0 text-xs underline opacity-70"
            @click="studio.resolveNote(note.id, !note.resolved)"
          >
            {{ note.resolved ? 'Reopen' : 'Done' }}
          </button>
        </li>
      </ul>
    </section>

    <section
      v-if="forge.galleryTarget"
      class="pf-help flex flex-col gap-2"
      aria-label="Creative direction"
    >
      <p class="pf-kicker text-secondary">Direct the writers and artists</p>
      <p class="text-xs opacity-80">
        Suggest a theme or reinterpretation for this
        {{ entry ? 'character' : 'section' }}. It goes to the game's GitHub
        master issue, where agents can incorporate it into the plan.
      </p>
      <textarea
        v-model="direction"
        class="pf-field text-sm"
        rows="3"
        aria-label="Creative direction for the selected cast or beat"
        placeholder="For example: model this cast around the zodiac, Chinese zodiac, or major arcana, without copying stereotypes."
      />
      <button
        type="button"
        data-nav
        class="pf-label btn btn-secondary btn-sm pf-focusable"
        :disabled="!direction.trim() || forge.posting"
        @click="sendDirection"
      >
        Send direction to GitHub
      </button>
      <p v-if="forge.adjustStatus" class="text-xs" role="status">
        {{ forge.adjustStatus }}
      </p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { usePlaybookStore, type PlaybookNoteKind } from '~/stores/playbookStore'
import {
  STATUS_LABEL,
  entryStatus,
  targetNoteKey,
} from '~/utils/playbookForge/gallery'

// The gallery's right side: the focused beat large, its renders, its prompt
// to review, edit, render or propose, and its notes; with no beat focused,
// the section or person itself and the comments on it.
const forge = usePlaybookForgeStore()
const studio = usePlaybookStore()

const NOTE_LABEL: Record<PlaybookNoteKind, string> = {
  comment: 'Comment',
  flag: 'Flagged',
  image: 'Image',
  'art-request': 'Render',
}

const entry = computed(() => forge.galleryFocused)
const status = computed(() =>
  entry.value ? entryStatus(entry.value) : 'unpainted',
)
const renders = computed(() =>
  entry.value ? forge.galleryRenders(entry.value.key) : [],
)
const preview = ref<string | null>(null)
const selectedForm = ref<string | null>(null)
const activeVariant = computed(
  () =>
    entry.value?.artVariants.find(
      (variant) => variant.id === selectedForm.value,
    ) ?? null,
)
const shown = computed(
  () =>
    preview.value ??
    (selectedForm.value
      ? (activeVariant.value?.imageUrl ?? null)
      : (entry.value?.imageUrl ?? null)),
)
const direction = ref('')
async function sendDirection() {
  if (await forge.postGalleryDirection(direction.value)) direction.value = ''
}
const prompt = ref('')
const comment = ref('')
watch(
  () => entry.value?.key,
  () => {
    prompt.value = entry.value?.prompt ?? ''
    preview.value = null
    selectedForm.value = null
    comment.value = ''
    direction.value = ''
  },
  { immediate: true },
)

const noteKey = computed(() =>
  entry.value
    ? entry.value.key
    : forge.galleryTarget
      ? targetNoteKey(forge.galleryTarget)
      : '',
)
const notes = computed(() =>
  noteKey.value ? studio.notesFor(noteKey.value) : [],
)

const standing = computed(() => {
  const all = forge.galleryEntries
  const count = (pick: (s: ReturnType<typeof entryStatus>) => boolean) =>
    all.filter((e) => pick(entryStatus(e))).length
  return [
    {
      label: 'Painted',
      count: count((s) => s === 'painted'),
      tone: 'text-success',
    },
    {
      label: 'Text only',
      count: count((s) => s === 'no-picture'),
      tone: 'opacity-70',
    },
    {
      label: 'Ready to render',
      count: count((s) => s === 'unpainted'),
      tone: '',
    },
    {
      label: 'No prompt yet',
      count: count((s) => s === 'no-prompt'),
      tone: 'text-warning',
    },
    {
      label: 'Rendering',
      count: count((s) => s === 'rendering'),
      tone: 'text-info',
    },
    {
      label: 'Not wired in',
      count: count((s) => s === 'not-wired'),
      tone: 'text-warning',
    },
    {
      label: 'Failed',
      count: count((s) => s === 'failed'),
      tone: 'text-error',
    },
  ]
})
const missing = computed(() =>
  forge.galleryEntries
    .filter((e) => e.state !== 'delivered')
    .map((e) => e.title),
)

async function send(kind: 'comment' | 'flag') {
  if (!noteKey.value) return
  const ok = await forge.galleryNote(
    noteKey.value,
    kind,
    kind === 'flag' ? `New picture wanted: ${comment.value}` : comment.value,
  )
  if (ok) comment.value = ''
}
</script>
