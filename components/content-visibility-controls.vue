<template>
  <section class="space-y-2 kr-panel-flat p-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 class="text-sm font-bold">Content visibility</h3>
        <p class="mt-0.5 text-xs text-base-content/55">
          Mature work defaults private; general-audience work defaults public.
          You can override privacy after choosing maturity.
        </p>
      </div>
      <span
        class="badge badge-sm rounded-xl"
        :class="isPublic ? 'badge-success badge-outline' : 'badge-neutral'"
      >
        {{ isPublic ? 'Public' : 'Private' }}
      </span>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      <label
        class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-200/50 px-3 py-2"
      >
        <span>
          <span class="block text-sm font-semibold">Mature</span>
          <span class="block text-[11px] text-base-content/55">18+ content</span>
        </span>
        <input
          :checked="isMature"
          type="checkbox"
          class="toggle toggle-warning toggle-sm"
          :disabled="disabled"
          @change="onMatureChange"
        />
      </label>

      <label
        class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-200/50 px-3 py-2"
      >
        <span>
          <span class="block text-sm font-semibold">Public</span>
          <span class="block text-[11px] text-base-content/55">
            {{ isPublic ? 'Visible in public surfaces' : 'Owner/admin only' }}
          </span>
        </span>
        <input
          :checked="isPublic"
          type="checkbox"
          class="toggle toggle-success toggle-sm"
          :disabled="disabled"
          @change="onPublicChange"
        />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { defaultPublicForMaturity } from '@/utils/maturityPrivacy'

const props = withDefaults(
  defineProps<{
    isMature: boolean
    isPublic: boolean
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  'update:isMature': [value: boolean]
  'update:isPublic': [value: boolean]
}>()

// A non-default initial pair is already an explicit privacy choice.
const privacyOverridden = ref(
  props.isPublic !== defaultPublicForMaturity(props.isMature),
)

function onMatureChange(event: Event): void {
  const isMature = (event.target as HTMLInputElement).checked
  emit('update:isMature', isMature)
  if (!privacyOverridden.value) {
    emit('update:isPublic', defaultPublicForMaturity(isMature))
  }
}

function onPublicChange(event: Event): void {
  privacyOverridden.value = true
  emit('update:isPublic', (event.target as HTMLInputElement).checked)
}
</script>
