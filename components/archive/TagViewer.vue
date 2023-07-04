<template>
  <div>
    <h1>Tags</h1>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tag in tags" :key="tag.id">
          <td>{{ tag.id }}</td>
          <td>{{ tag.name }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const tags = ref([])

onMounted(async () => {
  const res = await fetch('/prisma/tags')
  if (!res.ok) {
    // handle error
    console.error('Failed to fetch tags')
    return
  }
  tags.value = await res.json()
})
</script>
