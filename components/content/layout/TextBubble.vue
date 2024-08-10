<template>
  <div
    class="text-bubble"
    :style="{ top: y + 'px', left: x + 'px' }"
  >
    {{ text }}
  </div>
</template>

<script lang="ts">
export default {
  props: {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
}
</script>

<style scoped>
.text-bubble {
  background-color: var(--bg-base-200);
  border-radius: 12px;
  padding: 10px;
  max-width: 150px;
  font-size: 14px;
  color: var(--bg-primary);
  white-space: nowrap;
  transform: translate(-50%, -100%);
}
</style>
