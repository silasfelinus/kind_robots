import { readFileSync, writeFileSync } from 'node:fs'

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

const path = 'stores/socialStore.ts'
let source = readFileSync(path, 'utf8')

source = replaceRequired(
  source,
  `// A post with its child targets hydrated (the API includes them).\nexport type SocialPostWithTargets = SocialPost & {\n  targets?: SocialTarget[]\n}`,
  `export type SocialTargetSummary = Pick<\n  SocialTarget,\n  'id' | 'postId' | 'platform' | 'status'\n>\n\nexport type SocialPostWithTargets = SocialPost & {\n  targets?: SocialTargetSummary[]\n}`,
  'Social target summary type',
)

source = replaceRequired(
  source,
  `  // Merge, never overwrite: a remote fetch must not drop locally-created\n  // drafts the server response doesn't include (the old code assigned\n  // items.value = res.data, silently discarding unsynced posts). Existing\n  // rows come first so a just-created post stays at the top of the list.\n  function mergeItems(incoming: SocialPostWithTargets[]) {\n    const map = new Map<number, SocialPostWithTargets>()\n    for (const item of items.value) map.set(item.id, item)\n    for (const item of incoming) {\n      if (item && item.id) map.set(item.id, item)\n    }\n    items.value = Array.from(map.values())\n    syncToLocalStorage()\n  }\n\n  function upsertItem(item: SocialPostWithTargets) {\n    mergeItems([item])\n  }`,
  `  function mergeTargets(\n    existing: SocialTargetSummary[] = [],\n    incoming: SocialTargetSummary[] = [],\n  ): SocialTargetSummary[] {\n    const current = new Map(existing.map((target) => [target.id, target]))\n\n    return incoming.map((target) => ({\n      ...current.get(target.id),\n      ...target,\n    }))\n  }\n\n  function mergePost(\n    existing: SocialPostWithTargets,\n    incoming: SocialPostWithTargets,\n  ): SocialPostWithTargets {\n    return {\n      ...existing,\n      ...incoming,\n      targets:\n        incoming.targets !== undefined\n          ? mergeTargets(existing.targets, incoming.targets)\n          : existing.targets,\n    }\n  }\n\n  // Merge, never overwrite: a remote fetch must not drop locally-created\n  // drafts the server response doesn't include. Existing rows keep their\n  // position, while bounded mutation targets merge into any richer GET data.\n  function mergeItems(incoming: SocialPostWithTargets[]) {\n    const map = new Map<number, SocialPostWithTargets>()\n    for (const item of items.value) map.set(item.id, item)\n    for (const item of incoming) {\n      if (!item?.id) continue\n      const existing = map.get(item.id)\n      map.set(item.id, existing ? mergePost(existing, item) : item)\n    }\n    items.value = Array.from(map.values())\n    syncToLocalStorage()\n  }\n\n  function upsertItem(item: SocialPostWithTargets) {\n    const index = items.value.findIndex((entry) => entry.id === item.id)\n    const existing = index >= 0 ? items.value[index] : null\n    const next = existing ? mergePost(existing, item) : item\n\n    if (index >= 0) items.value[index] = next\n    else items.value.unshift(next)\n\n    if (selected.value?.id === item.id) selected.value = next\n    syncToLocalStorage()\n\n    return next\n  }`,
  'Social aggregate merge helpers',
)

source = replaceRequired(
  source,
  `      if (res.success && res.data) return res.data\n`,
  `      if (res.success && res.data) return upsertItem(res.data)\n`,
  'Social detail upsert',
)

source = replaceRequired(
  source,
  `      items.value.unshift(res.data)\n      syncToLocalStorage()\n\n      return { success: true, data: res.data }`,
  `      const created = upsertItem(res.data)\n\n      return { success: true, data: created }`,
  'Social create upsert',
)

source = replaceRequired(
  source,
  `      const idx = items.value.findIndex((i) => i.id === id)\n      if (idx !== -1) items.value[idx] = res.data\n      if (selected.value?.id === id) selected.value = res.data\n\n      syncToLocalStorage()\n\n      return { success: true, data: res.data }`,
  `      const updated = upsertItem(res.data)\n\n      return { success: true, data: updated }`,
  'Social update upsert',
)

source = replaceRequired(
  source,
  `      if (refreshed) {\n        const idx = items.value.findIndex((i) => i.id === id)\n        if (idx !== -1) items.value[idx] = refreshed\n        if (selected.value?.id === id) selected.value = refreshed\n      }\n      syncToLocalStorage()`,
  `      if (refreshed) upsertItem(refreshed)`,
  'Social publish refresh upsert',
)

source = replaceRequired(
  source,
  `      const idx = items.value.findIndex((i) => i.id === postId)\n      if (idx !== -1) items.value[idx] = res.data\n      if (selected.value?.id === postId) selected.value = res.data\n\n      syncToLocalStorage()\n\n      return { success: true }`,
  `      upsertItem(res.data)\n\n      return { success: true }`,
  'Social target update upsert',
)

writeFileSync(path, source)
