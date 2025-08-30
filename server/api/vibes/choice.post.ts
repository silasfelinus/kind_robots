// /server/api/vibes/choice.post.ts
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { slug, userId } = await readBody<{
    slug: string | null
    userId: number
  }>(event)
  const dataDir = join(process.cwd(), 'data')
  const file = join(dataDir, `vibes-${userId}.json`)

  await fs.mkdir(dataDir, { recursive: true })
  let current: any = {}
  try {
    current = JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {}

  const next = { ...current, academyChoiceSlug: slug }
  await fs.writeFile(file, JSON.stringify(next, null, 2), 'utf8')

  return { success: true, academyChoiceSlug: slug }
})
