<template>
  <button
    type="button"
    class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 bg-base-100"
    aria-label="Report a screenshot issue"
    title="Report this page to Conductor"
    data-testid="admin-screenshot-button"
    @click="begin"
  >
    <Icon name="kind-icon:camera" class="kr-icon-5" />
  </button>

  <Teleport to="body">
    <div
      v-if="feedback.open"
      class="fixed inset-0 z-[999] grid place-items-center bg-black/75 p-3"
      role="presentation"
      @click.self="feedback.close()"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-feedback-heading"
        class="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-base-content shadow-2xl"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 p-3"
        >
          <div class="min-w-0">
            <h2 id="site-feedback-heading" class="text-lg font-bold">
              Report this screen
            </h2>
            <p class="truncate text-xs text-base-content/65">
              {{ feedback.path }}
            </p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square"
            aria-label="Close feedback"
            @click="feedback.close()"
          >
            <Icon name="kind-icon:close" class="kr-icon-4" />
          </button>
        </div>

        <div class="kr-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <div v-if="feedback.result" class="space-y-3" role="status">
            <p class="font-semibold text-success">
              Issue created and routed to Conductor.
            </p>
            <a
              :href="feedback.result.url"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary break-all"
            >
              Open GitHub issue #{{ feedback.result.issue }}
            </a>
            <button
              type="button"
              class="btn btn-primary btn-sm block"
              @click="feedback.close()"
            >
              Done
            </button>
          </div>

          <template v-else>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="feedback.canCapture"
                type="button"
                class="btn btn-secondary btn-sm"
                :disabled="feedback.submitting"
                @click="feedback.capture()"
              >
                <Icon name="kind-icon:camera" class="kr-icon-4" />
                Capture screen
              </button>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="feedback.submitting"
                @click="chooseScreenshot"
              >
                Choose screenshot
              </button>
              <input
                ref="fileInput"
                class="hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Choose screenshot file"
                @change="fileSelected"
              />
            </div>

            <div
              v-if="feedback.previewUrl"
              class="overflow-hidden rounded-xl border border-base-300 bg-base-200"
            >
              <img
                :src="feedback.previewUrl"
                alt="Screenshot preview before posting to GitHub"
                class="max-h-48 w-full object-contain"
              />
            </div>
            <p
              v-else
              class="rounded-xl border border-dashed border-base-300 p-3 text-xs opacity-70"
            >
              Attach what you see. On iPad, take a normal device screenshot,
              then choose it here.
            </p>

            <label class="form-control block">
              <span class="mb-1 block text-sm font-semibold">Issue title</span>
              <input
                v-model="feedback.title"
                class="input input-bordered w-full"
                type="text"
                maxlength="130"
                placeholder="What should the agent fix?"
              />
            </label>

            <label class="form-control block">
              <span class="mb-1 block text-sm font-semibold"
                >Your feedback</span
              >
              <textarea
                v-model="feedback.note"
                class="textarea textarea-bordered min-h-28 w-full"
                maxlength="6000"
                placeholder="What is wrong, and what would you prefer?"
              />
            </label>

            <label class="form-control block">
              <span class="mb-1 block text-sm font-semibold"
                >Conductor project</span
              >
              <input
                v-model="feedback.project"
                class="input input-bordered w-full"
                type="text"
                maxlength="80"
                autocapitalize="off"
                spellcheck="false"
              />
              <span class="mt-1 block text-xs opacity-65">
                Auto-detected from the page. Correct the roadmap slug if needed.
              </span>
            </label>

            <label
              class="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs"
            >
              <input
                v-model="consent"
                type="checkbox"
                class="checkbox checkbox-warning checkbox-sm"
              />
              <span>
                I reviewed the screenshot and approve publishing it in a public
                GitHub issue. No private user data, tokens or personal
                information should be visible.
              </span>
            </label>

            <p v-if="feedback.error" role="alert" class="text-sm text-error">
              {{ feedback.error }}
            </p>

            <button
              type="button"
              class="btn btn-primary w-full"
              :disabled="
                !consent ||
                !feedback.screenshot ||
                !feedback.title.trim() ||
                !feedback.note.trim() ||
                feedback.submitting
              "
              @click="feedback.submit()"
            >
              <Icon name="kind-icon:camera" class="kr-icon-4" />
              {{
                feedback.submitting ? 'Submitting…' : 'Submit screenshot issue'
              }}
            </button>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSiteFeedbackStore } from '~/stores/siteFeedbackStore'

const feedback = useSiteFeedbackStore()
const consent = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function begin(): void {
  consent.value = false
  feedback.begin()
}

function chooseScreenshot(): void {
  fileInput.value?.click()
}

function fileSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  feedback.setScreenshot(input.files?.[0] || null)
  input.value = ''
}
</script>
