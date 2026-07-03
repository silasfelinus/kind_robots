<!-- /components/pages/serendipity-page.vue -->
<!-- Serendipity scaffold (serendipity/t-002): themed intro + streamed story
     loop on chat streams. Theme picker from Dreams arrives with t-003;
     task weaving with t-005. Read-only — no writes to todos or roadmaps. -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex items-start gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary"
      >
        <Icon name="kind-icon:sparkles" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-secondary/70">
          Serendipity
        </p>
        <h2 class="text-2xl font-black leading-tight">
          Step into a story that helps
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          Pick a tone, open the door, and answer what the story asks. You are
          the protagonist.
        </p>
      </div>
      <button
        v-if="store.session"
        type="button"
        class="btn btn-ghost btn-sm rounded-xl"
        :disabled="store.isWeaving"
        @click="startOver"
      >
        <Icon name="kind-icon:wand" class="size-4" /> New story
      </button>
    </header>

    <!-- Intro screen -->
    <div
      v-if="!store.session"
      class="space-y-4 rounded-2xl border border-secondary/20 bg-secondary/5 p-4"
    >
      <h3 class="text-xs font-bold uppercase tracking-wide text-secondary/70">
        Choose your door
      </h3>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="tone in SERENDIPITY_TONES"
          :key="tone"
          type="button"
          class="btn btn-sm rounded-xl capitalize"
          :class="
            tone === selectedTone
              ? 'btn-secondary'
              : 'btn-ghost border border-base-300'
          "
          @click="selectedTone = tone"
        >
          {{ tone }}
        </button>
      </div>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs font-bold uppercase tracking-wide">
            Vibe words (optional, comma separated)
          </span>
        </div>
        <input
          v-model="vibeInput"
          type="text"
          placeholder="moonlit, salt-air, mischievous"
          class="input input-bordered w-full rounded-xl"
          :disabled="store.isWeaving"
        />
      </label>

      <p v-if="store.errorMessage" class="text-xs text-error">
        {{ store.errorMessage }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-secondary rounded-xl"
          :disabled="store.isWeaving"
          @click="begin(false)"
        >
          <span
            v-if="store.isWeaving"
            class="loading loading-dots loading-sm"
          />
          <template v-else>
            <Icon name="kind-icon:sparkles" class="size-4" /> Open the door
          </template>
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="begin(true)"
        >
          <Icon name="kind-icon:wand" class="size-4" /> Surprise me
        </button>
        <p class="text-xs text-base-content/50">
          Soon: pick places and genres from your Dreams.
        </p>
      </div>
    </div>

    <!-- Story panel -->
    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <article
          v-for="beat in store.session.beats"
          :key="beat.id"
          class="space-y-2"
        >
          <div
            class="whitespace-pre-line rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm leading-relaxed"
          >
            {{ beat.narrative }}
          </div>
          <div
            v-if="beat.answer"
            class="ml-8 rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-sm leading-relaxed"
          >
            {{ beat.answer.text }}
          </div>
        </article>

        <div
          v-if="store.isWeaving"
          class="whitespace-pre-line rounded-2xl border border-dashed border-secondary/40 bg-base-200/40 p-4 text-sm leading-relaxed"
        >
          <template v-if="store.streamingText">{{
            store.streamingText
          }}</template>
          <span v-else class="flex items-center gap-2 text-base-content/60">
            <span class="loading loading-dots loading-sm" />
            Serendipity is weaving…
          </span>
        </div>

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>
      </div>

      <form
        class="flex items-end gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3"
        @submit.prevent="submitAnswer"
      >
        <textarea
          v-model="answerInput"
          rows="2"
          class="textarea textarea-bordered min-h-0 w-full flex-1 rounded-xl text-sm leading-relaxed"
          :placeholder="
            store.awaitingAnswer ? 'Answer the story…' : 'The story is weaving…'
          "
          :disabled="!store.awaitingAnswer"
          @keydown.enter.exact.prevent="submitAnswer"
        />
        <button
          type="submit"
          class="btn btn-secondary rounded-xl"
          :disabled="!store.awaitingAnswer || !answerInput.trim()"
        >
          <Icon name="kind-icon:sparkles" class="size-4" /> Answer
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  SERENDIPITY_TONES,
  useSerendipityStore,
  type SerendipityTone,
} from '@/stores/serendipityStore'

const store = useSerendipityStore()

const selectedTone = ref<SerendipityTone>('cozy')
const vibeInput = ref('')
const answerInput = ref('')

function parseVibes(): string[] {
  return vibeInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6)
}

async function begin(surprise: boolean) {
  const tone = surprise
    ? (SERENDIPITY_TONES[
        Math.floor(Math.random() * SERENDIPITY_TONES.length)
      ] ?? 'surprising')
    : selectedTone.value
  await store.beginStory({ tone, vibeTags: parseVibes(), surprise })
}

async function submitAnswer() {
  const text = answerInput.value.trim()
  if (!text || !store.awaitingAnswer) return
  answerInput.value = ''
  await store.answerCurrentBeat(text)
}

function startOver() {
  if (store.isWeaving) return
  store.resetSession()
}

onMounted(() => {
  store.restoreFromLocalStorage()
})
</script>
