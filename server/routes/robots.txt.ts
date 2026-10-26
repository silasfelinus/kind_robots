import { defineEventHandler, setResponseHeader } from 'h3'
import { buildRobotsTxt } from '~/utils/sharePreview'

const robotsTxt = buildRobotsTxt()

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return robotsTxt
})
