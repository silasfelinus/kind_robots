<!-- /components/content/story/choice-manager.vue -->
<template>
  <div
    v-if="choiceEntry"
    class="flex flex-col space-y-4 w-full p-4 bg-base-200 rounded-2xl border border-base-300 shadow-md"
  >
    <h2 class="text-xl font-bold text-center capitalize">
      Choose your {{ choiceEntry.label }}
    </h2>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="option in choiceEntry.options"
        :key="option.text"
        class="relative group cursor-pointer rounded-xl border border-base-300 overflow-hidden shadow hover:shadow-lg transition"
        :class="{
          'ring-2 ring-primary': option.text === choiceEntry.selected,
        }"
        @click="select(option.text)"
      >
        <img
          v-if="option.image"
          :src="option.image"
          alt=""
          class="w-full h-24 object-cover"
        />
        <div class="p-2 text-center">
          <p class="font-semibold">{{ option.text }}</p>
          <p class="text-sm text-base-content/60">{{ option.description }}</p>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <label class="block text-sm font-medium text-base-content mb-1">
        Or enter a custom {{ choiceEntry.label }}:
      </label>
      <input
        v-model="customValue"
        type="text"
        placeholder="Enter custom value"
        class="input input-bordered w-full"
        @blur="setCustom"
        @keyup.enter="setCustom"
      />
    </div>

    <div class="text-right text-sm italic text-base-content/60">
      Selected: <strong>{{ choiceEntry.selected || 'none' }}</strong>
    </div>
  </div>

  <div v-else class="p-4 text-center text-warning">
    Choice entry not found for "{{ label }}"
  </div>
</template>

<script setup lang="ts">
// /components/content/story/choice-manager.vue
import { computed, ref, watch } from 'vue'
import { useChoiceStore } from '@/stores/choiceStore'

const props = defineProps<{
  label: string
  model?: 'Character' | 'Bot' | 'Scenario' | 'Pitch' | 'Reward' | 'Blueprint'
}>()

const choiceStore = useChoiceStore()
const customValue = ref('')

const choiceEntry = computed(() =>
  choiceStore.getChoice(props.label, props.model),
)

watch(
  () => choiceEntry.value?.selected,
  (val) => {
    if (val && val !== customValue.value) {
      customValue.value = val
    }
  },
  { immediate: true },
)

function select(value: string) {
  choiceStore.selectChoice(props.label, value, props.model)
  customValue.value = value
}

function setCustom() {
  if (customValue.value.trim()) {
    choiceStore.setCustomChoice(
      props.label,
      customValue.value.trim(),
      props.model,
    )
  }
}
</script>
