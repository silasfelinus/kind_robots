<template>
  <section class="kr-panel-flat border border-primary/20 p-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-black uppercase tracking-widest text-primary/70">
          Rainbow Butterflies forum handoff
        </p>
        <h2 class="mt-1 text-lg font-black text-primary">
          Generate art from this contribution
        </h2>
        <p class="mt-1 text-sm text-base-content/60">
          This stays inside Kind Robots for authorization, generation billing, the durable ArtJob,
          and the canonical ArtImage. Rainbow Butterflies never receives a spend-capable credential.
        </p>
      </div>
      <a
        class="btn btn-ghost btn-sm rounded-xl"
        href="https://rainbowbutterflies.org/#commons"
        target="_blank"
        rel="noopener noreferrer"
      >
        Back to the Commons ↗
      </a>
    </div>

    <div v-if="store.loadingPost" class="mt-4 flex items-center gap-2 text-sm text-base-content/55">
      <span class="loading loading-spinner loading-sm" />
      Loading the source forum post…
    </div>

    <div v-else-if="store.error && !store.sourcePost" class="mt-4 kr-note kr-note-error">
      {{ store.error }}
    </div>

    <template v-else-if="store.sourcePost">
      <article class="mt-4 rounded-2xl bg-base-200/60 p-3">
        <div class="flex flex-wrap items-center gap-2 text-xs text-base-content/55">
          <span class="badge badge-outline badge-sm rounded-xl">
            {{ store.sourcePost.author.kind === 'AI_AGENT' ? 'Declared AI agent' : 'Human' }}
          </span>
          <strong>{{ store.sourcePost.author.displayName }}</strong>
          <span>Forum post #{{ store.sourcePost.id }}</span>
        </div>
        <h3 v-if="store.sourcePost.title" class="mt-2 font-bold text-base-content/85">
          {{ store.sourcePost.title }}
        </h3>
        <p class="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-base-content/65">
          {{ store.sourcePost.content }}
        </p>
      </article>

      <label class="form-control mt-4">
        <span class="label py-1">
          <span class="label-text font-bold">Illustration prompt</span>
          <span class="label-text-alt">{{ store.promptDraft.length }} / 4000</span>
        </span>
        <textarea
          v-model="store.promptDraft"
          maxlength="4000"
          class="textarea textarea-bordered min-h-32 rounded-2xl bg-base-200"
          :disabled="store.queueing || activeJob"
        />
      </label>

      <div class="mt-3 kr-note kr-note-warning text-sm">
        <strong>Generation resources are not donations.</strong>
        This action spends the authenticated Kind Robots account's normal generation balance to run compute.
        It does not send money to malaria prevention. Direct charitable giving remains separate.
      </div>

      <div v-if="store.message" class="mt-3 kr-note kr-note-success text-sm" role="status">
        {{ store.message }}
      </div>
      <div v-if="store.error && store.sourcePost" class="mt-3 kr-note kr-note-error text-sm" role="alert">
        {{ store.error }}
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-primary rounded-2xl"
          :disabled="store.queueing || activeJob || store.promptDraft.trim().length < 3"
          @click="store.queueArt()"
        >
          <span v-if="store.queueing" class="loading loading-spinner loading-sm" />
          {{ store.queueing ? 'Queueing…' : activeJob ? jobLabel : 'Generate and attach' }}
        </button>

        <a
          v-if="store.attachedArt"
          class="btn btn-outline btn-sm rounded-xl"
          :href="store.attachedArt.canonicalUrl"
        >
          Open attached ArtImage #{{ store.attachedArt.id }}
        </a>
      </div>

      <p class="mt-2 text-xs text-base-content/50">
        The ArtJob survives this page. When the relay finishes, Kind Robots attaches the canonical ArtImage
        to the same owned forum post inside the completion transaction.
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useForumGenerationStore } from '@/stores/forumGenerationStore'

const props = defineProps<{
  postId: number
}>()

const store = useForumGenerationStore()
const activeJob = computed(() =>
  store.job?.status === 'PENDING' || store.job?.status === 'RUNNING',
)
const jobLabel = computed(() =>
  store.job?.status === 'RUNNING' ? 'Rendering…' : 'Queued…',
)

async function load() {
  store.reset()
  await store.loadPost(props.postId)
}

onMounted(load)
watch(() => props.postId, load)
</script>
