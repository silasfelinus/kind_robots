<!-- /components/content/icons/icon-gallery.vue -->
<template>
  <div class="container mx-auto space-y-4 p-4">
    <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <h1 class="text-3xl font-bold text-primary">Smart Icon Gallery</h1>
      <NuxtLink to="/addicon" class="btn btn-primary btn-sm rounded-xl">
        ➕ Add New Icon
      </NuxtLink>
    </div>

    <div class="rounded-2xl border border-primary/30 bg-base-100 p-4 shadow-md">
      <div class="flex flex-col gap-4">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="badge rounded-xl"
                :class="customIconsEnabled ? 'badge-primary' : 'badge-outline'"
              >
                customIconsEnabled:
                {{ customIconsEnabled ? 'true' : 'false' }}
              </span>

              <span
                class="badge rounded-xl"
                :class="user?.customIcons ? 'badge-secondary' : 'badge-outline'"
              >
                user.customIcons:
                {{ user?.customIcons ? 'true' : 'false' }}
              </span>

              <span class="badge badge-outline rounded-xl">
                smartBar count: {{ smartBarIds.length }}
              </span>
            </div>

            <div class="text-sm">
              <span class="font-semibold">smartBar string:</span>
              <span class="break-all opacity-80">
                {{ smartBarString || 'empty' }}
              </span>
            </div>

            <div class="text-sm">
              <span class="font-semibold">parsed smartBar ids:</span>
              <span class="opacity-80">
                {{ smartBarIds.length ? smartBarIds.join(', ') : 'none' }}
              </span>
            </div>

            <div class="text-sm">
              <span class="font-semibold">active custom icon labels:</span>
              <span class="opacity-80">
                {{
                  smartBarIconLabels.length
                    ? smartBarIconLabels.join(' • ')
                    : 'none'
                }}
              </span>
            </div>

            <div v-if="syncMessage" class="text-xs opacity-70">
              {{ syncMessage }}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-primary btn-sm rounded-xl"
              :disabled="isSyncing"
              @click="forceEnableAndSync"
            >
              {{ isSyncing ? 'Syncing...' : 'Enable Custom Icons + Sync' }}
            </button>

            <button
              type="button"
              class="btn btn-outline btn-sm rounded-xl"
              :disabled="isSyncing"
              @click="logFrontendState"
            >
              Log Frontend State
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200/60 p-3">
          <div class="mb-2 text-sm font-semibold">
            Frontend readout of current custom icon set
          </div>

          <div
            v-if="smartBarIconDetails.length"
            class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3"
          >
            <div
              v-for="icon in smartBarIconDetails"
              :key="icon.id"
              class="flex flex-col items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-center"
            >
              <Icon :name="icon.icon || 'kind-icon:help'" class="text-3xl" />
              <div class="text-xs font-semibold">
                {{ icon.label || icon.title }}
              </div>
              <div class="text-[10px] opacity-60">#{{ icon.id }}</div>
            </div>
          </div>

          <div v-else class="text-sm opacity-70">
            No icons currently resolved from the smartBar string.
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-4">
      <select v-model="filterScope" class="select select-bordered rounded-lg">
        <option value="all">All Icons</option>
        <option value="user">My Icons</option>
        <option value="public">Public Only</option>
      </select>

      <select v-model="filterType" class="select select-bordered rounded-lg">
        <option value="">All Types</option>
        <option value="nav">Navigation</option>
        <option value="utility">Utility</option>
      </select>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6">
      <div
        v-for="icon in filteredIcons"
        :key="icon.id"
        class="relative flex flex-col items-center gap-2 rounded-2xl border bg-base-100 p-4 shadow-md"
      >
        <Icon :name="icon.icon || 'kind-icon:help'" class="text-4xl" />

        <div class="text-center text-sm font-medium">
          {{ icon.label || icon.title }}
        </div>

        <div v-if="icon.description" class="text-center text-sm font-medium">
          {{ icon.description }}
        </div>

        <button
          v-if="isAdmin"
          class="mt-1 text-[10px] text-blue-500 underline hover:text-blue-700"
          @click="openEditModal(icon)"
        >
          Edit Details
        </button>

        <button
          class="btn btn-xs mt-1 rounded-xl"
          :disabled="isSyncing"
          :class="{
            'btn-secondary': isInSmartBar(icon.id),
            'btn-outline': !isInSmartBar(icon.id),
          }"
          @click="toggleIcon(icon.id)"
        >
          {{ isInSmartBar(icon.id) ? 'Remove' : 'Add' }}
        </button>
      </div>
    </div>

    <edit-icon
      v-if="selectedIcon"
      :icon="selectedIcon"
      class="fixed inset-0 z-50 flex items-center justify-center bg-base-200 bg-opacity-90 p-4 backdrop-blur-md"
      style="max-height: 95vh; overflow-y: auto"
      @close="selectedIcon = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useUserStore } from '@/stores/userStore'

interface SyncResult {
  success?: boolean
  message?: string
  data?: unknown
}

function isSyncResult(value: unknown): value is SyncResult {
  return typeof value === 'object' && value !== null
}

const smartbarStore = useSmartbarStore()
const userStore = useUserStore()

const { icons, smartBarIds, customIconsEnabled } = storeToRefs(smartbarStore)
const { user } = storeToRefs(userStore)

const selectedIcon = ref<SmartIcon | null>(null)

const filterScope = ref<'all' | 'user' | 'public'>('all')
const filterType = ref('')
const isSyncing = ref(false)
const syncMessage = ref('')

const isAdmin = computed(() => userStore.isAdmin)
const smartBarString = computed(() => user.value?.smartBar || '')

const smartBarIconDetails = computed(() =>
  smartBarIds.value
    .map((id) => icons.value.find((icon) => icon.id === id))
    .filter((icon): icon is SmartIcon => Boolean(icon)),
)

const smartBarIconLabels = computed(() =>
  smartBarIconDetails.value.map(
    (icon) => icon.label || icon.title || `#${icon.id}`,
  ),
)

function openEditModal(icon: SmartIcon) {
  selectedIcon.value = icon
}

const filteredIcons = computed(() =>
  icons.value.filter((i: SmartIcon) => {
    if (filterScope.value === 'user' && i.userId !== user.value?.id)
      return false
    if (filterScope.value === 'public' && !i.isPublic) return false
    if (filterType.value && i.type !== filterType.value) return false
    return true
  }),
)

function isInSmartBar(id: number) {
  return smartBarIds.value.includes(id)
}

function logFrontendState() {
  console.group('[icon-gallery] frontend smartBar readout')
  console.log('customIconsEnabled:', customIconsEnabled.value)
  console.log('user.customIcons:', user.value?.customIcons)
  console.log('user.smartBar:', user.value?.smartBar)
  console.log('smartBarIds:', [...smartBarIds.value])
  console.log(
    'resolvedIcons:',
    smartBarIconDetails.value.map((icon) => ({
      id: icon.id,
      title: icon.title,
      label: icon.label,
      type: icon.type,
      icon: icon.icon,
      link: icon.link,
      component: icon.component,
    })),
  )
  console.groupEnd()

  syncMessage.value = 'Logged current frontend smartBar state to console.'
}

async function forceEnableAndSync() {
  isSyncing.value = true
  syncMessage.value = 'Trying to enable custom icons and sync smartBar...'

  console.group('[icon-gallery] forceEnableAndSync')
  console.log('before', {
    customIconsEnabled: customIconsEnabled.value,
    userCustomIcons: user.value?.customIcons,
    smartBar: user.value?.smartBar,
    smartBarIds: [...smartBarIds.value],
  })

  try {
    await smartbarStore.toggleCustomIcons(true)
    const result = await smartbarStore.updateSmartBar([...smartBarIds.value])

    console.log('after', {
      result,
      customIconsEnabled: customIconsEnabled.value,
      userCustomIcons: user.value?.customIcons,
      smartBar: user.value?.smartBar,
      smartBarIds: [...smartBarIds.value],
    })

    if (isSyncResult(result) && result.success === false) {
      syncMessage.value = result.message || 'Sync failed.'
      console.error('[icon-gallery] forceEnableAndSync failed', result)
      return
    }

    syncMessage.value = `Synced custom icons. smartBar is now: ${
      user.value?.smartBar || 'empty'
    }`
    console.info('[icon-gallery] forceEnableAndSync success')
  } catch (error) {
    syncMessage.value = error instanceof Error ? error.message : 'Sync failed.'
    console.error('[icon-gallery] forceEnableAndSync error', error)
  } finally {
    console.groupEnd()
    isSyncing.value = false
  }
}

async function toggleIcon(id: number) {
  isSyncing.value = true

  const removing = isInSmartBar(id)
  syncMessage.value = `${removing ? 'Removing' : 'Adding'} icon ${id}...`

  console.group('[icon-gallery] toggleIcon')
  console.log('before', {
    id,
    removing,
    customIconsEnabled: customIconsEnabled.value,
    userCustomIcons: user.value?.customIcons,
    smartBar: user.value?.smartBar,
    smartBarIds: [...smartBarIds.value],
  })

  try {
    const result = removing
      ? await smartbarStore.removeIconFromSmartBar(id)
      : await smartbarStore.addIconToSmartBar(id)

    console.log('after', {
      result,
      customIconsEnabled: customIconsEnabled.value,
      userCustomIcons: user.value?.customIcons,
      smartBar: user.value?.smartBar,
      smartBarIds: [...smartBarIds.value],
    })

    if (!customIconsEnabled.value) {
      syncMessage.value =
        'Icon changed, but customIconsEnabled is still false. Try the sync button.'
      console.warn('[icon-gallery] customIconsEnabled still false after toggle')
      return
    }

    if (isSyncResult(result) && result.success === false) {
      syncMessage.value = result.message || 'Icon update failed.'
      console.error('[icon-gallery] toggleIcon failed', result)
      return
    }

    syncMessage.value = `Updated smartBar: ${user.value?.smartBar || 'empty'}`
    console.info('[icon-gallery] toggleIcon success')
  } catch (error) {
    syncMessage.value =
      error instanceof Error ? error.message : 'Icon update failed.'
    console.error('[icon-gallery] toggleIcon error', error)
  } finally {
    console.groupEnd()
    isSyncing.value = false
  }
}

onMounted(async () => {
  try {
    if (
      'initialize' in userStore &&
      typeof userStore.initialize === 'function'
    ) {
      await userStore.initialize()
    }

    if (!smartbarStore.isInitialized) {
      await smartbarStore.initialize()
    }

    console.info('[icon-gallery] mounted', {
      customIconsEnabled: customIconsEnabled.value,
      userCustomIcons: user.value?.customIcons,
      smartBar: user.value?.smartBar,
      smartBarIds: [...smartBarIds.value],
    })
  } catch (error) {
    console.error('[icon-gallery] mount initialization error', error)
  }
})

watch(
  () => [user.value?.smartBar, user.value?.customIcons],
  ([smartBar, customIcons], [prevSmartBar, prevCustomIcons]) => {
    if (smartBar === prevSmartBar && customIcons === prevCustomIcons) return

    syncMessage.value = `Detected change. customIcons: ${String(
      customIcons,
    )}, smartBar: ${smartBar || 'empty'}`
  },
)
</script>
