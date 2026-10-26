// POST /api/playbook-forge/adjustment
//
// Posts an adjustment typed on a Playbook Forge ledger (a note, changed plan
// numbers, elements to add) as a comment on the game's GitHub master issue.
// Games without a master issue get one open "Playbook Forge adjustments" issue,
// found by title and reused. Admin only.
import { defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { conductorGithubToken } from '~/server/utils/conductor-github'
import {
  PLAYBOOK_ISSUES,
  PLAYBOOK_ISSUE_REPO,
  adjustmentComment,
  issueTitleFor,
  readAdjustment,
} from '~/utils/playbookForge/adjust'

const API = `https://api.github.com/repos/${PLAYBOOK_ISSUE_REPO}`

async function github<T>(
  token: string,
  url: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!res.ok)
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub answered ${res.status} for ${new URL(url).pathname}`,
    })
  return (await res.json()) as T
}

async function issueFor(
  token: string,
  slug: string,
  title: string,
): Promise<number> {
  const known = PLAYBOOK_ISSUES[slug]
  if (known) return known
  const issueTitle = issueTitleFor(title)
  const q = encodeURIComponent(
    `repo:${PLAYBOOK_ISSUE_REPO} is:issue is:open in:title "${issueTitle}"`,
  )
  const found = await github<{ items: { number: number; title: string }[] }>(
    token,
    `https://api.github.com/search/issues?q=${q}&per_page=5`,
  )
  const match = found.items.find((item) => item.title === issueTitle)
  if (match) return match.number
  const created = await github<{ number: number }>(token, `${API}/issues`, {
    method: 'POST',
    body: {
      title: issueTitle,
      body: `Adjustments to **${title}** (\`${slug}\`) typed on its Playbook Forge ledger at /admin/playbook-forge. Each comment is one adjustment.`,
    },
  })
  return created.number
}

export default defineEventHandler(async (event) => {
  const auth = await requireAdminApiUser(event)
  const post = readAdjustment(await readBody(event))
  if (typeof post === 'string')
    throw createError({ statusCode: 400, statusMessage: post })

  const token = conductorGithubToken()
  if (!token)
    throw createError({
      statusCode: 503,
      statusMessage:
        'GitHub write access is not configured on this Kind Robots server. Set GITHUB_TOKEN in the runtime environment.',
    })

  const issue = await issueFor(token, post.slug, post.title)
  const by = auth.user.username || 'an admin'
  const comment = await github<{ html_url: string }>(
    token,
    `${API}/issues/${issue}/comments`,
    { method: 'POST', body: { body: adjustmentComment(post, by) } },
  )
  return {
    success: true,
    message: `Posted to #${issue}.`,
    data: { issue, url: comment.html_url },
  }
})
