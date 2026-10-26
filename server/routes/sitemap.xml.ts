import { defineEventHandler, setResponseHeader } from 'h3'
import { buildSitemapXml } from '~/utils/sharePreview'

const sitemapXml = buildSitemapXml()

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return sitemapXml
})
