<template>
  <div class="collection-picker">
    <Icon name="kind-icon:tag" class="kr-icon-3 shrink-0 opacity-70" />
    <select
      v-model="target"
      class="kr-select-sm collection-picker-select"
      :aria-label="placeholder || 'Add to collection'"
      :disabled="disabled"
    >
      <option value="">{{ placeholder || 'Add to collection…' }}</option>
      <option
        v-for="collection in options"
        :key="collection.value"
        :value="collection.value"
      >
        {{ collection.label || collection.value }}
      </option>
      <option value="__new__">+ New collection…</option>
    </select>
    <input
      v-if="target === '__new__'"
      v-model="newLabel"
      type="text"
      class="kr-input-sm collection-picker-new"
      placeholder="New collection name"
      :disabled="disabled"
      @keydown.enter.prevent="submit"
    />
    <button
      v-if="target"
      type="button"
      class="kr-btn btn-primary btn-xs"
      :disabled="disabled || (target === '__new__' && !newLabel.trim())"
      @click="submit"
    >
      Add
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'

const props = defineProps<{
  exclude?: string[]
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  add: [collection: { value: string; label: string } | { newLabel: string }]
}>()

const gallery = useButterflyGalleryStore()
const target = ref('')
const newLabel = ref('')

const options = computed(() =>
  gallery.collectionSummaries.filter(
    (collection) => !(props.exclude ?? []).includes(collection.value),
  ),
)

function submit(): void {
  if (!target.value) return
  if (target.value === '__new__') {
    const label = newLabel.value.trim()
    if (!label) return
    emit('add', { newLabel: label })
  } else {
    const match = options.value.find((c) => c.value === target.value)
    emit('add', {
      value: target.value,
      label: match?.label || target.value,
    })
  }
  target.value = ''
  newLabel.value = ''
}
</script>

<style scoped>
.collection-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.collection-picker-select,
.collection-picker-new {
  min-width: 0;
  flex: 1 1 8rem;
}
</style>
