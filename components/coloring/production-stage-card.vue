<template>
  <article class="flex min-h-28 flex-col gap-2 kr-panel-tint-sm-50">
    <div class="flex items-center justify-between gap-2">
      <icon
        :name="iconName"
        class="size-5"
        :class="done ? 'text-success' : 'text-base-content/40'"
      />
      <span
        class="kr-badge-sm rounded-2xl"
        :class="done ? 'badge-success' : 'badge-ghost'"
      >
        {{ done ? 'Ready' : 'Waiting' }}
      </span>
    </div>
    <h4 class="kr-text-black-sm">{{ label }}</h4>
    <p class="kr-text-dim-xs line-clamp-2 break-all">
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
