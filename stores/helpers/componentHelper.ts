// /stores/helpers/componentHelper.ts

import { performFetch, handleError } from '@/stores/utils'
import { useErrorStore } from '@/stores/errorStore'
import type { Component } from '~/server/generated/prisma'

export interface Folder {
  folderName: string
  components: string[]
}

export function normalize(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export async function fetchComponentById(
  id: number,
): Promise<Component | undefined> {
  try {
    const response = await performFetch<Component>(`/api/components/${id}`)
    if (response.success && response.data) {
      return response.data
    } else {
      throw new Error(`Failed to fetch component with ID: ${id}`)
    }
  } catch (error) {
    handleError(error, `Error fetching component with ID ${id}`)
  }
}

export async function createComponent(
  component: Component,
): Promise<Component> {
  const response = await performFetch<Component>('/api/components', {
    method: 'POST',
    body: JSON.stringify(component),
  })
  if (!response.success || !response.data) {
    throw new Error(`Failed to create component: ${component.componentName}`)
  }
  return response.data
}

export async function updateComponent(
  component: Component,
): Promise<Component> {
  const response = await performFetch<Component>(
    `/api/components/${component.id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        ...component,
        notes: component.notes || '',
        artImageId: component.artImageId || null,
      }),
    },
  )
  if (!response.success || !response.data) {
    throw new Error(`Failed to update component: ${component.componentName}`)
  }
  return response.data
}

export async function deleteComponent(id: number): Promise<boolean> {
  const response = await performFetch(`/api/components/${id}`, {
    method: 'DELETE',
  })
  if (!response.success) {
    throw new Error(
      response.message || `Failed to delete component with ID: ${id}`,
    )
  }
  return true
}

export function findComponentByName(
  components: Component[],
  name: string,
): Component {
  const match = components.find((c) => c.componentName === name)
  if (!match) throw new Error(`Component with name "${name}" not found.`)
  return match
}

export async function createOrUpdateComponent(
  component: Component,
  action: 'create' | 'update',
): Promise<Component> {
  const method = action === 'create' ? 'POST' : 'PATCH'
  const response = await performFetch<Component>('/api/components', {
    method,
    body: JSON.stringify(component),
  })

  if (!response.success || !response.data) {
    throw new Error(`Failed to ${action} component: ${component.componentName}`)
  }
  return response.data
}
