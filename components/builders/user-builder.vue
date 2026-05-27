<!-- components/builders/user-builder.vue -->
<!--
  User Builder — onboarding and profile setup.
  Uses the established hand/stage/sheet pattern.
  Reads/writes directly to userStore — no separate builder store.
  Each card saves independently; no final "save all".
  Smart auth detection: skips or collapses login when already signed in.
-->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="kind-icon:person" class="h-5 w-5 text-primary" />
        <h1 class="text-lg font-black tracking-tight">User Builder</h1>
        <span
          v-if="userStore.isLoggedIn"
          class="rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success"
        >
          {{ userStore.username }}
        </span>
        <span
          v-else
          class="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning"
        >
          not signed in
        </span>
      </div>

      <!-- Progress dots -->
      <div class="flex items-center gap-1.5">
        <div
          v-for="card in CARDS"
          :key="card.key"
          class="h-2 w-2 rounded-full transition-all"
          :class="
            completedCards[card.key]
              ? 'bg-success'
              : activeCardKey === card.key
                ? 'bg-primary scale-125'
                : 'bg-base-300'
          "
        />
      </div>
    </header>

    <!-- ── Body ────────────────────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar: profile preview -->
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm overflow-y-auto p-4 gap-3"
      >
        <p
          class="text-xs font-bold uppercase tracking-widest text-base-content/40"
        >
          Profile Preview
        </p>

        <!-- Avatar -->
        <div class="flex flex-col items-center gap-2">
          <div
            class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/30 bg-base-200"
          >
            <img
              v-if="userStore.user?.avatarImage"
              :src="userStore.user.avatarImage"
              alt="Avatar"
              class="h-full w-full object-cover"
            />
            <Icon
              v-else
              name="kind-icon:person"
              class="h-10 w-10 text-base-content/30"
            />
          </div>
          <div class="text-center">
            <p class="font-black text-base-content">
              {{ userStore.user?.designerName || userStore.username || '—' }}
            </p>
            <p
              v-if="userStore.user?.designerName && userStore.username"
              class="text-xs text-base-content/40"
            >
              @{{ userStore.username }}
            </p>
          </div>
        </div>

        <!-- Status items -->
        <div class="flex flex-col gap-1.5">
          <div
            class="flex items-center gap-2 rounded-xl px-2 py-1.5"
            :class="userStore.isLoggedIn ? 'bg-success/8' : 'bg-warning/8'"
          >
            <Icon
              :name="
                userStore.isLoggedIn ? 'kind-icon:check' : 'kind-icon:alert'
              "
              class="h-3.5 w-3.5"
              :class="userStore.isLoggedIn ? 'text-success' : 'text-warning'"
            />
            <span
              class="text-xs"
              :class="userStore.isLoggedIn ? 'text-success' : 'text-warning'"
              >{{ userStore.isLoggedIn ? 'Signed in' : 'Not signed in' }}</span
            >
          </div>
          <div
            v-if="userStore.user?.designerName"
            class="flex items-center gap-2 rounded-xl bg-base-200 px-2 py-1.5"
          >
            <Icon
              name="kind-icon:signature"
              class="h-3.5 w-3.5 text-base-content/40"
            />
            <span class="text-xs text-base-content/60 truncate">{{
              userStore.user.designerName
            }}</span>
          </div>
          <div
            class="flex items-center gap-2 rounded-xl bg-base-200 px-2 py-1.5"
          >
            <Icon
              :name="
                userStore.user?.showMature
                  ? 'kind-icon:eye'
                  : 'kind-icon:shield'
              "
              class="h-3.5 w-3.5 text-base-content/40"
            />
            <span class="text-xs text-base-content/60">{{
              userStore.user?.showMature ? 'Mature: on' : 'Mature: off'
            }}</span>
          </div>
        </div>

        <!-- Section list -->
        <div class="flex flex-col gap-1">
          <button
            v-for="card in CARDS"
            :key="card.key"
            type="button"
            class="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-all"
            :class="
              activeCardKey === card.key
                ? 'bg-primary/15 text-primary'
                : completedCards[card.key]
                  ? 'text-success/70 hover:bg-success/8'
                  : 'text-base-content/50 hover:bg-base-200'
            "
            @click="selectCard(card.key)"
          >
            <Icon :name="card.icon" class="h-3.5 w-3.5 shrink-0" />
            <span>{{ card.label }}</span>
            <Icon
              v-if="completedCards[card.key]"
              name="kind-icon:check"
              class="ml-auto h-3 w-3 text-success"
            />
          </button>
        </div>
      </aside>

      <!-- ── Stage ──────────────────────────────────────────────────────── -->
      <main class="flex flex-1 flex-col overflow-hidden">
        <!-- No card selected -->
        <div
          v-if="!activeCardKey"
          class="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center"
        >
          <div
            class="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
          >
            <Icon name="kind-icon:person" class="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 class="text-2xl font-black text-base-content">
              {{
                userStore.isLoggedIn
                  ? `Welcome back, ${userStore.username}.`
                  : 'Get started.'
              }}
            </h2>
            <p class="mt-2 text-sm text-base-content/60 max-w-sm">
              {{
                userStore.isLoggedIn
                  ? 'Set up your designer identity, avatar, theme, and preferences.'
                  : 'Log in or create an account to start building.'
              }}
            </p>
          </div>
          <button
            type="button"
            class="btn btn-primary rounded-2xl gap-2"
            @click="startFromBeginning"
          >
            <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
            {{ userStore.isLoggedIn ? 'Set up profile' : 'Get started' }}
          </button>
        </div>

        <!-- Active card -->
        <template v-else>
          <!-- Hero -->
          <div
            class="relative h-36 w-full shrink-0 overflow-hidden bg-base-300"
          >
            <div
              class="absolute inset-0 opacity-30"
              :style="`background: radial-gradient(circle at 30% 50%, ${activeCard?.color ?? 'oklch(var(--p))'}, transparent 70%)`"
            />
            <div class="absolute inset-0 flex flex-col justify-end p-5">
              <p
                class="text-xs font-bold uppercase tracking-widest text-primary/80"
              >
                {{ activeCard?.label }}
              </p>
              <h2 class="text-2xl font-black leading-tight text-base-content">
                {{ activeCard?.title }}
              </h2>
              <p class="mt-0.5 text-sm text-base-content/60">
                {{ activeCard?.tagline }}
              </p>
            </div>
          </div>

          <!-- Card content -->
          <div class="flex flex-1 flex-col overflow-y-auto">
            <!-- ── Account ─────────────────────────────────────────────── -->
            <section
              v-if="activeCardKey === 'account'"
              class="flex flex-col gap-4 p-5"
            >
              <!-- Already logged in -->
              <div
                v-if="userStore.isLoggedIn"
                class="rounded-2xl border border-success/30 bg-success/8 p-5"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20"
                  >
                    <Icon name="kind-icon:check" class="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p class="font-black text-base-content">
                      Signed in as {{ userStore.username }}
                    </p>
                    <p class="text-sm text-base-content/60">
                      Your work will be saved to this account.
                    </p>
                  </div>
                </div>
                <div class="mt-4 flex gap-2">
                  <button
                    type="button"
                    class="btn btn-primary btn-sm rounded-xl"
                    @click="finishCard"
                  >
                    Continue to designer setup
                    <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm rounded-xl text-error"
                    @click="userStore.logout?.()"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              <!-- Not logged in -->
              <template v-else>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex-1 rounded-2xl border p-4 text-center transition-all"
                    :class="
                      accountMode === 'login'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/30'
                    "
                    @click="accountMode = 'login'"
                  >
                    <Icon name="kind-icon:login" class="mx-auto h-6 w-6" />
                    <p class="mt-2 text-sm font-black">Log In</p>
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-2xl border p-4 text-center transition-all"
                    :class="
                      accountMode === 'register'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/30'
                    "
                    @click="accountMode = 'register'"
                  >
                    <Icon name="kind-icon:plus" class="mx-auto h-6 w-6" />
                    <p class="mt-2 text-sm font-black">Register</p>
                  </button>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
                  <login-page v-if="accountMode === 'login'" />
                  <registration-page v-else />
                </div>
              </template>
            </section>

            <!-- ── Designer ────────────────────────────────────────────── -->
            <section
              v-else-if="activeCardKey === 'designer'"
              class="flex flex-col gap-4 p-5"
            >
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 rounded-2xl border p-4 text-center transition-all"
                  :class="
                    designerMode === 'username'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/30'
                  "
                  @click="useUsernameAsDesigner"
                >
                  <Icon name="kind-icon:person" class="mx-auto h-6 w-6" />
                  <p class="mt-2 text-sm font-black">Use Username</p>
                  <p class="mt-1 text-xs opacity-70">
                    @{{ userStore.username }}
                  </p>
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-2xl border p-4 text-center transition-all"
                  :class="
                    designerMode === 'custom'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/30'
                  "
                  @click="designerMode = 'custom'"
                >
                  <Icon name="kind-icon:sparkles" class="mx-auto h-6 w-6" />
                  <p class="mt-2 text-sm font-black">Custom Name</p>
                  <p class="mt-1 text-xs opacity-70">Creative byline</p>
                </button>
              </div>

              <div v-if="designerMode === 'custom'" class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                  >Designer Name</label
                >
                <input
                  v-model="designerName"
                  type="text"
                  class="input input-bordered w-full rounded-2xl bg-base-100 focus:border-primary"
                  placeholder="The Velvet Goblin Atelier, Inkwright Studios..."
                  maxlength="100"
                  @keydown.enter="saveDesignerName"
                />
              </div>

              <div v-else class="rounded-xl bg-base-200 p-3">
                <p class="text-xs text-base-content/50">
                  Designer name will be set to
                  <span class="font-bold text-base-content">{{
                    userStore.username
                  }}</span
                  >.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-primary btn-sm rounded-xl gap-1.5"
                  :disabled="isSavingDesigner"
                  @click="saveDesignerName"
                >
                  <span
                    v-if="isSavingDesigner"
                    class="loading loading-spinner loading-xs"
                  />
                  <Icon v-else name="kind-icon:save" class="h-4 w-4" />
                  Save & continue
                </button>
                <p
                  v-if="designerMessage"
                  class="text-xs"
                  :class="designerError ? 'text-error' : 'text-success'"
                >
                  {{ designerMessage }}
                </p>
              </div>
            </section>

            <!-- ── Avatar ─────────────────────────────────────────────── -->
            <section
              v-else-if="activeCardKey === 'avatar'"
              class="flex flex-col gap-4 p-5"
            >
              <art-designer
                purpose="user"
                :model-id="userStore.userId"
                :model-title="
                  userStore.user?.designerName || userStore.username || 'User'
                "
                :prompt="avatarPrompt"
                image-role="avatar"
                @update="updateAvatarArt"
              />

              <!-- Current avatar -->
              <div
                v-if="userStore.user?.avatarImage"
                class="flex items-center gap-4 rounded-2xl border border-success/30 bg-success/8 p-4"
              >
                <div class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                  <img
                    :src="userStore.user.avatarImage"
                    alt="Avatar"
                    class="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p class="text-xs font-bold text-success">Avatar saved</p>
                  <p class="text-xs text-base-content/50 truncate max-w-xs">
                    {{ userStore.user.avatarImage }}
                  </p>
                </div>
                <button
                  type="button"
                  class="ml-auto btn btn-ghost btn-sm rounded-xl"
                  @click="finishCard"
                >
                  Continue <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
                </button>
              </div>
            </section>

            <!-- ── Theme ──────────────────────────────────────────────── -->
            <section
              v-else-if="activeCardKey === 'theme'"
              class="flex flex-col gap-4 p-5"
            >
              <p class="text-sm text-base-content/60">
                Pick the visual atmosphere for your workspace. Changes apply
                immediately.
              </p>
              <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <theme-gallery />
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-xl self-start gap-1.5"
                @click="finishCard"
              >
                <Icon name="kind-icon:check" class="h-4 w-4" />
                Theme selected — continue
              </button>
            </section>

            <!-- ── Settings ───────────────────────────────────────────── -->
            <section
              v-else-if="activeCardKey === 'settings'"
              class="flex flex-col gap-4 p-5"
            >
              <!-- Privacy -->
              <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
                <p class="text-sm font-black text-base-content">
                  Default Privacy
                </p>
                <p class="mt-0.5 text-xs text-base-content/60">
                  New creations start public or private by default.
                </p>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm flex-1 rounded-xl gap-1.5"
                    :class="
                      !defaultPublic
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'
                    "
                    @click="defaultPublic = false"
                  >
                    <Icon name="kind-icon:lock" class="h-4 w-4" /> Private
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-1 rounded-xl gap-1.5"
                    :class="
                      defaultPublic
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'
                    "
                    @click="defaultPublic = true"
                  >
                    <Icon name="kind-icon:globe" class="h-4 w-4" /> Public
                  </button>
                </div>
              </div>

              <!-- Mature content -->
              <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
                <p class="text-sm font-black text-base-content">
                  Mature Content
                </p>
                <p class="mt-0.5 text-xs text-base-content/60">
                  Show or filter mature content while building.
                </p>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm flex-1 rounded-xl gap-1.5"
                    :class="
                      !showMature
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'
                    "
                    @click="showMature = false"
                  >
                    <Icon name="kind-icon:shield" class="h-4 w-4" /> Filter
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-1 rounded-xl gap-1.5"
                    :class="
                      showMature
                        ? 'btn-primary'
                        : 'btn-ghost border border-base-300'
                    "
                    @click="showMature = true"
                  >
                    <Icon name="kind-icon:eye" class="h-4 w-4" /> Allow
                  </button>
                </div>
              </div>

              <!-- User panel (existing controls) -->
              <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <p
                  class="mb-3 text-xs font-bold uppercase tracking-widest text-base-content/40"
                >
                  Account Controls
                </p>
                <user-panel />
              </div>

              <button
                type="button"
                class="btn btn-primary btn-sm rounded-xl self-start gap-1.5"
                :disabled="isSavingSettings"
                @click="saveSettings"
              >
                <span
                  v-if="isSavingSettings"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:save" class="h-4 w-4" />
                Save settings
              </button>
              <p
                v-if="settingsMessage"
                class="text-xs"
                :class="settingsError ? 'text-error' : 'text-success'"
              >
                {{ settingsMessage }}
              </p>
            </section>

            <!-- ── Summary ─────────────────────────────────────────────── -->
            <section
              v-else-if="activeCardKey === 'summary'"
              class="flex flex-col gap-4 p-5"
            >
              <div
                class="rounded-2xl border border-primary/30 bg-primary/8 p-4"
              >
                <h3 class="font-black text-primary">Setup complete.</h3>
                <p class="mt-1 text-sm text-base-content/60">
                  Your profile is configured. You can return to any section to
                  change settings at any time.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  v-for="item in summaryItems"
                  :key="item.key"
                  class="rounded-2xl border border-base-300 bg-base-200 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base-300"
                    >
                      <img
                        v-if="item.image"
                        :src="item.image"
                        :alt="item.label"
                        class="h-full w-full object-cover"
                      />
                      <Icon
                        v-else
                        :name="item.icon"
                        class="h-5 w-5 text-primary"
                      />
                    </div>
                    <div class="min-w-0">
                      <p
                        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
                      >
                        {{ item.label }}
                      </p>
                      <p
                        class="mt-0.5 text-sm font-semibold text-base-content truncate"
                      >
                        {{ item.value || '—' }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs mt-3 rounded-xl"
                    @click="selectCard(item.editCard)"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="btn btn-outline rounded-xl btn-sm"
                  @click="selectCard('account')"
                >
                  Start over
                </button>
                <a
                  href="/pitches"
                  class="btn btn-primary rounded-xl btn-sm gap-1.5"
                >
                  Go build something
                  <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
                </a>
              </div>
            </section>
          </div>

          <!-- ── Card footer (for non-self-saving cards) ──────────────── -->
          <div
            v-if="showFooter"
            class="flex shrink-0 items-center justify-between border-t border-base-300 px-5 py-3"
          >
            <button
              v-if="currentCardIndex > 0"
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              @click="goPrev"
            >
              <Icon name="kind-icon:arrow-left" class="h-4 w-4" /> Back
            </button>
            <div v-else />
            <button
              type="button"
              class="btn btn-primary btn-sm rounded-xl gap-1.5"
              @click="finishCard"
            >
              {{ isLastCard ? 'Finish' : 'Next' }}
              <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
            </button>
          </div>
        </template>
      </main>
    </div>

    <!-- ── Hand tray ────────────────────────────────────────────────────── -->
    <div
      class="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm scrollbar-thin"
    >
      <button
        v-for="card in CARDS"
        :key="card.key"
        type="button"
        class="relative flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-3 py-2 text-center transition-all duration-200"
        :class="handCardClass(card.key)"
        @click="selectCard(card.key)"
      >
        <Icon :name="card.icon" class="h-5 w-5" />
        <span class="text-xs font-bold leading-tight">{{ card.label }}</span>
        <span
          v-if="completedCards[card.key]"
          class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-content"
        >
          <Icon name="kind-icon:check" class="h-2.5 w-2.5" />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { handleError } from '@/stores/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type AccountMode = 'login' | 'register'
type DesignerMode = 'username' | 'custom'

type ArtCreatorPayload = {
  prompt?: string
  imagePath?: string | null
  artImageId?: number | null
  artImage?: {
    id: number
    imagePath?: string | null
    path?: string | null
    thumbnailData?: string | null
  } | null
}

// ── Store ──────────────────────────────────────────────────────────────────

const userStore = useUserStore()

// ── Card definitions ───────────────────────────────────────────────────────

const CARDS = [
  {
    key: 'account',
    label: 'Account',
    icon: 'kind-icon:login',
    title: 'Sign in or create account',
    tagline: 'Builder progress needs a real user.',
    color: 'oklch(0.7 0.2 250)',
  },
  {
    key: 'designer',
    label: 'Designer',
    icon: 'kind-icon:signature',
    title: 'Your creative identity',
    tagline: 'Username for access. Designer name for the work.',
    color: 'oklch(0.7 0.2 290)',
  },
  {
    key: 'avatar',
    label: 'Avatar',
    icon: 'kind-icon:portrait',
    title: 'Give yourself a face',
    tagline: 'Generate, upload, or select avatar art.',
    color: 'oklch(0.7 0.2 200)',
  },
  {
    key: 'theme',
    label: 'Theme',
    icon: 'kind-icon:palette',
    title: 'The atmosphere',
    tagline: 'Visual style for your workspace.',
    color: 'oklch(0.7 0.2 330)',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'kind-icon:sliders',
    title: 'Privacy and maturity',
    tagline: 'Defaults for new creations.',
    color: 'oklch(0.7 0.2 160)',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Setup complete',
    tagline: 'Review and go build something.',
    color: 'oklch(0.7 0.2 80)',
  },
] as const

type CardKey = (typeof CARDS)[number]['key']

// ── UI state ───────────────────────────────────────────────────────────────

const activeCardKey = ref<CardKey | null>(null)
const completedCards = reactive<Partial<Record<CardKey, boolean>>>({})

const accountMode = ref<AccountMode>('login')
const designerMode = ref<DesignerMode>('username')
const designerName = ref(
  userStore.user?.designerName ?? userStore.username ?? '',
)

const avatarPrompt = ref('')
const isMobile = ref(false)

const defaultPublic = ref(true)
const showMature = ref(userStore.user?.showMature ?? false)

const isSavingDesigner = ref(false)
const designerMessage = ref('')
const designerError = ref(false)

const isSavingSettings = ref(false)
const settingsMessage = ref('')
const settingsError = ref(false)

// ── Computed ───────────────────────────────────────────────────────────────

const activeCard = computed(
  () => CARDS.find((c) => c.key === activeCardKey.value) ?? null,
)

const currentCardIndex = computed(() =>
  CARDS.findIndex((c) => c.key === activeCardKey.value),
)

const isLastCard = computed(() => currentCardIndex.value >= CARDS.length - 1)

// Cards that save themselves — no footer Next button needed
const selfSavingCards: CardKey[] = ['designer', 'avatar', 'settings']
const noFooterCards: CardKey[] = ['account', 'theme', 'summary']

const showFooter = computed(
  () =>
    activeCardKey.value !== null &&
    !selfSavingCards.includes(activeCardKey.value as CardKey) &&
    !noFooterCards.includes(activeCardKey.value as CardKey),
)

const summaryItems = computed(() => [
  {
    key: 'account',
    label: 'Account',
    value: userStore.isLoggedIn ? `@${userStore.username}` : 'Not signed in',
    icon: 'kind-icon:login',
    image: null as string | null,
    editCard: 'account' as CardKey,
  },
  {
    key: 'designer',
    label: 'Designer Name',
    value: userStore.user?.designerName || userStore.username || '—',
    icon: 'kind-icon:signature',
    image: null as string | null,
    editCard: 'designer' as CardKey,
  },
  {
    key: 'avatar',
    label: 'Avatar',
    value: userStore.user?.avatarImage ? 'Image set' : 'No avatar yet',
    icon: 'kind-icon:portrait',
    image: userStore.user?.avatarImage ?? null,
    editCard: 'avatar' as CardKey,
  },
  {
    key: 'theme',
    label: 'Theme',
    value: 'Set in theme gallery',
    icon: 'kind-icon:palette',
    image: null as string | null,
    editCard: 'theme' as CardKey,
  },
  {
    key: 'settings',
    label: 'Settings',
    value: `${showMature.value ? 'Mature on' : 'Mature off'} · ${defaultPublic.value ? 'Public' : 'Private'} default`,
    icon: 'kind-icon:sliders',
    image: null as string | null,
    editCard: 'settings' as CardKey,
  },
])

// ── Methods ────────────────────────────────────────────────────────────────

function handCardClass(key: string): string {
  if (activeCardKey.value === key)
    return 'border-primary bg-primary/10 text-primary scale-105 shadow-md shadow-primary/20'
  if (completedCards[key as CardKey])
    return 'border-success/40 bg-success/5 text-success/80 hover:border-success'
  return 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/40 hover:text-primary hover:-translate-y-0.5'
}

function selectCard(key: CardKey | string) {
  activeCardKey.value = key as CardKey
  designerMessage.value = ''
  settingsMessage.value = ''
}

function startFromBeginning() {
  // If already logged in, skip account card
  const startKey: CardKey = userStore.isLoggedIn ? 'designer' : 'account'
  selectCard(startKey)
}

function finishCard() {
  if (!activeCardKey.value) return
  completedCards[activeCardKey.value] = true
  persistState()

  const idx = currentCardIndex.value
  if (idx < CARDS.length - 1) {
    selectCard(CARDS[idx + 1]!.key)
  }
}

function goPrev() {
  const idx = currentCardIndex.value
  if (idx > 0) selectCard(CARDS[idx - 1]!.key)
}

function useUsernameAsDesigner() {
  designerMode.value = 'username'
  designerName.value = userStore.username ?? ''
}

async function saveDesignerName() {
  isSavingDesigner.value = true
  designerMessage.value = ''
  designerError.value = false

  try {
    const name =
      designerMode.value === 'username'
        ? (userStore.username ?? '')
        : designerName.value.trim()

    if (!name) {
      designerMessage.value = 'Name cannot be blank.'
      designerError.value = true
      return
    }

    const store = userStore as Record<string, unknown>
    const payload = { designerName: name }

    if (typeof store.patchUser === 'function') {
      await (store.patchUser as (p: Record<string, unknown>) => Promise<void>)(
        payload,
      )
    } else if (typeof store.updateUser === 'function') {
      await (store.updateUser as (p: Record<string, unknown>) => Promise<void>)(
        payload,
      )
    } else if (typeof store.updateProfile === 'function') {
      await (
        store.updateProfile as (p: Record<string, unknown>) => Promise<void>
      )(payload)
    }

    designerMessage.value = 'Designer name saved.'
    completedCards['designer'] = true
    persistState()

    // Auto-advance after a beat
    setTimeout(() => finishCard(), 800)
  } catch (error) {
    handleError(error, 'saving designer name')
    designerMessage.value =
      error instanceof Error ? error.message : 'Save failed.'
    designerError.value = true
  } finally {
    isSavingDesigner.value = false
  }
}

function updateAvatarArt(payload: ArtCreatorPayload) {
  avatarPrompt.value = payload.prompt ?? avatarPrompt.value
  // The art-designer component saves directly to userStore/API
  // When an image is confirmed, mark avatar complete
  const path =
    payload.imagePath ?? payload.artImage?.imagePath ?? payload.artImage?.path
  if (path) {
    completedCards['avatar'] = true
    persistState()
  }
}

async function saveSettings() {
  isSavingSettings.value = true
  settingsMessage.value = ''
  settingsError.value = false

  try {
    const store = userStore as Record<string, unknown>
    const payload = { showMature: showMature.value }

    if (typeof store.patchUser === 'function') {
      await (store.patchUser as (p: Record<string, unknown>) => Promise<void>)(
        payload,
      )
    } else if (typeof store.updateUser === 'function') {
      await (store.updateUser as (p: Record<string, unknown>) => Promise<void>)(
        payload,
      )
    } else if (typeof store.updateProfile === 'function') {
      await (
        store.updateProfile as (p: Record<string, unknown>) => Promise<void>
      )(payload)
    }

    // Update store directly if it has showMature
    if ('showMature' in store && typeof store.showMature === 'boolean') {
      ;(store as { showMature: boolean }).showMature = showMature.value
    }

    settingsMessage.value = 'Settings saved.'
    completedCards['settings'] = true
    persistState()

    setTimeout(() => finishCard(), 800)
  } catch (error) {
    handleError(error, 'saving settings')
    settingsMessage.value =
      error instanceof Error ? error.message : 'Save failed.'
    settingsError.value = true
  } finally {
    isSavingSettings.value = false
  }
}

// ── Persistence ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'userBuilderState'

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completedCards: { ...completedCards },
        activeCardKey: activeCardKey.value,
      }),
    )
  } catch {}
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw) as {
      completedCards?: Record<string, boolean>
      activeCardKey?: string
    }
    if (s.completedCards) Object.assign(completedCards, s.completedCards)
    if (s.activeCardKey) activeCardKey.value = s.activeCardKey as CardKey
  } catch {}
}

// ── Watchers ──────────────────────────────────────────────────────────────

// Mark account card complete when user logs in
watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      completedCards['account'] = true
      designerName.value =
        userStore.user?.designerName ?? userStore.username ?? ''
      showMature.value = userStore.user?.showMature ?? false
      persistState()
    }
  },
  { immediate: true },
)

// ── Lifecycle ─────────────────────────────────────────────────────────────

function updateBreakpoint() {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  restoreState()
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)

  // Pre-fill from store
  if (userStore.user?.designerName)
    designerName.value = userStore.user.designerName
  if (userStore.user?.showMature !== undefined)
    showMature.value = userStore.user.showMature
})
</script>
