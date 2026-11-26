import { defineEventHandler } from 'h3'
import {
  getSlimeCityAccount,
  requireSlimeCityPlayer,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPlayer(event)
  const data = await getSlimeCityAccount(auth.user.id)
  return { success: true, data }
})
