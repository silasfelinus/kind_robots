<!-- /components/user/user-manager-directory.vue -->
<!--
  Admin User Directory (/user-admin). Roster of every user with inline
  moderation: change role, toggle mature, force email-verify, shadow-restrict
  (auto-private), reset password, create users, and "log in as" (added to the
  login-manager directory). Admin-gated by the channel/middleware; the store's
  endpoints re-check admin server-side.
-->
<template>
  <section class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
    <header
      class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="text-2xl font-black">User Admin</h1>
        <p class="text-sm text-base-content/70">
          {{ store.roster.length }} users · manage roles, maturity, access, and
          logins.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="store.search"
          type="search"
          placeholder="Search name, email, id…"
          class="input input-bordered input-sm w-48 rounded-xl bg-base-200"
        />
        <select
          v-model="store.roleFilter"
          class="select select-bordered select-sm rounded-xl bg-base-200"
        >
          <option value="ALL">All roles</option>
          <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
        </select>
        <button class="btn btn-primary btn-sm rounded-xl" @click="openCreate">
          <Icon name="kind-icon:plus" class="h-4 w-4" /> New user
        </button>
      </div>
    </header>

    <div
      v-if="store.lastMessage"
      class="rounded-xl border border-success/40 bg-success/10 p-2 text-sm text-success"
    >
      {{ store.lastMessage }}
    </div>
    <div
      v-if="store.lastError"
      class="rounded-xl border border-error/40 bg-error/10 p-2 text-sm text-error"
    >
      {{ store.lastError }}
    </div>

    <div class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
      <table class="table table-sm">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Email</th>
            <th class="text-center">Mature</th>
            <th class="text-center">Restricted</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.isLoading">
            <td colspan="6" class="py-6 text-center">
              <span class="loading loading-spinner" />
            </td>
          </tr>
          <tr v-for="u in store.filtered" :key="u.id" class="hover">
            <td>
              <div class="flex items-center gap-2">
                <div class="avatar">
                  <div class="h-8 w-8 rounded-full bg-base-300">
                    <img
                      v-if="u.avatarImage"
                      :src="u.avatarImage"
                      :alt="u.username"
                    />
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="truncate font-semibold">{{ u.username }}</div>
                  <div class="text-xs text-base-content/50">#{{ u.id }}</div>
                </div>
              </div>
            </td>
            <td>
              <select
                class="select select-bordered select-xs rounded-lg bg-base-200"
                :value="u.Role"
                :disabled="store.isSaving"
                @change="onRole(u.id, $event)"
              >
                <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
              </select>
            </td>
            <td>
              <div class="flex items-center gap-1 text-sm">
                <span class="max-w-[12rem] truncate">{{ u.email || '—' }}</span>
                <Icon
                  v-if="u.email"
                  :name="
                    u.emailVerified ? 'kind-icon:check' : 'kind-icon:message'
                  "
                  class="h-4 w-4 shrink-0"
                  :class="u.emailVerified ? 'text-success' : 'text-warning'"
                  :title="
                    u.emailVerified ? 'Verified' : 'Click to force-verify'
                  "
                  role="button"
                  @click="!u.emailVerified && onForceVerify(u.id)"
                />
              </div>
            </td>
            <td class="text-center">
              <input
                type="checkbox"
                class="toggle toggle-xs toggle-primary"
                :checked="u.showMature"
                :disabled="store.isSaving"
                @change="onMature(u.id, $event)"
              />
            </td>
            <td class="text-center">
              <input
                type="checkbox"
                class="toggle toggle-xs toggle-error"
                :checked="u.isRestricted"
                :disabled="store.isSaving"
                :title="
                  u.restrictedReason ||
                  'Shadow-restrict: auto-private everything'
                "
                @change="onRestrict(u)"
              />
            </td>
            <td>
              <div class="flex items-center justify-end gap-1">
                <button
                  class="btn btn-ghost btn-xs rounded-lg"
                  title="Reset password"
                  @click="openPassword(u)"
                >
                  <Icon name="kind-icon:lock" class="h-4 w-4" />
                </button>
                <button
                  class="btn btn-outline btn-xs rounded-lg"
                  :disabled="store.isSaving"
                  title="Log in as this user"
                  @click="onLoginAs(u)"
                >
                  <Icon name="kind-icon:login" class="h-4 w-4" /> Login as
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!store.isLoading && store.filtered.length === 0">
            <td colspan="6" class="py-6 text-center text-base-content/50">
              No users match.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create user modal -->
    <dialog ref="createDialog" class="modal">
      <div class="modal-box rounded-2xl">
        <h3 class="mb-3 text-lg font-black">Create user</h3>
        <div class="flex flex-col gap-3">
          <input
            v-model="createForm.username"
            placeholder="username"
            class="input input-bordered rounded-xl bg-base-200"
          />
          <input
            v-model="createForm.email"
            type="email"
            placeholder="email (optional)"
            class="input input-bordered rounded-xl bg-base-200"
          />
          <input
            v-model="createForm.password"
            type="password"
            placeholder="password (optional, min 8)"
            class="input input-bordered rounded-xl bg-base-200"
          />
          <div class="flex items-center gap-3">
            <select
              v-model="createForm.Role"
              class="select select-bordered rounded-xl bg-base-200"
            >
              <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
            </select>
            <label class="label cursor-pointer gap-2">
              <span class="label-text">Mature</span>
              <input
                v-model="createForm.showMature"
                type="checkbox"
                class="toggle toggle-sm toggle-primary"
              />
            </label>
          </div>
          <p v-if="createError" class="text-sm text-error">{{ createError }}</p>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost rounded-xl" @click="closeCreate">
            Cancel
          </button>
          <button
            class="btn btn-primary rounded-xl"
            :disabled="store.isSaving || !createForm.username"
            @click="onCreate"
          >
            Create
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Reset password modal -->
    <dialog ref="passwordDialog" class="modal">
      <div class="modal-box rounded-2xl">
        <h3 class="mb-1 text-lg font-black">Reset password</h3>
        <p class="mb-3 text-sm text-base-content/70">
          Set a new password for <strong>{{ pwTarget?.username }}</strong
          >.
        </p>
        <input
          v-model="newPassword"
          type="password"
          placeholder="New password (min 8)"
          class="input input-bordered w-full rounded-xl bg-base-200"
        />
        <p v-if="pwError" class="mt-2 text-sm text-error">{{ pwError }}</p>
        <div class="modal-action">
          <button class="btn btn-ghost rounded-xl" @click="closePassword">
            Cancel
          </button>
          <button
            class="btn btn-primary rounded-xl"
            :disabled="store.isSaving || newPassword.length < 8"
            @click="onSetPassword"
          >
            Save password
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useUserAdminStore, type AdminUser } from '@/stores/userAdminStore'

const ROLES = [
  'USER',
  'ADMIN',
  'FAMILY',
  'CHILD',
  'DESIGNER',
  'ASSISTANT',
  'BOT',
  'GUEST',
  'SYSTEM',
]

const store = useUserAdminStore()

const createDialog = ref<HTMLDialogElement>()
const passwordDialog = ref<HTMLDialogElement>()

const createForm = reactive({
  username: '',
  email: '',
  password: '',
  Role: 'USER',
  showMature: false,
})
const createError = ref('')

const pwTarget = ref<AdminUser | null>(null)
const newPassword = ref('')
const pwError = ref('')

onMounted(() => store.loadRoster())

function onRole(userId: number, evt: Event) {
  store.updateAdmin(userId, { Role: (evt.target as HTMLSelectElement).value })
}
function onMature(userId: number, evt: Event) {
  store.updateAdmin(userId, {
    showMature: (evt.target as HTMLInputElement).checked,
  })
}
function onForceVerify(userId: number) {
  store.updateAdmin(userId, { emailVerified: true })
}
async function onRestrict(u: AdminUser) {
  if (u.isRestricted) {
    await store.unrestrict(u.id)
  } else {
    const reason = window.prompt(
      `Restrict ${u.username}? This makes all their content private. Optional reason:`,
      '',
    )
    if (reason === null) {
      await store.loadRoster() // user cancelled — resync the toggle
      return
    }
    await store.restrict(u.id, reason || undefined)
  }
}

function openCreate() {
  createError.value = ''
  Object.assign(createForm, {
    username: '',
    email: '',
    password: '',
    Role: 'USER',
    showMature: false,
  })
  createDialog.value?.showModal()
}
function closeCreate() {
  createDialog.value?.close()
}
async function onCreate() {
  createError.value = ''
  const res = await store.createUser({
    username: createForm.username.trim(),
    email: createForm.email.trim() || undefined,
    password: createForm.password || undefined,
    Role: createForm.Role,
    showMature: createForm.showMature,
  })
  if (res.success) closeCreate()
  else createError.value = res.message
}

function openPassword(u: AdminUser) {
  pwTarget.value = u
  newPassword.value = ''
  pwError.value = ''
  passwordDialog.value?.showModal()
}
function closePassword() {
  passwordDialog.value?.close()
}
async function onSetPassword() {
  if (!pwTarget.value) return
  pwError.value = ''
  const res = await store.setPassword(pwTarget.value.id, newPassword.value)
  if (res.success) closePassword()
  else pwError.value = res.message
}

async function onLoginAs(u: AdminUser) {
  const res = await store.loginAs(u.id)
  if (res.success) navigateTo('/dashboard')
}
</script>
