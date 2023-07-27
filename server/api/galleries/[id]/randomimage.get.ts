// ~/server/api/galleries/randomimages.get.ts
import { getRandomGalleryImage } from './../'

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
    const image = await getRandomGalleryImage(Number(id))
    if (!image) {
      throw new Error(`No images available for gallery ${id}.`)
    }
    return { success: true, image }
  } catch (error) {
    return { success: false, message: 'No images available' }
  }
}
