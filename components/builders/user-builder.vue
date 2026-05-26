<!-- /components/builders/user-builder.vue -->
<template>
  <builder-shell
    builder-key="user"
    title="User Builder"
    :sections="sections"
    :summary-items="summaryItems"
    initial-section="account"
    summary-title="User Setup Summary"
    summary-subtitle="Review account access, designer identity, avatar art, theme, privacy, and maturity settings."
    @section-change="activeSection = $event"
  >
    <template
      #default="{ activeSection: currentSection, setSection, goNext, goBack }"
    >
      <section v-if="currentSection === 'account'" class="flex flex-col gap-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:login" class="h-6 w-6 text-primary" />
            Login or Register
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Start by entering your account. Builder progress needs a real user
            if it is going to remember all these tiny universe crimes.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                accountMode === 'login'
                  ? 'border-primary bg-primary text-primary-content shadow-md'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              type="button"
              @click="accountMode = 'login'"
            >
              <Icon name="kind-icon:login" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">Login</p>

              <p class="mt-1 text-sm opacity-70">
                Return to your existing Kind Robots account.
              </p>
            </button>

            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                accountMode === 'register'
                  ? 'border-primary bg-primary text-primary-content shadow-md'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              type="button"
              @click="accountMode = 'register'"
            >
              <Icon name="kind-icon:plus" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">Register</p>

              <p class="mt-1 text-sm opacity-70">
                Create a new builder identity.
              </p>
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <login-page v-if="accountMode === 'login'" />
          <registration-page v-else />
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'designer'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:signature" class="h-6 w-6 text-primary" />
            Designer Name
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Your username is your account identity. Your designer name is your
            creative byline.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                designerMode === 'username'
                  ? 'border-primary bg-primary text-primary-content shadow-md'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              type="button"
              @click="useUsernameAsDesigner"
            >
              <Icon name="kind-icon:person" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">Use Username</p>

              <p class="mt-1 text-sm opacity-70">
                Keep your account name and creator name the same.
              </p>
            </button>

            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                designerMode === 'custom'
                  ? 'border-primary bg-primary text-primary-content shadow-md'
                  : 'border-base-300 bg-base-100 text-base-content'
              "
              type="button"
              @click="designerMode = 'custom'"
            >
              <Icon name="kind-icon:sparkles" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">Custom Designer Name</p>

              <p class="mt-1 text-sm opacity-70">
                Make a separate public-facing creator identity.
              </p>
            </button>
          </div>

          <label class="form-control mt-4">
            <span class="label-text font-bold">Designer Name</span>

            <input
              v-model="designerName"
              class="input input-bordered rounded-2xl text-base"
              type="text"
              placeholder="Example: The Velvet Goblin Atelier"
              :disabled="designerMode === 'username'"
            />
          </label>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="saveDesignerName"
            >
              <Icon name="kind-icon:save" class="h-4 w-4" />
              Save Designer Name
            </button>

            <p
              v-if="designerMessage"
              class="rounded-2xl border border-info/30 bg-info/10 px-3 py-2 text-sm text-info"
            >
              {{ designerMessage }}
            </p>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'avatar'"
        class="flex flex-col gap-4"
      >
        <art-creator
          purpose="user"
          :model-id="userStore.userId"
          :model-title="designerName || username"
          :prompt="avatarPrompt"
          image-role="avatar"
          @update="updateAvatarArt"
        />

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-lg font-bold text-base-content"
          >
            <Icon name="kind-icon:portrait" class="h-5 w-5 text-primary" />
            Avatar Preview
          </h3>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[12rem_1fr]">
            <div
              class="flex justify-center rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <div
                class="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-primary/40 bg-base-300"
              >
                <img
                  v-if="avatarImagePath"
                  :src="avatarImagePath"
                  alt="Selected avatar"
                  class="h-full w-full object-cover"
                />

                <Icon
                  v-else
                  name="kind-icon:person"
                  class="h-16 w-16 text-primary"
                />
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <p
                class="text-sm font-bold uppercase tracking-[0.18em] text-base-content/50"
              >
                Avatar Prompt
              </p>

              <p class="mt-2 whitespace-pre-wrap text-sm text-base-content/70">
                {{ avatarPrompt || 'No avatar prompt yet.' }}
              </p>

              <p
                class="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-base-content/50"
              >
                Avatar Image
              </p>

              <p class="mt-2 break-all text-sm text-base-content/70">
                {{ avatarImagePath || 'No avatar image selected yet.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'theme'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:palette" class="h-6 w-6 text-primary" />
            Theme
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Pick the visual atmosphere for your workspace. This uses the
            existing theme gallery.
          </p>

          <div class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-4">
            <theme-gallery />
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Continue
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'settings'"
        class="flex flex-col gap-4"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-xl font-bold text-base-content"
          >
            <Icon name="kind-icon:sliders" class="h-6 w-6 text-primary" />
            Privacy and Maturity
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Choose builder defaults. Individual records can still override these
            later.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">Privacy Default</h4>

              <p class="mt-1 text-sm text-base-content/60">
                Decide whether new creations should start public or private.
              </p>

              <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  class="btn rounded-xl"
                  :class="
                    defaultPrivacy === 'private'
                      ? 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  "
                  type="button"
                  @click="defaultPrivacy = 'private'"
                >
                  <Icon name="kind-icon:lock" class="h-4 w-4" />
                  Private
                </button>

                <button
                  class="btn rounded-xl"
                  :class="
                    defaultPrivacy === 'public'
                      ? 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  "
                  type="button"
                  @click="defaultPrivacy = 'public'"
                >
                  <Icon name="kind-icon:globe" class="h-4 w-4" />
                  Public
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h4 class="font-bold text-base-content">Mature Content</h4>

              <p class="mt-1 text-sm text-base-content/60">
                Decide whether mature content can be shown while building.
              </p>

              <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  class="btn rounded-xl"
                  :class="
                    allowMature
                      ? 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  "
                  type="button"
                  @click="allowMature = true"
                >
                  <Icon name="kind-icon:eye" class="h-4 w-4" />
                  Allow
                </button>

                <button
                  class="btn rounded-xl"
                  :class="
                    !allowMature
                      ? 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  "
                  type="button"
                  @click="allowMature = false"
                >
                  <Icon name="kind-icon:shield" class="h-4 w-4" />
                  Filter
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-4">
            <h4 class="font-bold text-base-content">Account Panel</h4>

            <p class="mt-1 text-sm text-base-content/60">
              Existing user controls stay available here too.
            </p>

            <div class="mt-3">
              <user-panel />
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="goNext"
          >
            Summary
          </button>
        </div>
      </section>

      <section
        v-else-if="currentSection === 'summary'"
        class="flex flex-col gap-4"
      >
        <div
          class="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3"
        >
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary"
          >
            <Icon name="kind-icon:blueprint" class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <h3 class="flex items-center gap-2 text-xl font-bold text-primary">
              <Icon name="kind-icon:blueprint" class="h-6 w-6" />
              User Builder Summary
            </h3>

            <p class="mt-1 text-sm text-base-content/70">
              Review your setup before moving into pitches.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="item in summaryItems"
            :key="item.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300"
              >
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.label"
                  class="h-full w-full object-cover"
                />

                <Icon
                  v-else
                  :name="item.icon || 'kind-icon:sparkles'"
                  class="h-7 w-7 text-primary"
                />
              </div>

              <div class="min-w-0">
                <p class="font-bold text-base-content">
                  {{ item.label }}
                </p>

                <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                  {{ displaySummaryValue(item.value) }}
                </p>

                <p
                  v-if="item.description"
                  class="mt-1 line-clamp-2 text-xs text-base-content/50"
                >
                  {{ item.description }}
                </p>
              </div>
            </div>

            <button
              v-if="item.editSection"
              class="btn btn-sm mt-3 rounded-xl"
              type="button"
              @click="setSection(item.editSection)"
            >
              Reconfigure
            </button>
          </article>
        </div>

        <div class="flex justify-between gap-2">
          <button class="btn rounded-xl" type="button" @click="goBack">
            Back
          </button>

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="setSection('account')"
          >
            Start Over
          </button>
        </div>
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        <Icon name="kind-icon:alert" class="h-4 w-4 shrink-0" />
        Unknown user builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  BuilderChoiceSummary,
  BuilderSectionConfig,
} from '@/components/builders/builder-shell.vue'
import { useUserStore } from '@/stores/userStore'
import { handleError } from '@/stores/utils'

type AccountMode = 'login' | 'register'
type DesignerMode = 'username' | 'custom'
type PrivacyDefault = 'private' | 'public'

type ArtCreatorPayload = {
  prompt?: string
  imagePath?: string | null
  artImageId?: number | null
  artImage?: {
    id: number
    imageData?: string | null
    imagePath?: string | null
    path?: string | null
    thumbnailData?: string | null
  } | null
}

const userStore = useUserStore()

const activeSection = ref<string>('account')
const accountMode = ref<AccountMode>('login')
const designerMode = ref<DesignerMode>('username')
const designerName = ref('')
const designerMessage = ref('')
const avatarPrompt = ref('')
const avatarImagePath = ref<string | null>(null)
const defaultPrivacy = ref<PrivacyDefault>('private')
const allowMature = ref(false)

const sections: BuilderSectionConfig[] = [
  {
    key: 'account',
    label: 'Account',
    icon: 'kind-icon:login',
    title: 'Login or Register',
    summary:
      'Access your account or create a new one so builder work can be saved.',
  },
  {
    key: 'designer',
    label: 'Designer',
    icon: 'kind-icon:signature',
    title: 'Designer Name',
    summary:
      'Choose whether your creative byline matches your username or becomes its own persona.',
  },
  {
    key: 'avatar',
    label: 'Avatar',
    icon: 'kind-icon:portrait',
    title: 'Avatar Art',
    summary:
      'Create, upload, generate, or select avatar art for the user profile.',
  },
  {
    key: 'theme',
    label: 'Theme',
    icon: 'kind-icon:palette',
    title: 'Theme',
    summary: 'Choose the visual style for the builder workspace.',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'kind-icon:sliders',
    title: 'Privacy and Maturity',
    summary:
      'Set default privacy and mature-content behavior for new creations.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'User Setup Summary',
    summary:
      'Review account, designer identity, avatar, theme, privacy, and maturity choices.',
  },
]

const username = computed(() => {
  return userStore.username || 'Guest'
})

const resolvedDesignerName = computed(() => {
  return designerName.value.trim() || username.value
})

const summaryItems = computed<BuilderChoiceSummary[]>(() => [
  {
    key: 'account',
    label: 'Account Mode',
    value: accountMode.value === 'login' ? 'Login' : 'Register',
    icon: accountMode.value === 'login' ? 'kind-icon:login' : 'kind-icon:plus',
    description: 'How the user enters the builder flow.',
    editSection: 'account',
  },
  {
    key: 'designer',
    label: 'Designer Name',
    value: resolvedDesignerName.value,
    icon: 'kind-icon:signature',
    description:
      designerMode.value === 'username'
        ? 'Using the account username as the designer name.'
        : 'Using a separate creative byline.',
    editSection: 'designer',
  },
  {
    key: 'avatar',
    label: 'Avatar',
    value: avatarImagePath.value ? 'Avatar image selected' : avatarPrompt.value,
    image: avatarImagePath.value,
    icon: 'kind-icon:portrait',
    description: 'Avatar art is created through art-creator.',
    editSection: 'avatar',
  },
  {
    key: 'theme',
    label: 'Theme',
    value: 'Selected in Theme Gallery',
    icon: 'kind-icon:palette',
    description: 'Theme selection uses the existing theme gallery.',
    editSection: 'theme',
  },
  {
    key: 'privacy',
    label: 'Privacy Default',
    value:
      defaultPrivacy.value === 'private'
        ? 'Private by default'
        : 'Public by default',
    icon:
      defaultPrivacy.value === 'private' ? 'kind-icon:lock' : 'kind-icon:globe',
    description: 'Default visibility for new creations.',
    editSection: 'settings',
  },
  {
    key: 'maturity',
    label: 'Mature Content',
    value: allowMature.value ? 'Allowed' : 'Filtered',
    icon: allowMature.value ? 'kind-icon:eye' : 'kind-icon:shield',
    description: 'Controls whether mature content is visible while building.',
    editSection: 'settings',
  },
])

function useUsernameAsDesigner() {
  designerMode.value = 'username'
  designerName.value = username.value
}

function updateAvatarArt(payload: ArtCreatorPayload) {
  avatarPrompt.value = payload.prompt || avatarPrompt.value
  avatarImagePath.value =
    payload.imagePath ||
    payload.artImage?.imagePath ||
    payload.artImage?.path ||
    avatarImagePath.value
}

async function saveDesignerName() {
  designerMessage.value = ''

  try {
    const name = resolvedDesignerName.value.trim()

    if (!name) {
      designerMessage.value = 'Designer name cannot be blank.'
      return
    }

    const store = userStore as unknown as {
      patchUser?: (payload: Record<string, unknown>) => Promise<unknown>
      updateUser?: (payload: Record<string, unknown>) => Promise<unknown>
      updateProfile?: (payload: Record<string, unknown>) => Promise<unknown>
    }

    const payload = {
      designer: name,
      designerName: name,
    }

    if (typeof store.patchUser === 'function') {
      await store.patchUser(payload)
      designerMessage.value = 'Designer name saved.'
      return
    }

    if (typeof store.updateUser === 'function') {
      await store.updateUser(payload)
      designerMessage.value = 'Designer name saved.'
      return
    }

    if (typeof store.updateProfile === 'function') {
      await store.updateProfile(payload)
      designerMessage.value = 'Designer name saved.'
      return
    }

    designerMessage.value =
      'Designer name staged locally. Add a userStore update action when ready.'
  } catch (error) {
    handleError(error, 'saving designer name from user-builder')
    designerMessage.value =
      error instanceof Error ? error.message : 'Failed to save designer name.'
  }
}

function displaySummaryValue(value: BuilderChoiceSummary['value']) {
  if (value === null || value === undefined || value === '') {
    return 'Not selected yet'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}
</script>
