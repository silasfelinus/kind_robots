<!-- components/bots/bot-sheet.vue -->
<!-- Live preview sidebar reading from botStore.botForm directly. -->
<template>
  <div class="flex flex-col gap-2 overflow-y-auto p-4">
    <p
      class="mb-1 text-xs font-bold uppercase tracking-widest text-base-content/40"
    >
      Bot Preview
    </p>

    <!-- Avatar -->
    <div v-if="form.avatarImage" class="mb-1 overflow-hidden rounded-2xl">
      <img
        :src="String(form.avatarImage)"
        alt="Bot avatar"
        class="w-full object-cover"
      />
    </div>
    <div
      v-else
      class="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200"
    >
      <Icon name="kind-icon:robot" class="h-8 w-8 text-base-content/20" />
    </div>

    <!-- Type badge -->
    <div v-if="form.BotType" class="flex items-center gap-2">
      <span
        class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary capitalize"
      >
        {{ form.BotType }}
      </span>
      <span
        v-if="builder.selectedTraits.length"
        class="text-xs text-base-content/40"
      >
        {{ builder.selectedTraits.length }} traits
      </span>
    </div>

    <!-- Name -->
    <div v-if="form.name" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Name
      </p>
      <p class="mt-0.5 font-black text-base-content">{{ form.name }}</p>
      <p v-if="form.subtitle" class="mt-0.5 text-xs text-base-content/60">
        {{ form.subtitle }}
      </p>
    </div>

    <!-- Tagline -->
    <p
      v-if="form.tagline"
      class="text-xs italic text-base-content/60 leading-snug"
    >
      {{ form.tagline }}
    </p>

    <!-- Prompt preview -->
    <div v-if="form.prompt" class="rounded-xl bg-base-200 p-2.5">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Prompt
      </p>
      <p class="mt-1 text-xs leading-snug text-base-content/60 line-clamp-3">
        {{ form.prompt }}
      </p>
    </div>

    <!-- Intros count -->
    <div v-if="introCount > 0" class="flex items-center gap-2">
      <Icon name="kind-icon:message" class="h-3.5 w-3.5 text-base-content/40" />
      <span class="text-xs text-base-content/60"
        >{{ introCount }} opener{{ introCount === 1 ? '' : 's' }}</span
      >
    </div>

    <!-- Personality -->
    <div v-if="builder.selectedTraits.length" class="flex flex-wrap gap-1">
      <span
        v-for="trait in builder.selectedTraits.slice(0, 6)"
        :key="trait"
        class="rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/60 capitalize"
      >
        {{ trait }}
      </span>
      <span
        v-if="builder.selectedTraits.length > 6"
        class="text-xs text-base-content/30"
      >
        +{{ builder.selectedTraits.length - 6 }} more
      </span>
    </div>

    <!-- Modules -->
    <div
      v-if="builder.activeModules().length"
      class="flex items-center gap-1.5"
    >
      <Icon name="kind-icon:grid" class="h-3.5 w-3.5 text-base-content/40" />
      <span class="text-xs text-base-content/60"
        >{{ builder.activeModules().length }} module{{
          builder.activeModules().length === 1 ? '' : 's'
        }}</span
      >
    </div>

    <!-- Empty state -->
    <div
      v-if="!form.name && !form.BotType"
      class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <Icon name="kind-icon:robot" class="h-8 w-8 text-base-content/15" />
      <p class="text-xs text-base-content/30">
        Your bot will appear here as you build it.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotBuilderStore } from '@/stores/botBuilderStore'
import { useBotStore } from '@/stores/botStore'
import { parseIntros } from '@/stores/botBuilderStore'

const builder = useBotBuilderStore()
const botStore = useBotStore()
const form = computed(() => botStore.botForm)

const introCount = computed(
  () => parseIntros(botStore.botForm.botIntro ?? '').filter(Boolean).length,
)
</script>
