export default defineEventHandler(async () => {
  const { conductorGithubToken } = useRuntimeConfig()
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (conductorGithubToken) headers.Authorization = `Bearer ${conductorGithubToken}`

  const res = await fetch(
    'https://api.github.com/repos/silasfelinus/conductor/pulls?state=open&per_page=30',
    { headers },
  )
  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: 'GitHub API error fetching PRs' })
  }

  const data = (await res.json()) as Array<{
    number: number
    title: string
    html_url: string
    head: { ref: string }
    draft: boolean
    created_at: string
    updated_at: string
    user: { login: string }
  }>

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    branch: pr.head.ref,
    draft: pr.draft,
    updatedAt: pr.updated_at,
    author: pr.user.login,
  }))
})
