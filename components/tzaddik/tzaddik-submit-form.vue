<!-- /components/tzaddik/tzaddik-submit-form.vue -->
<!--
  Authenticated candidate submission (tzaddik-gallery/t-006). Opened from
  pages/tzaddik-gallery.vue by a signed-in user. Submissions always land at
  curationState: PENDING -- an editor reviews before a nomination joins the
  public Living/Memorial galleries (see server/api/tzaddik/index.post.ts and
  the [id].get.ts submitter-visibility carve-out).
-->
<template>
  <Teleport to="body">
    <dialog
      class="modal modal-open"
      aria-modal="true"
      @cancel.prevent="emit('close')"
      @click.self="emit('close')"
    >
      <div
        class="modal-box flex max-h-[88dvh] w-[min(94vw,36rem)] max-w-none flex-col overflow-hidden rounded-3xl border-2 border-primary/60 bg-base-100 p-0 shadow-2xl"
      >
        <header
          class="flex shrink-0 items-start gap-3 kr-panel-header-sm sm:p-4"
        >
          <div class="min-w-0 flex-1">
            <p
              class="kr-text-eyebrow text-[0.6rem] tracking-[0.18em] text-primary"
            >
              Tzaddik Gallery
            </p>
            <h2 class="kr-text-black-lg truncate sm:text-xl">
              Submit a candidate
            </h2>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm shrink-0 rounded-xl"
            aria-label="Close"
            @click="emit('close')"
          >
            <Icon name="kind-icon:x" class="kr-icon-4" />
          </button>
        </header>

        <form
          class="kr-scroll flex flex-col gap-3 p-3 sm:p-4"
          @submit.prevent="submit"
        >
          <p class="text-sm leading-relaxed text-base-content/75">
            Nominate a real, sourced person. Every submission starts as a
            pending suggestion -- an editor reviews it before it joins the
            public gallery.
          </p>

          <label class="flex flex-col gap-1">
            <span class="kr-text-bold-xs">Name</span>
            <input
              v-model="displayName"
              type="text"
              maxlength="255"
              required
              placeholder="Full name"
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="kr-text-bold-xs">Living or memorial?</span>
            <select
              v-model="lifeState"
              required
              class="select select-bordered w-full rounded-xl text-sm"
            >
              <option value="LIVING">Living</option>
              <option value="MEMORIAL">Memorial (deceased)</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="kr-text-bold-xs">Wikipedia source</span>
            <input
              v-model="wikipediaUrl"
              type="url"
              maxlength="2048"
              required
              placeholder="https://en.wikipedia.org/wiki/..."
              class="input input-bordered w-full rounded-xl text-sm"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="kr-text-bold-xs">Why does this person belong?</span>
            <textarea
              v-model="rationale"
              required
              rows="3"
              placeholder="What makes this a compelling nomination?"
              class="textarea textarea-bordered w-full rounded-xl text-sm"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="kr-text-bold-xs">Biography (optional)</span>
            <textarea
              v-model="biography"
              rows="3"
              placeholder="A short sourced summary, if you have one handy"
              class="textarea textarea-bordered w-full rounded-xl text-sm"
            />
          </label>

          <p v-if="errorMessage" class="kr-note kr-note-warning">
            {{ errorMessage }}
          </p>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              :disabled="busy"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm gap-1.5 rounded-xl"
              :disabled="busy || !canSubmit"
            >
              <span v-if="busy" class="kr-spinner-xs" />
              Submit
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTzaddikStore } from '@/stores/tzaddikStore'
import type { TzaddikCandidateWithTags } from '@/stores/tzaddikStore'

const emit = defineEmits<{
  close: []
  submitted: [candidate: TzaddikCandidateWithTags]
}>()

const store = useTzaddikStore()

const displayName = ref('')
const lifeState = ref<'LIVING' | 'MEMORIAL'>('LIVING')
const wikipediaUrl = ref('')
const rationale = ref('')
const biography = ref('')
const errorMessage = ref('')

const busy = computed(() => store.isSubmittingCandidate)

const canSubmit = computed(
  () =>
    displayName.value.trim().length > 0 &&
    rationale.value.trim().length > 0 &&
    wikipediaUrl.value.trim().length > 0,
)

async function submit(): Promise<void> {
  if (!canSubmit.value) return
  errorMessage.value = ''

  const result = await store.submitCandidate({
    displayName: displayName.value.trim(),
    lifeState: lifeState.value,
    rationale: rationale.value.trim(),
    wikipediaUrl: wikipediaUrl.value.trim(),
    biography: biography.value.trim() || undefined,
  })

  if (!result) {
    errorMessage.value = store.submitError || 'Failed to submit this candidate.'
    return
  }

  emit('submitted', result)
}
</script>
