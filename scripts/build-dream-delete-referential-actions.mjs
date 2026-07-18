import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

function read(path) {
  return readFileSync(path, 'utf8')
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

let schema = read('prisma/schema.prisma')
schema = replaceRequired(
  schema,
  '  Dream           Dream?       @relation(fields: [dreamId], references: [id])\n',
  '  Dream           Dream?       @relation(fields: [dreamId], references: [id], onDelete: SetNull)\n',
  'Chat.Dream onDelete',
)
schema = replaceRequired(
  schema,
  '  Dream                 Dream?                    @relation(fields: [dreamId], references: [id])\n',
  '  Dream                 Dream?                    @relation(fields: [dreamId], references: [id], onDelete: Cascade)\n',
  'Reaction.Dream onDelete',
)
schema = replaceRequired(
  schema,
  '  Dream       Dream?       @relation(fields: [dreamId], references: [id])\n',
  '  Dream       Dream?       @relation(fields: [dreamId], references: [id], onDelete: SetNull)\n',
  'Todo.Dream onDelete',
)
schema = replaceRequired(
  schema,
  '  Dream           Dream?                  @relation(fields: [dreamId], references: [id])\n',
  '  Dream           Dream?                  @relation(fields: [dreamId], references: [id], onDelete: SetNull)\n',
  'LifeRun.Dream onDelete',
)
write('prisma/schema.prisma', schema)

write(
  'server/api/dreams/[id].delete.ts',
  `// /server/api/dreams/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { assertDreamAccess, getDreamId } from './index'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const auth = await requireApiUser(event)
    const user = auth.user
    const dream = await prisma.dream.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        dreamType: true,
        userId: true,
        isPublic: true,
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: \`Dream with ID \${id} not found.\`,
      })
    }

    assertDreamAccess({
      dream,
      userId: user.id,
      userRole: user.Role,
      action: 'mutate',
    })

    const actor = user.username || \`User \${user.id}\`
    const data = await prisma.dream.delete({ where: { id } })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: \`Dream "\${dream.title}" deleted by \${actor}.\`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || \`Failed to delete Dream with ID \${id}.\`,
      data: null,
      statusCode,
    }
  }
})
`,
)

const migrationPath =
  'prisma/migrations/20260718210000_dream_delete_referential_actions/migration.sql'
if (existsSync(migrationPath)) {
  throw new Error(`Migration already exists: ${migrationPath}`)
}
write(
  migrationPath,
  `-- Dream-owned reactions should disappear with the Dream.
-- Chat, Todo, LifeRun, Composition, and other optional references already use
-- ON DELETE SET NULL in the live baseline and remain preserved.
ALTER TABLE \`Reaction\` DROP FOREIGN KEY \`Reaction_dreamId_fkey\`;
ALTER TABLE \`Reaction\`
  ADD CONSTRAINT \`Reaction_dreamId_fkey\`
  FOREIGN KEY (\`dreamId\`) REFERENCES \`Dream\`(\`id\`)
  ON DELETE CASCADE ON UPDATE CASCADE;
`,
)

write(
  'cypress/e2e/api/dream-delete-referential-actions.cy.ts',
  `/// <reference types="cypress" />

import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  statusCode?: number
  count?: number
}

type DreamRow = {
  id: number
  title: string
}

type ChatRow = {
  id: number
  dreamId: number | null
}

type TodoRow = {
  id: number
  dreamId: number | null
}

type PitchSheetRow = {
  id: number
  dreamId: number | null
}

describe('Dream delete referential actions', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  let dreamId = 0
  let deletedDreamId = 0
  let chatId = 0
  let todoId = 0
  let pitchSheetId = 0

  const stamp = Date.now()
  const headers = () => bearerHeaders(user!.token)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        user = auth
      })
  })

  after(() => {
    if (dreamId && user) {
      cy.request({
        method: 'DELETE',
        url: \`\${apiBase}/dreams/\${dreamId}\`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    if (chatId && user) {
      cy.request({
        method: 'DELETE',
        url: \`\${apiBase}/chats/\${chatId}\`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    if (todoId && user) {
      cy.request({
        method: 'DELETE',
        url: \`\${apiBase}/todos/\${todoId}\`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('creates a Dream with preserved references and owned children', () => {
    cy.request<ApiResponse<DreamRow>>({
      method: 'POST',
      url: \`\${apiBase}/dreams\`,
      headers: headers(),
      body: {
        title: \`Dream Delete Contract \${stamp}\`,
        slug: \`dream-delete-contract-\${stamp}\`,
        description: 'Temporary Dream for referential-action testing.',
        dreamType: 'PITCH',
        isPublic: false,
      },
    }).then((dreamResponse) => {
      expect(dreamResponse.status, JSON.stringify(dreamResponse.body)).to.eq(201)
      dreamId = dreamResponse.body.data!.id

      return cy
        .request<ApiResponse<ChatRow>>({
          method: 'POST',
          url: \`\${apiBase}/chats\`,
          headers: headers(),
          body: {
            type: 'Dream',
            sender: user!.username,
            content: 'This Chat should survive Dream deletion.',
            dreamId,
            isPublic: false,
          },
        })
        .then((chatResponse) => {
          expect(chatResponse.status).to.eq(201)
          chatId = chatResponse.body.data!.id
        })
    })

    cy.then(() =>
      cy
        .request<ApiResponse<TodoRow>>({
          method: 'POST',
          url: \`\${apiBase}/todos\`,
          headers: headers(),
          body: {
            title: \`Detached Todo \${stamp}\`,
            description: 'This Todo should survive with dreamId cleared.',
            dreamId,
          },
        })
        .then((todoResponse) => {
          expect(todoResponse.status).to.eq(201)
          todoId = todoResponse.body.data!.id
        }),
    )

    cy.then(() =>
      cy.request({
        method: 'POST',
        url: \`\${apiBase}/reactions\`,
        headers: headers(),
        body: {
          reactionType: 'LOVED',
          reactionCategory: 'DREAM',
          dreamId,
          rating: 5,
          comment: 'This owned reaction should cascade.',
        },
      }),
    ).then((reactionResponse) => {
      expect(reactionResponse.status).to.eq(201)
      expect(reactionResponse.body.data.dreamId).to.eq(dreamId)
    })

    cy.then(() =>
      cy
        .request<ApiResponse<PitchSheetRow>>({
          method: 'POST',
          url: \`\${apiBase}/sheets/by-dream/\${dreamId}\`,
          headers: headers(),
          body: {},
        })
        .then((sheetResponse) => {
          expect([200, 201]).to.include(sheetResponse.status)
          pitchSheetId = sheetResponse.body.data!.id
        }),
    )
  })

  it('deletes the Dream through one database delete', () => {
    cy.request<ApiResponse<DreamRow>>({
      method: 'DELETE',
      url: \`\${apiBase}/dreams/\${dreamId}\`,
      headers: headers(),
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(dreamId)
      deletedDreamId = dreamId
      dreamId = 0
    })
  })

  it('preserves Chat and Todo rows with dreamId cleared', () => {
    cy.request<ApiResponse<ChatRow>>({
      method: 'GET',
      url: \`\${apiBase}/chats/\${chatId}\`,
      headers: headers(),
    }).then((chatResponse) => {
      expect(chatResponse.status).to.eq(200)
      expect(chatResponse.body.data?.dreamId).to.eq(null)
    })

    cy.request<ApiResponse<TodoRow[]>>({
      method: 'GET',
      url: \`\${apiBase}/todos?includeArchived=true\`,
      headers: headers(),
    }).then((todoResponse) => {
      expect(todoResponse.status).to.eq(200)
      const todo = todoResponse.body.data?.find((entry) => entry.id === todoId)
      expect(todo).to.exist
      expect(todo?.dreamId).to.eq(null)
    })
  })

  it('cascades Dream-owned reactions and PitchSheet', () => {
    cy.request({
      method: 'GET',
      url: \`\${apiBase}/reactions/dream/\${deletedDreamId}\`,
      headers: headers(),
    }).then((reactionResponse) => {
      expect(reactionResponse.status).to.eq(200)
      expect(reactionResponse.body.count).to.eq(0)
      expect(reactionResponse.body.data.reactions).to.deep.eq([])
    })

    cy.request({
      method: 'GET',
      url: \`\${apiBase}/sheets/\${pitchSheetId}\`,
      headers: headers(),
      failOnStatusCode: false,
    }).then((sheetResponse) => {
      expect(sheetResponse.status).to.eq(404)
      expect(sheetResponse.body.success).to.eq(false)
    })

    cy.request({
      method: 'GET',
      url: \`\${apiBase}/dreams/\${deletedDreamId}\`,
      headers: headers(),
      failOnStatusCode: false,
    }).then((dreamResponse) => {
      expect(dreamResponse.status).to.eq(404)
      expect(dreamResponse.body.success).to.eq(false)
    })
  })
})
`,
)

let audit = read('docs/architecture/thin-resource-api-audit.md')
audit = replaceRequired(
  audit,
  '| Dream delete       | Manually detaches Chats, Reactions, and many-to-many links before deletion                                    | Kept temporarily for referential integrity; replace with explicit database delete behavior in a migration before simplifying the route |',
  '| Dream delete       | Manually detached Chats, deleted Reactions, and cleared many-to-many links before deletion                     | Declared preserve-vs-cascade behavior in Prisma, migrated Dream reactions to cascade, and reduced the route to one Dream delete          |',
  'Dream delete audit row',
)
audit = replaceRequired(
  audit,
  '5. Database referential-action migration for deletes that currently require manual cross-resource cleanup.',
  '5. ✅ Dream delete referential actions and route simplification; continue the same audit for other resources only where manual cleanup remains.',
  'referential-action execution item',
)
write('docs/architecture/thin-resource-api-audit.md', audit)

console.log('Prepared explicit Dream delete referential actions and regression coverage.')
