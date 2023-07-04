<template>
  <div>
    <h1>Users</h1>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <!-- Add more headers as needed -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <!-- Add more fields as needed -->
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const users = ref([])

onMounted(async () => {
  const res = await fetch('/api/users')
  if (!res.ok) {
    // handle error
    console.error('Failed to fetch users')
    return
  }
  users.value = await res.json()
})
</script>
