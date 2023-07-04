import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const id = Number(event.context.params?.id)

    if (!id) {
      throw new Error('Missing ID parameter.')
    }

    // Fetch the bot from the database
    let bot = await prisma.bot.findUnique({ where: { id } })

    if (!bot) {
      throw new Error('Bot not found.')
    }

    // Update only the provided fields
    bot = await prisma.bot.update({
      where: { id },
      data: {
        name: body.name ?? bot.name,
        botType: body.botType ?? bot.botType,
        description: body.description ?? bot.description,
        avatarImage: body.avatarImage ?? bot.avatarImage,
        model: body.model ?? bot.model,
        post: body.post ?? bot.post,
        temperature: body.temperature ?? bot.temperature,
        maxTokens: body.maxTokens ?? bot.maxTokens,
        prompt: body.prompt ?? bot.prompt,
        image: body.image ?? bot.image,
        mask: body.mask ?? bot.mask,
        style: body.style ?? bot.style,
        n: body.n ?? bot.n,
        intro: body.intro ?? bot.intro,
        size: body.size ?? bot.size
      }
    })

    return bot
  } catch (error) {
    let errorMessage = 'An error occurred while updating the bot.'

    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
