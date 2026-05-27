<!-- components/scenarios/scenario-sheet.vue -->
<!-- Live preview sidebar reading from scenarioStore.scenarioForm. -->
<template>
  <div class="flex flex-col gap-2 overflow-y-auto p-4">
    <p
      class="mb-1 text-xs font-bold uppercase tracking-widest text-base-content/40"
    >
      Scenario Preview
    </p>

    <!-- Genres -->
    <div v-if="form.genres" class="flex flex-wrap gap-1">
      <span
        v-for="g in genreList"
        :key="g"
        class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary"
        >{{ g }}</span
      >
    </div>

    <!-- Inspirations -->
    <p
      v-if="form.inspirations"
      class="text-xs italic text-base-content/40 truncate"
    >
      {{ form.inspirations }}
    </p>

    <!-- Title -->
    <div v-if="form.title" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Title
      </p>
      <p class="mt-1 font-black text-base-content">{{ form.title }}</p>
    </div>

    <!-- Description -->
    <div v-if="form.description" class="rounded-2xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Description
      </p>
      <p class="mt-1 text-xs leading-snug text-base-content/70 line-clamp-4">
        {{ form.description }}
      </p>
    </div>

    <!-- Intros -->
    <div
      v-if="introCount > 0"
      class="rounded-xl bg-primary/8 border border-primary/20 p-2.5"
    >
      <p class="text-xs font-bold text-primary">
        {{ introCount }} intro{{ introCount === 1 ? '' : 's' }}
      </p>
      <p
        v-for="(intro, i) in introList"
        :key="i"
        class="mt-1 text-xs text-base-content/60 line-clamp-1"
      >
        {{ i + 1 }}. {{ intro }}
      </p>
    </div>

    <!-- Locations -->
    <div v-if="form.locations" class="flex items-start gap-1.5">
      <Icon
        name="kind-icon:map"
        class="h-3.5 w-3.5 mt-0.5 shrink-0 text-base-content/40"
      />
      <span class="text-xs text-base-content/60 leading-snug">{{
        form.locations
      }}</span>
    </div>

    <!-- Classification -->
    <div
      v-if="form.tier || form.group || form.difficulty != null"
      class="flex flex-wrap gap-1.5"
    >
      <span
        v-if="form.tier"
        class="rounded-full border border-base-300 px-2 py-0.5 text-xs capitalize text-base-content/60"
        >{{ form.tier }}</span
      >
      <span
        v-if="form.group"
        class="rounded-full border border-base-300 px-2 py-0.5 text-xs text-base-content/60"
        >{{ form.group }}</span
      >
      <span
        v-if="form.difficulty != null"
        class="rounded-full border border-base-300 px-2 py-0.5 text-xs text-base-content/60"
        >diff {{ form.difficulty }}</span
      >
    </div>

    <!-- Secret notes -->
    <div
      v-if="form.secretNotes"
      class="flex items-center gap-1.5 text-xs text-warning/70"
    >
      <Icon name="kind-icon:eye" class="h-3.5 w-3.5" />
      <span>Has secret notes</span>
    </div>

    <!-- Empty state -->
    <div
      v-if="!form.title && !form.genres"
      class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <Icon name="kind-icon:layers" class="h-8 w-8 text-base-content/15" />
      <p class="text-xs text-base-content/30">
        Your scenario will appear here as you build it.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'

const scenarioStore = useScenarioStore()
const form = computed(() => scenarioStore.scenarioForm)

const genreList = computed(() =>
  form.value.genres
    ? form.value.genres
        .split(', ')
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [],
)

const introList = computed((): string[] => {
  const raw = form.value.intros
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  try {
    const parsed = JSON.parse(String(raw))
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
})

const introCount = computed(() => introList.value.length)
</script>
