<!-- /components/navigation/account-hub.vue -->
<!--
  EVERYTHING THAT USED TO BE A HEADER ICON, behind one avatar.

  Silas, 2026-08-10: "Let's move all the icons in that top bar, except the
  tutorial toggle and login-manager, their options inside the login-manager
  (which might need a new name). The notification badge should appear on the
  login pic if appropriate, but actual notification stays inside as well. server
  link, mana and token count icons should be inside as well ... No lost
  options."

  THE NEW NAME. This was login-switcher.vue, and that name stopped being true
  the moment it absorbed the server picker, the wallet readouts, notifications,
  the maturity toggle and the app reload — none of which is a login. It is the
  one door to everything about YOUR session, so: account-hub. The store keeps
  its own name (loginStore/useLoginManagerStore) because renaming persisted
  state is a data migration, not a rename, and this component is not worth one.

  WHAT MOVED IN, and where each thing went:

    notifications   its own section, with the unread count ALSO on the avatar
                    (Silas: "badge should appear on the login pic if
                    appropriate, but actual notification stays inside as well")
    karma + mana    a resources row — the widgets themselves, not copies of
                    their numbers, so the transaction list, the refill
                    countdown and the wallet links all come along
    server          server-selector's own trigger; its picker is a <dialog>,
                    so it escapes this panel rather than nesting inside it
    maturity        `variant="resource"`, the labelled row form, because a bare
                    icon toggle in a panel says nothing about what it toggles
    refresh         the full startup reload, at the bottom with the other
                    session-level action
    page actions    the #kr-header-actions teleport target, so a page that
                    injects its own controls (user-manager's account Refresh
                    and Log Out) still has somewhere to put them

  NOTHING WAS DROPPED. That was the explicit ask, and it is the one thing worth
  checking on any future edit here: this panel is now the only route to five
  controls that used to be one click away in the header, so deleting a section
  deletes the capability outright rather than moving it.
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

      <!--
        THE BADGE RIDES THE AVATAR. With the bell gone from the header this is
        the only unread signal left on screen, so it has to carry the count
        rather than just a dot — "you have mail" and "you have eleven" are
        different urgencies. It also goes into the button's aria-label, because
        a positioned span is not announced in a useful order.
      -->
      <span
        v-if="unreadCount"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-black leading-none text-primary-content ring-2 ring-base-100"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>

      <span
        v-else-if="userStore.isLoggedIn"
        class="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-base-100 bg-success"
      />
    </button>

    <!--
      v-show, NOT v-if, and that is a bug fix rather than a preference.

      This panel hosts #kr-header-actions, the teleport target that pages fill
      through kr-header-actions.vue. A `v-if` panel does not exist while the hub
      is closed, so the teleport had no target to find and Vue threw on every
      page that uses one -- observed as `TypeError: Cannot set properties of
      null (setting '__vnode')` on /themes, /dashboard and /achievements, on
      load, before anyone clicked anything.

      Keeping it mounted and merely hidden costs nothing that was not already
      being paid: karma-widget, mana-widget, server-selector, cart-button and
      the notification load were ALL permanently mounted in the header before
      they moved in here, so this restores exactly the old mounting cost rather
      than adding one. `display: none` also keeps the hidden panel out of the
      accessibility tree, so nothing is announced while it is shut.

      LEFT-ANCHORED, unlike the old right-anchored menu: the hub now sits at the
      far left of the header, so a right-anchored panel would hang off the
      screen edge on a phone.
    -->
    <section
      v-show="store.isOpen"
      class="absolute left-0 top-full z-50 mt-2 flex max-h-[min(80vh,44rem)] w-80 max-w-[calc(100vw-1rem)] flex-col gap-3 overflow-y-auto overscroll-contain kr-panel-flat p-3 shadow-2xl"
    >
      <header class="flex items-center gap-3 rounded-2xl bg-base-200 p-3">
        <img
          :src="store.currentAvatar"
          :alt="`${userStore.username} avatar`"
          class="h-12 w-12 rounded-2xl border border-base-300 object-cover"
        />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-black text-base-content">
            {{ userStore.isLoggedIn ? userStore.username : 'Guest' }}
          </p>

          <p class="truncate text-xs text-base-content/60">
            {{
              userStore.isLoggedIn
                ? `${userStore.role} · Logged in`
                : 'Not logged in'
            }}
          </p>
        </div>
      </header>

      <div
        v-if="store.lastError"
        class="rounded-2xl border border-error/30 bg-error/10 p-3 text-sm font-bold text-error"
      >
        {{ store.lastError }}
      </div>

      <!-- RESOURCES. The widgets themselves rather than their numbers copied
           out: each one owns a popover with the detail (karma's transaction
           list, mana's refill countdown and top-up link) and re-rendering just
           the totals here would quietly drop all of it. -->
      <section v-if="userStore.isLoggedIn" class="flex flex-col gap-1.5">
        <p
          class="px-1 text-xs font-black uppercase tracking-widest text-base-content/50"
        >
          Wallet
        </p>

        <div class="flex items-center gap-2">
          <karma-widget class="shrink-0" />
          <mana-widget class="shrink-0" />
        </div>
      </section>

      <!-- NOTIFICATIONS, in full. The badge above is the summary; this is the
           thing itself, which Silas asked to keep inside. -->
      <section
        v-if="userStore.isLoggedIn && !userStore.isGuest"
        class="flex flex-col gap-1.5"
      >
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

      <!-- SESSION TOOLS: the cart doorway, the server picker, the maturity
           preference, and the app reload. -->
      <section class="flex flex-col gap-2">
        <p
          class="px-1 text-xs font-black uppercase tracking-widest text-base-content/50"
        >
          Session
        </p>

        <div class="flex items-center gap-2">
          <cart-button />
          <server-selector />

          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            aria-label="Refresh with launch animation"
            title="Refresh with launch animation"
            @click="requestFullStartupReload"
          >
            <Icon name="kind-icon:refresh" class="h-5 w-5" />
          </button>
        </div>

        <maturity-toggle
          v-if="showDashboardMaturityToggle && userStore.isLoggedIn"
          variant="resource"
        />

        <!--
          WHERE A PAGE PUTS ITS OWN CONTROLS, moved in here with everything
          else. kr-header-actions.vue teleports into this id from inside
          <NuxtPage>; see that component for why a teleport rather than a store
          of action descriptors.

          A ROW OF ITS OWN, where the header version of this target was
          `display: contents`. That was right in a flex ROW -- the buttons
          became direct items of the control strip and inherited its spacing --
          but wrong inside this column, where it made each teleported button a
          full-width stacked block. `empty:hidden` keeps the old property that
          mattered: a page teleporting nothing costs no box and no gap.
        -->
        <div
          id="kr-header-actions"
          class="flex flex-wrap items-center gap-2 empty:hidden"
        />
      </section>

      <div class="flex flex-col gap-2">
        <p
          class="px-1 text-xs font-black uppercase tracking-widest text-base-content/50"
        >
          Saved logins
        </p>

        <button
          v-for="account in store.accounts"
          :key="account.userId"
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition hover:bg-base-200"
          :class="
            account.userId === currentUserId
              ? 'border-primary bg-primary/10'
              : 'border-base-300 bg-base-100'
          "
          :disabled="store.isSwitching || account.userId === currentUserId"
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
            class="h-4 w-4 text-success"
          />
        </button>

        <div
          v-if="!store.accounts.length"
          class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
        >
          No saved logins yet. Login once, then this switcher starts collecting
          tiny test goblins.
        </div>
      </div>

      <div v-if="userStore.isLoggedIn" class="grid grid-cols-2 gap-2">
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

      <NuxtLink
        v-else
        to="/login"
        class="btn btn-primary btn-sm w-full justify-center gap-2 whitespace-nowrap rounded-2xl px-4"
        @click="store.close"
      >
        <Icon name="kind-icon:login" class="h-4 w-4 shrink-0" />
        <span class="shrink-0">Log in</span>
      </NuxtLink>

      <button
        v-if="userStore.isLoggedIn"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLoginManagerStore } from '@/stores/loginStore'
import { useMaturityPreferenceStore } from '@/stores/maturityPreferenceStore'
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
const menuRef = ref<HTMLElement | null>(null)
const fallbackAvatar = '/images/kindart.webp'

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
    if (isOpen && canSeeNotifications.value) notifications.load()
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
