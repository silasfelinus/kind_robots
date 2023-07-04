<template>
  <div>
    <h1>Register</h1>
    <form @submit.prevent="register">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script setup>
const email = ref('')
const password = ref('')
const router = useRouter()

const register = async () => {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })

  const data = await response.json()

  if (data.success) {
    localStorage.setItem('token', data.token)
    router.push('/userDashboard')
  } else {
    alert('Registration failed')
  }
}
</script>
