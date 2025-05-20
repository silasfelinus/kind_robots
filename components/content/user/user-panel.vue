<!-- /components/content/user/user-panel.vue -->
<template>
  <div class="user-panel p-4 bg-base-200 rounded-lg max-w-2xl mx-auto">
    <h2 class="text-xl font-semibold mb-4">User Profile</h2>
    <form v-if="userProfile" @submit.prevent="updateProfile">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="(field, key) in profileFields"
          :key="key"
          class="flex flex-col"
        >
          <label
            :for="key"
            class="block text-sm font-medium mb-1 text-gray-700"
          >
            {{ field.label }}
          </label>
          <input
            v-if="field.type !== 'textarea' && field.type !== 'date'"
            :id="key"
            v-model="nonNullableUserProfile[key as keyof User]"
            :type="field.type"
            :placeholder="field.placeholder"
            class="input input-bordered w-full mt-1"
          />

          <textarea
            v-else-if="field.type === 'textarea'"
            :id="key"
            :value="nonNullableUserProfile[key as keyof User]?.toString() || ''"
            :placeholder="field.placeholder"
            class="textarea textarea-bordered w-full mt-1"
            @input="
              (e) => {
                const target = e.target as HTMLTextAreaElement | null
                if (target) {
                  updateUserProfile(key, target.value)
                }
              }
            "
          ></textarea>

          <input
            v-else-if="field.type === 'date'"
            :id="key"
            v-model="nonNullableUserProfile[key as keyof User]"
            type="date"
            :placeholder="field.placeholder"
            class="input input-bordered w-full mt-1"
          />
        </div>
      </div>
      <button
        type="submit"
        class="btn btn-primary mt-4 w-full md:w-auto px-6 py-2"
      >
        Update Profile
      </button>
    </form>
    <div v-else>
      <p class="text-center text-gray-500">No user profile available.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore, type User } from '@/stores/userStore'

const userStore = useUserStore()

// Define userProfile as a computed ref, allowing null when userStore.user is null
const userProfile = computed(() =>
  userStore.user ? { ...userStore.user } : null,
)

const nonNullableUserProfile = computed<
  Partial<Record<keyof User, User[keyof User] | undefined>>
>(() => {
  if (!userProfile.value) {
    throw new Error('User profile is null')
  }

  return {
    ...userProfile.value,
    birthday: userProfile.value.birthday
      ? new Date(userProfile.value.birthday).toISOString().split('T')[0]
      : '',
  }
})

const updateProfile = async () => {
  if (!userProfile.value) {
    alert('No user profile to update!')
    return
  }

  try {
    if (typeof userProfile.value.birthday === 'string') {
      userProfile.value.birthday = new Date(userProfile.value.birthday)
    }
    await userStore.updateUserInfo(userProfile.value)
    alert('Profile updated successfully!')
  } catch (error) {
    console.error('Failed to update profile:', error)
    alert('An error occurred while updating your profile.')
  }
}

// Profile fields configuration
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
    label: 'Twitter/X URL',
    type: 'url',
    placeholder: 'Enter your Twitter profile URL',
  },
  kindrobotsUrl: {
    label: 'KindRobots URL',
    type: 'url',
    placeholder: 'Enter your KindRobots profile URL',
  },
}

const updateUserProfile = (
  key: keyof User,
  value: User[keyof User] | undefined,
) => {
  if (nonNullableUserProfile.value) {
    if (key === 'birthday' && typeof value === 'string') {
      value = new Date(value) as User[keyof User]
    }
    nonNullableUserProfile.value[key] = value
  }
}
</script>
