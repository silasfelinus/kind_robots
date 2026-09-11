<template>
  <div class="kr-unbound flex flex-col items-center bg-(--kr-surface) px-4 py-6">
    <div class="w-full max-w-3xl">
      <div
        v-if="userStore.isAdmin"
        class="kr-panel-flat sticky top-3 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 bg-base-100/95 p-3 shadow-lg backdrop-blur"
      >
        <div class="join">
          <button
            type="button"
            class="kr-btn-join-sm"
            :class="visitorPreview ? 'btn-ghost' : 'btn-primary'"
            @click="visitorPreview = false"
          >
            Writing mode
          </button>
          <button
            type="button"
            class="kr-btn-join-sm"
            :class="visitorPreview ? 'btn-primary' : 'btn-ghost'"
            @click="visitorPreview = true"
          >
            Visitor preview
          </button>
        </div>
        <p class="kr-text-dim-xs-60">
          {{ visitorPreview ? 'Edit controls hidden' : saveStatus }}
        </p>
      </div>

      <div
        v-if="userStore.isAdmin && lastError && !loaded"
        class="alert alert-error mb-4"
        role="alert"
      >
        <Icon name="kind-icon:warning" class="kr-icon-5" />
        <span class="flex-1">{{ lastError }}</span>
        <button
          type="button"
          class="kr-btn-plain"
          @click="mermaidsStore.loadDraft(true)"
        >
          Retry load
        </button>
      </div>

      <header
        class="relative mb-6 overflow-hidden rounded-3xl border border-base-300 bg-linear-to-br from-primary/18 via-base-100 to-secondary/16 shadow-lg"
      >
        <div class="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div class="min-w-0">
            <template v-if="editing">
              <input
                v-model="draft.heroTitle"
                aria-label="Page title"
                class="kr-text-black-2xl input input-bordered mb-3 w-full sm:text-3xl"
              />
              <textarea
                v-model="draft.heroSubtitle"
                aria-label="Page subtitle"
                class="textarea textarea-bordered min-h-20 w-full text-sm font-semibold sm:text-base"
              />
            </template>
            <template v-else>
              <h2 class="text-3xl font-black text-base-content sm:text-4xl">
                {{ draft.heroTitle }}
              </h2>
              <p class="mt-2 text-sm font-semibold text-base-content/75 sm:text-base">
                {{ draft.heroSubtitle }}
              </p>
            </template>
          </div>

          <img
            src="/images/utility/mermaids/mermaids1.jpg"
            alt="Mermaids of Venice book cover"
            class="mx-auto w-36 rounded-xl shadow-xl sm:mx-0 sm:w-44"
          />
        </div>
      </header>

      <section class="kr-panel mb-4 flex flex-col gap-5 p-5 sm:flex-row">
        <img
          src="/images/utility/mermaids/mermaids1.jpg"
          alt="Mermaids of Venice novel"
          class="mx-auto w-40 shrink-0 self-start rounded-xl shadow-md sm:mx-0"
        />

        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
            >
              <Icon name="kind-icon:book" class="kr-icon-5" />
            </span>
            <input
              v-if="editing"
              v-model="draft.bookHeading"
              aria-label="Book section heading"
              class="kr-text-eyebrow input input-bordered w-full tracking-wider"
            />
            <h2
              v-else
              class="kr-text-eyebrow text-base tracking-wider text-base-content"
            >
              {{ draft.bookHeading }}
            </h2>
          </div>

          <textarea
            v-if="editing"
            v-model="draft.bookDescription"
            aria-label="Book description"
            class="textarea textarea-bordered min-h-36 w-full text-sm leading-relaxed"
          />
          <p v-else class="kr-text-dim-sm-70 whitespace-pre-line leading-relaxed">
            {{ draft.bookDescription }}
          </p>

          <div class="mt-1 flex flex-wrap items-center gap-2">
            <a
              href="https://www.amazon.com/Mermaids-Venice-Silas-Knight/dp/0615516742/"
              target="_blank"
              rel="noopener"
              class="btn btn-primary btn-sm rounded-2xl"
            >
              <Icon name="kind-icon:external-link" class="kr-icon-4" />
              {{ draft.amazonLabel }}
            </a>
            <input
              v-if="editing"
              v-model="draft.amazonLabel"
              aria-label="Amazon button label"
              class="kr-input-sm min-w-48 flex-1"
            />
          </div>

          <mermaids-pdf-purchase />

          <textarea
            v-if="editing"
            v-model="draft.signedCopiesNote"
            aria-label="Signed copies note"
            class="textarea textarea-bordered min-h-20 w-full text-xs"
          />
          <p v-else class="kr-text-dim-xs whitespace-pre-line">
            {{ draft.signedCopiesNote }}
          </p>
        </div>
      </section>

      <section
        class="mb-4 kr-panel-flat p-5 shadow-sm"
      >
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary"
          >
            <Icon name="kind-icon:hand-heart" class="kr-icon-5" />
          </span>
          <input
            v-if="editing"
            v-model="draft.personalNoteHeading"
            aria-label="Personal note heading"
            class="kr-text-eyebrow input input-bordered w-full tracking-wider"
          />
          <h2
            v-else
            class="kr-text-eyebrow text-base tracking-wider text-base-content"
          >
            {{ draft.personalNoteHeading }}
          </h2>
        </div>

        <textarea
          v-if="editing"
          v-model="draft.personalNote"
          aria-label="Personal note"
          class="textarea textarea-bordered min-h-64 w-full text-sm leading-relaxed"
          placeholder="Write your note here."
        />
        <p v-else class="kr-text-dim-sm-70 whitespace-pre-line leading-relaxed">
          {{ draft.personalNote }}
        </p>
      </section>

      <section class="kr-panel p-5">
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent"
          >
            <Icon name="kind-icon:robot-color" class="kr-icon-5" />
          </span>
          <input
            v-if="editing"
            v-model="draft.aiNoteHeading"
            aria-label="AI disclosure heading"
            class="kr-text-eyebrow input input-bordered w-full tracking-wider"
          />
          <h2
            v-else
            class="kr-text-eyebrow text-base tracking-wider text-base-content"
          >
            {{ draft.aiNoteHeading }}
          </h2>
        </div>

        <textarea
          v-if="editing"
          v-model="draft.aiNote"
          aria-label="AI disclosure"
          class="textarea textarea-bordered min-h-56 w-full text-sm leading-relaxed"
        />
        <p v-else class="kr-text-dim-sm-70 whitespace-pre-line leading-relaxed">
          {{ draft.aiNote }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMermaidsStore } from '@/stores/mermaidsStore'
import { useUserStore } from '@/stores/userStore'

const mermaidsStore = useMermaidsStore()
const userStore = useUserStore()
const { draft, loaded, lastError, saveStatus } = storeToRefs(mermaidsStore)
const visitorPreview = ref(false)
const editing = computed(
  () => userStore.isAdmin && loaded.value && !visitorPreview.value,
)

onMounted(() => void mermaidsStore.loadDraft())
</script>
