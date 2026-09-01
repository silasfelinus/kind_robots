import { defineEventHandler } from 'h3'
import { getForumChannels } from '@/server/utils/forumApi'

export default defineEventHandler(() => ({
  success: true,
  data: getForumChannels(),
  statusCode: 200,
}))
