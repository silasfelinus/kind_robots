<template>
  <div
    :class="[
      'relative flex flex-col bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
    ]"
    @click="$emit('selectCharacter', character.id)"
  >
    <!-- Character Image -->
    <div
      class="relative flex justify-center items-center overflow-hidden rounded-lg shadow-md"
    >
      <img
        :src="character.imagePath || '/images/default-character.jpg'"
        alt="Character Portrait"
        class="rounded-xl w-full h-40 object-cover"
        loading="lazy"
      />
    </div>

    <!-- Name and Summary -->
    <div class="mt-4 space-y-2">
      <h2 class="text-lg font-bold text-gray-800 truncate">{{ character.name }}</h2>
      <p class="text-sm text-gray-600">Class: {{ character.class || 'Unknown' }}</p>
      <p class="text-sm text-gray-600">Species: {{ character.species || 'Unknown' }}</p>
    </div>

    <!-- "Is Selected" Text -->
    <div v-if="isSelected" class="mt-4 text-center text-sm text-primary font-semibold">
      Is Selected
    </div>
  </div>
</template>

<script setup>
defineProps({
  character: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})
</script>
