<template>
  <select v-model="selectedModelType" @change="updateModelType">
    <option v-for="type in modelTypes" :key="type" :value="type">{{ type }}</option>
  </select>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ModelType } from '@prisma/client'
import { useScreenStore } from '../../stores/screenStore'

const screenStore = useScreenStore()
const modelTypes = Object.values(ModelType)
const selectedModelType = ref(screenStore.currentModelType)

const updateModelType = () => {
  screenStore.currentModelType = selectedModelType.value
}
</script>
