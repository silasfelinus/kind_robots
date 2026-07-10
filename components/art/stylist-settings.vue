<!-- /components/art/stylist-settings.vue -->
<!--
  Receipt / contact settings for the Superkate suite. The calculator SPEC
  requires the receipt contact block to be editable: salon name, preferred
  booking/contact link, and reply contact. Live receipt preview included.
-->
<template>
  <section
    class="stylist-settings flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:adjust" class="h-5 w-5 text-primary" />
      <h2 class="text-base font-black text-base-content">Receipt Settings</h2>
    </header>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1 sm:col-span-2">
        <span class="text-xs font-black text-base-content">Salon name</span>
        <input
          v-model="salonName"
          type="text"
          class="input input-sm input-bordered w-full"
          @change="save"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Booking / contact link</span>
        <input
          v-model="bookingLink"
          type="text"
          placeholder="Booking URL, phone, or however clients should reach out"
          class="input input-sm input-bordered w-full"
          @change="save"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Reply contact</span>
        <input
          v-model="replyContact"
          type="text"
          placeholder="Where replies should go"
          class="input input-sm input-bordered w-full"
          @change="save"
        />
      </label>
    </div>

    <div class="flex flex-col gap-1 rounded-xl border border-base-300 bg-base-100 p-3">
      <span class="text-xs font-black text-base-content">Receipt preview</span>
      <pre class="whitespace-pre-wrap text-xs text-base-content/70">{{ preview }}</pre>
    </div>

    <p class="text-xs text-base-content/40">
      Settings save automatically on this device. "Superkate loves you!" is not
      configurable. It's the law.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSuperkateStore } from '@/stores/superkateStore'

const superkate = useSuperkateStore()

const salonName = ref(superkate.settings.salonName)
const bookingLink = ref(superkate.settings.bookingLink)
const replyContact = ref(superkate.settings.replyContact)

// Settings hydrate from localStorage after mount; mirror them in.
watch(
  () => superkate.settings,
  (settings) => {
    salonName.value = settings.salonName
    bookingLink.value = settings.bookingLink
    replyContact.value = settings.replyContact
  },
  { deep: true },
)

const preview = computed(() =>
  [
    'Hi Alex!',
    '',
    `Thank you so much for visiting ${salonName.value || 'the salon'} on 2026-07-09.`,
    '',
    '$80.00/hr x 1h 30m + $12.00 products = $132.00',
    '',
    salonName.value || 'the salon',
    bookingLink.value,
    replyContact.value,
    'Superkate loves you!',
  ].join('\n'),
)

function save() {
  superkate.updateSettings({
    salonName: salonName.value.trim() || 'Hair by Superkate',
    bookingLink: bookingLink.value.trim(),
    replyContact: replyContact.value.trim(),
  })
}
</script>
