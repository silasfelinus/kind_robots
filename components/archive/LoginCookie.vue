<script setup lang="ts">
import { ref, Ref } from 'vue'

interface User {
  name: string
}

const user: Ref<User | null> = useCookie<User | null>('user')
const logins = useCookie<number>('logins')

const name = ref('')

const login = () => {
  logins.value = (logins.value || 0) + 1
  user.value = { name: name.value }
}

const logout = () => {
  user.value = null
}
</script>

<template>
  <template v-if="user">
    <h1 class="text-3xl mb-3">Welcome, {{ user.name }}! 👋</h1>
    <div class="py-2 px-4 bg-green-600 text-white inline-flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      You have logged in <b>{{ logins }} times</b>!
    </div>
    <div class="mt-3">
      <button class="btn btn-red" @click="logout">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a3 3 0 013-3h1a3 3 0 013 3v1"
          />
        </svg>
        Log out
      </button>
    </div>
  </template>
  <template v-else>
    <h1 class="text-3xl mb-3">Login</h1>
    <input
      v-model="name"
      type="text"
      class="input input-lg w-full m-auto"
      placeholder="Enter your name..."
      @keypress.enter="login()"
    />
    <div class="mt-3">
      <button :disabled="!name" class="btn btn-primary" @click="login">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v16a2 2 0 002 2h12a2 2 0 002-2V8l-8-4-8 4zm12 0v16M4 4l8-2 8 2M4 4l8 2 8-2"
          />
        </svg>
        Log in
      </button>
    </div>
  </template>
</template>
