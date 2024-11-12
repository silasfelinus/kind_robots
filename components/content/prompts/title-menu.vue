<template>
  <div class="title-menu">
    <input
      v-model="searchQuery"
      placeholder="Search Titles"
      class="search-input"
    />
    <div class="title-grid">
      <div
        v-for="title in filteredTitles"
        :key="title.id"
        :class="{ selected: pitchStore.selectedTitle?.id === title.id }"
        class="title-card"
        @click="selectTitle(title.id)"
      >
        <h3 class="title-text">{{ title.title }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'
const pitchStore = usePitchStore()
const searchQuery = ref('')

const filteredTitles = computed(() => pitchStore.titles)

function selectTitle(titleId: number) {
  pitchStore.setTitle(titleId)
}
</script>

<style scoped>
.title-menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.title-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.title-card {
  padding: 1rem;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.title-card:hover {
  transform: translateY(-5px);
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
}

.selected {
  border: 2px solid #007bff;
}
</style>
