<!-- components/bots/bot-intros.vue -->
<!-- Multi-entry opener editor — same pattern as scenario-intros. -->
<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl gap-1.5 border border-base-300"
        :disabled="!canGenerate || builder.llmLoading"
        @click="builder.generateAllIntros()"
      >
        <span
          v-if="builder.llmLoading"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
        Generate from prompt
      </button>
      <p class="text-xs text-base-content/40">
        {{ builder.introEntries.length }}/4 openers
      </p>
    </div>

    <div
      v-for="(intro, index) in builder.introEntries"
      :key="index"
      class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-black uppercase tracking-widest text-primary/70"
          >Opener {{ index + 1 }}</span
        >
        <button
          v-if="builder.introEntries.length > 1"
          type="button"
          class="text-base-content/30 hover:text-error transition-colors"
          @click="builder.removeIntro(index)"
        >
          <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
        </button>
      </div>

      <textarea
        :value="intro"
        class="textarea textarea-bordered w-full resize-none rounded-xl bg-base-200 text-sm leading-relaxed focus:border-primary focus:outline-none"
        rows="3"
        :placeholder="
          index === 0
            ? 'Hello! I\'m here to help you build something interesting...'
            : `Alternative opener ${index + 1}...`
        "
        @input="
          builder.setIntro(index, ($event.target as HTMLTextAreaElement).value)
        "
      />

      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-xl gap-1 self-start border border-base-300 text-xs"
        :disabled="builder.llmLoading"
        @click="builder.refineIntro(index, intro)"
      >
        <Icon name="kind-icon:sparkles" class="h-3 w-3" />
        {{ intro.trim() ? 'Refine' : 'Generate' }}
      </button>
    </div>

    <button
      v-if="builder.introEntries.length < 4"
      type="button"
      class="btn btn-ghost btn-sm rounded-xl gap-1.5 border border-dashed border-base-300 w-full hover:border-primary/40"
      @click="builder.addIntro()"
    >
      <Icon name="kind-icon:plus" class="h-4 w-4" />
      Add another opener
    </button>

    <p v-if="builder.llmError" class="text-xs text-error">
      {{ builder.llmError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotBuilderStore } from '@/stores/botBuilderStore'
import { useBotStore } from '@/stores/botStore'

const builder = useBotBuilderStore()
const botStore = useBotStore()

const canGenerate = computed(() =>
  Boolean(botStore.botForm.prompt?.trim() || botStore.botForm.name?.trim()),
)
</script>
