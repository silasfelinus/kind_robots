<!-- /components/content/blueprints/edit-blueprint.vue -->
<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-base-content/10"
  >
    <h2 class="text-2xl font-bold mb-4 text-center">Edit Blueprint</h2>

    <div class="grid gap-4">
      <choice-manager label="title" model="Blueprint" />
      <choice-manager label="description" model="Blueprint" />
      <choice-manager label="tags" model="Blueprint" />
      <choice-manager label="coverArtId" model="Blueprint" />

      <label class="form-control">
        <span class="label-text">Steps (JSON)</span>
        <textarea
          v-model="stepsInput"
          class="textarea textarea-bordered"
          rows="6"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Designer</span>
        <input
          v-model="blueprintStore.form.designer"
          class="input input-bordered"
        />
      </label>
    </div>

    <div class="flex justify-end mt-6 gap-2">
      <button class="btn btn-outline btn-sm" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn btn-primary btn-sm" @click="handleSave">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/blueprints/edit-blueprint.vue
import { ref, watch } from 'vue'
import { useBlueprintStore } from '@/stores/blueprintStore'
import { useChoiceStore } from '@/stores/choiceStore'

const blueprintStore = useBlueprintStore()
const choiceStore = useChoiceStore()

const emit = defineEmits(['close'])

const stepsInput = ref(
  blueprintStore.form.steps
    ? typeof blueprintStore.form.steps === 'string'
      ? blueprintStore.form.steps
      : JSON.stringify(blueprintStore.form.steps, null, 2)
    : '',
)

watch(
  () => blueprintStore.form.steps,
  (newVal) => {
    stepsInput.value =
      typeof newVal === 'string'
        ? newVal
        : JSON.stringify(newVal ?? '', null, 2)
  },
)

async function handleSave() {
  const fields = ['title', 'description', 'tags', 'coverArtId']
  fields.forEach((field) => {
    choiceStore.applyToForm(blueprintStore.form, field, 'Blueprint')
  })

  try {
    blueprintStore.form.steps = stepsInput.value
      ? JSON.parse(stepsInput.value)
      : []
  } catch (e) {
    console.error('Invalid JSON for steps')
    return
  }

  const result = await blueprintStore.save()
  if (result.success) emit('close')
}
</script>
