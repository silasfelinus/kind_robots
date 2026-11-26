import { defineEventHandler } from 'h3'
import {
  buySlimeCityPack,
  requireSlimeCityPlayer,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const data = await buySlimeCityPack(auth.user.id)
  return { success: true, data }
})
