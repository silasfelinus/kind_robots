<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTarotStudioStore } from '~/stores/tarotStudioStore'
import { TAROT_DESIGN_ENGINES } from '~/utils/tarotStudio'
import type { TarotArtRecord, TarotDesignEdit } from '~/types/tarotStudio'

const store = useTarotStudioStore()
const showArchived = ref(false)
const editingId = ref<number | null>(null)
const draft = ref<TarotDesignEdit>({
  title: '',
  stylePrompt: '',
  backPrompt: '',
  engine: 'krea2',
  checkpoint: null,
  loras: '',
  notes: '',
})
const newOpen = ref(false)
const newTitle = ref('')
const newStyle = ref('')

const visibleDesigns = computed(() =>
  store.designs.filter(
    (design) => showArchived.value || design.status !== 'ARCHIVED',
  ),
)

const approvedProgress = computed(() => {
  const design = store.approvedDesign
  if (!design) return null
  const faces = store.art.filter(
    (entry) =>
      entry.designId === design.id &&
      entry.side === 'FACE' &&
      entry.status !== 'REJECTED' &&
      entry.status !== 'FAILED',
  )
  const covered = new Set(faces.map((entry) => entry.cardId))
  const rendered = new Set(
    faces
      .filter((entry) => entry.status === 'RENDERED')
      .map((entry) => entry.cardId),
  )
  return {
    requested: covered.size,
    rendered: rendered.size,
    total: store.cards.length,
  }
})

function edit(id: number) {
  const design = store.designById(id)
  if (!design) return
  editingId.value = editingId.value === id ? null : id
  draft.value = {
    title: design.title,
    stylePrompt: design.stylePrompt,
    backPrompt: design.backPrompt,
    engine: design.engine,
    checkpoint: design.checkpoint,
    loras: design.loras,
    notes: design.notes,
  }
}

async function saveDraft() {
  if (editingId.value === null) return
  if (await store.saveDesign(editingId.value, draft.value)) {
    editingId.value = null
  }
}

async function addDesign() {
  if (!newTitle.value.trim()) return
  if (await store.createDesign(newTitle.value.trim(), newStyle.value.trim())) {
    newTitle.value = ''
    newStyle.value = ''
    newOpen.value = false
  }
}

function slotLabel(key: string) {
  if (key === 'back') return 'Back'
  return store.cards.find((card) => card.key === key)?.title ?? key
}

function slotState(entry: TarotArtRecord | null) {
  if (!entry) return 'empty'
  if (entry.status === 'RENDERED') return 'rendered'
  if (entry.status === 'FAILED') return 'failed'
  return 'waiting'
}
</script>

<template>
  <section
    class="kr-scroll min-h-0 flex-1 overflow-y-auto rounded-xl border border-base-content/10 bg-base-200/40 p-2 sm:p-3"
    aria-label="Deck designs and samples"
    data-testid="tarot-design-board"
  >
    <div
      v-if="store.approvedDesign && approvedProgress"
      class="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-3"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm font-black">
          Approved design: {{ store.approvedDesign.title }}
        </p>
        <p class="text-xs opacity-75">
          {{ approvedProgress.rendered }} rendered ·
          {{ approvedProgress.requested }} requested of
          {{ approvedProgress.total }} faces
        </p>
      </div>
      <button
        class="btn btn-success btn-sm"
        type="button"
        :disabled="store.saving"
        @click="store.requestArt('set', { designId: store.approvedDesign.id })"
      >
        Generate full set
      </button>
    </div>

    <div class="mb-3 flex flex-wrap items-center gap-2">
      <button
        class="btn btn-outline btn-sm"
        type="button"
        @click="newOpen = !newOpen"
      >
        + New design
      </button>
      <label class="label cursor-pointer gap-2 text-xs">
        <input
          v-model="showArchived"
          type="checkbox"
          class="toggle toggle-xs"
        />
        Show archived
      </label>
      <span v-if="store.openArtCount" class="badge badge-warning badge-sm">
        {{ store.openArtCount }} rendering
      </span>
      <span
        v-if="store.enqueueProgress.total && store.saving"
        class="text-xs opacity-70"
        aria-live="polite"
      >
        Queuing {{ store.enqueueProgress.done }}/{{
          store.enqueueProgress.total
        }}
      </span>
    </div>

    <form
      v-if="newOpen"
      class="mb-3 grid gap-2 rounded-xl border border-primary/30 bg-base-200 p-3"
      @submit.prevent="addDesign"
    >
      <input
        v-model="newTitle"
        class="input input-bordered input-sm"
        maxlength="160"
        aria-label="Design title"
        placeholder="Design name, e.g. Rainbow Ink"
        required
      />
      <textarea
        v-model="newStyle"
        class="textarea textarea-bordered text-xs"
        rows="2"
        maxlength="12000"
        aria-label="Style prompt"
        placeholder="Medium, palette, linework and lighting in concrete words"
      />
      <button class="btn btn-primary btn-sm justify-self-start" type="submit">
        Add design
      </button>
    </form>

    <div class="grid gap-3">
      <article
        v-for="design in visibleDesigns"
        :key="design.id"
        class="rounded-2xl border bg-base-100/60 p-3"
        :class="
          design.status === 'APPROVED'
            ? 'border-success'
            : 'border-base-content/10'
        "
      >
        <header class="mb-2 flex flex-wrap items-center gap-2">
          <h3 class="text-sm font-black">{{ design.title }}</h3>
          <span
            class="badge badge-sm"
            :class="
              design.status === 'APPROVED'
                ? 'badge-success'
                : design.status === 'ARCHIVED'
                  ? 'badge-ghost'
                  : 'badge-outline'
            "
          >
            {{ design.status }}
          </span>
          <span class="text-[11px] opacity-60">
            {{ design.engine }} · {{ design.checkpoint || 'engine default' }}
          </span>
          <div class="ml-auto flex flex-wrap gap-1">
            <button
              class="btn btn-ghost btn-xs"
              type="button"
              @click="edit(design.id)"
            >
              {{ editingId === design.id ? 'Close' : 'Edit recipe' }}
            </button>
            <button
              class="btn btn-primary btn-xs"
              type="button"
              :disabled="store.saving"
              @click="store.requestArt('samples', { designId: design.id })"
            >
              Generate samples
            </button>
            <button
              class="btn btn-ghost btn-xs"
              type="button"
              :disabled="store.saving"
              @click="
                store.requestArt('samples', {
                  designId: design.id,
                  force: true,
                })
              "
            >
              Re-roll
            </button>
            <button
              v-if="design.status !== 'APPROVED'"
              class="btn btn-success btn-xs"
              type="button"
              :disabled="store.saving"
              @click="store.approveDesign(design.id)"
            >
              Approve design
            </button>
            <button
              v-if="design.status !== 'ARCHIVED'"
              class="btn btn-ghost btn-xs"
              type="button"
              :disabled="store.saving"
              @click="store.saveDesign(design.id, { status: 'ARCHIVED' })"
            >
              Archive
            </button>
            <button
              v-else
              class="btn btn-ghost btn-xs"
              type="button"
              @click="store.saveDesign(design.id, { status: 'EXPLORING' })"
            >
              Restore
            </button>
          </div>
        </header>

        <form
          v-if="editingId === design.id"
          class="mb-3 grid gap-2 text-xs"
          @submit.prevent="saveDraft"
        >
          <label class="form-control">
            <span class="mb-1 font-bold">Title</span>
            <input
              v-model="draft.title"
              class="input input-bordered input-sm"
              maxlength="160"
            />
          </label>
          <label class="form-control">
            <span class="mb-1 font-bold">Face style prompt</span>
            <textarea
              v-model="draft.stylePrompt"
              class="textarea textarea-bordered font-mono text-xs"
              rows="3"
              maxlength="12000"
            />
          </label>
          <label class="form-control">
            <span class="mb-1 font-bold">Back prompt</span>
            <textarea
              v-model="draft.backPrompt"
              class="textarea textarea-bordered font-mono text-xs"
              rows="3"
              maxlength="12000"
            />
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label class="form-control">
              <span class="mb-1 font-bold">Engine</span>
              <select
                v-model="draft.engine"
                class="select select-bordered select-sm"
              >
                <option
                  v-for="engine in TAROT_DESIGN_ENGINES"
                  :key="engine"
                  :value="engine"
                >
                  {{ engine }}
                </option>
              </select>
            </label>
            <label class="form-control">
              <span class="mb-1 font-bold">Checkpoint</span>
              <input
                v-model="draft.checkpoint"
                class="input input-bordered input-sm"
                maxlength="255"
                placeholder="Engine default"
              />
            </label>
          </div>
          <label class="form-control">
            <span class="mb-1 font-bold">LoRAs (name:strength per line)</span>
            <textarea
              v-model="draft.loras"
              class="textarea textarea-bordered font-mono text-xs"
              rows="2"
              maxlength="4000"
            />
          </label>
          <label class="form-control">
            <span class="mb-1 font-bold">Notes</span>
            <textarea
              v-model="draft.notes"
              class="textarea textarea-bordered"
              rows="2"
              maxlength="16000"
            />
          </label>
          <button
            class="btn btn-primary btn-sm justify-self-start"
            type="submit"
            :disabled="store.saving"
          >
            Save design
          </button>
        </form>

        <div class="grid grid-cols-5 gap-2">
          <figure
            v-for="(entry, key) in store.samplesForDesign(design.id)"
            :key="key"
            class="min-w-0"
          >
            <div class="relative">
              <img
                v-if="slotState(entry) === 'rendered' && entry"
                :src="store.artUrl(entry)"
                :alt="`${slotLabel(String(key))} sample in ${design.title}`"
                class="aspect-[2/3] w-full rounded-xl object-cover"
                loading="lazy"
              />
              <tarot-card-face
                v-else
                :title="slotLabel(String(key))"
                :card-key="String(key)"
                :side="key === 'back' ? 'back' : 'face'"
                class="opacity-60"
              />
              <span
                v-if="slotState(entry) === 'waiting'"
                class="badge badge-warning badge-xs absolute left-1 top-1"
              >
                {{ entry?.status }}
              </span>
              <span
                v-if="slotState(entry) === 'failed'"
                class="badge badge-error badge-xs absolute left-1 top-1"
                :title="entry?.error || ''"
              >
                failed
              </span>
              <button
                v-if="
                  key === 'back' &&
                  entry &&
                  slotState(entry) === 'rendered' &&
                  store.activeDeck?.backArtId !== entry.id
                "
                class="btn btn-xs absolute bottom-1 left-1 right-1"
                type="button"
                @click="store.setBack(entry.id)"
              >
                Use as back
              </button>
              <span
                v-else-if="
                  key === 'back' &&
                  entry &&
                  store.activeDeck?.backArtId === entry.id
                "
                class="badge badge-success badge-xs absolute bottom-1 left-1"
              >
                deck back
              </span>
            </div>
            <figcaption
              class="mt-1 truncate text-center text-[10px] opacity-70"
            >
              {{ slotLabel(String(key)) }}
            </figcaption>
          </figure>
        </div>
      </article>
    </div>
  </section>
</template>
