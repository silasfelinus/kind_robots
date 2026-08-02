<!-- /components/narrative/kr-narrator-stage.vue -->
<!-- The narrator as a first-class region rather than an overlay drawer.
     Large art plate (page art + narrator portrait), a generous narration
     window styled as narration, and a pinned action rail with quick topic
     choices plus free-text input. Mount lazily (LazyKrNarratorStage) so
     narratorStore's eager store composition never enters a page's
     first-paint bundle — see components/dreams/dream-interact.vue. -->
<template>
  <section
    class="kr-narrator-stage kr-stage gap-3 rounded-3xl border border-primary/15 bg-base-200/40 p-3 sm:p-4"
  >
    <div
      class="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
    >
      <div
        class="relative min-h-40 overflow-hidden rounded-3xl border border-primary/20 bg-base-300 shadow-inner md:min-h-0"
      >
        <img
          v-if="props.stageImage"
          :src="props.stageImage"
          :alt="stageAlt"
          class="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="lazy"
        />
        <div
          class="absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/10 to-transparent"
        />

        <div class="absolute inset-x-3 bottom-3 flex items-center gap-2">
          <img
            v-if="narratorImage"
            :src="narratorImage"
            :alt="narratorName"
            class="h-12 w-12 shrink-0 rounded-full border-2 border-primary/40 bg-base-100 object-cover shadow-lg"
            loading="lazy"
          />
          <div
            class="min-w-0 rounded-2xl border border-primary/20 bg-base-100/90 px-3 py-1.5 backdrop-blur"
          >
            <p
              class="truncate text-sm font-black leading-tight text-base-content"
            >
              {{ narratorName }}
            </p>
            <p
              class="truncate text-[0.65rem] font-black uppercase tracking-widest text-primary/75"
            >
              {{ currentEmotionLabel }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col justify-center rounded-3xl border border-primary/15 bg-base-100/70 p-4"
      >
        <p
          class="narration-text whitespace-pre-wrap font-serif text-sm italic leading-relaxed text-base-content/85 line-clamp-6"
        >
          {{ narrationText }}
        </p>
      </div>
    </div>

    <div class="kr-toolbar flex-wrap gap-2 border-t border-primary/10 pt-3">
      <!-- The quick topics were the seed for kr-choice-list: the same
           pick-one-from-a-few idea that workspace-narrator and the scenarios
           choice-* trio each re-implemented. Adopting it here puts the shared
           component in Storybook's and Taskmaster's real render path at once,
           since both mount this stage. -->
      <kr-choice-list
        layout="row"
        :choices="topicChoices"
        :disabled="isNarratorResponding"
        :show-index="false"
        label="Narrator topics"
        @select="selectTopicByKey"
      />

      <div class="flex min-w-0 flex-1 items-center gap-2">
        <input
          v-model="narratorMessage"
          type="text"
          class="input input-bordered input-sm min-w-0 flex-1 rounded-2xl bg-base-100 text-sm"
          :placeholder="narratorPlaceholder"
          :disabled="!canUseNarrator || isNarratorResponding"
          @keydown.enter.prevent="sendNarratorMessage"
        />
        <button
          type="button"
          class="btn btn-primary btn-sm shrink-0 rounded-2xl text-white"
          :disabled="!canSendNarrator"
          @click="sendNarratorMessage"
        >
          <span
            v-if="isNarratorResponding"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:send" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNarratorStore } from '@/stores/narratorStore'

const props = defineProps<{
  stageImage?: string | null
}>()

const narratorStore = useNarratorStore()

const {
  narratorName,
  currentEmotionLabel,
  narratorImage,
  narratorIntro,
  narratorThreads,
  narratorSession,
  narratorMessage,
  isNarratorResponding,
  canUseNarrator,
  canSendNarrator,
  narratorPlaceholder,
} = storeToRefs(narratorStore)

const { initialize, sendNarratorMessage, disposeTimers, teardownLiveness } =
  narratorStore

const stageAlt = computed(() => `${narratorName.value}'s stage`)

const narrationText = computed(() => {
  const lastReply = [...narratorSession.value]
    .reverse()
    .find((chat) => chat.botResponse)?.botResponse

  return lastReply || narratorIntro.value
})


const topicButtons = computed(() => {
  return narratorThreads.value.slice(0, 4).map((thread) => {
    const topic = thread.Topic
    return {
      key: `thread-${thread.id}`,
      title: thread.title || topic?.title || 'Narrator thread',
      icon: topic?.icon || 'kind-icon:message',
      prompt: topic?.sampleUserPrompt || topic?.prompt || thread.guidance || '',
    }
  })
})

/*
 * kr-choice-list speaks {key,label,hint,icon}; the narrator's threads speak
 * {key,title,icon}. Adapt here rather than reshaping narratorStore, so the
 * shared component never has to learn a store's vocabulary.
 */
const topicChoices = computed(() =>
  topicButtons.value.map((topic) => ({
    key: topic.key,
    label: topic.title,
    icon: topic.icon,
  })),
)

function selectTopicByKey(choice: { key: string }): void {
  const topic = topicButtons.value.find((entry) => entry.key === choice.key)
  if (topic) selectTopic(topic)
}

function selectTopic(topic: { prompt: string }): void {
  if (topic.prompt) {
    narratorMessage.value = topic.prompt
  }
}

onMounted(async () => {
  await initialize()
})

onBeforeUnmount(() => {
  disposeTimers()
  teardownLiveness()
})
</script>
