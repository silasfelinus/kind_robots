import { readFileSync, writeFileSync } from 'node:fs'

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

const patchPath = 'server/api/scenarios/[id].patch.ts'
const storePath = 'stores/scenarioStore.ts'

let patch = readFileSync(patchPath, 'utf8')

patch = replaceRequired(
  patch,
  `import type {
  Prisma,
  ScenarioOutputType,
} from '~/prisma/generated/prisma/client'
`,
  `import type {
  Prisma,
  ScenarioOutputType,
} from '~/prisma/generated/prisma/client'
import { scenarioMutationSelect } from './selects'
`,
  'Scenario patch selector import',
)

patch = replaceRequired(
  patch,
  `    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data,
      include: {
        ArtImage: true,
        User: {
          select: {
            id: true,
            username: true,
          },
        },
        Characters: true,
        Dreams: true,
      },
    })
`,
  `    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data,
      select: scenarioMutationSelect,
    })
`,
  'Scenario patch relation include',
)

writeFileSync(patchPath, patch)

let store = readFileSync(storePath, 'utf8')

store = replaceRequired(
  store,
  `      upsertScenario(res.data)
      selectedScenario.value = res.data
      scenarioForm.value = toScenarioForm(res.data)
      syncToLocalStorage()

      return res.data
`,
  `      upsertScenario(res.data)
      const created =
        (await fetchScenarioById(res.data.id, true)) ?? res.data

      selectedScenario.value = created
      scenarioForm.value = toScenarioForm(created)
      syncToLocalStorage()

      return created
`,
  'Scenario create detail hydration',
)

store = replaceRequired(
  store,
  `      upsertScenario(res.data)
      selectedScenario.value = res.data
      scenarioForm.value = toScenarioForm(res.data)
      syncToLocalStorage()

      return res.data
`,
  `      upsertScenario(res.data)
      const updated = (await fetchScenarioById(id, true)) ?? res.data

      selectedScenario.value = updated
      scenarioForm.value = toScenarioForm(updated)
      syncToLocalStorage()

      return updated
`,
  'Scenario update detail hydration',
)

store = replaceRequired(
  store,
  `  async function fetchScenarioById(
    id: number,
  ): Promise<ScenarioWithRelations | null> {
    const existing = scenarios.value.find((scenario) => scenario.id === id)

    if (existing) {
      return existing
    }
`,
  `  async function fetchScenarioById(
    id: number,
    force = false,
  ): Promise<ScenarioWithRelations | null> {
    const existing = scenarios.value.find((scenario) => scenario.id === id)

    if (existing && !force) {
      return existing
    }
`,
  'Scenario detail fetch force option',
)

writeFileSync(storePath, store)
