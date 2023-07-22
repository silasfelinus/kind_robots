// /server/api/galleries/count.get.ts
import { ErrorHandler } from '../utils/error'
import { countGalleries } from '../utils/gallery'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const count = await countGalleries()

    return { count }
  }, 'An error occurred while fetching Gallery count')
)
