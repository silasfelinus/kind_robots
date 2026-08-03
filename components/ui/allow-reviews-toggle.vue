<!-- /components/ui/allow-reviews-toggle.vue -->
<!-- Owner-facing allowReviews toggle, shared across Project/Bot/Character/Reward/Scenario edit surfaces. -->
<template>
  <button
    type="button"
    class="btn btn-sm gap-1.5 rounded-xl"
    :class="allowReviews ? 'btn-accent' : 'btn-ghost border border-base-300'"
    :disabled="saving"
    @click="$emit('toggle')"
  >
    <Icon name="kind-icon:chat" class="size-3.5" />{{
      allowReviews ? 'Reviews On' : 'Reviews Off'
    }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  allowReviews: boolean
  saving?: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>
