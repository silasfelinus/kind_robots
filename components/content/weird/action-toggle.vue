<template>
  <div class="ml-2">
    <select v-model="action" class="border p-1">
      <option value="keep">Keep</option>
      <option value="embellish">Embellish</option>
      <option value="create">Create</option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const action = ref('keep')
</script>
