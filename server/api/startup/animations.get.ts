import { defineEventHandler, setHeader } from 'h3'
import { listStartupAnimationUrls } from '@/server/utils/startupAnimations'

export interface StartupAnimationsResponse {
  animations: string[]
}

export default defineEventHandler(async (event): Promise<StartupAnimationsResponse> => {
  setHeader(
    event,
    'Cache-Control',
    'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  )

  return {
    animations: await listStartupAnimationUrls(),
  }
})
