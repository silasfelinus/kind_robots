<!-- /components/content/user/user-panel.vue -->
<template>
  <section
    class="mx-auto flex w-full max-w-6xl min-h-0 flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header
      class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 md:flex-row md:items-center md:justify-between"
    >
      <div class="flex min-w-0 items-center gap-4">
        <user-avatar
          v-if="hasProfile"
          :user-id="userStore.user?.id"
          :username="userStore.user?.username || 'Kind Guest'"
          class="h-20 w-20 shrink-0"
        />

        <div class="min-w-0">
          <h2 class="truncate text-xl font-black">
            {{ profileTitle }}
          </h2>

          <p class="text-sm text-base-content/60">
            Edit your account details and browse your magnificent pile of
            robot-adjacent treasures.
          </p>

          <p
            v-if="userStore.user?.artImageId"
            class="mt-1 text-xs font-semibold text-success"
          >
            Avatar connected through ArtImage #{{ userStore.user.artImageId }}
          </p>

          <p
            v-else-if="hasProfile"
            class="mt-1 text-xs font-semibold text-warning"
          >
            No ArtImage avatar connected yet.
          </p>
        </div>
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

    <div
      v-if="hasProfile"
      class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]"
    >
      <form
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
        @submit.prevent="updateProfile"
      >
        <div class="mb-4">
          <h3 class="text-lg font-black">Profile Details</h3>
          <p class="text-sm text-base-content/60">
            The usual mortal paperwork, now with fewer goblins.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              class="textarea textarea-bordered min-h-28 w-full resize-none rounded-2xl bg-base-200"
            />

            <input
              v-else
              v-model="form[field.key]"
              :type="field.type"
              :placeholder="field.placeholder"
              class="input input-bordered w-full rounded-2xl bg-base-200"
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

      <aside
        class="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div>
          <h3 class="text-lg font-black">User Galleries</h3>
          <p class="text-sm text-base-content/60">
            Showing records where <span class="font-bold">userId</span> matches
            this profile.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <article
            v-for="section in userOwnedSections"
            :key="section.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-black">
                {{ section.label }}
              </span>

              <span class="badge badge-primary badge-sm">
                {{ section.items.length }}
              </span>
            </div>
          </article>
        </div>

        <div class="flex min-h-0 flex-col gap-4">
          <article
            v-for="section in visibleUserOwnedSections"
            :key="section.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 class="font-black">
                  {{ section.label }}
                </h4>

                <p class="text-xs text-base-content/60">
                  {{ section.items.length }} matching
                  {{ section.items.length === 1 ? 'item' : 'items' }}
                </p>
              </div>

              <button
                type="button"
                class="btn btn-ghost btn-xs"
                @click="section.expanded = !section.expanded"
              >
                {{ section.expanded ? 'Hide' : 'Show' }}
              </button>
            </div>

            <div
              v-if="section.expanded"
              class="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1"
            >
              <div
                v-for="item in section.items"
                :key="`${section.key}-${item.id}`"
                class="rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-black">
                      {{ getItemTitle(item) }}
                    </p>

                    <p class="text-xs text-base-content/60">ID {{ item.id }}</p>
                  </div>

                  <span
                    v-if="getItemVisibility(item)"
                    class="badge badge-outline badge-xs"
                  >
                    {{ getItemVisibility(item) }}
                  </span>
                </div>

                <p
                  v-if="getItemSummary(item)"
                  class="mt-2 line-clamp-3 text-xs text-base-content/70"
                >
                  {{ getItemSummary(item) }}
                </p>
              </div>
            </div>
          </article>

          <div
            v-if="!totalUserOwnedItems"
            class="rounded-2xl border border-base-300 bg-base-200 p-4 text-center"
          >
            <p class="font-black">No matching user records yet.</p>
            <p class="mt-1 text-sm text-base-content/60">
              The gallery goblins checked every shelf. Suspiciously tidy.
            </p>
          </div>
        </div>
      </aside>
    </div>

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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useUserStore, type User } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useRewardStore } from '@/stores/rewardStore'

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

type UserOwnedItem = {
  id: number
  userId?: number | null
  title?: string | null
  name?: string | null
  label?: string | null
  username?: string | null
  description?: string | null
  subtitle?: string | null
  pitch?: string | null
  intro?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
}

type UserOwnedSection = {
  key: string
  label: string
  expanded: boolean
  items: UserOwnedItem[]
}

const userStore = useUserStore()
const artStore = useArtStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const scenarioStore = useScenarioStore()
const rewardStore = useRewardStore()

const isSaving = ref(false)
const success = ref(false)
const message = ref('')

const expandedSections = reactive<Record<string, boolean>>({
  dreams: true,
  art: false,
  bots: false,
  characters: false,
  scenarios: false,
  rewards: false,
})

const hasProfile = computed(() => Boolean(userStore.user))
const activeUserId = computed(() => userStore.user?.id ?? null)

const profileTitle = computed(() => {
  return userStore.user?.username
    ? `${userStore.user.username}'s Profile`
    : 'User Profile'
})

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

const artItems = computed(() => {
  return getUserOwnedItems(
    (artStore as unknown as { allArt?: unknown[] }).allArt,
  )
})

const botItems = computed(() => {
  return getUserOwnedItems((botStore as unknown as { bots?: unknown[] }).bots)
})

const characterItems = computed(() => {
  return getUserOwnedItems(
    (characterStore as unknown as { characters?: unknown[] }).characters,
  )
})

const dreamItems = computed(() => {
  return getUserOwnedItems(
    (dreamStore as unknown as { dreams?: unknown[] }).dreams,
  )
})

const scenarioItems = computed(() => {
  return getUserOwnedItems(
    (scenarioStore as unknown as { scenarios?: unknown[] }).scenarios,
  )
})

const rewardItems = computed(() => {
  return getUserOwnedItems(
    (rewardStore as unknown as { rewards?: unknown[] }).rewards,
  )
})

const userOwnedSections = computed<UserOwnedSection[]>(() => {
  return [
    {
      key: 'dreams',
      label: 'Dreams',
      expanded: expandedSections.dreams,
      items: dreamItems.value,
    },
    {
      key: 'art',
      label: 'Art',
      expanded: expandedSections.art,
      items: artItems.value,
    },
    {
      key: 'bots',
      label: 'Bots',
      expanded: expandedSections.bots,
      items: botItems.value,
    },
    {
      key: 'characters',
      label: 'Characters',
      expanded: expandedSections.characters,
      items: characterItems.value,
    },
    {
      key: 'scenarios',
      label: 'Scenarios',
      expanded: expandedSections.scenarios,
      items: scenarioItems.value,
    },
    {
      key: 'rewards',
      label: 'Rewards',
      expanded: expandedSections.rewards,
      items: rewardItems.value,
    },
  ]
})

const visibleUserOwnedSections = computed(() => {
  return userOwnedSections.value.filter((section) => section.items.length > 0)
})

const totalUserOwnedItems = computed(() => {
  return userOwnedSections.value.reduce((total, section) => {
    return total + section.items.length
  }, 0)
})

function getUserOwnedItems(source: unknown[] | undefined): UserOwnedItem[] {
  if (!source || !activeUserId.value) {
    return []
  }

  return source
    .filter((item): item is UserOwnedItem => {
      return isUserOwnedItem(item) && item.userId === activeUserId.value
    })
    .sort((a, b) => b.id - a.id)
}

function isUserOwnedItem(value: unknown): value is UserOwnedItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Partial<UserOwnedItem>

  return typeof item.id === 'number'
}

function getItemTitle(item: UserOwnedItem): string {
  return (
    item.title || item.name || item.label || item.username || `Item #${item.id}`
  )
}

function getItemSummary(item: UserOwnedItem): string {
  return item.description || item.subtitle || item.pitch || item.intro || ''
}

function getItemVisibility(item: UserOwnedItem): string {
  if (item.isMature) {
    return 'Mature'
  }

  if (item.isPublic) {
    return 'Public'
  }

  return ''
}

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

async function callStoreMethod(
  store: unknown,
  methodNames: string[],
): Promise<void> {
  const target = store as Record<string, unknown>

  for (const methodName of methodNames) {
    const method = target[methodName]

    if (typeof method === 'function') {
      await method.call(store)
      return
    }
  }
}

async function initializeUserOwnedGalleries(): Promise<void> {
  await Promise.allSettled([
    callStoreMethod(artStore, ['initialize', 'fetchArt', 'fetchAllArt']),
    callStoreMethod(botStore, ['initialize', 'fetchBots']),
    callStoreMethod(characterStore, ['initialize', 'fetchCharacters']),
    callStoreMethod(dreamStore, ['initialize', 'fetchDreams']),
    callStoreMethod(scenarioStore, ['initialize', 'fetchScenarios']),
    callStoreMethod(rewardStore, ['initialize', 'fetchRewards']),
  ])
}

watch(
  () => userStore.user,
  (user) => syncFormFromUser(user),
  { immediate: true },
)

watch(
  () => activeUserId.value,
  async () => {
    await initializeUserOwnedGalleries()
  },
  { immediate: true },
)

onMounted(initializeUserOwnedGalleries)
</script>
