<template>
  <section
    class="kr-panel flex max-h-[48vh] shrink-0 flex-col gap-3 overflow-auto border-2 p-3"
    :class="verdictBorder"
    aria-label="The Editor"
  >
    <header class="flex flex-wrap items-center gap-2">
      <div class="mr-auto">
        <p class="kr-text-black-base">The Editor</p>
        <p class="kr-text-dim-xs">
          Only GREAT gets through. Pitch it, challenge what you're working on,
          or argue back.
        </p>
      </div>
      <label
        class="flex items-center gap-2 text-xs"
        title="Ask for a verdict whenever series, character or issue notes change"
      >
        <input
          type="checkbox"
          class="kr-checkbox-primary-sm"
          :checked="studio.autoEditor"
          @change="
            studio.setAutoEditor(($event.target as HTMLInputElement).checked)
          "
        />
        Speaks up on notes saves
      </label>
      <button
        type="button"
        class="kr-btn btn-ghost btn-xs"
        @click="folded = !folded"
      >
        {{ folded ? 'Open' : 'Fold' }}
      </button>
    </header>

    <template v-if="!folded">
      <div
        class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]"
      >
        <div class="flex flex-col gap-2">
          <textarea
            v-model="pitch"
            class="kr-textarea min-h-24 text-sm"
            placeholder="Pitch an idea: a beat, a twist, a character turn, a faction, a cover..."
            aria-label="Pitch the editor"
            @keydown.meta.enter="sendPitch"
            @keydown.ctrl.enter="sendPitch"
          />
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="kr-btn btn-primary btn-sm"
              :disabled="!pitch.trim() || Boolean(studio.editorBusy)"
              @click="sendPitch"
            >
              <span
                v-if="studio.editorBusy?.startsWith('pitch')"
                class="kr-spinner-xs"
              />
              Pitch it
            </button>
            <button
              v-if="challengeTarget"
              type="button"
              class="kr-btn btn-outline btn-sm"
              :disabled="Boolean(studio.editorBusy)"
              @click="challenge"
            >
              <span
                v-if="
                  studio.editorBusy &&
                  !studio.editorBusy.startsWith('pitch') &&
                  !studio.editorBusy.startsWith('reply')
                "
                class="kr-spinner-xs"
              />
              Challenge {{ challengeTarget.label }}
            </button>
            <span v-if="studio.editorBusy" class="kr-text-dim-xs"
              >The editor is reading everything you've established...</span
            >
          </div>
          <p v-if="studio.editorError" class="kr-note kr-note-error text-xs">
            {{ studio.editorError }}
          </p>
          <div
            v-if="history.length > 1"
            class="max-h-40 overflow-auto rounded-xl border border-base-300"
          >
            <button
              v-for="item in history"
              :key="item.id"
              type="button"
              class="flex w-full items-start gap-2 border-b border-base-300 px-2 py-1 text-left text-xs last:border-b-0 hover:bg-base-200"
              :class="{ 'bg-base-200': item.id === featured?.id }"
              @click="featuredId = item.id"
            >
              <span
                class="badge badge-xs mt-0.5 shrink-0"
                :class="verdictBadge(item.verdict)"
                >{{ item.verdict }}</span
              >
              <span class="min-w-0 flex-1 truncate"
                >{{ item.targetName ? `${item.targetName}: ` : ''
                }}{{ item.headline }}</span
              >
            </button>
          </div>
        </div>

        <article v-if="featured" class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="badge badge-lg font-black uppercase"
              :class="verdictBadge(featured.verdict)"
              >{{ featured.verdict }}</span
            >
            <span class="kr-text-dim-xs"
              >{{ targetLabel(featured) }} ·
              {{
                featured.trigger === 'auto'
                  ? 'spoke up'
                  : featured.trigger === 'reply'
                    ? 'after your reply'
                    : 'asked'
              }}</span
            >
          </div>
          <p class="text-base font-bold leading-snug">
            {{ featured.headline }}
          </p>
          <ul v-if="featured.problems.length" class="space-y-1 text-sm">
            <li
              v-for="(problem, index) in featured.problems"
              :key="index"
              class="flex gap-2"
            >
              <span
                class="badge badge-xs mt-1 shrink-0"
                :class="
                  problem.severity === 'high'
                    ? 'badge-error'
                    : problem.severity === 'medium'
                      ? 'badge-warning'
                      : 'badge-ghost'
                "
                >{{ problem.area }}</span
              >
              <span>{{ problem.issue }}</span>
            </li>
          </ul>
          <div v-if="featured.questions.length" class="text-sm">
            <p class="kr-text-dim-xs">Answer these</p>
            <ul class="list-disc space-y-0.5 pl-5">
              <li v-for="(question, index) in featured.questions" :key="index">
                {{ question }}
              </li>
            </ul>
          </div>
          <p v-if="featured.bar" class="rounded-xl bg-base-200 p-2 text-sm">
            <span class="font-bold">The bar: </span>{{ featured.bar }}
          </p>
          <details v-if="featured.strengths.length" class="text-sm">
            <summary class="cursor-pointer kr-text-dim-xs">
              What's working
            </summary>
            <ul class="mt-1 list-disc space-y-0.5 pl-5">
              <li v-for="(strength, index) in featured.strengths" :key="index">
                {{ strength }}
              </li>
            </ul>
          </details>
          <div class="flex gap-2">
            <textarea
              v-model="reply"
              class="kr-textarea min-h-12 flex-1 text-sm"
              placeholder="Argue back, or show the revision..."
              aria-label="Reply to the editor"
            />
            <button
              type="button"
              class="kr-btn btn-outline btn-sm self-end"
              :disabled="!reply.trim() || Boolean(studio.editorBusy)"
              @click="sendReply"
            >
              <span
                v-if="studio.editorBusy?.startsWith('reply')"
                class="kr-spinner-xs"
              />
              Reply
            </button>
          </div>
        </article>
        <div
          v-else
          class="grid place-items-center rounded-2xl border border-dashed border-base-300 p-4 text-center"
        >
          <p class="kr-text-dim-sm">
            No verdicts yet. Pitch something, or challenge the series notes.
          </p>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'
import type { ComicCritiqueDto } from '~/types/comicStudio'
import type { ComicEditorTarget } from '~/utils/comicEditor'

const studio = useComicStudioStore()
const pitch = ref('')
const reply = ref('')
const folded = ref(false)
const featuredId = ref<number | null>(null)

const history = computed(() => studio.critiques.slice(0, 40))
const featured = computed(
  () =>
    studio.critiques.find((item) => item.id === featuredId.value) ??
    studio.critiques[0] ??
    null,
)
watch(
  () => studio.critiques[0]?.id,
  () => {
    featuredId.value = null
  },
)

const challengeTarget = computed<{
  type: ComicEditorTarget
  id: number | null
  label: string
} | null>(() => {
  if (studio.mode === 'composer' && studio.selectedPanel?.slotId) {
    return {
      type: 'slot',
      id: studio.selectedPanel.slotId,
      label: 'this panel',
    }
  }
  if (studio.mode === 'composer' && studio.selectedIssue) {
    return {
      type: 'issue',
      id: studio.selectedIssue.id,
      label: `issue ${studio.selectedIssue.number}`,
    }
  }
  if (studio.selectedSlot)
    return {
      type: 'slot',
      id: studio.selectedSlot.id,
      label: `"${studio.selectedSlot.title}"`,
    }
  if (studio.selectedEntity)
    return {
      type: 'entity',
      id: studio.selectedEntity.id,
      label: studio.selectedEntity.name,
    }
  return studio.series
    ? { type: 'series', id: null, label: 'the series notes' }
    : null
})

function verdictBadge(verdict: string): string {
  if (verdict === 'great') return 'badge-success'
  if (verdict === 'close') return 'badge-info'
  if (verdict === 'not-yet') return 'badge-warning'
  return 'badge-error'
}

const verdictBorder = computed(() => {
  const verdict = featured.value?.verdict
  if (verdict === 'great') return 'border-success'
  if (verdict === 'close') return 'border-info'
  if (verdict === 'not-yet') return 'border-warning'
  if (verdict === 'reject') return 'border-error'
  return 'border-base-300'
})

function targetLabel(item: ComicCritiqueDto): string {
  if (item.targetType === 'pitch') return 'Pitch'
  return item.targetName ?? item.targetType
}

async function sendPitch() {
  const text = pitch.value.trim()
  if (!text || studio.editorBusy) return
  const result = await studio.askEditor({ targetType: 'pitch', text })
  if (result) pitch.value = ''
}

async function challenge() {
  const target = challengeTarget.value
  if (!target || studio.editorBusy) return
  await studio.askEditor({ targetType: target.type, targetId: target.id })
}

async function sendReply() {
  const text = reply.value.trim()
  if (!text || !featured.value || studio.editorBusy) return
  const result = await studio.askEditor({ parentId: featured.value.id, text })
  if (result) reply.value = ''
}
</script>
