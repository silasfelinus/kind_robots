<template>
  <div class="user-panel p-4 bg-base-200 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">User Profile</h2>
    <form @submit.prevent="updateProfile">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="(field, key) in profileFields"
          :key="key"
          class="form-group"
        >
          <label :for="key" class="block text-sm font-medium mb-1">{{
            field.label
          }}</label>
          <input
            v-if="field.type !== 'textarea' && key !== 'birthday'"
            :id="key"
            v-model="formattedUserProfile[key]"
            :type="field.type"
            :placeholder="field.placeholder"
            class="input input-bordered w-full"
          />

          <textarea
            v-else-if="field.type === 'textarea'"
            :id="key"
            v-model="formattedUserProfile[key]"
            :placeholder="field.placeholder"
            class="textarea textarea-bordered w-full"
          ></textarea>

          <!-- Separate birthday input to handle type issues -->
          <input
            v-else-if="key === 'birthday'"
            id="birthday"
            v-model="formattedBirthday"
            type="date"
            placeholder="Select your birthday"
            class="input input-bordered w-full"
          />
        </div>
      </div>
      <button type="submit" class="btn btn-primary mt-4">Update Profile</button>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, reactive } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const userProfile = reactive({ ...userStore.user })

// Separate birthday into a formatted string
const formattedBirthday = ref(
  userProfile.birthday instanceof Date
    ? userProfile.birthday.toISOString().split('T')[0]
    : (userProfile.birthday ?? ''),
)

// Computed profile for binding, ensuring all fields are strings
const formattedUserProfile = computed(() => ({
  ...userProfile,
  birthday: formattedBirthday.value,
}))

const profileFields = {
  username: {
    label: 'Username',
    type: 'text',
    placeholder: 'Enter your username',
  },
  email: { label: 'Email', type: 'email', placeholder: 'Enter your email' },
  name: { label: 'Name', type: 'text', placeholder: 'Enter your full name' },
  bio: {
    label: 'Bio',
    type: 'textarea',
    placeholder: 'Tell us about yourself',
  },
  address1: {
    label: 'Address Line 1',
    type: 'text',
    placeholder: 'Enter your address',
  },
  address2: {
    label: 'Address Line 2',
    type: 'text',
    placeholder: 'Enter your address',
  },
  city: { label: 'City', type: 'text', placeholder: 'Enter your city' },
  state: { label: 'State', type: 'text', placeholder: 'Enter your state' },
  country: {
    label: 'Country',
    type: 'text',
    placeholder: 'Enter your country',
  },
  phone: {
    label: 'Phone',
    type: 'text',
    placeholder: 'Enter your phone number',
  },
  birthday: {
    label: 'Birthday',
    type: 'date',
    placeholder: 'Select your birthday',
  },
  languages: {
    label: 'Languages',
    type: 'text',
    placeholder: 'Enter languages you speak',
  },
  timezone: {
    label: 'Timezone',
    type: 'text',
    placeholder: 'Enter your timezone',
  },
  discordUrl: {
    label: 'Discord URL',
    type: 'url',
    placeholder: 'Enter your Discord profile URL',
  },
  facebookUrl: {
    label: 'Facebook URL',
    type: 'url',
    placeholder: 'Enter your Facebook profile URL',
  },
  instagramUrl: {
    label: 'Instagram URL',
    type: 'url',
    placeholder: 'Enter your Instagram profile URL',
  },
  twitterUrl: {
    label: 'Twitter URL',
    type: 'url',
    placeholder: 'Enter your Twitter profile URL',
  },
  kindrobotsUrl: {
    label: 'KindRobots URL',
    type: 'url',
    placeholder: 'Enter your KindRobots profile URL',
  },
}

const updateProfile = async () => {
  try {
    // Ensure birthday is converted to a Date for saving
    userProfile.birthday = formattedBirthday.value
      ? new Date(formattedBirthday.value)
      : null
    await userStore.updateUserInfo(userProfile)
    alert('Profile updated successfully!')
  } catch (error) {
    console.error('Failed to update profile:', error)
    alert('An error occurred while updating your profile.')
  }
}
</script>

<style scoped>
.user-panel {
  max-width: 800px;
  margin: 0 auto;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.input,
.textarea {
  margin-top: 0.5rem;
}
</style>
