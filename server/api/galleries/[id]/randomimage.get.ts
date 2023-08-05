// ~/server/api/galleries/randomimages.get.ts
import { getRandomGalleryImage, getAllGalleryImages } from './../'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  try {
    let image
    if (id) {
      // If there is an ID, get a random image from that gallery
      image = await getRandomGalleryImage(id)
    } else {
      // If there is no ID, get a random image from all galleries
      const allImages = await getAllGalleryImages()
      const randomIndex = Math.floor(Math.random() * allImages.length)
      image = allImages[randomIndex]
    }

    return image
  } catch (error) {
    return console.error(`Failed to get random image: ${error}`)
  }
})
