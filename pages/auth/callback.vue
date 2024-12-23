
<template>
  <div class="flex items-center justify-center h-screen">
    <p class="text-lg">Logging you in...</p>
  </div>
</template>


<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '~/stores/userStore';
import { useRoute } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    console.error('No token found in the callback URL.');
    return;
  }

  try {
    // Call your backend to validate the token and fetch the user
    const user = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json());

    if (user.success) {
      // Log in the user by updating the store
      userStore.login(user.data); // Assumes your store has a `login` action
      await router.push('/dashboard'); // Redirect to the dashboard
    } else {
      console.error('Token verification failed:', user.message);
    }
  } catch (error) {
    console.error('Error during authentication callback:', error);
  }
});
</script>

