<template>
  <article
    class="flex min-h-28 flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3"
  >
    <div class="flex items-center justify-between gap-2">
      <icon
        :name="iconName"
        class="size-5"
        :class="done ? 'text-success' : 'text-base-content/40'"
      />
      <span
        class="badge badge-sm rounded-2xl"
        :class="done ? 'badge-success' : 'badge-ghost'"
      >
        {{ done ? 'Ready' : 'Waiting' }}
      </span>
    </div>
    <h4 class="text-sm font-black">{{ label }}</h4>
    <p class="line-clamp-2 break-all text-xs text-base-content/50">
      {{ detail }}
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  detail: string
  iconName: string
  done?: boolean
}>()
</script>
