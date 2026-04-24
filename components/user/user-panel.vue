<template>
  <section
    class="mx-auto flex w-full max-w-5xl min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header
      class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h2 class="text-xl font-black">User Profile</h2>
        <p class="text-sm text-base-content/60">
          Edit your account details without summoning form goblins.
        </p>
      </div>

      <button
        type="button"
        class="btn btn-primary btn-sm"
        :disabled="isSaving || !hasProfile"
        @click="updateProfile"
      >
        <span v-if="isSaving" class="loading loading-spinner loading-xs" />
        <span>{{ isSaving ? 'Saving...' : 'Update Profile' }}</span>
      </button>
    </header>

    <form
      v-if="hasProfile"
      class="min-h-0 overflow-y-auto"
      @submit.prevent="updateProfile"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label
          v-for="field in profileFields"
          :key="field.key"
          class="flex min-w-0 flex-col gap-1"
        >
          <span class="text-sm font-bold text-base-content/70">
            {{ field.label }}
          </span>

          <textarea
            v-if="field.type === 'textarea'"
            v-model="form[field.key]"
            :placeholder="field.placeholder"
            class="textarea textarea-bordered min-h-28 w-full resize-none rounded-2xl bg-base-100"
          />

          <input
            v-else
            v-model="form[field.key]"
            :type="field.type"
            :placeholder="field.placeholder"
            class="input input-bordered w-full rounded-2xl bg-base-100"
          />
        </label>
      </div>

      <div
        v-if="message"
        class="mt-4 rounded-2xl border p-3 text-sm font-semibold"
        :class="
          success
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-error/40 bg-error/10 text-error'
        "
      >
        {{ message }}
      </div>

      <div class="mt-4 flex justify-end">
        <button
          type="submit"
          class="btn btn-primary w-full md:w-auto"
          :disabled="isSaving"
        >
          <span v-if="isSaving" class="loading loading-spinner loading-xs" />
          <span>{{ isSaving ? 'Saving Profile' : 'Save Changes' }}</span>
        </button>
      </div>
    </form>

    <div
      v-else
      class="flex min-h-48 items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
    >
      <div>
        <p class="text-lg font-black">No user profile available.</p>
        <p class="mt-1 text-sm text-base-content/60">
          Guest mode is charming, but it does not fill out forms.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/user/user-panel.vue
import { computed, reactive, ref, watch } from 'vue'
import { useUserStore, type User } from '@/stores/userStore'

type EditableUserKey =
  | 'username'
  | 'email'
  | 'name'
  | 'bio'
  | 'city'
  | 'state'
  | 'country'
  | 'phone'
  | 'birthday'
  | 'languages'
  | 'timezone'
  | 'discordUrl'
  | 'facebookUrl'
  | 'instagramUrl'
  | 'twitterUrl'
  | 'kindrobotsUrl'

type ProfileField = {
  key: EditableUserKey
  label: string
  type: 'text' | 'email' | 'url' | 'date' | 'textarea'
  placeholder: string
}

type UserProfileForm = Record<EditableUserKey, string>

const userStore = useUserStore()

const isSaving = ref(false)
const success = ref(false)
const message = ref('')

const hasProfile = computed(() => Boolean(userStore.user))

const form = reactive<UserProfileForm>({
  username: '',
  email: '',
  name: '',
  bio: '',
  city: '',
  state: '',
  country: '',
  phone: '',
  birthday: '',
  languages: '',
  timezone: '',
  discordUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  kindrobotsUrl: '',
})

const profileFields: ProfileField[] = [
  {
    key: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Enter your username',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
  },
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Enter your full name',
  },
  {
    key: 'bio',
    label: 'Bio',
    type: 'textarea',
    placeholder: 'Tell us about yourself',
  },
  {
    key: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'Enter your city',
  },
  {
    key: 'state',
    label: 'State',
    type: 'text',
    placeholder: 'Enter your state',
  },
  {
    key: 'country',
    label: 'Country',
    type: 'text',
    placeholder: 'Enter your country',
  },
  {
    key: 'phone',
    label: 'Phone',
    type: 'text',
    placeholder: 'Enter your phone number',
  },
  {
    key: 'birthday',
    label: 'Birthday',
    type: 'date',
    placeholder: 'Select your birthday',
  },
  {
    key: 'languages',
    label: 'Languages',
    type: 'text',
    placeholder: 'Enter languages you speak',
  },
  {
    key: 'timezone',
    label: 'Timezone',
    type: 'text',
    placeholder: 'Enter your timezone',
  },
  {
    key: 'discordUrl',
    label: 'Discord URL',
    type: 'url',
    placeholder: 'Enter your Discord profile URL',
  },
  {
    key: 'facebookUrl',
    label: 'Facebook URL',
    type: 'url',
    placeholder: 'Enter your Facebook profile URL',
  },
  {
    key: 'instagramUrl',
    label: 'Instagram URL',
    type: 'url',
    placeholder: 'Enter your Instagram profile URL',
  },
  {
    key: 'twitterUrl',
    label: 'Twitter/X URL',
    type: 'url',
    placeholder: 'Enter your Twitter profile URL',
  },
  {
    key: 'kindrobotsUrl',
    label: 'KindRobots URL',
    type: 'url',
    placeholder: 'Enter your KindRobots profile URL',
  },
]

function formatBirthday(
  value: User['birthday'] | string | null | undefined,
): string {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().split('T')[0] || ''
}

function syncFormFromUser(user: User | null): void {
  if (!user) return

  form.username = user.username || ''
  form.email = user.email || ''
  form.name = user.name || ''
  form.bio = user.bio || ''
  form.city = user.city || ''
  form.state = user.state || ''
  form.country = user.country || ''
  form.phone = user.phone || ''
  form.birthday = formatBirthday(user.birthday)
  form.languages = user.languages || ''
  form.timezone = user.timezone || ''
  form.discordUrl = user.discordUrl || ''
  form.facebookUrl = user.facebookUrl || ''
  form.instagramUrl = user.instagramUrl || ''
  form.twitterUrl = user.twitterUrl || ''
  form.kindrobotsUrl = user.kindrobotsUrl || ''
}

async function updateProfile(): Promise<void> {
  if (!userStore.user) {
    success.value = false
    message.value = 'No user profile to update.'
    return
  }

  isSaving.value = true
  message.value = ''

  try {
    const birthday = form.birthday ? new Date(form.birthday) : null

    const payload: Partial<User> = {
      ...userStore.user,
      username: form.username,
      email: form.email,
      name: form.name,
      bio: form.bio,
      city: form.city,
      state: form.state,
      country: form.country,
      phone: form.phone,
      birthday,
      languages: form.languages,
      timezone: form.timezone,
      discordUrl: form.discordUrl,
      facebookUrl: form.facebookUrl,
      instagramUrl: form.instagramUrl,
      twitterUrl: form.twitterUrl,
      kindrobotsUrl: form.kindrobotsUrl,
    }

    await userStore.updateUserInfo(payload)

    success.value = true
    message.value = 'Profile updated successfully.'
  } catch (error) {
    success.value = false
    message.value =
      error instanceof Error
        ? error.message
        : 'An error occurred while updating your profile.'
  } finally {
    isSaving.value = false
  }
}

watch(
  () => userStore.user,
  (user) => syncFormFromUser(user),
  { immediate: true },
)
</script>
