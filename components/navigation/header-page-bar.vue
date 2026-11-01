<!-- /components/navigation/header-page-bar.vue -->
<!--
  ONE HEADER, NOT TWO. Silas, 2026-11-01, on Slime City: "It has two headers.
  We want one. The title, icons, as well as nav entries, can be merged ... so
  icons are top over the row that is shown for the slime city or other
  dominant tabs ... we want a single interface."

  A page that owns its own title, view tabs or HUD wraps them in this component
  instead of rendering a second persistent header above its stage. The content
  is teleported into workspace-header's page-bar row: below xl it is a second
  row inside the same header card, under the icons; at xl it joins the icon
  row. The page keeps its own markup, handlers and scoped styles.

  Client-only because a teleport into an in-app target cannot be server
  rendered without a hydration mismatch; the shell loader covers first paint.
-->
<template>
  <ClientOnly>
    <Teleport to="#kr-header-page-bar" defer>
      <div
        class="flex min-w-0 flex-1 items-center gap-2"
        data-testid="header-page-bar"
      >
        <slot />
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useNavStore } from '@/stores/navStore'

const navStore = useNavStore()

onMounted(() => navStore.registerPageBar())
onBeforeUnmount(() => navStore.releasePageBar())
</script>
