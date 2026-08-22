// /server/utils/conductor-github.ts
// Shared helpers for reading/writing files in silasfelinus/conductor via GitHub API.
//
// Production is self-hosted from a prebuilt GHCR image. `GITHUB_TOKEN` is loaded
// into the running container by docker-compose's env_file, while Nuxt runtime
// config defaults are serialized when that image is built. Read the live Node
// environment first so a runtime-only secret is not mistaken for a missing one;
// keep runtimeConfig as the development / NUXT_GITHUB_TOKEN fallback.

export interface ConductorFile {
  sha: string
  content: string
}

function conductorGithubToken(): string {
  const runtimeToken = useRuntimeConfig().githubToken
  return (
    process.env.GITHUB_TOKEN ||
    (typeof runtimeToken === 'string' ? runtimeToken : '')
  ).trim()
}

export async function conductorGet(
  path: string,
): Promise<ConductorFile | null> {
  const githubToken = conductorGithubToken()

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  const res = await fetch(
    `https://api.github.com/repos/silasfelinus/conductor/contents/${path}`,
    { headers },
  )

  if (res.status === 404) return null

  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub read error ${res.status}`,
    })
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
  const githubToken = conductorGithubToken()

  if (!githubToken) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'GitHub write access is not configured on this Kind Robots server. Set GITHUB_TOKEN in the runtime environment.',
    })
  }

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
  }

  if (existingSha) {
    body.sha = existingSha
  }

  const res = await fetch(
    `https://api.github.com/repos/silasfelinus/conductor/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub write error: ${err}`,
    })
  }
}

export interface ConductorDirEntry {
  name: string
  type: 'file' | 'dir'
}

export async function conductorList(
  path: string,
): Promise<ConductorDirEntry[] | null> {
  const githubToken = conductorGithubToken()

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  const res = await fetch(
    `https://api.github.com/repos/silasfelinus/conductor/contents/${path}`,
    { headers },
  )

  if (res.status === 404) return null

  if (!res.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `GitHub read error ${res.status}`,
    })
  }

  const data = (await res.json()) as Array<{ name: string; type: string }>

  if (!Array.isArray(data)) return null

  return data.map((entry) => ({
    name: entry.name,
    type: entry.type === 'dir' ? 'dir' : 'file',
  }))
}
