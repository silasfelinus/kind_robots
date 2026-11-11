<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-layout="console-fixed"
    data-testid="monstrique-bible-admin"
  >
    <div
      v-if="!mayOpen"
      class="grid h-full min-h-0 flex-1 place-items-center bg-base-300 p-5 text-center"
    >
      <div class="max-w-md space-y-3">
        <Icon name="kind-icon:lock" class="mx-auto size-9 opacity-60" />
        <p class="text-2xl font-bold">Access restricted</p>
        <p class="opacity-75">
          The Monstrique series bible requires an administrator account with
          mature content enabled. Accounts with the child role cannot enter.
        </p>
        <p v-if="caseStore.checking" class="text-sm opacity-60" role="status">
          Checking account access…
        </p>
      </div>
    </div>
    <template v-else>
      <header-page-bar console-theme="forge">
        <div class="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold">
          <Icon name="kind-icon:book-open" class="size-4 text-primary" />
          <span class="truncate">MONSTRIQUE · Series bible</span>
        </div>
      </header-page-bar>
      <MonstriqueSeriesBible />
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import { useUserStore } from '~/stores/userStore'

const user = useUserStore()
const caseStore = useMonstressConventionStore()
const mayOpen = computed(
  () => caseStore.authorized && user.isAdmin && user.showMature,
)

onMounted(() => {
  watch(
    () => [user.token, user.showMature, user.isAdmin],
    () => void caseStore.verifyAccess(),
    { immediate: true },
  )
})
</script>
