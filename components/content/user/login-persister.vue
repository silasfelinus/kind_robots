<!-- /components/content/user/login-persister.vue -->
<template>
  <div class="w-full max-w-sm mx-auto space-y-2">
    <div class="flex items-center space-x-2">
      <input
        id="stayLoggedIn"
        type="checkbox"
        v-model="localStayLoggedIn"
        class="checkbox checkbox-sm"
      />
      <label for="stayLoggedIn" class="text-sm select-none cursor-pointer">
        Stay Logged In
      </label>
    </div>

    <Transition name="fade">
      <div
        v-if="showToast"
        class="bg-info text-info-content px-4 py-2 rounded-2xl shadow-md text-sm"
      >
        {{
          localStayLoggedIn
            ? '🔒 Staying logged in!'
            : '⏳ Session only – will log out'
        }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// /components/util/login-persister.vue
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const showToast = ref(false)
const localStayLoggedIn = ref(true)
let initialized = false

onMounted(() => {
  const saved = userStore.getFromLocalStorage('stayLoggedIn')
  localStayLoggedIn.value = saved === null ? true : saved === 'true'
  userStore.setStayLoggedIn(localStayLoggedIn.value)
  initialized = true
})

watch(localStayLoggedIn, (newVal) => {
  if (initialized) {
    userStore.setStayLoggedIn(newVal)
    showToast.value = true
    setTimeout(() => (showToast.value = false), 2500)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
