// ~/server/api/galleries/images.get.ts
import { getGalleryImages } from './../'

interface Params {
  id: string | undefined
}

interface Req {
  params: Params
}

export default async ({ params: { id } }: Req) => {
  if (!id || isNaN(Number(id))) {
    return { success: false, message: 'Invalid gallery id' }
  }

  try {
    const images = await getGalleryImages(Number(id))
    if (!images || images.length === 0) {
      throw new Error(`No images available for gallery ${id}.`)
    }
    return { success: true, images }
  } catch (error) {
    return { success: false, message: 'No images available' }
  }
}
