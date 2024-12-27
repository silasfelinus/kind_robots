<template>
  <main>
    <NuxtLayout :name="page?.layout || 'default'">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  // If the user is already logged in, skip this step
  if (userStore.user !== null) {
    console.log('User already logged in. Skipping Google login.');
    return;
  }

  // Check for Google login flag and token in localStorage
  const googleLogin = userStore.getFromLocalStorage('googleLogin') === 'true';
  const token = userStore.getFromLocalStorage('token');

  if (googleLogin && token) {
    console.log('Google login detected. Redirecting to Google auth...');
    window.location.href = '/api/auth/google'; // Redirect to Google login
    return;
  }

  // Handle token or code from the query
  const queryToken = route.query.token;
  const code = route.query.code;

  if (typeof queryToken === 'string') {
    console.log('Token found in query:', queryToken);
    try {
      // Save the token to the store
      userStore.token = queryToken;

      // Validate the token and fetch user data
      const isValid = await userStore.validateAndFetchUserData();
      if (isValid) {
        console.log('Token validated. Redirecting to dashboard...');
        await router.push('/dashboard');
      } else {
        console.warn('Token validation failed. Redirecting to login...');
        await router.push('/login');
      }
    } catch (error) {
      console.error('Error during token processing:', error);
      await router.push('/login'); // Redirect on error
    }
  } else if (typeof code === 'string') {
    console.log('Code found in query. Redirecting to backend for token exchange...');
    await router.push(`/api/auth/google/callback?code=${code}`);
  } else {
    console.log('No token or code found. Proceeding with normal content rendering.');
  }
});
</script>
