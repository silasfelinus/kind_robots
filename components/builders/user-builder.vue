<!-- /components/content/builder/user-builder.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4">
    <h2 class="flex items-center gap-2 text-2xl font-bold text-base-content">
      <Icon name="kind-icon:person" class="h-6 w-6 text-primary" />
      User Builder
    </h2>

    <p class="text-base text-base-content/70">
      Login, register, pick a designer name, choose an avatar, configure privacy, maturity, and servers.
    </p>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <user-panel />
      <server-gallery />
    </div>
  </section>
</template>

<script setup lang="ts"></script>