// /server/api/chatgpt/index.post.ts
import { createError, defineEventHandler, readBody, type H3Event } from 'h3'
import { ZodError } from 'zod'
import { Prisma } from '~/prisma/generated/prisma/client'
import {
  resolveChatGptActor,
  type ChatGptActor,
} from '~/server/chatgpt/auth/resolveActor'
import {
  ChatGptOperationSchema,
  type ChatGptOperation,
} from '~/server/chatgpt/schemas/operationSchemas'
import {
  createContent,
  getContent,
  listContent,
  setContentActive,
  updateContent,
} from '~/server/chatgpt/services/currentContentService'
import {
  getImage,
  uploadImage,
} from '~/server/chatgpt/services/currentImageService'
import {
  addRelation,
  listRelations,
  removeRelation,
} from '~/server/chatgpt/services/currentRelationService'
import { describeChatGptApi } from '~/server/chatgpt/services/currentMetaService'

type ChatGptApiResponse<TData = unknown> = {
  success: boolean
  operation: ChatGptOperation['operation']
  data?: TData
  message?: string
}

type ChatGptRequestContext<
  TOperation extends ChatGptOperation = ChatGptOperation,
> = {
  event: H3Event
  actor: ChatGptActor
  request: TOperation
}

type OperationHandler<TOperation extends ChatGptOperation = ChatGptOperation> = (
  context: ChatGptRequestContext<TOperation>,
) => Promise<ChatGptApiResponse> | ChatGptApiResponse

const operationHandlers = {
  'content.create': ({ actor, request }) =>
    createContent({
      actor,
      resource: request.resource,
      data: request.data,
    }),

  'content.get': ({ actor, request }) =>
    getContent({
      actor,
      resource: request.resource,
      id: request.id,
    }),

  'content.list': ({ actor, request }) =>
    listContent({
      actor,
      resource: request.resource,
      filter: request.filter,
    }),

  'content.update': ({ actor, request }) =>
    updateContent({
      actor,
      resource: request.resource,
      id: request.id,
      data: request.data,
    }),

  'content.setActive': ({ actor, request }) =>
    setContentActive({
      actor,
      resource: request.resource,
      id: request.id,
      isActive: request.isActive,
    }),

  'image.upload': ({ actor, request }) =>
    uploadImage({
      actor,
      data: request.data,
    }),

  'image.get': ({ actor, request }) =>
    getImage({
      actor,
      id: request.id,
      format: request.format,
      thumbnail: request.thumbnail,
      maxWidth: request.maxWidth,
      maxHeight: request.maxHeight,
      quality: request.quality,
    }),

  'relation.add': ({ actor, request }) =>
    addRelation({
      actor,
      from: request.from,
      to: request.to,
    }),

  'relation.remove': ({ actor, request }) =>
    removeRelation({
      actor,
      from: request.from,
      to: request.to,
    }),

  'relation.list': ({ actor, request }) =>
    listRelations({
      actor,
      from: request.from,
      toResource: request.toResource,
    }),

  'meta.describe': ({ actor }) => describeChatGptApi({ actor }),
} satisfies Partial<{
  [TOperation in ChatGptOperation['operation']]: OperationHandler<
    Extract<ChatGptOperation, { operation: TOperation }>
  >
}>

function getOperationHandler(operation: ChatGptOperation['operation']) {
  const handler = operationHandlers[operation as keyof typeof operationHandlers]

  if (!handler) {
    throw createError({
      statusCode: 400,
      statusMessage: `Operation not supported by the Kind Robots content API: ${operation}`,
    })
  }

  return handler as OperationHandler
}

function normalizeZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }))
}

function normalizePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Request values do not match the current Prisma schema',
      data: {
        success: false,
        message:
          'Prisma rejected one or more field values. Check enum, date, JSON, and relation value types.',
      },
    })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode =
      error.code === 'P2025'
        ? 404
        : error.code === 'P2002' || error.code === 'P2003'
          ? 409
          : 400

    throw createError({
      statusCode,
      statusMessage: 'The database rejected the requested content operation',
      data: {
        success: false,
        code: error.code,
        message:
          error.code === 'P2002'
            ? 'A record already exists with a value that must be unique.'
            : error.code === 'P2003'
              ? 'A referenced record does not exist or cannot be related.'
              : error.code === 'P2025'
                ? 'The requested record was not found.'
                : 'The requested database operation could not be completed.',
      },
    })
  }

  throw error
}

export default defineEventHandler(async (event) => {
  try {
    const actor = await resolveChatGptActor(event)
    const body = await readBody(event)
    const request = ChatGptOperationSchema.parse(body)
    const handler = getOperationHandler(request.operation)

    return await handler({
      event,
      actor,
      request,
    })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Kind Robots content API request',
        data: {
          success: false,
          message:
            'The request body does not match a supported operation shape.',
          issues: normalizeZodError(error),
        },
      })
    }

    return normalizePrismaError(error)
  }
})
