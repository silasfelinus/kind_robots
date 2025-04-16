<!-- /components/content/story/character-designer.vue -->
<template>
  <div
    class="rounded-2xl border border-base-300 p-4 bg-base-200 mx-auto w-full max-w-7xl space-y-6"
  >
    <!-- Header -->
    <header class="text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-primary">
        Character Designer
      </h1>
    </header>

    <!-- Character Title -->
    <section class="w-full">
      <character-title />
    </section>

    <!-- Main Display: Art + Stats -->
    <section class="flex flex-wrap gap-4">
      <div class="w-full md:w-1/2 space-y-4">
        <character-art />
      </div>
      <div class="w-full md:w-1/2 space-y-4">
        <character-stats />
        <character-rewards />
      </div>
    </section>

    <!-- Choice Chapters -->
    <section class="space-y-8">
      <div
        v-for="chapter in characterChapters"
        :key="chapter.label"
        class="rounded-xl p-4 bg-base-100 border border-base-300"
      >
        <h2 class="text-xl font-semibold flex items-center gap-2 mb-2">
          <Icon :name="chapter.icon" class="w-5 h-5" />
          {{ chapter.intro }}
        </h2>

        <div class="grid gap-4">
          <choice-manager
            v-for="choice of chapter.choices"
            :key="choice"
            :label="choice"
            model="Character"
          />
        </div>
      </div>
    </section>

    <!-- Bottom Section -->
    <section>
      <character-bottom />
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/character-designer.vue
import { onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { characterChapters } from '@/stores/chapters/characterChapters'

const characterStore = useCharacterStore()

onMounted(() => {
  characterStore.generateRandomCharacter()
})
</script>
