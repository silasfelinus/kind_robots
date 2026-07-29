<!-- /pages/models.vue -->
<!--
  Model (checkpoint) browser — the sibling of /lora for base models. Browse /
  filter / sort the installed checkpoints, grouped by base model with the
  non-image checkpoints (3D / Audio / Video) in their own section.

  Add / edit / Civitai discover + download land here next, mirroring the LoRA
  rig (<add-lora>, <lora-discover>, server/api/lora/download).
-->
<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-3 p-3">
    <div class="min-h-0 flex-1">
      <model-gallery />
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Model Library' })
</script>
