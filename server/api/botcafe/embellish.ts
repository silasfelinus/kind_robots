// /server/api/botcafe/embellish.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { manaGate } from '../../utils/manaGate'

const creativeEmbellishments = [
  {
    title: 'Invisible Vending Machines',
    pitch: 'You’ll never know what snack you’ll get if you can find it.',
    flavorText: 'A snack run turned treasure hunt!',
    description:
      'These vending machines are designed to test your patience and snack-detection skills. Perfect for the adventurous consumer who enjoys a mystery snack as much as a challenge.',
    artPrompt:
      'invisible vending machine, confused customer, floating snacks, urban background',
  },
  {
    title: 'Quantum Pizza Delivery',
    pitch: 'It’s there before you order it... sometimes.',
    flavorText: 'Pizza delivery with a dash of uncertainty.',
    description:
      'Harnessing the power of quantum mechanics, this pizza might already be at your door or lost in another dimension. It’s fast when it exists.',
    artPrompt:
      'pizza box appearing from a portal, confused delivery driver, futuristic cityscape',
  },
  {
    title: 'Teleportation Spa',
    pitch:
      'Relax and refresh without the travel time. Just watch where you teleport!',
    flavorText: 'A quick escape to paradise unless you end up at work.',
    description:
      'Why fly to your spa when you can teleport? A luxurious experience, unless you accidentally end up in a board meeting. Teleportation: for the bold and the stressed.',
    artPrompt:
      'floating spa pods, teleportation portals, serene background, spa vibes',
  },
  {
    title: 'Lava Lamp Coffee Maker',
    pitch:
      'Brew your coffee and brighten your room at the same time. Don’t touch it.',
    flavorText: 'Hot coffee... and we mean HOT.',
    description:
      'For those who like their coffee with a side of retro style. Watch the lava bubbles rise as your coffee brews, but be careful, this machine is as hot as it looks!',
    artPrompt:
      'lava lamp coffee maker, colorful lava bubbles, steaming coffee cup, cozy kitchen setting',
  },
  {
    title: 'Personalized Weather Forecasts',
    pitch:
      'Tired of the same weather as everyone else? Customize your climate.',
    flavorText: 'Make it rain or shine on your terms.',
    description:
      'Set your own weather forecast: sunny for your beach day, snowy for hot chocolate season. Only drawback? It’s not always on your schedule.',
    artPrompt:
      'cartoon cloud with remote control, personalized sunny beach, stormy sky mix',
  },
  {
    title: 'Whispering WiFi Router',
    pitch: 'It tells you secrets... and maybe your neighbor’s password.',
    flavorText: 'Finally, a router with a personality!',
    description:
      'This router doesn’t just broadcast WiFi, it whispers juicy secrets about network speeds and other people’s streaming habits. The perfect accessory for nosy internet users.',
    artPrompt:
      'whispering WiFi router, cartoon-style whispers, confused users, glowing internet signals',
  },
  {
    title: 'Pet Psychic Hotline',
    pitch: 'Finally, figure out why your cat stares at the wall for hours.',
    flavorText: 'Who needs a vet when you can call a psychic?',
    description:
      'Unlock the mysteries of your pet’s mind with a psychic hotline dedicated to interpreting their deepest thoughts. Just be prepared for a lot of requests for treats.',
    artPrompt:
      'a cat on the phone, psychic hotline vibe, crystal ball, humorous tone',
  },
  {
    title: 'Gravity-Defying Yoga Mat',
    pitch: 'Achieve perfect balance... literally floating on air.',
    flavorText: 'For yoga that lifts you up, literally.',
    description:
      'Tired of regular yoga? Try a mat that lets you float mid-pose. Perfect for mastering that tricky headstand, as long as you don’t float away.',
    artPrompt:
      'floating yoga mat, levitating yogi, peaceful outdoor scene, vibrant colors',
  },
  {
    title: 'Time-Traveling Toaster',
    pitch: 'It’s toast... before you even put the bread in.',
    flavorText: 'Toast that’s ahead of its time.',
    description:
      'A toaster that bends time to give you perfectly toasted bread in the past, present, and future. Just be careful not to get burnt by tomorrow’s toast today.',
    artPrompt:
      'retro-futuristic toaster, time vortex, floating toast, sci-fi kitchen',
  },
  {
    title: 'Anti-Gravity Roller Skates',
    pitch: 'Skate anywhere, even up walls. Just don’t look down.',
    flavorText: 'Take your skating to new heights, literally!',
    description:
      'These skates will have you defying gravity and zooming up vertical surfaces. Just make sure your sense of direction is as sharp as your skates.',
    artPrompt:
      'roller skater zooming up a wall, futuristic city, anti-gravity effect, dynamic movement',
  },
]

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, pitch } = body

    if (!title || !pitch) {
      throw createError({
        statusCode: 400,
        message: 'Missing title or pitch.',
      })
    }

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: 0,
      serverId: body.serverId ?? null,
    })

    const embellishment =
      creativeEmbellishments[
        Math.floor(Math.random() * creativeEmbellishments.length)
      ]

    if (!embellishment) {
      throw createError({
        statusCode: 500,
        message: 'Failed to select embellishment.',
      })
    }

    const { balance } = await gate.commit(`embellish:${Date.now()}`)

    return {
      success: true,
      title,
      pitch,
      flavorText: embellishment.flavorText,
      description: embellishment.description,
      artPrompt: embellishment.artPrompt,
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to embellish pitch.',
    }
  }
})
