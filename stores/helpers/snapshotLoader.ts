// /stores/helpers/snapshotLoader.ts
// Loads the nightly public-content snapshots in stores/fallback/*.json
// (written by utils/scripts/snapshotFallback.ts via the fallback-snapshot
// Action) so stores can render real content while the database is down —
// the conductorStore fallback pattern, generalized.
//
// import.meta.glob keeps the build green before the first snapshot exists
// and code-splits each file so a store only downloads its own model.
import { ref } from 'vue'

export type SnapshotFile<T> = {
  model: string
  rowCount: number
  cap: number
  rows: T[]
}

const modules = import.meta.glob('../fallback/*.json', {
  import: 'default',
}) as Record<string, () => Promise<SnapshotFile<unknown>>>

// Models currently rendering snapshot rows instead of live data. UI (e.g.
// the conductor page) can watch this to surface a "degraded mode" notice.
export const snapshotActiveModels = ref<string[]>([])

export function markSnapshotActive(model: string, active: boolean): void {
  const list = snapshotActiveModels.value
  const has = list.includes(model)

  if (active && !has) {
    snapshotActiveModels.value = [...list, model]
  } else if (!active && has) {
    snapshotActiveModels.value = list.filter((m) => m !== model)
  }
}

// Returns [] when the snapshot doesn't exist yet, fails to parse, or when
// called during SSR (module-level degraded state must stay per-client).
export async function loadSnapshot<T>(model: string): Promise<T[]> {
  if (import.meta.server) return []

  const loader = modules[`../fallback/${model}.json`]
  if (!loader) return []

  try {
    const snapshot = (await loader()) as SnapshotFile<T>
    return Array.isArray(snapshot?.rows) ? snapshot.rows : []
  } catch {
    return []
  }
}
