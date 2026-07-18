import { readFileSync, writeFileSync } from 'node:fs'

function read(path) {
  return readFileSync(path, 'utf8')
}

function write(path, content) {
  writeFileSync(path, content)
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

let serverApi = read('server/utils/serverApi.ts')
serverApi = replaceRequired(
  serverApi,
  `import type {
  Server,
  ServerAccessMode,
  ServerAuthType,
  ServerStatus,
  ServerType,
} from '~/prisma/generated/prisma/client'`,
  `import {
  ServerAccessMode,
  ServerAuthType,
  ServerStatus,
  ServerType,
  type Server,
} from '~/prisma/generated/prisma/client'`,
  'Server enum imports',
)
serverApi = replaceRequired(
  serverApi,
  `const serverTypes: ServerType[] = [
  'A1111',
  'COMFY',
  'OPENAI',
  'ANTHROPIC',
  'CUSTOM',
]

const accessModes: ServerAccessMode[] = [
  'BROWSER',
  'BACKEND',
  'TAILSCALE',
  'PUBLIC',
  'LOCAL',
]

const authTypes: ServerAuthType[] = [
  'NONE',
  'BEARER',
  'HEADER',
  'QUERY',
  'API_KEY',
]

const serverStatuses: ServerStatus[] = [
  'ONLINE',
  'OFFLINE',
  'DEGRADED',
  'UNKNOWN',
]`,
  `const serverTypes = Object.values(ServerType)
const accessModes = Object.values(ServerAccessMode)
const authTypes = Object.values(ServerAuthType)
const serverStatuses = Object.values(ServerStatus)`,
  'Server enum value arrays',
)
serverApi = replaceRequired(
  serverApi,
  `function cleanEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof value !== 'string') return undefined
  return allowed.includes(value as T) ? (value as T) : undefined
}
`,
  `function cleanEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof value !== 'string') return undefined
  return allowed.includes(value as T) ? (value as T) : undefined
}

function validateEnumField(
  input: ServerInput,
  field: string,
  allowedValues: readonly string[],
): void {
  const value = input[field]

  if (value === undefined || value === null) return

  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw createError({
      statusCode: 400,
      message: \`Invalid \${field}. Expected one of: \${allowedValues.join(', ')}.\`,
    })
  }
}

export function validateServerEnums(input: ServerInput): void {
  validateEnumField(input, 'serverType', serverTypes)
  validateEnumField(input, 'accessMode', accessModes)
  validateEnumField(input, 'authType', authTypes)
  validateEnumField(input, 'lastStatus', serverStatuses)
}
`,
  'shared Server enum validation',
)
write('server/utils/serverApi.ts', serverApi)

write(
  'server/api/server/index.post.ts',
  `// /server/api/server/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthUser(event)
    const body = await readBody(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/server creates one Server. Use /api/server/batch for arrays.',
      })
    }

    const safeBody =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

    validateServerEnums(safeBody)

    const data = buildServerCreateData(safeBody, user)
    const server = await prisma.server.create({ data })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Server created successfully.',
      data: safeServer(server, user),
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to create server.',
      data: null,
      statusCode,
    }
  }
})
`,
)

write(
  'server/api/server/[id].patch.ts',
  `// /server/api/server/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerUpdateData,
  canMutateServer,
  parseId,
  readServerById,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await requireAuthUser(event)
    const server = await readServerById(id)

    if (!canMutateServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this server.',
      })
    }

    if (!server.isEditable && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'This server is not editable.',
      })
    }

    const body = await readBody(event)
    const safeBody =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {}

    validateServerEnums(safeBody)

    const data = buildServerUpdateData(safeBody, user)
    const updatedServer = await prisma.server.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Server updated successfully.',
      data: safeServer(updatedServer, user),
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to update server.',
      data: null,
      statusCode,
    }
  }
})
`,
)

write(
  'server/api/server/batch.post.ts',
  `// /server/api/server/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerCreateData,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'
import type { Server } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthUser(event)
    const body = await readBody(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Server batch body must be a non-empty array.',
      })
    }

    const created: ReturnType<typeof safeServer>[] = []
    const skipped: string[] = []

    for (const item of body) {
      try {
        const safeBody =
          item && typeof item === 'object'
            ? (item as Record<string, unknown>)
            : {}

        validateServerEnums(safeBody)

        const data = buildServerCreateData(safeBody, user)
        const server: Server = await prisma.server.create({ data })
        created.push(safeServer(server, user))
      } catch (error) {
        const handled = errorHandler(error)

        if (Number(handled.statusCode) >= 500) throw error

        skipped.push(handled.message || 'Skipped invalid server.')
      }
    }

    const statusCode = created.length
      ? skipped.length
        ? 207
        : 201
      : 400

    event.node.res.statusCode = statusCode

    return {
      success: created.length > 0,
      message: created.length
        ? \`\${created.length} servers created, \${skipped.length} skipped.\`
        : 'No servers were created.',
      data: created,
      skipped,
      statusCode,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to batch-create servers.',
      data: null,
      skipped: [],
      statusCode,
    }
  }
})
`,
)

let serverStore = read('stores/serverStore.ts')
const addServersStart = serverStore.indexOf('  async function addServers(')
const updateServerStart = serverStore.indexOf('  async function updateServer(', addServersStart)
if (addServersStart < 0 || updateServerStart < 0) {
  throw new Error('Could not locate serverStore.addServers')
}
const addServersSection = serverStore.slice(addServersStart, updateServerStart)
const updatedAddServersSection = replaceRequired(
  addServersSection,
  "performFetch('/api/server', {",
  "performFetch('/api/server/batch', {",
  'serverStore.addServers endpoint',
)
serverStore =
  serverStore.slice(0, addServersStart) +
  updatedAddServersSection +
  serverStore.slice(updateServerStart)
write('stores/serverStore.ts', serverStore)

let addServer = read('components/servers/add-server.vue')
addServer = replaceRequired(
  addServer,
  `            <option value="ANTHROPIC">ANTHROPIC</option>
            <option value="CUSTOM">CUSTOM</option>`,
  `            <option value="ANTHROPIC">ANTHROPIC</option>
            <option value="OLLAMA">OLLAMA</option>
            <option value="CUSTOM">CUSTOM</option>`,
  'OLLAMA server type option',
)
addServer = replaceRequired(
  addServer,
  `  if (serverType === 'ANTHROPIC') {`,
  `  if (serverType === 'OLLAMA') {
    form.value.baseUrl ||= 'http://127.0.0.1:11434'
    form.value.endpointPath ||= '/api/chat'
    form.value.healthPath ||= '/api/tags'
    form.value.accessMode ||= 'LOCAL'
    form.value.authType ||= 'NONE'
    form.value.category ||= 'text'
    return
  }

  if (serverType === 'ANTHROPIC') {`,
  'OLLAMA server defaults',
)
write('components/servers/add-server.vue', addServer)

let existingTests = read('cypress/e2e/api/servers.cy.ts')
existingTests = replaceRequired(
  existingTests,
  `type ServerType = 'A1111' | 'COMFY' | 'OPENAI' | 'ANTHROPIC' | 'CUSTOM'`,
  `type ServerType =
  | 'A1111'
  | 'COMFY'
  | 'OPENAI'
  | 'ANTHROPIC'
  | 'OLLAMA'
  | 'CUSTOM'`,
  'Server Cypress union',
)
write('cypress/e2e/api/servers.cy.ts', existingTests)

write(
  'cypress/e2e/api/server-create-boundaries.cy.ts',
  `/// <reference types="cypress" />

import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

type ServerRow = {
  id: number
  title: string
  serverType: string
  apiKey: string | null
  hasApiKey: boolean
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  skipped?: string[]
  statusCode?: number
}

describe('Server create boundaries', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  const createdIds: number[] = []
  const stamp = Date.now()

  const baseUrl = () => \`\${apiBase}/server\`
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
    for (const id of createdIds) {
      cy.request({
        method: 'DELETE',
        url: \`\${baseUrl()}/\${id}\`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('rejects arrays on single-resource Server POST', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl(),
      headers: headers(),
      body: [
        {
          title: \`Wrong Route \${stamp}\`,
          serverType: 'OLLAMA',
          baseUrl: 'http://127.0.0.1:11434',
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('/api/server/batch')
    })
  })

  it('creates and updates an OLLAMA server with a masked API key', () => {
    cy.request<ApiResponse<ServerRow>>({
      method: 'POST',
      url: baseUrl(),
      headers: headers(),
      body: {
        title: \`Ollama Boundary \${stamp}\`,
        serverType: 'OLLAMA',
        accessMode: 'LOCAL',
        authType: 'BEARER',
        baseUrl: 'http://127.0.0.1:11434',
        endpointPath: '/api/chat',
        healthPath: '/api/tags',
        apiKey: 'cypress-secret',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.serverType).to.eq('OLLAMA')
      expect(response.body.data?.apiKey).to.eq('••••••••')
      expect(response.body.data?.hasApiKey).to.eq(true)

      createdIds.push(response.body.data!.id)

      return cy.request<ApiResponse<ServerRow>>({
        method: 'PATCH',
        url: \`\${baseUrl()}/\${response.body.data!.id}\`,
        headers: headers(),
        body: {
          serverType: 'OLLAMA',
          model: 'llama3.2',
        },
      })
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.serverType).to.eq('OLLAMA')
      expect(response.body.data?.apiKey).to.eq('••••••••')
      expect(response.body.data?.hasApiKey).to.eq(true)
    })
  })

  it('batch-creates valid servers and reports invalid enum rows', () => {
    cy.request<ApiResponse<ServerRow[]>>({
      method: 'POST',
      url: \`\${baseUrl()}/batch\`,
      headers: headers(),
      body: [
        {
          title: \`Batch Ollama \${stamp}\`,
          serverType: 'OLLAMA',
          accessMode: 'LOCAL',
          authType: 'NONE',
          baseUrl: 'http://127.0.0.1:11435',
        },
        {
          title: \`Invalid Server \${stamp}\`,
          serverType: 'BANANA',
          baseUrl: 'https://example.com',
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(207)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.have.length(1)
      expect(response.body.data?.[0].serverType).to.eq('OLLAMA')
      expect(response.body.skipped).to.have.length(1)
      expect(response.body.skipped?.[0]).to.include('Invalid serverType')

      createdIds.push(response.body.data![0].id)
    })
  })
})
`,
)

let audit = read('docs/architecture/thin-resource-api-audit.md')
audit = replaceRequired(
  audit,
  `| Project                   | POST/PATCH returned manager, art, collection, pitch sheet, and six counts; direct fallback fabricated empty relation objects                     | Added \`projectMutationSelect\`; Prisma and direct-write paths return the same Project scalar shape. \`projectStore\` merges lean rows into loaded detail and clears stale relation objects when foreign keys change                                            |
| PitchSheet`,
  `| Project                   | POST/PATCH returned manager, art, collection, pitch sheet, and six counts; direct fallback fabricated empty relation objects                     | Added \`projectMutationSelect\`; Prisma and direct-write paths return the same Project scalar shape. \`projectStore\` merges lean rows into loaded detail and clears stale relation objects when foreign keys change                                            |
| Server                    | POST/PATCH duplicated stale handwritten enum lists that rejected OLLAMA; collection POST also accepted arrays                                   | Validation now derives from Prisma enum values, OLLAMA is available in the form, single POST rejects arrays, and \`/api/server/batch\` owns partial-success creation while preserving masked-key responses                                                        |
| PitchSheet`,
  'Server audit row',
)
write('docs/architecture/thin-resource-api-audit.md', audit)

console.log('Prepared Server enum and create-boundary cleanup.')
