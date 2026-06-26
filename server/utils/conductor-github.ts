// Shared helpers for reading/writing files in silasfelinus/conductor via GitHub API.
// Requires CONDUCTOR_GITHUB_TOKEN in runtimeConfig for write operations.

export interface ConductorFile {
  sha: string
  content: string
}

export async function conductorGet(path: string): Promise<ConductorFile | null> {
  const { conductorGithubToken } = useRuntimeConfig()
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (conductorGithubToken) headers.Authorization = `Bearer ${conductorGithubToken}`

  const res = await fetch(
    `https://api.github.com/repos/silasfelinus/conductor/contents/${path}`,
    { headers },
  )
  if (res.status === 404) return null
  if (!res.ok) {
    throw createError({ statusCode: 502, statusMessage: `GitHub read error ${res.status}` })
  }
  const data = (await res.json()) as { sha: string; content: string }
  return {
    sha: data.sha,
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
  }
}

export async function conductorPut(
  path: string,
  content: string,
  message: string,
  existingSha?: string,
): Promise<void> {
  const { conductorGithubToken } = useRuntimeConfig()
  if (!conductorGithubToken) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'CONDUCTOR_GITHUB_TOKEN is not configured. Add it to Vercel environment variables.',
    })
  }

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
  }
  if (existingSha) body.sha = existingSha

  const res = await fetch(
    `https://api.github.com/repos/silasfelinus/conductor/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${conductorGithubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw createError({ statusCode: 502, statusMessage: `GitHub write error: ${err}` })
  }
}
