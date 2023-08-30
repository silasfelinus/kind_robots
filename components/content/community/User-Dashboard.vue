<template>
  <div>
    <h1>User Dashboard</h1>
    <p>Welcome, {{ user.email }}</p>
  </div>
</template>

<script setup>
const user = ref(null)

onMounted(async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/user', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  user.value = await response.json()
})
</script>
