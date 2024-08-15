<template>
  <div>
    <div class="grid-container">
      <div
        v-for="cardId in cardStore.cardOrder"
        :key="cardId"
        class="grid-item"
      >
        <Card :id="cardId" />
        <button class="remove-btn" @click="removeCard(cardId)">Delete</button>
      </div>
    </div>

    <div class="deleted-pages">
      <h3>Deleted Pages</h3>
      <div
        v-for="pageId in Array.from(cardStore.deletedPages)"
        :key="pageId"
        class="deleted-item"
      >
        <span>{{ pageId }}</span>
        <button class="restore-btn" @click="restoreCard(pageId)">
          Restore
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCardStore } from './../stores/cardStore'

const cardStore = useCardStore()

const removeCard = (cardId: string) => {
  cardStore.removeCard(cardId)
}

const restoreCard = (cardId: string) => {
  cardStore.restoreCard(cardId)
}
</script>

<style scoped>
/* Base styles for the grid container */
.grid-container {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(
    auto-fit,
    minmax(200px, 1fr)
  ); /* Example for dynamic columns */
}

/* Individual grid items */
.grid-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* Button styles */
.remove-btn,
.restore-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: red;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 8px;
}

.restore-btn {
  background: green;
}
</style>
