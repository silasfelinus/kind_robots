// /server/api/appmaker/github/connect.get.ts
// Step 1 of GITHUB-APP-DESIGN.md §5a: redirect the logged-in user to GitHub's
// own installation picker, with a signed state nonce binding the round-trip
// back to their kind_robots account.
import { defineEventHandler, sendRedirect } from 'h3'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  APPMAKER_GITHUB_APP_SLUG,
  signInstallState,
} from '~/server/utils/appmakerGithub'

export default defineEventHandler(async (event) => {
  const { user } = await requireApiUser(event)
  const state = await signInstallState(user.id)

  return sendRedirect(
    event,
    `https://github.com/apps/${APPMAKER_GITHUB_APP_SLUG}/installations/new?state=${encodeURIComponent(state)}`,
    302,
  )
})
