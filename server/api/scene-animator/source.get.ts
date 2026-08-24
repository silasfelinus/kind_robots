import { defineEventHandler, getQuery, setHeader } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { readSceneAnimatorSource } from '@/server/utils/sceneAnimator'

function queryString(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const query = getQuery(event)
  const source = await readSceneAnimatorSource(
    queryString(query.folder),
    queryString(query.file),
  )

  setHeader(event, 'Content-Type', source.mime)
  setHeader(event, 'Content-Length', String(source.bytes.length))
  setHeader(event, 'Cache-Control', 'private, max-age=60')
  setHeader(event, 'ETag', `"${source.hash}"`)
  return source.bytes
})
