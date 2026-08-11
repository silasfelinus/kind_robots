<!-- /components/navigation/account-hub.vue -->
<!--
  EVERYTHING THAT USED TO BE A HEADER ICON, behind one avatar.

  Silas, 2026-08-10: "Let's move all the icons in that top bar, except the
  tutorial toggle and login-manager, their options inside the login-manager
  (which might need a new name) ... No lost options."

  THE NEW NAME. This was login-switcher.vue, and that name stopped being true
  the moment it absorbed the server picker, the wallet readouts, notifications
  and the app reload — none of which is a login. The store keeps its own name
  (loginStore/useLoginManagerStore) because renaming persisted state is a data
  migration, not a rename.

  THE PANEL IS A LADDER, top to bottom. Silas, 2026-08-11: "the icons like
  server and refresh should be below the user info (selectable pic name and
  role), as well as mana and token counts, then notifications."

    1. who you are      — and a button, because it opens the account menu
    2. tools            — server picker, app reload
    3. wallet           — karma and mana
    4. notifications
    5. maturity         — a preference, so it sits under the things it affects

  WHY ACCOUNT SWITCHING IS NESTED. The first version put the saved-login list,
  Save, Add and Logout on the panel directly, which meant the signed-in user
  appeared TWICE: once truncated in the header row and again, in full, as the
  ticked row of the switcher. Silas: "we don't need two references to the same
  info ... those items, non-duplicated, should be another nested menu if the
  user clicks the avatar image."

  So the identity row IS the disclosure. The name and role are no longer
  competing with a column of icons for a 20rem panel, which is what truncated
  them ("sila... / ADM..."), and the switcher's copy of the same user is behind
  the click rather than beside it.

  WHAT WAS REMOVED, and why it is not a lost option: the #kr-header-actions
  teleport target. It carried user-manager's own Refresh and Log Out into this
  panel, where they landed next to controls that already do those jobs — Silas,
  looking at it: "a refresh option that has the same icon as our full refresh,
  but I have no idea what it does, and ANOTHER logout button." Both are still
  here, once each: the reload in Tools, logout in the account menu.
-->
<template>
  <div ref="menuRef" class="account-hub relative flex min-w-0 justify-center">
    <button
      type="button"
      class="account-hub-avatar btn btn-ghost relative shrink-0 overflow-hidden rounded-full border border-base-300 bg-base-100 p-0"
      :class="store.isOpen ? 'ring-2 ring-primary' : ''"
      :title="hubLabel"
      :aria-label="hubLabel"
      :aria-expanded="store.isOpen"
      @click.stop="store.toggle"
    >
      <img
        :src="store.currentAvatar"
        :alt="`${userStore.username} avatar`"
        class="h-full w-full rounded-full object-cover"
      />

      <span
        v-if="!unreadCount && userStore.isLoggedIn"
        class="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-base-100 bg-success"
      />
    </button>

    <!--
      THE BADGE SITS OUTSIDE THE BUTTON, and has to. Silas, 2026-08-11: "the
      Notification badge is being cut off by the circle we cover the avatar
      image in, it needs to be over it."

      The button carries `overflow-hidden rounded-full` to crop the avatar into
      a circle, and that crop applies to every descendant — so a badge hung off
      the corner had it shaved by the same curve. As a sibling it is positioned
      against .account-hub (already `relative`) instead, overlapping the circle
      without being subject to its clip. `pointer-events-none` keeps the avatar
      clickable through it, and the count reaches screen readers through the
      button's own aria-label (see hubLabel).
    -->
    <span
      v-if="unreadCount"
      class="pointer-events-none absolute -right-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-black leading-none text-primary-content ring-2 ring-base-100"
      aria-hidden="true"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>

    <!--
      v-show rather than v-if, so opening the panel does not remount
      server-selector (a ~1000 line component owning a <dialog>), both wallet
      widgets and the notification list every time. All of them were
      permanently mounted in the header before they moved in here, so this is
      the cost that was already being paid rather than a new one, and
      `display: none` keeps the shut panel out of the accessibility tree.

      RIGHT-ANCHORED, because the button sits a couple of controls in from the
      right edge — a left-anchored 20rem panel hanging off it ran past the
      viewport and was clipped mid-word at 760px.
    -->
    <section
      v-show="store.isOpen"
      class="absolute right-0 top-full z-50 mt-2 flex max-h-[min(80vh,44rem)] w-80 max-w-[calc(100vw-1rem)] flex-col gap-3 overflow-y-auto overscroll-contain kr-panel-flat p-3 shadow-2xl"
    >
      <!-- 1. WHO YOU ARE, and the door to the account menu. The full width is
              its own now, so the name and role stop truncating. -->
      <div class="flex flex-col gap-2 rounded-2xl bg-base-200 p-2">
        <button
          type="button"
          class="flex items-center gap-3 rounded-xl p-1 text-left transition hover:bg-base-300/60"
          :aria-expanded="accountMenuOpen"
          :aria-label="
            accountMenuOpen ? 'Hide account options' : 'Show account options'
          "
          @click="accountMenuOpen = !accountMenuOpen"
        >
          <img
            :src="store.currentAvatar"
            :alt="`${userStore.username} avatar`"
            class="h-11 w-11 shrink-0 rounded-2xl border border-base-300 object-cover"
          />

          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-black text-base-content">
              {{ userStore.isLoggedIn ? userStore.username : 'Guest' }}
            </span>

            <span class="block truncate text-xs text-base-content/60">
              {{ userStore.isLoggedIn ? userStore.role : 'Not logged in' }}
            </span>
          </span>

          <Icon
            name="kind-icon:chevron-down"
            class="h-4 w-4 shrink-0 text-base-content/45 transition-transform"
            :class="accountMenuOpen ? 'rotate-180' : ''"
          />
        </button>

        <!-- THE NESTED ACCOUNT MENU: switching, saving, adding, leaving. Every
             one of these acts on WHICH account you are, which is what the row
             above names — so they belong behind it rather than beside it. -->
        <div v-if="accountMenuOpen" class="flex flex-col gap-2 px-1 pb-1">
          <div
            v-if="store.lastError"
            class="rounded-xl border border-error/30 bg-error/10 p-2 text-xs font-bold text-error"
          >
            {{ store.lastError }}
          </div>

          <button
            v-for="account in store.accounts"
            :key="account.userId"
            type="button"
            class="flex w-full items-center gap-2 rounded-xl border p-2 text-left transition hover:bg-base-100"
            :class="
              account.userId === currentUserId
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-100/60'
            "
            :disabled="store.isSwitching || account.userId === currentUserId"
            @click="store.switchToAccount(account.userId)"
          >
            <img
              :src="account.avatarImage || fallbackAvatar"
              :alt="`${account.username} avatar`"
              class="h-8 w-8 shrink-0 rounded-lg border border-base-300 object-cover"
            />

            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-black">
                {{ account.label || account.username }}
              </span>

              <span class="block truncate text-[0.65rem] text-base-content/60">
                {{ account.relationship }} ·
                {{
                  (account.roles?.length ? account.roles : [account.role]).join(
                    ' + ',
                  )
                }}
              </span>
            </span>

            <Icon
              v-if="account.userId === currentUserId"
              name="kind-icon:check"
              class="h-4 w-4 shrink-0 text-success"
            />
          </button>

          <p
            v-if="!store.accounts.length"
            class="rounded-xl border border-dashed border-base-300 p-2 text-xs text-base-content/60"
          >
            No saved logins yet. Login once, then this switcher starts
            collecting tiny test goblins.
          </p>

          <div v-if="userStore.isLoggedIn" class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-xs rounded-xl"
              @click="captureCurrent"
            >
              <Icon name="kind-icon:save" class="h-3.5 w-3.5" />
              Save
            </button>

            <button
              type="button"
              class="btn btn-xs btn-secondary rounded-xl"
              @click="addAccount"
            >
              <Icon name="kind-icon:plus" class="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <NuxtLink
            v-else
            to="/login"
            class="btn btn-primary btn-xs w-full justify-center gap-1.5 rounded-xl"
            @click="store.close"
          >
            <Icon name="kind-icon:login" class="h-3.5 w-3.5 shrink-0" />
            Log in
          </NuxtLink>

          <button
            v-if="userStore.isLoggedIn"
            type="button"
            class="btn btn-xs btn-ghost rounded-xl text-error"
            @click="logout"
          >
            <Icon name="kind-icon:logout" class="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </div>

      <!-- 2. TOOLS. The one reload in this panel, next to the server picker. -->
      <div class="flex items-center gap-2">
        <server-selector />

        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1.5 rounded-xl"
          title="Reload the app with the launch animation"
          @click="requestFullStartupReload"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          <span class="text-xs font-bold">Reload</span>
        </button>

        <!-- Renders nothing until the cart has items, so it costs no row on
             the pages where there is nothing to check out. -->
        <cart-button />
      </div>

      <!-- 3. WALLET. The widgets themselves rather than their numbers copied
              out: karma owns a transaction list and mana owns a refill
              countdown and a top-up link, and reprinting the totals here would
              quietly drop all of it. -->
      <div v-if="userStore.isLoggedIn" class="flex items-center gap-2">
        <karma-widget class="shrink-0" />
        <mana-widget class="shrink-0" />
      </div>

      <!-- 4. NOTIFICATIONS. The badge on the avatar is the summary; this is
              the thing itself. -->
      <section v-if="canSeeNotifications" class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between px-1">
          <p
            class="text-xs font-black uppercase tracking-widest text-base-content/50"
          >
            Notifications
          </p>

          <button
            v-if="unreadCount"
            type="button"
            class="btn btn-ghost btn-xs rounded-lg"
            @click="notifications.markAllRead()"
          >
            Mark all read
          </button>
        </div>

        <div class="max-h-56 overflow-y-auto rounded-2xl bg-base-200/60 p-1">
          <p
            v-if="!notifications.items.length"
            class="px-2 py-4 text-center text-sm text-base-content/50"
          >
            You're all caught up.
          </p>

          <button
            v-for="n in notifications.items"
            :key="n.id"
            type="button"
            class="flex w-full flex-col gap-0.5 rounded-xl px-2 py-2 text-left hover:bg-base-100"
            :class="{ 'bg-base-100/70': !n.isRead }"
            @click="openNotification(n)"
          >
            <span class="flex items-center gap-2 text-sm font-semibold">
              <span
                v-if="!n.isRead"
                class="h-2 w-2 shrink-0 rounded-full bg-primary"
              />
              {{ n.title }}
            </span>
            <span
              v-if="n.body"
              class="line-clamp-2 pl-4 text-xs text-base-content/60"
            >
              {{ n.body }}
            </span>
          </button>
        </div>
      </section>

      <!--
        5. PREFERENCES, rather than actions, so they sit last.

        THE CARD HAND SWITCH USED TO BE A FLOATING BUTTON pinned to the
        bottom-right corner of every page. Silas, 2026-08-11: "remove the front
        end toggle for the card view, and put it in the login-manager menu. It
        needs a real icon, but that's it, and no other conditionals, just a
        toggle that controls whether the user sees our hand navigation menu on
        the bottom of the page, remembered in localstorage."

        "No other conditionals" is why this one carries no `v-if` at all, unlike
        the maturity toggle below it — the hand is chrome every visitor sees,
        signed in or not, so gating the switch on a login would strand guests
        with whatever state they happened to land on.
      -->
      <label
        class="flex cursor-pointer items-center justify-between gap-3 kr-panel-flat px-3 py-2"
        title="Show or hide the card hand along the bottom of the page"
      >
        <span class="flex min-w-0 items-center gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="
              navStore.workspaceHandOpen
                ? 'bg-primary/15 text-primary'
                : 'bg-base-200 text-base-content/55'
            "
          >
            <Icon name="kind-icon:cards" class="h-5 w-5" />
          </span>

          <span class="min-w-0">
            <span class="block text-sm font-bold text-base-content">
              Card hand
            </span>
            <span class="block text-xs text-base-content/55">
              Navigation cards along the bottom of the page.
            </span>
          </span>
        </span>

        <input
          type="checkbox"
          class="toggle toggle-primary toggle-sm shrink-0"
          :checked="navStore.workspaceHandOpen"
          aria-label="Show the card hand"
          @change="onCardHandChange"
        />
      </label>

      <maturity-toggle
        v-if="showDashboardMaturityToggle && userStore.isLoggedIn"
        variant="resource"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLoginManagerStore } from '@/stores/loginStore'
import { useMaturityPreferenceStore } from '@/stores/maturityPreferenceStore'
import { useNavStore } from '@/stores/navStore'
import {
  useNotificationStore,
  type AppNotification,
} from '@/stores/notificationStore'
import { useUserStore } from '@/stores/userStore'
import { requestFullStartupReload } from '@/utils/startupLaunch'

const store = useLoginManagerStore()
const userStore = useUserStore()
const notifications = useNotificationStore()
const maturityPreferenceStore = useMaturityPreferenceStore()
const navStore = useNavStore()
const menuRef = ref<HTMLElement | null>(null)
const fallbackAvatar = '/images/kindart.webp'

/**
 * Whether the nested account menu is showing.
 *
 * Closed by default and reset whenever the hub closes, so reopening the panel
 * always lands on the short version. Leaving it open would put the switcher
 * back beside the identity row it was moved out of.
 */
const accountMenuOpen = ref(false)

const currentUserId = computed(() => {
  return userStore.isLoggedIn ? (userStore.user?.id ?? null) : null
})

const canSeeNotifications = computed(
  () => userStore.isLoggedIn && !userStore.isGuest,
)

const unreadCount = computed(() =>
  canSeeNotifications.value ? notifications.unreadCount : 0,
)

const showDashboardMaturityToggle = computed(
  () => maturityPreferenceStore.showDashboardMaturityToggle,
)

/**
 * The button's accessible name carries the unread count.
 *
 * The badge is a positioned span, which a screen reader reads in DOM order
 * rather than as part of the button's purpose — so without this, the only
 * notification signal left on screen is invisible to anyone not looking at it.
 */
const hubLabel = computed(() => {
  const base = userStore.isLoggedIn ? 'Account and settings' : 'Log in'

  return unreadCount.value
    ? `${base} — ${unreadCount.value} unread notification${unreadCount.value === 1 ? '' : 's'}`
    : base
})

function handlePointerDown(event: PointerEvent) {
  if (!store.isOpen) {
    return
  }

  /*
   * server-selector opens a <dialog> that is NOT inside menuRef -- it is a
   * modal, portalled to the top layer by the browser. A plain "clicked outside
   * the panel" test therefore counts every click inside that dialog as a click
   * away and closes the hub underneath it, which is how the picker ended up
   * dismissing the thing that opened it.
   */
  const target = event.target as Node | null
  if (target instanceof Element && target.closest('dialog')) return

  if (!menuRef.value?.contains(target)) {
    store.close()
  }
}

function onCardHandChange(event: Event): void {
  navStore.setWorkspaceHandOpen((event.target as HTMLInputElement).checked)
}

function captureCurrent() {
  store.captureCurrentSession()
}

async function addAccount(): Promise<void> {
  store.close()
  userStore.logout()
  await navigateTo('/login')
}

function logout() {
  store.close()
  userStore.logout()
  store.clearActiveSession()
}

async function openNotification(notification: AppNotification): Promise<void> {
  await notifications.markRead(notification.id)

  if (notification.linkPath) {
    store.close()
    navigateTo(notification.linkPath)
  }
}

watch(currentUserId, (newId) => {
  if (newId) {
    store.captureCurrentSession()
    return
  }

  store.clearActiveSession()
})

/*
 * Notifications load when the panel opens rather than on mount, because the
 * bell that used to own this call was always rendered and this panel is not.
 * The badge still needs a count before the first open, though, so the mounted
 * hook below does one load for it.
 */
watch(
  () => store.isOpen,
  (isOpen) => {
    if (!isOpen) {
      accountMenuOpen.value = false
      return
    }

    if (canSeeNotifications.value) notifications.load()
  },
)

onMounted(() => {
  store.initialize()
  maturityPreferenceStore.initialize()

  if (canSeeNotifications.value) notifications.load()

  document.addEventListener('pointerdown', handlePointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
})
</script>
