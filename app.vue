<template>
  <div>
    <ami-loader />
  </div>
</template>
<script setup lang="ts">
async function fetchUserByToken(token: string) {
  // Make an API call to fetch the user
  const response = await fetch('/api/user', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (response.ok) {
    return await response.json()
  } else {
    throw new Error('Failed to fetch user')
  }
}
</script>
