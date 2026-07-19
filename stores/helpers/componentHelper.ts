// /stores/helpers/componentHelper.ts

import { performFetch, handleError } from '@/stores/utils'
import type { Component } from '~/prisma/generated/prisma/client'

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
  component: Partial<Component>,
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
        componentName: component.componentName,
        folderName: component.folderName,
        status: component.status,
        statusReason: component.statusReason,
        title: component.title,
        description: component.description,
        notes: component.notes || null,
        category: component.category,
        previewMode: component.previewMode,
        artImageId: component.artImageId || null,
        tags: component.tags ?? null,
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
