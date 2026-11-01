<!-- /components/navigation/page-help.vue -->
<!--
  ONE TUTORIAL BUTTON PER PAGE. Silas, 2026-11-01: "we are inconsistent with
  our tutorial buttons, just make sure we only have the one for each page, but
  it should be on the lower bar generally, as that feels more connected to the
  main content."

  The one button is the "?" at the end of workspace-header's lower row. A page
  with its own in-game guide (Slime City's How to play, Prom of Doom's
  tutorial screen) no longer draws a second help button: it mounts this, and
  the workspace sheet that "?" opens leads with a button into that guide.
  Renders nothing.
-->
<template>
  <span hidden aria-hidden="true" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useNavStore } from '@/stores/navStore'

const props = defineProps<{ label: string }>()
const emit = defineEmits<{ open: [] }>()

const navStore = useNavStore()
let helpId = 0

onMounted(() => {
  helpId = navStore.registerPageHelp(props.label, () => emit('open'))
})
onBeforeUnmount(() => navStore.releasePageHelp(helpId))
</script>
