<!-- /pages/admin/wonderlab-review-generator.vue -->
<template>
  <main class="mx-auto min-h-screen max-w-3xl space-y-4 p-4 md:p-6">
    <header class="rounded-3xl border border-base-300 bg-base-100 p-5">
      <p class="text-xs font-black uppercase tracking-widest text-primary">
        WonderLab Editorial
      </p>
      <h1 class="mt-2 text-3xl font-black">Generate a personality review draft</h1>
      <p class="mt-2 text-sm leading-relaxed text-base-content/60">
        This creates a proposed draft only. A curator must review, approve, and separately
        publish it from the curator workspace.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink to="/admin/wonderlab-reviews" class="btn btn-primary btn-sm">
          Open curator workspace
        </NuxtLink>
        <NuxtLink to="/wonderlab" class="btn btn-outline btn-sm">Open WonderLab</NuxtLink>
      </div>
    </header>

    <section v-if="!ready" class="grid min-h-52 place-items-center rounded-3xl bg-base-100">
      <span class="loading loading-spinner loading-lg text-primary" />
    </section>

    <section v-else-if="!userStore.isAdmin" class="rounded-3xl border border-error/40 bg-error/10 p-8 text-center">
      <h2 class="text-xl font-black">Administrator access required</h2>
    </section>

    <template v-else>
      <form class="grid gap-4 rounded-3xl border border-base-300 bg-base-100 p-5" @submit.prevent="generate">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control">
            <span class="label-text text-xs font-bold">Component ID</span>
            <input v-model="form.componentId" required type="number" min="1" class="input input-bordered mt-1" />
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Reviewer kind</span>
            <select v-model="form.authorKind" class="select select-bordered mt-1">
              <option value="BOT">Bot</option>
              <option value="CHARACTER">Character</option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Reviewer ID</span>
            <input v-model="form.authorId" required type="number" min="1" class="input input-bordered mt-1" />
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">OpenAI model</span>
            <input v-model="form.model" class="input input-bordered mt-1" placeholder="gpt-4o-mini" />
          </label>
        </div>

        <label class="flex cursor-pointer items-start gap-3 rounded-2xl bg-base-200/70 p-4">
          <input v-model="form.regenerate" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
          <span>
            <strong class="block">Create a new generation attempt</strong>
            <span class="text-sm text-base-content/60">
              Without this, the endpoint reuses the latest draft for the same Component and reviewer.
            </span>
          </span>
        </label>

        <button class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm" />
          Generate proposed draft
        </button>
      </form>

      <p v-if="notice" class="rounded-2xl border p-4 text-sm" :class="failed ? 'border-error/40 bg-error/10 text-error' : 'border-success/40 bg-success/10 text-success'">
        {{ notice }}
      </p>

      <article v-if="result" class="rounded-3xl border border-base-300 bg-base-100 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase text-primary">{{ result.draft.author.kind }}</p>
            <h2 class="text-2xl font-black">{{ result.draft.author.name }}</h2>
            <p class="text-sm text-base-content/60">
              {{ result.draft.componentTitle || result.draft.componentName }} · Draft #{{ result.draft.id }}
            </p>
          </div>
          <span class="badge" :class="result.draft.status === 'FAILED' ? 'badge-error' : 'badge-warning'">
            {{ result.draft.status }}
          </span>
        </div>

        <p class="mt-4 whitespace-pre-wrap leading-relaxed">{{ result.draft.generatedComment }}</p>

        <dl class="mt-4 grid gap-3 rounded-2xl bg-base-200/70 p-4 text-sm sm:grid-cols-2">
          <div><dt class="font-black">Rating</dt><dd>{{ result.draft.rating }} / 5</dd></div>
          <div><dt class="font-black">Confidence</dt><dd>{{ confidenceLabel }}</dd></div>
          <div><dt class="font-black">Attempt</dt><dd>{{ result.draft.generationAttempt }}</dd></div>
          <div><dt class="font-black">Model</dt><dd>{{ result.draft.generationModel }}</dd></div>
        </dl>

        <div v-if="result.observations.length" class="mt-4">
          <h3 class="font-black">Grounding observations</h3>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/70">
            <li v-for="observation in result.observations" :key="observation">{{ observation }}</li>
          </ul>
        </div>

        <NuxtLink to="/admin/wonderlab-reviews" class="btn btn-secondary btn-sm mt-5">
          Review this draft
        </NuxtLink>
      </article>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type GeneratedDraft = {
  draft: {
    id: number
    status: string
    componentName: string
    componentTitle: string | null
    generatedComment: string
    rating: number
    generationAttempt: number
    generationModel: string | null
    author: { kind: 'BOT' | 'CHARACTER'; name: string }
  }
  generated: boolean
  reused: boolean
  confidence: number | null
  observations: string[]
}

const userStore = useUserStore()
const ready = ref(false)
const loading = ref(false)
const failed = ref(false)
const notice = ref('')
const result = ref<GeneratedDraft | null>(null)
const form = reactive({
  componentId: '',
  authorKind: 'BOT' as 'BOT' | 'CHARACTER',
  authorId: '',
  model: 'gpt-4o-mini',
  regenerate: false,
})

const confidenceLabel = computed(() =>
  result.value?.confidence === null || result.value?.confidence === undefined
    ? 'Existing draft'
    : result.value.confidence.toFixed(2),
)

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
})

async function generate(): Promise<void> {
  loading.value = true
  failed.value = false
  notice.value = ''
  result.value = null

  try {
    const componentId = Number(form.componentId)
    const authorId = Number(form.authorId)
    if (!Number.isInteger(componentId) || componentId <= 0) throw new Error('Valid Component ID required.')
    if (!Number.isInteger(authorId) || authorId <= 0) throw new Error('Valid reviewer ID required.')

    const body: Record<string, unknown> = {
      componentId,
      model: form.model.trim() || 'gpt-4o-mini',
      regenerate: form.regenerate,
    }
    body[form.authorKind === 'BOT' ? 'authorBotId' : 'authorCharacterId'] = authorId

    const response = await performFetch<GeneratedDraft>(
      '/api/admin/wonderlab/review-drafts/generate',
      { method: 'POST', body: JSON.stringify(body) },
      1,
      75_000,
    )
    if (!response.success || !response.data) throw new Error(response.message)

    result.value = response.data
    notice.value = response.data.generated
      ? response.data.draft.status === 'FAILED'
        ? 'The draft was saved but held because its confidence was too low.'
        : 'The proposed draft is ready for curator review.'
      : 'The existing draft was reused. Enable regeneration for another attempt.'
  } catch (error) {
    failed.value = true
    notice.value = error instanceof Error ? error.message : 'Review generation failed.'
  } finally {
    loading.value = false
  }
}
</script>
