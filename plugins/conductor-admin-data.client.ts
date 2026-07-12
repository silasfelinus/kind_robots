import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConductorStore } from '@/stores/conductorStore'
import { usePageStore } from '@/stores/pageStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTodoStore } from '@/stores/todoStore'
import { useUserStore } from '@/stores/userStore'

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const conductorStore = useConductorStore()
  const pageStore = usePageStore()
  const projectStore = useProjectStore()
  const todoStore = useTodoStore()
  const userStore = useUserStore()

  const isConductorSurface = computed(() => {
    return (
      route.path === '/conductor' ||
      route.path === '/workspace' ||
      (pageStore.dashboardKey === 'conductor' &&
        pageStore.dashboardTab === 'conductor') ||
      (pageStore.dashboardKey === 'wonder' &&
        pageStore.dashboardTab === 'workspace')
    )
  })

  let loading = false

  async function refreshConductorAdminData() {
    if (loading || !userStore.isAdmin || !isConductorSurface.value) return

    loading = true
    try {
      await Promise.all([
        conductorStore.fetchProjects(true),
        projectStore.fetchProjects(),
        todoStore.hasLoaded ? todoStore.fetchTodos(true) : Promise.resolve(),
      ])
    } finally {
      loading = false
    }
  }

  watch(
    [
      () => userStore.isAdmin,
      () => route.path,
      () => pageStore.dashboardKey,
      () => pageStore.dashboardTab,
    ],
    () => {
      void refreshConductorAdminData()
    },
    { immediate: true },
  )
})
