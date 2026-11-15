<template>
  <section
    class="flex flex-col gap-3"
    :data-testid="`advert-slot-${artSlot.name}`"
  >
    <div class="flex items-start gap-3">
      <img
        :src="currentSrc"
        :alt="`${artSlot.label} in use`"
        class="w-24 shrink-0 rounded-xl border border-base-300 object-cover"
        :class="artSlot.name === 'hero' ? 'aspect-video' : 'aspect-square'"
        :style="{ objectPosition: artSlot.position }"
      />
      <div class="min-w-0 text-xs">
        <p class="text-sm font-bold">{{ artSlot.label }}</p>
        <p class="break-all font-mono text-base-content/60">
          {{ artSlot.key }}
        </p>
        <p class="mt-1 text-base-content/70">
          {{ chosenId ? `Using render #${chosenId}` : 'Using the default art' }}
        </p>
      </div>
    </div>

    <div v-if="candidates.length" class="flex flex-col gap-1">
      <p class="text-xs font-bold uppercase tracking-wide text-base-content/60">
        Renders for this slot
      </p>
      <div class="advert-candidates grid gap-2">
        <div
          v-for="candidate in candidates"
          :key="candidate.id"
          class="relative overflow-hidden rounded-xl border"
          :class="
            candidate.artImageId === chosenId
              ? 'border-primary ring-2 ring-primary'
              : 'border-base-300'
          "
        >
          <img
            :src="
              candidate.thumbnailUrl ||
              `/api/art/images/${candidate.artImageId}/file`
            "
            :alt="`Render ${candidate.artImageId}`"
            loading="lazy"
            class="aspect-square w-full object-cover"
            :class="{ 'blur-md': candidate.isMature }"
          />
          <button
            type="button"
            class="kr-btn-primary-xs-lg absolute bottom-1 left-1 right-1"
            :disabled="isSaving || candidate.artImageId === chosenId"
            @click="advertStore.chooseCandidate(artSlot.key, candidate)"
          >
            {{ candidate.artImageId === chosenId ? 'In use' : 'Use' }}
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-xs text-base-content/60">
      No renders yet. Queue one below, then check for new renders when it
      finishes.
    </p>

    <ul v-if="queuedJobs.length" class="flex flex-col gap-1 text-xs">
      <li
        v-for="job in queuedJobs"
        :key="job.jobId"
        class="flex items-center gap-2 rounded-lg bg-base-200 px-2 py-1"
      >
        <Icon name="kind-icon:art-queue" class="size-3.5 shrink-0" />
        ArtJob #{{ job.jobId }} · {{ job.status }}
      </li>
    </ul>

    <form class="flex flex-col gap-2" @submit.prevent="queue">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-bold uppercase tracking-wide"
          >Queue new render</span
        >
        <textarea
          v-model="prompt"
          class="kr-textarea min-h-24 rounded-xl text-sm"
          rows="4"
          maxlength="1200"
        />
      </label>
      <p v-if="negations.length" class="text-xs text-warning">
        Describe only what is in the picture. Remove: {{ negations.join(', ') }}
      </p>
      <div class="grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1 text-xs">
          Engine
          <select v-model="engine" class="kr-select-sm">
            <option
              v-for="option in ADVERT_ENGINES"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-xs">
          Seed
          <input
            v-model="seed"
            class="kr-input-sm"
            inputmode="numeric"
            placeholder="random"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs">
          Width
          <input
            v-model.number="width"
            type="number"
            min="512"
            max="2048"
            step="64"
            class="kr-input-sm"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs">
          Height
          <input
            v-model.number="height"
            type="number"
            min="512"
            max="2048"
            step="64"
            class="kr-input-sm"
          />
        </label>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="submit"
          class="kr-btn-primary"
          :disabled="isQueueing || !prompt.trim() || negations.length > 0"
        >
          <span v-if="isQueueing" class="loading loading-spinner loading-xs" />
          Queue render
        </button>
        <button type="button" class="kr-btn-ghost" @click="reset">
          Reset prompt
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdvertStore } from '@/stores/advertStore'
import { useArtSlotStore } from '@/stores/artSlotStore'
import {
  ADVERT_DEFAULT_ENGINE,
  ADVERT_ENGINES,
  advertPromptNegations,
  type AdvertEngine,
  type AdvertPoster,
  type AdvertSlot,
} from '@/utils/adverts/posters'

const props = defineProps<{
  poster: AdvertPoster
  artSlot: AdvertSlot
  currentSrc: string
}>()

const advertStore = useAdvertStore()
const { isQueueing, selections } = storeToRefs(advertStore)
const { isSaving } = storeToRefs(useArtSlotStore())

const prompt = ref(props.artSlot.prompt)
const engine = ref<AdvertEngine>(ADVERT_DEFAULT_ENGINE)
const width = ref(props.artSlot.width)
const height = ref(props.artSlot.height)
const seed = ref('')

const chosenId = computed(() => selections.value[props.artSlot.key] ?? null)
const candidates = computed(() => advertStore.candidatesFor(props.artSlot.key))
const queuedJobs = computed(() => advertStore.queuedFor(props.artSlot.key))
const negations = computed(() => advertPromptNegations(prompt.value))

function reset(): void {
  prompt.value = props.artSlot.prompt
  width.value = props.artSlot.width
  height.value = props.artSlot.height
  seed.value = ''
}

watch(() => props.artSlot.key, reset)

async function queue(): Promise<void> {
  const parsedSeed = Number.parseInt(seed.value, 10)
  await advertStore.queueRender({
    posterSlug: props.poster.slug,
    slotKey: props.artSlot.key,
    prompt: prompt.value,
    engine: engine.value,
    width: width.value,
    height: height.value,
    seed: Number.isSafeInteger(parsedSeed) ? parsedSeed : null,
  })
}
</script>

<style scoped>
.advert-candidates {
  grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
}
</style>
