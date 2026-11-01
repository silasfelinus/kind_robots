<!-- /components/navigation/shell-console-theme.vue -->
<!--
  The console skin without a bar. header-page-bar's `console-theme` only lasts
  while the bar is mounted, and a game's title screen or intro often shows no
  bar -- which left the shell cream until play began. A page that owns a
  scoped daisyUI theme mounts this at its root so the whole shell (system bar,
  pickers, menus, gutters) takes the game's palette from the first screen and
  reverts when the page unmounts. Renders nothing.
-->
<template>
  <span hidden aria-hidden="true" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useNavStore } from '@/stores/navStore'

const props = defineProps<{ theme: string }>()

const navStore = useNavStore()
let themeId = 0

onMounted(() => {
  themeId = navStore.registerConsoleTheme(props.theme)
})
onBeforeUnmount(() => navStore.releasePageBar(themeId))
</script>
