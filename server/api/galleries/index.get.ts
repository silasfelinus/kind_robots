// server/api/galleries/index.get.ts
import { ErrorHandler } from '../utils/error'
import { getGalleries } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const galleries = await getGalleries()

    return galleries
  }, 'An error occurred while fetching galleries')
)
