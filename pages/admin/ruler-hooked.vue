<!-- /pages/admin/ruler-hooked.vue -->
<!--
  The Ruler Is Hooked moved here from /plan/projects/ruler-hooked on 2026-10-11
  (Silas: "move the ruler is hooked to admin, it's not ready for prime time").
  The game itself is unchanged; this page only gates it to admins until it
  launches under /play.
-->
<template>
  <main class="kr-surface">
    <div v-if="!userStore.initialized" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!userStore.isAdmin"
      class="kr-note kr-note-error mx-auto mt-12 max-w-xl p-8 text-center"
    >
      The Ruler Is Hooked is in its admin workshop until it is ready to launch.
    </div>
    <ruler-hooked-page v-else />
  </main>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()

useHead({ title: 'The Ruler Is Hooked' })
</script>
