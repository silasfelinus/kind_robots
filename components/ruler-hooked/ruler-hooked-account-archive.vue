<template>
  <fieldset class="grid gap-2 rounded-xl border p-3">
    <legend class="font-bold">Account archive</legend>
    <p v-if="!account.signedIn" class="text-sm">
      Sign in for automatic reign and scrapbook syncing across devices. Guest
      reigns remain available offline.
    </p>
    <template v-else>
      <p class="text-sm">
        Your account's reigns sync automatically while playing. Matching reigns
        use the newest saved timestamp. Guest reigns stay separate, and custom
        portrait images stay on their original device. Deleting a local reign
        does not delete its account backup.
      </p>
      <button
        v-if="!confirmGuestImport"
        type="button"
        class="rh-btn"
        :disabled="!store.canRestoreAccount || account.busy"
        @click="confirmGuestImport = true"
      >
        Import older device reigns
      </button>
      <div v-else class="grid gap-2">
        <p class="text-sm">
          Copy all guest and legacy device reigns into this account? Only do
          this if they belong to you. Originals stay on this device.
        </p>
        <button type="button" class="rh-btn" @click="importGuest">
          Confirm import
        </button>
        <button type="button" class="rh-btn" @click="confirmGuestImport = false">
          Cancel
        </button>
      </div>
      <button
        type="button"
        class="rh-btn"
        :disabled="account.busy"
        @click="account.refresh()"
      >
        {{ account.busy ? 'Contacting archive…' : 'Read account archive' }}
      </button>
      <template v-if="account.archive">
        <p class="text-sm">
          {{ account.archive.save?.reigns.length ?? 0 }} account reigns ·
          {{ store.slots.length }} on this device
        </p>
        <button
          type="button"
          class="rh-btn rh-btn--gold"
          :disabled="account.busy"
          @click="account.backup()"
        >
          Back up this device
        </button>
        <button
          v-if="account.archive.save"
          type="button"
          class="rh-btn"
          :disabled="account.busy || !store.canRestoreAccount"
          @click="account.restore()"
        >
          Restore account reigns
        </button>
        <p v-if="!store.canRestoreAccount" class="text-sm">
          Finish the active catch or petition before restoring.
        </p>
      </template>
    </template>
    <p v-if="importMessage" role="status" class="text-sm">
      {{ importMessage }}
    </p>
    <p v-if="account.message" role="status" class="text-sm">
      {{ account.message }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { useRulerHookedAccountStore } from '~/stores/rulerHookedAccountStore'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { useUserStore } from '~/stores/userStore'

const account = useRulerHookedAccountStore()
const store = useRulerHookedStore()
const user = useUserStore()
const confirmGuestImport = ref(false)
const importMessage = ref('')

function importGuest() {
  try {
    if (store.importGuestReigns()) {
      account.reconnect()
      importMessage.value = 'Legacy device reigns copied into this account.'
    } else {
      importMessage.value = 'Finish your active encounter before importing.'
    }
  } catch {
    importMessage.value = 'Could not import the legacy archive. Originals are unchanged.'
  }
  confirmGuestImport.value = false
}
watch(
  () => user.authenticatedUserId,
  () => {
    confirmGuestImport.value = false
    importMessage.value = ''
  },
  { flush: 'sync' },
)
</script>
