<template>
  <div>
    <select v-model="selectedWildcard" class="form-select">
      <option v-for="wildcard in wildcards" :key="wildcard" :value="wildcard">
        {{ wildcard }}
      </option>
    </select>

    <div>{{ randomDream }}</div>
  </div>
</template>

<script setup>
const wildcards = ['dreams', 'morality', 'scenarios']
const selectedWildcard = ref(wildcards[0])
const randomDream = ref(null)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

watchEffect(async () => {
  try {
    const response = await fetch(`${BASE_URL}/wonderforge/wildcards/${selectedWildcard.value}.md`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const rawMarkdownData = await response.text()
    const dreams = rawMarkdownData.split('\n')
    randomDream.value = dreams[Math.floor(Math.random() * dreams.length)]
  } catch (e) {
    console.error('Error fetching wildcard data', e)
  }
})
</script>
