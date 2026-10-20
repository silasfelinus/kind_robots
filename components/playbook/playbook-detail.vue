<template>
  <div v-if="node" class="flex flex-col gap-3 p-3">
    <header class="flex flex-col gap-2">
      <div
        class="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-base-300"
      >
        <EcotoneScene
          :kind="node.scene"
          :art="node.art ?? undefined"
          :label="node.title"
          class="absolute inset-0"
        />
        <span
          v-if="node.needsArt"
          class="absolute left-2 top-2 rounded-full bg-warning px-2 py-0.5 text-xs font-black text-warning-content"
          >Needs art</span
        >
      </div>
      <div>
        <p class="font-mono text-xs text-base-content/55">
          {{ node.key }} · {{ KIND_LABEL[node.kind] }}
        </p>
        <h2 class="font-serif text-2xl font-black leading-tight">
          {{ node.title }}
        </h2>
        <p v-if="node.place" class="text-sm text-base-content/65">
          {{ node.place }}
        </p>
        <div class="mt-1 flex flex-wrap gap-1">
          <span
            v-for="(placement, index) in node.placements"
            :key="index"
            class="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-bold"
            >{{ placement.routeName }} · Day {{ placement.day }},
            {{ placement.dayName }}</span
          >
        </div>
      </div>
    </header>

    <nav
      class="flex flex-wrap gap-1 rounded-xl bg-base-200 p-1"
      role="tablist"
      aria-label="Beat details"
    >
      <button
        v-for="item in tabs"
        :key="item.value"
        type="button"
        role="tab"
        class="rounded-lg px-2.5 py-1 text-xs font-black transition"
        :class="
          tab === item.value
            ? 'bg-primary text-primary-content shadow'
            : 'hover:bg-base-100'
        "
        :aria-selected="tab === item.value"
        @click="tab = item.value"
      >
        {{ item.label }}
      </button>
    </nav>

    <section v-if="tab === 'story'" class="flex flex-col gap-2">
      <template v-if="base">
        <label class="flex flex-col gap-1 text-xs font-bold">
          Title
          <input v-model="form.title" class="kr-input" type="text" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold">
          Place
          <input v-model="form.place" class="kr-input" type="text" />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold">
          Story text (blank line between paragraphs)
          <textarea
            v-model="form.body"
            class="textarea textarea-bordered min-h-40 font-serif text-sm leading-relaxed"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold">
          Provenance (what is real, what is invented)
          <textarea
            v-model="form.provenance"
            class="textarea textarea-bordered min-h-16 text-xs"
          />
        </label>
      </template>
      <template v-else>
        <p
          v-for="(paragraph, index) in node.body"
          :key="index"
          class="font-serif text-sm leading-relaxed"
        >
          {{ paragraph }}
        </p>
        <p class="rounded-xl bg-base-200 p-2 text-xs text-base-content/70">
          This beat is assembled from other beats and the game’s rules. Select
          the beats it links to in order to edit their text. Comments, flags and
          art requests still work here.
        </p>
      </template>
    </section>

    <section v-else-if="tab === 'choices'" class="flex flex-col gap-2">
      <article
        v-for="choice in node.choices"
        :key="choice.id"
        class="rounded-2xl border border-base-content/10 bg-base-200/50 p-2.5"
      >
        <p class="flex flex-wrap items-center gap-1 text-[11px]">
          <span class="font-mono text-base-content/55">{{ choice.id }}</span>
          <span
            v-if="choice.check"
            class="rounded bg-base-300 px-1 font-mono font-bold"
            >Roll {{ choice.check.skill }} {{ choice.check.target }}</span
          >
          <span
            v-for="tag in choice.tags"
            :key="tag"
            class="rounded bg-primary/10 px-1 font-bold text-primary"
            >{{ tag }}</span
          >
          <span
            v-if="choice.success && effectText(choice.success.effects)"
            class="rounded bg-success/15 px-1 font-bold"
            >{{ effectText(choice.success.effects) }}</span
          >
          <button
            v-if="choice.leadsTo && store.playbook.nodes[choice.leadsTo]"
            type="button"
            class="ml-auto inline-flex items-center gap-0.5 font-bold text-primary hover:underline"
            @click="store.selectedKey = choice.leadsTo"
          >
            {{ store.playbook.nodes[choice.leadsTo]?.title }}
            <Icon name="kind-icon:arrow-right" class="size-3" />
          </button>
        </p>
        <template v-if="base && form.choices[choice.id]">
          <input
            v-model="form.choices[choice.id]!.label"
            class="kr-input mt-1.5 w-full font-bold"
            type="text"
            :aria-label="`${choice.id} label`"
          />
          <input
            v-model="form.choices[choice.id]!.cost"
            class="kr-input mt-1 w-full text-xs"
            type="text"
            placeholder="Cost or hint (optional)"
            :aria-label="`${choice.id} cost`"
          />
          <label class="mt-1 flex flex-col gap-0.5 text-[11px] font-bold">
            {{ choice.check ? 'On success' : 'Result' }}
            <textarea
              v-model="form.choices[choice.id]!.success"
              class="textarea textarea-bordered min-h-14 text-xs"
            />
          </label>
          <label
            v-if="choice.failure"
            class="mt-1 flex flex-col gap-0.5 text-[11px] font-bold"
          >
            On a complication
            <textarea
              v-model="form.choices[choice.id]!.failure"
              class="textarea textarea-bordered min-h-14 text-xs"
            />
          </label>
        </template>
        <template v-else>
          <p class="mt-1 text-sm font-black">{{ choice.label }}</p>
          <p v-if="choice.success" class="text-xs text-base-content/75">
            {{ choice.success.text }}
          </p>
        </template>
        <button
          type="button"
          class="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-secondary hover:underline"
          @click="askArtFor(choice.id, choice.label)"
        >
          <Icon name="kind-icon:sparkles" class="size-3" /> Request art for this
          choice
        </button>
      </article>

      <div
        v-if="base"
        class="rounded-2xl border border-dashed border-primary/40 p-2.5"
      >
        <p class="text-xs font-black">
          Added choices ({{ form.added.length }}/{{ maxAdded }})
        </p>
        <article
          v-for="(added, index) in form.added"
          :key="index"
          class="mt-1.5 flex items-start gap-2 rounded-xl bg-primary/5 p-2 text-xs"
        >
          <span class="min-w-0 flex-1">
            <span class="font-black">{{ added.label }}</span>
            <span v-if="added.check" class="ml-1 font-mono"
              >Roll {{ added.check.skill }} {{ added.check.target }}</span
            >
            <span class="block text-base-content/70">{{
              added.success.text
            }}</span>
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            :aria-label="`Remove ${added.label}`"
            @click="form.added.splice(index, 1)"
          >
            <Icon name="kind-icon:close" class="size-3.5" />
          </button>
        </article>
        <div
          v-if="form.added.length < maxAdded && node.choices.length < 4"
          class="mt-2 grid gap-1.5"
        >
          <input
            v-model="draft.label"
            class="kr-input text-sm"
            type="text"
            placeholder="New choice label"
            aria-label="New choice label"
          />
          <input
            v-model="draft.cost"
            class="kr-input text-xs"
            type="text"
            placeholder="Cost or hint (optional)"
            aria-label="New choice cost"
          />
          <div class="flex flex-wrap gap-1.5">
            <select
              v-model="draft.skill"
              class="select select-bordered select-sm"
              aria-label="Roll skill"
            >
              <option value="">No roll</option>
              <option v-for="skill in SKILLS" :key="skill.id" :value="skill.id">
                Roll {{ skill.label }}
              </option>
            </select>
            <select
              v-if="draft.skill"
              v-model.number="draft.target"
              class="select select-bordered select-sm"
              aria-label="Roll target"
            >
              <option :value="7">7</option>
              <option :value="9">9</option>
              <option :value="11">11</option>
            </select>
            <select
              v-for="meter in METERS"
              :key="meter"
              v-model.number="draft.effects[meter]"
              class="select select-bordered select-sm"
              :aria-label="`${meter} change`"
            >
              <option v-for="n in [-2, -1, 0, 1, 2]" :key="n" :value="n">
                {{ meter }} {{ n > 0 ? `+${n}` : n }}
              </option>
            </select>
          </div>
          <textarea
            v-model="draft.success"
            class="textarea textarea-bordered min-h-14 text-xs"
            :placeholder="draft.skill ? 'On success…' : 'What happens…'"
            aria-label="New choice result"
          />
          <textarea
            v-if="draft.skill"
            v-model="draft.failure"
            class="textarea textarea-bordered min-h-14 text-xs"
            placeholder="On a complication…"
            aria-label="New choice complication"
          />
          <input
            v-model="draft.evidence"
            class="kr-input text-xs"
            type="text"
            placeholder="Evidence it logs (optional)"
            aria-label="New choice evidence"
          />
          <button
            type="button"
            class="kr-btn btn-outline btn-sm"
            :disabled="!draft.label.trim() || !draft.success.trim()"
            @click="addChoice"
          >
            <Icon name="kind-icon:plus" class="size-4" /> Add choice
          </button>
        </div>
      </div>
    </section>

    <section v-else-if="tab === 'variations'" class="flex flex-col gap-3">
      <template v-if="base">
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider">By lens</h3>
          <p class="text-[11px] text-base-content/60">
            A line shown on this card for players who opened the run this way.
          </p>
          <label
            v-for="lens in LENSES"
            :key="lens.id"
            class="mt-1.5 flex flex-col gap-0.5 text-[11px] font-bold"
          >
            <span
              >{{ lens.label }}
              <span v-if="!lens.open" class="font-normal text-base-content/50"
                >(road still being written)</span
              ></span
            >
            <textarea
              v-model="form.lensLines[lens.id]"
              class="textarea textarea-bordered min-h-12 text-xs"
              :class="form.lensLines[lens.id] ? '' : 'border-dashed'"
            />
          </label>
        </div>
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider">
            By companion
          </h3>
          <p class="text-[11px] text-base-content/60">
            An aside when this companion is traveling with you.
          </p>
          <label
            v-for="companion in COMPANIONS"
            :key="companion.id"
            class="mt-1.5 flex flex-col gap-0.5 text-[11px] font-bold"
          >
            {{ companion.name }}
            <textarea
              v-model="form.leadLines[companion.id]"
              class="textarea textarea-bordered min-h-12 text-xs"
              :class="form.leadLines[companion.id] ? '' : 'border-dashed'"
            />
          </label>
          <label class="mt-1.5 flex flex-col gap-0.5 text-[11px] font-bold">
            Alone
            <textarea
              v-model="form.aloneLine"
              class="textarea textarea-bordered min-h-12 text-xs"
              :class="form.aloneLine ? '' : 'border-dashed'"
            />
          </label>
        </div>
        <div v-if="variantKeys.length">
          <h3 class="text-xs font-black uppercase tracking-wider">
            Whole-card versions
            {{
              base.variantBy === 'prospect'
                ? 'by who the opening led you to'
                : 'by companion'
            }}
          </h3>
          <label
            v-for="key in variantKeys"
            :key="key"
            class="mt-1.5 flex flex-col gap-0.5 text-[11px] font-bold"
          >
            {{ leadLabel(key) }}
            <textarea
              v-model="form.variants[key]"
              class="textarea textarea-bordered min-h-28 font-serif text-xs"
            />
          </label>
        </div>
      </template>
      <template v-else>
        <article
          v-for="(variation, index) in node.variations"
          :key="index"
          class="rounded-xl bg-base-200/60 p-2"
        >
          <p class="text-[11px] font-black uppercase tracking-wider">
            {{ variation.label }}
          </p>
          <p class="whitespace-pre-line text-xs">{{ variation.text }}</p>
        </article>
        <p v-if="!node.variations.length" class="text-xs text-base-content/60">
          No variations on this beat.
        </p>
      </template>
    </section>

    <section v-else-if="tab === 'art'" class="flex flex-col gap-3">
      <div class="rounded-2xl border border-base-content/10 p-2.5">
        <h3 class="text-xs font-black uppercase tracking-wider">Request art</h3>
        <p v-if="artChoice" class="text-[11px] text-base-content/60">
          For the choice “{{ artChoice.label }}”.
          <button
            type="button"
            class="font-bold text-primary"
            @click="artChoice = null"
          >
            Whole beat instead
          </button>
        </p>
        <textarea
          v-model="art.prompt"
          class="textarea textarea-bordered mt-1 min-h-24 w-full text-xs"
          aria-label="Art prompt"
        />
        <div class="mt-1.5 flex flex-wrap gap-1.5">
          <select
            v-model="art.lane"
            class="select select-bordered select-sm"
            aria-label="Art lane"
          >
            <option
              v-for="lane in PLAYBOOK_ART_LANES"
              :key="lane.key"
              :value="lane.key"
            >
              {{ lane.label }}
            </option>
          </select>
          <select
            v-model="art.shape"
            class="select select-bordered select-sm"
            aria-label="Art shape"
          >
            <option value="scene">Wide scene</option>
            <option value="portrait">Portrait</option>
          </select>
          <button
            type="button"
            class="kr-btn-primary btn-sm"
            :disabled="store.saving || !art.prompt.trim()"
            @click="requestArt"
          >
            <Icon name="kind-icon:sparkles" class="size-4" /> Queue it
          </button>
        </div>
        <p class="mt-1 text-[11px] text-base-content/55">
          Private renders, tagged to the Weird Humboldt project. The prompt
          checker refuses negations such as “no people”; describe what should be
          there instead.
        </p>
      </div>

      <div class="grid gap-2 @md:grid-cols-2">
        <div class="rounded-2xl border border-base-content/10 p-2.5">
          <h3 class="text-xs font-black uppercase tracking-wider">
            Flag the current image
          </h3>
          <textarea
            v-model="flagReason"
            class="textarea textarea-bordered mt-1 min-h-14 w-full text-xs"
            placeholder="What’s wrong with it?"
            aria-label="Flag reason"
          />
          <button
            type="button"
            class="kr-btn btn-outline btn-sm mt-1"
            :disabled="store.saving || !flagReason.trim()"
            @click="flag"
          >
            <Icon name="kind-icon:flag" class="size-4" /> Flag
          </button>
        </div>
        <div class="rounded-2xl border border-base-content/10 p-2.5">
          <h3 class="text-xs font-black uppercase tracking-wider">
            Submit an image
          </h3>
          <input
            v-model.number="submitId"
            class="kr-input mt-1 w-full text-xs"
            type="number"
            min="1"
            placeholder="ArtImage id"
            aria-label="ArtImage id"
          />
          <input
            v-model="submitNote"
            class="kr-input mt-1 w-full text-xs"
            type="text"
            placeholder="Why this one (optional)"
            aria-label="Submission note"
          />
          <button
            type="button"
            class="kr-btn btn-outline btn-sm mt-1"
            :disabled="store.saving || !submitId"
            @click="submitImage"
          >
            <Icon name="kind-icon:image" class="size-4" /> Submit
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-wider">Art history</h3>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          @click="store.refreshJobs(node.key)"
        >
          <Icon name="kind-icon:refresh" class="size-3.5" /> Check status
        </button>
      </div>
      <article
        v-for="note in artNotes"
        :key="note.id"
        class="flex gap-2 rounded-xl bg-base-200/60 p-2 text-xs"
        :class="note.resolved ? 'opacity-50' : ''"
      >
        <span
          class="relative size-16 shrink-0 overflow-hidden rounded-lg bg-base-300"
        >
          <img
            v-if="imageFor(note)"
            :src="imageFor(note)"
            :alt="`Art for ${node.title}`"
            class="size-full object-cover"
          />
          <Icon
            v-else
            :name="
              note.kind === 'flag' ? 'kind-icon:flag' : 'kind-icon:sparkles'
            "
            class="absolute inset-0 m-auto size-6 text-base-content/40"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="font-black">{{ NOTE_LABEL[note.kind] }}</span>
          <span v-if="note.artJobId" class="ml-1 font-mono"
            >Job {{ note.artJobId }}
            <span v-if="store.jobs[note.artJobId]"
              >· {{ store.jobs[note.artJobId]?.status }}</span
            ></span
          >
          <span v-if="note.artImageId" class="ml-1 font-mono"
            >Image {{ note.artImageId }}</span
          >
          <span v-if="note.choiceId" class="ml-1 text-base-content/60"
            >· choice {{ note.choiceId }}</span
          >
          <span class="block text-base-content/75">{{ note.body }}</span>
        </span>
        <button
          type="button"
          class="btn btn-ghost btn-xs self-start"
          @click="store.resolveNote(note.id, !note.resolved)"
        >
          {{ note.resolved ? 'Reopen' : 'Done' }}
        </button>
      </article>
      <p v-if="!artNotes.length" class="text-xs text-base-content/60">
        No art requests, flags or submissions yet.
      </p>
    </section>

    <section v-else class="flex flex-col gap-2">
      <textarea
        v-model="comment"
        class="textarea textarea-bordered min-h-20 text-sm"
        placeholder="A note for the writers (and for future you)…"
        aria-label="New comment"
      />
      <button
        type="button"
        class="kr-btn-primary btn-sm self-start"
        :disabled="store.saving || !comment.trim()"
        @click="addComment"
      >
        <Icon name="kind-icon:chat" class="size-4" /> Comment
      </button>
      <article
        v-for="note in store.notesFor(node.key)"
        :key="note.id"
        class="rounded-xl bg-base-200/60 p-2 text-sm"
        :class="note.resolved ? 'opacity-50' : ''"
      >
        <p class="flex items-center gap-2 text-[11px] text-base-content/60">
          <span class="font-black uppercase">{{ NOTE_LABEL[note.kind] }}</span>
          {{ new Date(note.createdAt).toLocaleString() }}
          <button
            type="button"
            class="btn btn-ghost btn-xs ml-auto"
            @click="store.resolveNote(note.id, !note.resolved)"
          >
            {{ note.resolved ? 'Reopen' : 'Resolve' }}
          </button>
        </p>
        <p class="whitespace-pre-line">{{ note.body }}</p>
      </article>
    </section>

    <footer
      v-if="base"
      class="sticky bottom-0 -mx-3 mt-auto flex flex-wrap items-center gap-2 border-t border-base-content/10 bg-base-100/95 px-3 py-2 backdrop-blur"
    >
      <span class="w-full text-[11px] text-base-content/60">
        {{
          edit
            ? edit.live
              ? 'Live in play'
              : 'Draft, not in play yet'
            : 'Authored text'
        }}
        <template v-if="dirty"> · unsaved changes</template>
      </span>
      <button
        v-if="edit"
        type="button"
        class="btn btn-ghost btn-sm mr-auto"
        :disabled="store.saving"
        @click="revert"
      >
        Revert to authored
      </button>
      <button
        type="button"
        class="kr-btn btn-outline btn-sm"
        :disabled="store.saving || (!dirty && !edit?.live)"
        @click="save(false)"
      >
        Save draft
      </button>
      <button
        type="button"
        class="kr-btn-primary btn-sm"
        :disabled="store.saving || (!dirty && Boolean(edit?.live))"
        @click="save(true)"
      >
        <Icon name="kind-icon:save" class="size-4" /> Save and go live
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { usePlaybookStore, type PlaybookNoteRow } from '~/stores/playbookStore'
import { ALL_CARDS } from '~/utils/ecotone/engine'
import {
  COMPANIONS,
  LENSES,
  SKILLS,
  type CompanionId,
  type Effects,
  type EncounterCard,
  type LeadId,
  type LensId,
  type SkillId,
} from '~/utils/ecotone/content'
import { leadLabel, type NodeKind } from '~/utils/playbook/ecotone'
import {
  MAX_ADDED_CHOICES,
  applyCardEdit,
  type AddedChoice,
  type CardEdit,
} from '~/utils/playbook/edits'
import { PLAYBOOK_ART_LANES } from '~/utils/playbook/artLanes'

type Tab = 'story' | 'choices' | 'variations' | 'art' | 'notes'
type Meter = 'nerve' | 'goodwill' | 'weird'

const store = usePlaybookStore()
const node = computed(() => store.selected)
const base = computed<EncounterCard | null>(
  () =>
    (node.value?.editable &&
      ALL_CARDS.find((card) => card.id === node.value?.key)) ||
    null,
)
const edit = computed(() =>
  node.value ? store.edits[node.value.key] : undefined,
)
const tab = ref<Tab>('story')
const maxAdded = MAX_ADDED_CHOICES
const METERS: Meter[] = ['nerve', 'goodwill', 'weird']

const KIND_LABEL: Record<NodeKind, string> = {
  opening: 'Opening choice',
  spine: 'Story spine',
  fork: 'White-rabbit fork',
  encounter: 'Random encounter',
  crossroads: 'Crossroads',
  ending: 'Ending storyline',
}
const NOTE_LABEL: Record<string, string> = {
  comment: 'Comment',
  flag: 'Image flagged',
  image: 'Image submitted',
  'art-request': 'Art requested',
}

const tabs = computed(() => {
  const notes = node.value ? store.notesFor(node.value.key) : []
  const open = (kinds: string[]) =>
    notes.filter((n) => !n.resolved && kinds.includes(n.kind)).length
  return [
    { value: 'story' as Tab, label: 'Story' },
    {
      value: 'choices' as Tab,
      label: `Choices ${node.value?.choices.length ?? 0}`,
    },
    {
      value: 'variations' as Tab,
      label: `Variations ${node.value?.variations.length ?? 0}`,
    },
    {
      value: 'art' as Tab,
      label: `Art ${open(['flag', 'art-request', 'image']) || ''}`.trim(),
    },
    { value: 'notes' as Tab, label: `Notes ${open(['comment']) || ''}`.trim() },
  ]
})

type ChoiceForm = {
  label: string
  cost: string
  success: string
  failure: string
}

const form = reactive({
  title: '',
  place: '',
  body: '',
  provenance: '',
  lensLines: {} as Partial<Record<LensId, string>>,
  leadLines: {} as Partial<Record<CompanionId, string>>,
  aloneLine: '',
  variants: {} as Partial<Record<LeadId, string>>,
  choices: {} as Record<string, ChoiceForm>,
  added: [] as AddedChoice[],
})

const variantKeys = computed(
  () => Object.keys(base.value?.variants ?? {}) as LeadId[],
)

function joinParagraphs(list?: string[]) {
  return (list ?? []).join('\n\n')
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function snapshot() {
  return JSON.stringify(buildEdit())
}

const saved = ref('{}')

function resetForm() {
  const card = base.value
  if (!card) return
  const current = applyCardEdit(card, edit.value?.content ?? {})
  form.title = current.title
  form.place = current.place
  form.body = joinParagraphs(current.body)
  form.provenance = current.provenance
  form.lensLines = { ...current.lensLines }
  form.leadLines = { ...current.leadLines }
  form.aloneLine = current.aloneLine ?? ''
  form.variants = Object.fromEntries(
    Object.entries(current.variants ?? {}).map(([k, v]) => [
      k,
      joinParagraphs(v),
    ]),
  )
  form.choices = Object.fromEntries(
    card.choices.map((choice) => {
      const live = current.choices.find((c) => c.id === choice.id) ?? choice
      return [
        choice.id,
        {
          label: live.label,
          cost: live.cost ?? '',
          success: live.success.text,
          failure: live.failure?.text ?? '',
        },
      ]
    }),
  )
  form.added = [...(edit.value?.content.added ?? [])]
  saved.value = snapshot()
}

function buildEdit(): CardEdit {
  const card = base.value
  if (!card) return {}
  const out: CardEdit = {}
  if (form.title.trim() !== card.title) out.title = form.title
  if (form.place.trim() !== card.place) out.place = form.place
  const body = splitParagraphs(form.body)
  if (joinParagraphs(body) !== joinParagraphs(card.body)) out.body = body
  if (form.provenance.trim() !== card.provenance)
    out.provenance = form.provenance
  for (const lens of LENSES) {
    const text = form.lensLines[lens.id]?.trim()
    if (text && text !== card.lensLines?.[lens.id])
      (out.lensLines ??= {})[lens.id] = text
  }
  for (const companion of COMPANIONS) {
    const text = form.leadLines[companion.id]?.trim()
    if (text && text !== card.leadLines?.[companion.id])
      (out.leadLines ??= {})[companion.id] = text
  }
  if (form.aloneLine.trim() && form.aloneLine.trim() !== card.aloneLine)
    out.aloneLine = form.aloneLine
  for (const key of variantKeys.value) {
    const text = splitParagraphs(form.variants[key] ?? '')
    if (
      text.length &&
      joinParagraphs(text) !== joinParagraphs(card.variants?.[key])
    )
      (out.variants ??= {})[key] = text
  }
  for (const choice of card.choices) {
    const f = form.choices[choice.id]
    if (!f) continue
    const changes: NonNullable<CardEdit['choices']>[string] = {}
    if (f.label.trim() !== choice.label) changes.label = f.label
    if (f.cost.trim() !== (choice.cost ?? '')) changes.cost = f.cost
    if (f.success.trim() !== choice.success.text) changes.success = f.success
    if (choice.failure && f.failure.trim() !== choice.failure.text)
      changes.failure = f.failure
    if (Object.keys(changes).length) (out.choices ??= {})[choice.id] = changes
  }
  if (form.added.length) out.added = form.added
  return out
}

const dirty = computed(() => snapshot() !== saved.value)

const draft = reactive({
  label: '',
  cost: '',
  skill: '' as SkillId | '',
  target: 9,
  success: '',
  failure: '',
  evidence: '',
  effects: { nerve: 0, goodwill: 0, weird: 0 } as Record<Meter, number>,
})

function addChoice() {
  const effects: Effects = {}
  for (const meter of METERS)
    if (draft.effects[meter]) effects[meter] = draft.effects[meter]
  if (draft.evidence.trim()) effects.evidence = draft.evidence.trim()
  const choice: AddedChoice = {
    id: `added-${form.added.length + 1}`,
    label: draft.label.trim(),
    success: { text: draft.success.trim(), effects },
  }
  if (draft.cost.trim()) choice.cost = draft.cost.trim()
  if (draft.skill) {
    choice.check = { skill: draft.skill, target: draft.target }
    choice.failure = {
      text: draft.failure.trim() || 'It doesn’t go the way you hoped.',
      effects: { nerve: -1 },
    }
  }
  form.added.push(choice)
  Object.assign(draft, {
    label: '',
    cost: '',
    skill: '',
    target: 9,
    success: '',
    failure: '',
    evidence: '',
    effects: { nerve: 0, goodwill: 0, weird: 0 },
  })
}

async function save(live: boolean) {
  if (!node.value) return
  if (await store.saveEdit(node.value.key, buildEdit(), live)) resetForm()
}

async function revert() {
  if (!node.value) return
  if (await store.saveEdit(node.value.key, {}, false)) resetForm()
}

function effectText(effects: Effects) {
  const parts: string[] = []
  for (const meter of METERS) {
    const value = effects[meter]
    if (value) parts.push(`${meter} ${value > 0 ? '+' : ''}${value}`)
  }
  if (effects.evidence) parts.push('evidence')
  if (effects.flag) parts.push(`flag ${effects.flag}`)
  return parts.join(' · ')
}

// Art.
const art = reactive({
  prompt: '',
  lane: PLAYBOOK_ART_LANES[0]?.key ?? '',
  shape: 'scene' as 'scene' | 'portrait',
})
const artChoice = ref<{ id: string; label: string } | null>(null)
const flagReason = ref('')
const submitId = ref<number | null>(null)
const submitNote = ref('')
const comment = ref('')

function defaultPrompt() {
  const n = node.value
  if (!n) return ''
  const first = n.body[0]?.split(/(?<=\.)\s/)[0] ?? ''
  return `${n.title}, ${n.place}. ${first}`.trim()
}

function askArtFor(id: string, label: string) {
  artChoice.value = { id, label }
  art.prompt = `${node.value?.title ?? ''}: ${label}. ${defaultPrompt()}`
  tab.value = 'art'
}

const artNotes = computed(() =>
  node.value
    ? store
        .notesFor(node.value.key)
        .filter((n) => ['flag', 'image', 'art-request'].includes(n.kind))
    : [],
)

function imageFor(note: PlaybookNoteRow) {
  const id =
    note.artImageId ??
    (note.artJobId ? store.jobs[note.artJobId]?.artImageId : null)
  return id ? store.previews[id] : undefined
}

async function requestArt() {
  if (!node.value) return
  const ok = await store.requestArt(node.value.key, {
    prompt: art.prompt,
    laneKey: art.lane,
    shape: art.shape,
    choiceId: artChoice.value?.id ?? null,
  })
  if (ok) artChoice.value = null
}

async function flag() {
  if (!node.value) return
  const ok = await store.addNote(node.value.key, {
    kind: 'flag',
    body: flagReason.value,
    artImageId: null,
  })
  if (ok) flagReason.value = ''
}

async function submitImage() {
  if (!node.value || !submitId.value) return
  const ok = await store.addNote(node.value.key, {
    kind: 'image',
    body: submitNote.value || 'Submitted for this beat.',
    artImageId: submitId.value,
  })
  if (ok) {
    void store.loadPreview(submitId.value)
    submitId.value = null
    submitNote.value = ''
  }
}

async function addComment() {
  if (!node.value) return
  const ok = await store.addNote(node.value.key, {
    kind: 'comment',
    body: comment.value,
  })
  if (ok) comment.value = ''
}

watch(
  () => [node.value?.key, edit.value?.updatedAt],
  () => {
    resetForm()
    art.prompt = defaultPrompt()
    art.shape = node.value?.kind === 'ending' ? 'portrait' : 'scene'
    artChoice.value = null
    if (node.value) {
      for (const note of store.notesFor(node.value.key))
        if (note.artImageId) void store.loadPreview(note.artImageId)
    }
  },
  { immediate: true },
)
watch(
  () => node.value?.key,
  () => {
    if (!base.value && tab.value === 'choices' && !node.value?.choices.length)
      tab.value = 'story'
  },
)
</script>
