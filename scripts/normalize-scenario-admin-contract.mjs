import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const normalized = source.replace(/\r\n/g, '\n')

  if (!normalized.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(
    path,
    normalized.replace(target, replacement).replace(/\n/g, newline),
    'utf8',
  )
}

replaceExact(
  'server/api/scenarios/[id].patch.ts',
  `import { validateApiKey } from '../../utils/validateKey'
import { normalizeSlugInput } from '~/utils/slugify'`,
  `import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import { normalizeSlugInput } from '~/utils/slugify'`,
  'Scenario PATCH admin helper import',
)

replaceExact(
  'server/api/scenarios/[id].patch.ts',
  `    if (existingScenario.userId !== user.id && user.Role !== 'ADMIN') {`,
  `    if (existingScenario.userId !== user.id && !userIsAdmin(user)) {`,
  'Scenario PATCH admin check',
)

replaceExact(
  'server/api/scenarios/batch.patch.ts',
  `import { validateApiKey } from '../../utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'`,
  `import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { scenarioMutationSelect } from './selects'`,
  'Scenario batch admin and projection imports',
)

replaceExact(
  'server/api/scenarios/batch.patch.ts',
  `  user: { id: number; Role: string },`,
  `  user: { id: number; Role?: string | null },`,
  'Scenario batch auth user type',
)

replaceExact(
  'server/api/scenarios/batch.patch.ts',
  `    if (existingScenario.userId !== user.id && user.Role !== 'ADMIN') {`,
  `    if (existingScenario.userId !== user.id && !userIsAdmin(user)) {`,
  'Scenario batch admin check',
)

replaceExact(
  'server/api/scenarios/batch.patch.ts',
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
      },
    })`,
  `    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data,
      select: scenarioMutationSelect,
    })`,
  'Scenario batch lean mutation projection',
)

replaceExact(
  'cypress/e2e/api/scenario.cy.ts',
  `  it('should not allow deleting a scenario without authentication', () => {`,
  `  it('should return lean rows from batch PATCH', () => {
    expect(batchScenarioId).to.exist

    cy.request({
      method: 'PATCH',
      url: \`${'${baseUrl}'}/batch\`,
      headers: bearerHeaders(userToken),
      body: {
        updates: [
          {
            id: batchScenarioId,
            description: 'Updated through the explicit batch mutation route.',
          },
        ],
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array').with.length(1)
      expect(response.body.data[0].success).to.be.true
      expect(response.body.data[0].statusCode).to.eq(200)
      expectLeanMutation(response.body.data[0].data)
    })
  })

  it('should not allow deleting a scenario without authentication', () => {`,
  'Scenario batch PATCH regression test',
)

replaceExact(
  'cypress/e2e/api/scenario.cy.ts',
  `      expect(response.body.message).to.include(
        \`Scenario with ID ${'${scenarioId}'} successfully deleted\`,
      )

      scenarioId = undefined`,
  `      expect(response.body.message).to.include(
        \`Scenario with ID ${'${scenarioId}'} successfully deleted\`,
      )
      expect(response.body.data).to.eq(null)
      expect(response.body.statusCode).to.eq(200)

      scenarioId = undefined`,
  'Scenario DELETE response envelope assertion',
)
