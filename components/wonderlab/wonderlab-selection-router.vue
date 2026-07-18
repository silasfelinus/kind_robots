<!-- /components/wonderlab/wonderlab-selection-router.vue -->
<template>
  <span class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component as PrismaComponent } from '~/prisma/generated/prisma/client'
import { useComponentStore } from '@/stores/componentStore'
import {
  findWonderLabComponentForQuery,
  normalizeWonderLabComponentQuery,
  wonderLabComponentQueryValue,
} from '@/utils/wonderlab/componentSelection'

const route = useRoute()
const router = useRouter()
const componentStore = useComponentStore()

const components = computed<PrismaComponent[]>(() => {
  const fromAll = componentStore.allComponents || []
  const fromMain = componentStore.components || []
  return fromAll.length ? fromAll : fromMain
})

const routeComponentQuery = computed(() => route.query.component)

function queryWithComponent(value: string | null) {
  const query = { ...route.query }

  if (value) {
    query.component = value
  } else {
    delete query.component
  }

  return query
}

async function replaceComponentQuery(value: string | null): Promise<void> {
  await router.replace({
    path: route.path,
    query: queryWithComponent(value),
    hash: route.hash,
  })
}

async function pushComponentQuery(value: string | null): Promise<void> {
  await router.push({
    path: route.path,
    query: queryWithComponent(value),
    hash: route.hash,
  })
}

watch(
  [routeComponentQuery, components],
  () => {
    const query = normalizeWonderLabComponentQuery(routeComponentQuery.value)

    if (!query) {
      if (componentStore.selectedComponent) {
        componentStore.selectedComponent = null
      }
      return
    }

    const resolved = findWonderLabComponentForQuery(components.value, query)

    if (!resolved) {
      if (components.value.length) {
        componentStore.selectedComponent = null
        void replaceComponentQuery(null)
      }
      return
    }

    if (componentStore.selectedComponent?.id !== resolved.id) {
      componentStore.selectedComponent = resolved
    }

    const canonicalQuery = wonderLabComponentQueryValue(resolved)
    if (query !== canonicalQuery) {
      void replaceComponentQuery(canonicalQuery)
    }
  },
  { immediate: true, flush: 'post' },
)

watch(
  () => componentStore.selectedComponent?.id ?? null,
  (selectedId) => {
    const routeSelection = findWonderLabComponentForQuery(
      components.value,
      routeComponentQuery.value,
    )
    const routeSelectedId = routeSelection?.id ?? null

    if (routeSelectedId === selectedId) return

    const selected = selectedId
      ? components.value.find((component) => component.id === selectedId) ?? null
      : null

    void pushComponentQuery(
      selected ? wonderLabComponentQueryValue(selected) : null,
    )
  },
)
</script>
