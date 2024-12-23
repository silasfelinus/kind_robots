<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

onMounted(async () => {
console.log("starting callback")
  const token = route.query.token;

  if (!token) {
    console.error('No token received in the callback.');
    return;
  }

  try {
    // Set the token in the store
    userStore.token = token;

    // Validate the token and fetch user data
    console.log("validating callback")
    const isValid = await userStore.validateAndFetchUserData();
    console.log("validation finished")

    if (isValid) {
      await router.push('/dashboard'); // Redirect to dashboard
    } else {
      console.warn('Token validation failed.');
      await router.push('/login'); // Redirect to login if validation fails
    }
  } catch (error) {
    console.error('Error during authentication callback:', error);
    await router.push('/login'); // Redirect to login on error
  }
});
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <p class="text-lg">Finalizing your login...</p>
  </div>
</template>
