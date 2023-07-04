import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let gallery = null

  if (body.name)
    await prisma.gallery
      .create({
        data: {
          id: body.id,
          name: body.name,
          content: body.content,
          description: body.description,
          highlightImage: body.highlightImage,
          isNSFW: body.isNSFW,
          isAuth: body.isAuth,
          user: body.user
        }
      })
      .then((response) => {
        gallery = response
      })
  return {
    gallery
  }
})
