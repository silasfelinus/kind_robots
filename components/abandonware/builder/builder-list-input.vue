<!-- /components/builder/builder-list-input.vue -->
<template>
  <div v-if="step" class="flex flex-col gap-4">
    <label class="form-control">
      <div class="label pb-1">
        <span class="label-text font-bold">{{ step.inputLabel || step.title }}</span>
        <span class="label-text-alt text-base-content/40">pipe-separated</span>
      </div>
      <input
        v-model="customValue"
        type="text"
        class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
        :placeholder="step.placeholder || 'Add a custom option...'
        "
        @keydown.enter.prevent="addCustomValue"
      />
    </label>

    <div v-if="options.length" class="rounded-2xl border border-base-300 bg-base-200 p-3">
      <p class="mb-2 text-xs font-black uppercase tracking-widest text-base-content/50">Options</p>
      <div class="flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
        <button
          v-for="option in options"
          :key="option"
          type="button"
          class="btn btn-xs rounded-xl"
          :class="selected.includes(option) ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="store.selectListOption(step.key, option)"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <div v-if="selected.length" class="rounded-2xl border border-primary/30 bg-primary/5 p-3">
      <p class="mb-2 text-xs font-black uppercase tracking-widest text-primary/70">Selected</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in selected"
          :key="item"
          type="button"
          class="badge badge-primary gap-1 rounded-xl"
          @click="store.selectListOption(step.key, item)"
        >
          {{ item }}
          <Icon name="kind-icon:x" class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
const customValue = ref('')

const step = computed(() => store.activeStep)
const options = computed(() => step.value?.listOptions ?? step.value?.choices?.map((choice) => choice.value).filter(Boolean) ?? [])
const selected = computed(() => step.value ? store.selectedListOptions[step.value.key] ?? [] : [])

function addCustomValue(): void {
  if (!step.value) return
  const clean = customValue.value.trim()
  if (!clean) return
  store.selectListOption(step.value.key, clean)
  customValue.value = ''
}
</script>
