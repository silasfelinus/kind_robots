// /server/api/stripe/checkout.post.ts
import { defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'
import prisma from '../../utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { cartItems } from '@/stores/seeds/cartItems' // or move to server if needed

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default defineEventHandler(async (event) => {
  try {
    const { userId, cart } = await readBody<{
      userId: number
      cart: Array<{ id: string; quantity: number }>
    }>(event)

    if (!userId || !cart?.length)
      return errorHandler({ message: 'Missing user or cart', statusCode: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user)
      return errorHandler({ message: 'User not found', statusCode: 404 })

    const email = user.email || `user-${user.id}@kindrobots.org`

    const customerId =
      user.stripeCustomerId ?? (await stripe.customers.create({ email })).id

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      })
    }

    // TODO: move cartItems to server location if needed — this is for demo
    const trustedItems = cartItems

    const line_items = cart.map(({ id, quantity }) => {
      const item = trustedItems.find((i) => i.id === id)
      if (!item) throw new Error(`Invalid cart item: ${id}`)

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.label,
            images: [item.image],
            description: item.description,
          },
          unit_amount: Math.round(item.price * 100), // cents
        },
        quantity,
      }
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items,
      success_url: `${process.env.BASE_URL}/shop/success`,
      cancel_url: `${process.env.BASE_URL}/shop/cancel`,
    })

    return {
      success: true,
      url: session.url,
      message: '🧾 Stripe checkout ready',
    }
  } catch (error: any) {
    console.error('🔥 Stripe Checkout Error:', error)
    return errorHandler({
      error,
      message: '😵 Stripe checkout failed',
      statusCode: error?.statusCode || 500,
    })
  }
})
