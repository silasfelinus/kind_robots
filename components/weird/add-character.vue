<!-- /components/content/weird/add-character.vue -->
<template>
  <div
    class="mx-auto w-full max-w-7xl space-y-6 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="text-center">
      <h1 class="text-3xl font-bold text-primary md:text-4xl">
        {{ title }}
      </h1>

      <p class="mt-2 text-sm text-base-content/70">
        {{ subtitle }}
      </p>
    </header>

    <section class="w-full">
      <character-title />
    </section>

    <section class="flex flex-wrap gap-4">
      <div class="w-full space-y-4 md:w-1/2">
        <character-art />
      </div>

      <div class="w-full space-y-4 md:w-1/2">
        <character-stats />
        <character-rewards />
      </div>
    </section>

    <section class="space-y-8">
      <div
        v-for="chapter in characterChapters"
        :key="chapter.label"
        class="rounded-xl border border-base-300 bg-base-100 p-4"
      >
        <h2 class="mb-2 flex items-center gap-2 text-xl font-semibold">
          <Icon :name="chapter.icon" class="h-5 w-5" />
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

    <section>
      <character-bottom />
    </section>

    <footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        class="btn btn-ghost rounded-xl"
        type="button"
        @click="emit('cancel')"
      >
        Cancel
      </button>

      <button
        class="btn btn-primary rounded-xl"
        type="button"
        :disabled="characterStore.isSaving"
        @click="saveCharacter"
      >
        <span
          v-if="characterStore.isSaving"
          class="loading loading-spinner loading-sm"
        />
        {{ saveLabel }}
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { characterChapters } from '@/stores/chapters/characterChapters'

const props = withDefaults(
  defineProps<{
    mode?: 'add' | 'edit'
  }>(),
  {
    mode: 'add',
  },
)

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const characterStore = useCharacterStore()

const title = computed(() =>
  props.mode === 'edit' ? 'Edit Character' : 'Character Designer',
)

const subtitle = computed(() =>
  props.mode === 'edit'
    ? 'Tune up this delightful little narrative gremlin.'
    : 'Build a fresh weirdo for the adventure.',
)

const saveLabel = computed(() =>
  props.mode === 'edit' ? 'Save Character' : 'Create Character',
)

onMounted(() => {
  const hasFormData = Object.keys(characterStore.characterForm || {}).length > 0

  if (props.mode === 'add' && !hasFormData) {
    characterStore.generateRandomCharacter()
  }
})

async function saveCharacter() {
  await characterStore.saveCharacter()
  emit('saved')
}
</script>
