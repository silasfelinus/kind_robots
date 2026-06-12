<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="btn btn-ghost btn-circle relative overflow-hidden border border-base-300 bg-base-100"
      :class="store.isOpen ? 'ring-2 ring-primary' : ''"
      title="Switch account"
      aria-label="Switch account"
      :aria-expanded="store.isOpen"
      @click.stop="store.toggle"
    >
      <img
        :src="store.currentAvatar"
        :alt="`${userStore.username} avatar`"
        class="h-full w-full object-cover"
      />

      <span
        v-if="userStore.isLoggedIn"
        class="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-base-100 bg-success"
      />
    </button>

    <section
      v-if="store.isOpen"
      class="absolute right-0 top-full z-50 mt-2 flex w-80 max-w-[calc(100vw-1rem)] flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-2xl"
    >
      <header class="flex items-center gap-3 rounded-2xl bg-base-200 p-3">
        <img
          :src="store.currentAvatar"
          :alt="`${userStore.username} avatar`"
          class="h-12 w-12 rounded-2xl border border-base-300 object-cover"
        />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-black text-base-content">
            {{ userStore.username }}
          </p>

          <p class="truncate text-xs text-base-content/60">
            {{ userStore.role }} · {{ userStore.isLoggedIn ? 'Logged in' : 'Guest mode' }}
          </p>
        </div>
      </header>

      <div
        v-if="store.lastError"
        class="rounded-2xl border border-error/30 bg-error/10 p-3 text-sm font-bold text-error"
      >
        {{ store.lastError }}
      </div>

      <div class="flex flex-col gap-2">
        <p class="px-1 text-xs font-black uppercase tracking-widest text-base-content/50">
          Saved logins
        </p>

        <button
          v-for="account in store.accounts"
          :key="account.userId"
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition hover:bg-base-200"
          :class="
            account.userId === userStore.userId
              ? 'border-primary bg-primary/10'
              : 'border-base-300 bg-base-100'
          "
          :disabled="store.isSwitching || account.userId === userStore.userId"
          @click="store.switchToAccount(account.userId)"
        >
          <img
            :src="account.avatarImage || fallbackAvatar"
            :alt="`${account.username} avatar`"
            class="h-10 w-10 rounded-xl border border-base-300 object-cover"
          />

          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-black">
              {{ account.label || account.username }}
            </span>

            <span class="block truncate text-xs text-base-content/60">
              {{ account.relationship }} · {{ account.role }}
            </span>
          </span>

          <Icon
            v-if="account.userId === userStore.userId"
            name="kind-icon:check"
            class="h-4 w-4 text-success"
          />
        </button>

        <div
          v-if="!store.accounts.length"
          class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
        >
          No saved logins yet. Login once, then this switcher starts collecting tiny test goblins.
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="btn btn-sm rounded-2xl"
          @click="captureCurrent"
        >
          <Icon name="kind-icon:save" class="h-4 w-4" />
          Save
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary rounded-2xl"
          @click="addAccount"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-2xl text-error"
        @click="logout"
      >
        <Icon name="kind-icon:logout" class="h-4 w-4" />
        Logout current
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useLoginManagerStore } from '@/stores/loginStore'
import { useUserStore } from '@/stores/userStore'

const store = useLoginManagerStore()
const userStore = useUserStore()
const menuRef = ref<HTMLElement | null>(null)
const fallbackAvatar = '/images/kindart.webp'

function handlePointerDown(event: PointerEvent) {
  if (!store.isOpen) {
    return
  }

  if (!menuRef.value?.contains(event.target as Node)) {
    store.close()
  }
}

function captureCurrent() {
  store.captureCurrentSession()
}

function addAccount() {
  store.close()
  userStore.logout()
}

function logout() {
  store.close()
  userStore.logout()
}

onMounted(() => {
  store.initialize()
  document.addEventListener('pointerdown', handlePointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
})
</script>