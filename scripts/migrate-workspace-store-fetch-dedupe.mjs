import { readFileSync, writeFileSync } from 'node:fs'

function migrate(path, replacements) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  let updated = source.replace(/\r\n/g, '\n')

  for (const { target, replacement, label } of replacements) {
    if (!updated.includes(target)) {
      throw new Error(`Expected ${label} was not found in ${path}.`)
    }
    updated = updated.replace(target, replacement)
  }

  writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
}

migrate('stores/sheetStore.ts', [
  {
    label: 'Sheet ensure result type',
    target: `export type SheetUpdatePayload = Partial<
  Omit<PitchSheet, 'id' | 'createdAt' | 'updatedAt'>
>`,
    replacement: `export type SheetUpdatePayload = Partial<
  Omit<PitchSheet, 'id' | 'createdAt' | 'updatedAt'>
>

type EnsureSheetResult = {
  success: boolean
  data?: SheetWithDream
  created?: boolean
  message?: string
}`,
  },
  {
    label: 'Sheet fetch promise state',
    target: `  const error = ref<string | null>(null)
  const override = ref<WorkspaceSheetOverride | null>(null)`,
    replacement: `  const error = ref<string | null>(null)
  const override = ref<WorkspaceSheetOverride | null>(null)
  const fetchSheetsPromise = ref<Promise<SheetWithDream[]> | null>(null)
  const fetchSheetPromises = ref<
    Record<number, Promise<SheetWithDream | null>>
  >({})
  const fetchSheetByDreamPromises = ref<
    Record<number, Promise<SheetWithDream | null>>
  >({})
  const ensureSheetPromises = ref<
    Record<number, Promise<EnsureSheetResult>>
  >({})`,
  },
  {
    label: 'Sheet list fetch dedupe',
    target: `  async function fetchSheets() {
    loading.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream[]>('/api/sheets')

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch sheets')
      }

      sheets.value = res.data

      return res.data
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching sheets')

      return []
    } finally {
      loading.value = false
    }
  }`,
    replacement: `  async function fetchSheets() {
    if (fetchSheetsPromise.value) return fetchSheetsPromise.value

    fetchSheetsPromise.value = (async () => {
      loading.value = true
      error.value = null

      try {
        const res = await performFetch<SheetWithDream[]>('/api/sheets')

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch sheets')
        }

        const existingById = new Map(
          sheets.value.map((sheet) => [sheet.id, sheet]),
        )
        sheets.value = res.data.map((sheet) => {
          const existing = existingById.get(sheet.id)
          return existing ? mergeSheetDetail(existing, sheet) : sheet
        })

        return sheets.value
      } catch (err) {
        error.value = (err as Error).message
        handleError(err, 'fetching sheets')

        return sheets.value
      } finally {
        loading.value = false
        fetchSheetsPromise.value = null
      }
    })()

    return fetchSheetsPromise.value
  }`,
  },
  {
    label: 'Sheet detail fetch dedupe',
    target: `  async function fetchSheet(id: number) {
    loading.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(\`/api/sheets/\${id}\`)

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch sheet')
      }

      return upsertLocal(res.data)
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching sheet')

      return null
    } finally {
      loading.value = false
    }
  }`,
    replacement: `  async function fetchSheet(id: number) {
    if (fetchSheetPromises.value[id]) return fetchSheetPromises.value[id]

    fetchSheetPromises.value[id] = (async () => {
      loading.value = true
      error.value = null

      try {
        const res = await performFetch<SheetWithDream>(\`/api/sheets/\${id}\`)

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch sheet')
        }

        return upsertLocal(res.data)
      } catch (err) {
        error.value = (err as Error).message
        handleError(err, 'fetching sheet')

        return null
      } finally {
        loading.value = false
        delete fetchSheetPromises.value[id]
      }
    })()

    return fetchSheetPromises.value[id]
  }`,
  },
  {
    label: 'Sheet Dream fetch dedupe',
    target: `  async function fetchSheetByDreamId(dreamId: number, force = false) {
    const cached = sheetsByDreamId.value.get(dreamId)

    if (cached && !force) return cached

    loading.value = true
    error.value = null

    try {
      const res = await performFetch<SheetWithDream>(
        \`/api/sheets/by-dream/\${dreamId}\`,
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch sheet by Dream')
      }

      return upsertLocal(res.data)
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching sheet by Dream')

      return null
    } finally {
      loading.value = false
    }
  }`,
    replacement: `  async function fetchSheetByDreamId(dreamId: number, force = false) {
    const cached = sheetsByDreamId.value.get(dreamId)

    if (cached && !force) return cached
    if (fetchSheetByDreamPromises.value[dreamId]) {
      return fetchSheetByDreamPromises.value[dreamId]
    }

    fetchSheetByDreamPromises.value[dreamId] = (async () => {
      loading.value = true
      error.value = null

      try {
        const res = await performFetch<SheetWithDream>(
          \`/api/sheets/by-dream/\${dreamId}\`,
        )

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch sheet by Dream')
        }

        return upsertLocal(res.data)
      } catch (err) {
        error.value = (err as Error).message
        handleError(err, 'fetching sheet by Dream')

        return null
      } finally {
        loading.value = false
        delete fetchSheetByDreamPromises.value[dreamId]
      }
    })()

    return fetchSheetByDreamPromises.value[dreamId]
  }`,
  },
  {
    label: 'Sheet ensure command dedupe',
    target: `  async function ensureSheetForDream(dreamId: number) {
    const cached = sheetsByDreamId.value.get(dreamId)

    if (cached) return { success: true, data: cached, created: false }

    isSaving.value = true
    error.value = null

    try {
      const res = await performFetch<PitchSheet>(
        \`/api/sheets/by-dream/\${dreamId}\`,
        {
          method: 'POST',
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create sheet')
      }

      const summary = upsertLocal(res.data)
      const sheet = (await fetchSheetByDreamId(dreamId, true)) ?? summary

      return {
        success: true,
        data: sheet,
        created: res.status === 201,
      }
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'creating sheet for Dream')

      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }`,
    replacement: `  async function ensureSheetForDream(
    dreamId: number,
  ): Promise<EnsureSheetResult> {
    const cached = sheetsByDreamId.value.get(dreamId)

    if (cached) return { success: true, data: cached, created: false }
    if (ensureSheetPromises.value[dreamId]) {
      return ensureSheetPromises.value[dreamId]
    }

    ensureSheetPromises.value[dreamId] = (async () => {
      isSaving.value = true
      error.value = null

      try {
        const res = await performFetch<PitchSheet>(
          \`/api/sheets/by-dream/\${dreamId}\`,
          {
            method: 'POST',
          },
        )

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to create sheet')
        }

        const summary = upsertLocal(res.data)
        const sheet = (await fetchSheetByDreamId(dreamId, true)) ?? summary

        return {
          success: true,
          data: sheet,
          created: res.status === 201,
        }
      } catch (err) {
        error.value = (err as Error).message
        handleError(err, 'creating sheet for Dream')

        return { success: false, message: (err as Error).message }
      } finally {
        isSaving.value = false
        delete ensureSheetPromises.value[dreamId]
      }
    })()

    return ensureSheetPromises.value[dreamId]
  }`,
  },
])

migrate('stores/todoStore.ts', [
  {
    label: 'Todo request state',
    target: `  const loading = ref(false)
  const hasLoaded = ref(false)
  const lastError = ref<string | null>(null)`,
    replacement: `  const loading = ref(false)
  const hasLoaded = ref(false)
  const lastError = ref<string | null>(null)
  const activeFetches = ref(0)
  const fetchPromises = new Map<string, Promise<void>>()`,
  },
  {
    label: 'Todo request runner',
    target: `  const honeyDoTodos = computed(() =>
    openTodos.value.filter((todo) => todo.category === 'HONEYDO'),
  )

  function dreamKaizens(dreamId: number) {`,
    replacement: `  const honeyDoTodos = computed(() =>
    openTodos.value.filter((todo) => todo.category === 'HONEYDO'),
  )

  function runFetch(key: string, task: () => Promise<void>): Promise<void> {
    const existing = fetchPromises.get(key)
    if (existing) return existing

    activeFetches.value += 1
    loading.value = true

    const request = task().finally(() => {
      fetchPromises.delete(key)
      activeFetches.value = Math.max(0, activeFetches.value - 1)
      loading.value = activeFetches.value > 0
    })

    fetchPromises.set(key, request)
    return request
  }

  function dreamKaizens(dreamId: number) {`,
  },
  {
    label: 'Dream Todo fetch dedupe',
    target: `  async function fetchDreamTodos(dreamId: number): Promise<void> {
    loading.value = true
    lastError.value = null
    try {
      const response = await performFetch<Todo[]>(\`/api/todos/dream/\${dreamId}\`)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch Dream todos')
      }
      const others = todos.value.filter((todo) => todo.dreamId !== dreamId)
      todos.value = [...others, ...response.data]
    } catch (error) {
      handleError(error, 'fetchDreamTodos')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to fetch Dream todos'
    } finally {
      loading.value = false
    }
  }`,
    replacement: `  async function fetchDreamTodos(dreamId: number): Promise<void> {
    return runFetch(\`dream:\${dreamId}\`, async () => {
      lastError.value = null
      try {
        const response = await performFetch<Todo[]>(
          \`/api/todos/dream/\${dreamId}\`,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch Dream todos')
        }
        const others = todos.value.filter((todo) => todo.dreamId !== dreamId)
        todos.value = [...others, ...response.data]
      } catch (error) {
        handleError(error, 'fetchDreamTodos')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to fetch Dream todos'
      }
    })
  }`,
  },
  {
    label: 'Project Todo fetch dedupe',
    target: `  async function fetchProjectTodos(projectId: number): Promise<void> {
    loading.value = true
    lastError.value = null
    try {
      const response = await performFetch<Todo[]>(\`/api/todos/project/\${projectId}\`)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch Project todos')
      }
      const others = todos.value.filter((todo) => todo.projectId !== projectId)
      todos.value = [...others, ...response.data]
    } catch (error) {
      handleError(error, 'fetchProjectTodos')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to fetch Project todos'
    } finally {
      loading.value = false
    }
  }`,
    replacement: `  async function fetchProjectTodos(projectId: number): Promise<void> {
    return runFetch(\`project:\${projectId}\`, async () => {
      lastError.value = null
      try {
        const response = await performFetch<Todo[]>(
          \`/api/todos/project/\${projectId}\`,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch Project todos')
        }
        const others = todos.value.filter((todo) => todo.projectId !== projectId)
        todos.value = [...others, ...response.data]
      } catch (error) {
        handleError(error, 'fetchProjectTodos')
        lastError.value =
          error instanceof Error
            ? error.message
            : 'Failed to fetch Project todos'
      }
    })
  }`,
  },
  {
    label: 'Full Todo fetch dedupe',
    target: `  async function fetchTodos(includeArchived = false): Promise<void> {
    loading.value = true
    lastError.value = null

    try {
      const response = await performFetch<Todo[]>(
        \`/api/todos\${includeArchived ? '?includeArchived=1' : ''}\`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch todos')
      }

      todos.value = response.data
      hasLoaded.value = true
    } catch (error) {
      handleError(error, 'fetchTodos')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to fetch todos'
      console.error('fetchTodos failed:', error)
    } finally {
      loading.value = false
    }
  }`,
    replacement: `  async function fetchTodos(includeArchived = false): Promise<void> {
    return runFetch(\`all:\${includeArchived ? 1 : 0}\`, async () => {
      lastError.value = null

      try {
        const response = await performFetch<Todo[]>(
          \`/api/todos\${includeArchived ? '?includeArchived=1' : ''}\`,
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch todos')
        }

        todos.value = response.data
        hasLoaded.value = true
      } catch (error) {
        handleError(error, 'fetchTodos')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to fetch todos'
      }
    })
  }`,
  },
])
