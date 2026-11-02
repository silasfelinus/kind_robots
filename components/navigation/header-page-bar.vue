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

  CONSOLE THEME. Silas, same day: "the top header still feels out of place.
  We are designing after a AAA console experience, that shouldn't skip the os
  substitute, but ideally, this all flows." A page that passes
  `console-theme` (a scoped daisyUI theme such as `slime-city`) re-skins the
  whole shell -- header, pickers, account hub, gutters -- while it is mounted,
  so the site chrome reads as the game console's system bar rather than a
  cream web header sitting on top of it. Nothing is hidden; only the skin
  changes, and it reverts when the page unmounts.

  COMPACT. A page that docks only a few actions (a Refresh, a range switch, a
  status chip) passes `compact`: its bar takes the right of the row and the
  page's room and message stay visible on the left, so the strip still says
  where you are.

  NESTED. A page that docks its own bar and also embeds components that could
  dock one (the user dashboard embeds the galleries) calls
  `provide('kr-page-bar-owner', true)`; any header-page-bar below it then renders
  its controls in place instead of teleporting a second bar into the row.

  Client-only because a teleport into an in-app target cannot be server
  rendered without a hydration mismatch; the shell loader covers first paint.
-->
<template>
  <div
    v-if="nested"
    class="flex min-w-0 flex-wrap items-center gap-2"
    data-testid="header-page-bar-inline"
  >
    <slot />
  </div>
  <ClientOnly v-else>
    <Teleport to="#kr-header-page-bar" defer>
      <div
        class="flex min-w-0 flex-1 items-center gap-2"
        :class="compact ? 'justify-end' : ''"
        data-testid="header-page-bar"
      >
        <slot />
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted } from 'vue'
import { useNavStore } from '@/stores/navStore'

const props = defineProps<{ consoleTheme?: string; compact?: boolean }>()

const nested = inject<boolean>('kr-page-bar-owner', false)

const navStore = useNavStore()
let pageBarId = 0

onMounted(() => {
  if (nested) return
  pageBarId = navStore.registerPageBar(props.consoleTheme, true, props.compact)
})
onBeforeUnmount(() => {
  if (!nested) navStore.releasePageBar(pageBarId)
})
</script>
