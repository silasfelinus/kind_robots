<!-- /components/builders/user-builder.vue -->
<template>
  <builder-shell
    builder-key="user"
    title="User Builder"
    :sections="sections"
    :summary-items="summaryItems"
    initial-section="account"
    summary-title="User Setup Summary"
    summary-subtitle="Review your account, designer identity, avatar, theme, privacy, and maturity settings."
    @section-change="activeSection = $event"
  >
    <template
      #default="{ activeSection: currentSection, setSection, goNext, goBack }"
    >
      <section
        v-if="currentSection === 'account'"
        class="flex flex-col gap-4"
      >
        <div
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div class="flex flex-col gap-2">
            <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
              <Icon name="kind-icon:person" class="h-6 w-6 text-primary" />
              Account Access
            </h3>

            <p class="text-sm text-base-content/70">
              Login or create an account so your builder progress can be saved, connected, and summoned later without a tiny archivist crying in a drawer.
            </p>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                accountMode === 'login'
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-base-300 bg-base-100'
              "
              type="button"
              @click="accountMode = 'login'"
            >
              <Icon name="kind-icon:login" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">
                Login
              </p>

              <p class="mt-1 text-sm opacity-70">
                Return to your existing Kind Robots account.
              </p>
            </button>

            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                accountMode === 'register'
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-base-300 bg-base-100'
              "
              type="button"
              @click="accountMode = 'register'"
            >
              <Icon name="kind-icon:plus" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">
                Register
              </p>

              <p class="mt-1 text-sm opacity-70">
                Create a new identity for building strange little universes.
              </p>
            </button>
          </div>
        </div>

        <div
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
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
        <div
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:signature" class="h-6 w-6 text-primary" />
            Designer Name
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Your username is for account identity. Your designer name is your creative byline. It can match your username, or it can be gloriously theatrical.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                designerMode === 'username'
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-base-300 bg-base-100'
              "
              type="button"
              @click="useUsernameAsDesigner"
            >
              <Icon name="kind-icon:person" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">
                Use Username
              </p>

              <p class="mt-1 text-sm opacity-70">
                Keep your account name and creative name the same.
              </p>
            </button>

            <button
              class="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
              :class="
                designerMode === 'custom'
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-base-300 bg-base-100'
              "
              type="button"
              @click="designerMode = 'custom'"
            >
              <Icon name="kind-icon:sparkles" class="h-7 w-7" />

              <p class="mt-2 text-lg font-bold">
                Make Designer Name
              </p>

              <p class="mt-1 text-sm opacity-70">
                Create a separate public-facing maker identity.
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
        </div>

        <div class="flex justify-between gap-2">
          <button
            class="btn rounded-xl"
            type="button"
            @click="goBack"
          >
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
        <div
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:portrait" class="h-6 w-6 text-primary" />
            Avatar
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Pick an existing avatar, upload one, or generate something new. This should eventually point to ArtImage, not the old Art path.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[18rem_1fr]">
            <div
              class="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <div
                class="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-primary/40 bg-base-300"
              >
                <img
                  v-if="avatarPreview"
                  :src="avatarPreview"
                  alt="Selected avatar"
                  class="h-full w-full object-cover"
                />

                <Icon
                  v-else
                  name="kind-icon:person"
                  class="h-16 w-16 text-primary"
                />
              </div>

              <p class="text-center text-sm font-semibold text-base-content/70">
                {{ avatarLabel }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div
                class="rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <h4 class="font-bold text-base-content">
                  Upload Avatar
                </h4>

                <p class="mt-1 text-sm text-base-content/60">
                  Use the standard image uploader and save the result as your avatar ArtImage.
                </p>

                <div class="mt-3">
                  <image-upload />
                </div>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <h4 class="font-bold text-base-content">
                  Generate Avatar
                </h4>

                <p class="mt-1 text-sm text-base-content/60">
                  Describe the avatar vibe and send it to the art builder pipeline.
                </p>

                <textarea
                  v-model="avatarPrompt"
                  class="textarea textarea-bordered mt-3 min-h-28 w-full rounded-2xl text-base"
                  placeholder="A friendly robot occultist with butterfly goggles..."
                />

                <button
                  class="btn btn-secondary mt-3 rounded-xl"
                  type="button"
                  @click="markAvatarGenerated"
                >
                  <Icon name="kind-icon:wand" class="h-4 w-4" />
                  Generate Later
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button
            class="btn rounded-xl"
            type="button"
            @click="goBack"
          >
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
        <div
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:palette" class="h-6 w-6 text-primary" />
            Theme
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Pick the visual atmosphere for the builder experience. This should use the same theme gallery already powering the user dashboard.
          </p>

          <div class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-4">
            <theme-gallery />
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button
            class="btn rounded-xl"
            type="button"
            @click="goBack"
          >
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
        <div
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon name="kind-icon:sliders" class="h-6 w-6 text-primary" />
            Privacy and Maturity
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Choose your default content behavior. These are builder defaults, so individual records can still override them later when needed.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div
              class="rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <h4 class="font-bold text-base-content">
                Privacy Default
              </h4>

              <p class="mt-1 text-sm text-base-content/60">
                Decide whether new creations should start public or private.
              </p>

              <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  class="btn rounded-xl"
                  :class="defaultPrivacy === 'private' ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="defaultPrivacy = 'private'"
                >
                  <Icon name="kind-icon:lock" class="h-4 w-4" />
                  Private
                </button>

                <button
                  class="btn rounded-xl"
                  :class="defaultPrivacy === 'public' ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="defaultPrivacy = 'public'"
                >
                  <Icon name="kind-icon:globe" class="h-4 w-4" />
                  Public
                </button>
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <h4 class="font-bold text-base-content">
                Mature Content
              </h4>

              <p class="mt-1 text-sm text-base-content/60">
                Decide whether mature content can be shown while building.
              </p>

              <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  class="btn rounded-xl"
                  :class="allowMature ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  type="button"
                  @click="allowMature = true"
                >
                  <Icon name="kind-icon:eye" class="h-4 w-4" />
                  Allow
                </button>

                <button
                  class="btn rounded-xl"
                  :class="!allowMature ? 'btn-primary' : 'btn-ghost border border-base-300'"
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
            <h4 class="font-bold text-base-content">
              User Panel
            </h4>

            <p class="mt-1 text-sm text-base-content/60">
              Keep the existing account controls available here too, because hiding settings inside settings is how apps become haunted filing cabinets.
            </p>

            <div class="mt-3">
              <user-panel />
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <button
            class="btn rounded-xl"
            type="button"
            @click="goBack"
          >
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
          class="rounded-2xl border border-primary/30 bg-primary/10 p-4"
        >
          <h3 class="flex items-center gap-2 text-xl font-bold text-primary">
            <Icon name="kind-icon:blueprint" class="h-6 w-6" />
            User Builder Summary
          </h3>

          <p class="mt-1 text-sm text-base-content/70">
            Review your setup before moving into pitches. This is the launchpad for the rest of the builder tool.
          </p>
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
          <button
            class="btn rounded-xl"
            type="button"
            @click="goBack"
          >
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
        Unknown user builder section: {{ currentSection }}
      </div>
    </template>
  </builder-shell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

type AccountMode = 'login' | 'register'
type DesignerMode = 'username' | 'custom'
type PrivacyDefault = 'private' | 'public'

type UserBuilderSectionKey =
  | 'account'
  | 'designer'
  | 'avatar'
  | 'theme'
  | 'settings'
  | 'summary'

type BuilderChoiceSummary = {
  key: string
  label: string
  value?: string | number | boolean | null
  image?: string | null
  icon?: string | null
  description?: string | null
  editSection?: UserBuilderSectionKey
}

const userStore = useUserStore()

const activeSection = ref<string>('account')
const accountMode = ref<AccountMode>('login')
const designerMode = ref<DesignerMode>('username')
const designerName = ref('')
const avatarPrompt = ref('')
const avatarPreview = ref<string | null>(null)
const defaultPrivacy = ref<PrivacyDefault>('private')
const allowMature = ref(false)

const username = computed(() => {
  return userStore.username || 'Guest'
})

const avatarLabel = computed(() => {
  if (avatarPreview.value) return 'Selected avatar'
  if (avatarPrompt.value) return 'Avatar prompt ready'

  return 'No avatar selected yet'
})

const sections = [
  {
    key: 'account',
    label: 'Account',
    icon: 'kind-icon:login',
    title: 'Login or Register',
    summary:
      'Access your account or create a new one so your builder work can be saved.',
  },
  {
    key: 'designer',
    label: 'Designer',
    icon: 'kind-icon:signature',
    title: 'Designer Name',
    summary:
      'Choose whether your creative byline should match your username or become its own delightful little persona.',
  },
  {
    key: 'avatar',
    label: 'Avatar',
    icon: 'kind-icon:portrait',
    title: 'Avatar',
    summary:
      'Pick, upload, or generate an avatar that represents this creator identity.',
  },
  {
    key: 'theme',
    label: 'Theme',
    icon: 'kind-icon:palette',
    title: 'Theme',
    summary:
      'Choose the visual style for your workspace and creative dashboard.',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'kind-icon:sliders',
    title: 'Privacy and Maturity',
    summary:
      'Set default privacy and mature-content behavior for new builder creations.',
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
    value: designerName.value || username.value,
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
    value: avatarLabel.value,
    image: avatarPreview.value,
    icon: 'kind-icon:portrait',
    description: avatarPrompt.value || 'Avatar can be uploaded, selected, or generated.',
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
    value: defaultPrivacy.value === 'private' ? 'Private by default' : 'Public by default',
    icon: defaultPrivacy.value === 'private' ? 'kind-icon:lock' : 'kind-icon:globe',
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

function markAvatarGenerated() {
  avatarPreview.value = null
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