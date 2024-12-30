<template>
  <div class="info-block">
    <div class="info-block-header">
      <h2 class="info-block-title">{{ props.title }}</h2>
      <button
        v-if="props.showRemove"
        class="remove-btn"
        @click="emit('remove')"
      >
        Delete
      </button>
    </div>
    <div class="info-block-body">
      <img
        v-if="props.image"
        :src="props.image"
        alt="Info Image"
        class="info-block-image"
      />
      <p class="info-block-description">{{ props.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  image?: string
  showRemove?: boolean
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()
</script>

<style scoped>
.info-block {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.info-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-block-title {
  font-size: 1.25rem;
  font-weight: bold;
}

.info-block-body {
  margin-top: 8px;
}

.info-block-image {
  max-width: 100%;
  border-radius: 4px;
  margin-bottom: 8px;
}

.remove-btn {
  background: #e53e3e; /* Red color */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 8px;
  transition: background 0.3s ease;
}

.remove-btn:hover {
  background: #c53030; /* Darker red on hover */
}
</style>
