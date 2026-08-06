<!-- /components/content/characters/character-manager.vue -->
<template>
  <kr-manager
    dashboard-key="character"
    :loading="isLoadingManager"
    :error="managerError"
    :loading-label="managerSummary"
    @refresh="refreshManagerData"
  >
    <template #characters>
      <character-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </template>

    <template #adventure>
      <add-character />
    </template>

    <template #stage>
      <stage-manager class="h-full min-h-0 flex-1 overflow-hidden" />
    </template>
  </kr-manager>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from '#app'
import { useCharacterStore } from '@/stores/characterStore'
import { useNavStore } from '@/stores/navStore'

const dashboardKey = 'character'

const route = useRoute()
const characterStore = useCharacterStore()
const navStore = useNavStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const managerSummary = computed(() => {
  const count = characterStore.characters.length

  return `${count} character${count === 1 ? '' : 's'} loaded.`
})

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await characterStore.initialize({
      force,
      fetchRemote: true,
      createDefaultForm: true,
    })
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load characters.'
  } finally {
    isLoadingManager.value = false
  }
}

function querySelectionId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function syncCharacterFromRoute(): Promise<void> {
  const id = querySelectionId(route.query.characterId ?? route.query.character)
  if (!id) return

  navStore.setDashboardTab(dashboardKey, 'characters')
  await characterStore.selectCharacter(id)
}

async function refreshManagerData() {
  await loadManagerData(true)
  await syncCharacterFromRoute()
}

onMounted(async () => {
  await loadManagerData()
  await syncCharacterFromRoute()

  watch(
    () => [route.query.characterId, route.query.character],
    () => {
      void syncCharacterFromRoute()
    },
  )
})
</script>
