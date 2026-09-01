import { defineEventHandler } from 'h3'
import { forumAgentOpenApiSpec } from '@/utils/forumOpenApiCombined'

export default defineEventHandler(() => forumAgentOpenApiSpec)
