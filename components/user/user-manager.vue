<script setup lang="ts">
// /components/content/user/user-manager.vue
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useNavStore } from '@/stores/navStore'

type UserManagerSection =
  | 'dashboard'
  | 'subscription'
  | 'milestones'
  | 'servers'
  | 'themes'
  | 'chats'
  | 'galleries'

type ManagerSection = {
  key: UserManagerSection
  label: string
  icon: string
  description: string
}

const userStore = useUserStore()
const navStore = useNavStore()

const isLoggingOut = ref(false)

const sections: ManagerSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'kind-icon:user',
    description: 'Profile and account basics',
  },
  {
    key: 'subscription',
    label: 'Subscription',
    icon: 'kind-icon:jellybean',
    description: 'Plans, credits, receipts',
  },
  {
    key: 'milestones',
    label: 'Milestones',
    icon: 'kind-icon:trophy',
    description: 'Rewards and progress',
  },
  {
    key: 'servers',
    label: 'Servers',
    icon: 'kind-icon:server',
    description: 'Backend endpoints',
  },
  {
    key: 'themes',
    label: 'Themes',
    icon: 'kind-icon:palette',
    description: 'DaisyUI and custom themes',
  },
  {
    key: 'chats',
    label: 'Chats',
    icon: 'kind-icon:chat',
    description: 'Conversation galleries',
  },
  {
    key: 'galleries',
    label: 'Galleries',
    icon: 'kind-icon:gallery',
    description: 'Collections and art',
  },
]

const activeSection = computed<UserManagerSection>({
  get: () => {
    const tab = navStore.getDashboardTab('user')

    if (isUserManagerSection(tab)) {
      return tab
    }

    return 'dashboard'
  },
  set: (tab: UserManagerSection) => {
    navStore.setDashboardTab('user', tab)
  },
})

const username = computed(() => userStore.username || 'Kind Guest')

const userStatus = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode'
  return `${userStore.role} · User #${userStore.userId}`
})

const stats = computed(() => [
  {
    label: 'Karma',
    value: userStore.karma,
    className: 'text-primary',
  },
  {
    label: 'Mana',
    value: userStore.mana,
    className: 'text-secondary',
  },
  {
    label: 'Record',
    value: userStore.matchRecord,
    className: 'text-accent',
  },
])

const accountDetails = computed(() => [
  {
    label: 'Username',
    value: userStore.username || 'Kind Guest',
  },
  {
    label: 'Email',
    value: userStore.user?.email || 'Not set',
  },
  {
    label: 'Role',
    value: userStore.role,
  },
  {
    label: 'User ID',
    value: userStore.userId,
  },
  {
    label: 'Mature Content',
    value: userStore.showMature ? 'Enabled' : 'Disabled',
  },
  {
    label: 'Click Record',
    value: userStore.clickRecord,
  },
])

function isUserManagerSection(value: string): value is UserManagerSection {
  return sections.some((section) => section.key === value)
}

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await userStore.logout()
    navStore.setDashboardTab('user', 'dashboard')
    await navigateTo('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>
