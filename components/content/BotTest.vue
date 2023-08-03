<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const name = route.params.name
const id = route.params.id
</script>

<template>
  <div>{{ id }}</div>
  <div>{{ name }}</div>
</template>
