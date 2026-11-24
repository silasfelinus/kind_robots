<template>
  <fieldset class="grid gap-2 rounded-xl border p-3">
    <legend class="font-bold">Account archive</legend>
    <p v-if="!account.signedIn" class="text-sm">
      Sign in to back up reigns and scrapbook discoveries across devices.
      Device saves remain available offline.
    </p>
    <template v-else>
      <p class="text-sm">
        Backups include all reigns on this device. Matching reigns use the
        newest saved timestamp. Custom portrait images stay on their original
        device. Deleting a device reign does not delete its account backup.
      </p>
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
    <p v-if="account.message" role="status" class="text-sm">
      {{ account.message }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { useRulerHookedAccountStore } from '~/stores/rulerHookedAccountStore'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const account = useRulerHookedAccountStore()
const store = useRulerHookedStore()
</script>
