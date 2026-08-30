import { defineEventHandler } from 'h3'
import { forumAgentOpenApiSpec } from '@/utils/forumOpenApi'

export default defineEventHandler(() => forumAgentOpenApiSpec)
