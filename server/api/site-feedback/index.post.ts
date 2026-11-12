import { randomUUID } from 'node:crypto'
import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { conductorGet, conductorGithubToken } from '~/server/utils/conductor-github'

const REPO = 'silasfelinus/kind_robots'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 16 * 1024
const PROJECT_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

function field(
  parts: Awaited<ReturnType<typeof readMultipartFormData>>,
  name: string,
  limit: number,
): string {
  const value =
    parts
      ?.find((part) => part.name === name)
      ?.data.toString('utf8')
      .trim() ?? ''
  if (value.length > limit) {
    throw createError({ statusCode: 400, message: name + ' is too long.' })
  }
  return value
}

function validImage(data: Buffer, mime: string): boolean {
  if (mime === 'image/png')
    return data
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mime === 'image/jpeg')
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (mime === 'image/webp')
    return (
      data.toString('ascii', 0, 4) === 'RIFF' &&
      data.toString('ascii', 8, 12) === 'WEBP'
    )
  return false
}

async function github(
  path: string,
  token: string,
  method: string = 'GET',
  body?: unknown,
): Promise<Response> {
  return fetch('https://api.github.com/repos/' + REPO + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

async function ensureProjectLabel(
  token: string,
  project: string,
): Promise<string[]> {
  if (project === 'kind-robots') return []
  const name = 'project:' + project
  const found = await github('/labels/' + encodeURIComponent(name), token)
  if (found.status === 404) {
    const created = await github('/labels', token, 'POST', {
      name,
      color: '277da1',
      description: 'Route GitHub issue to the Conductor project roadmap.',
    })
    if (!created.ok) {
      const existing =
        created.status === 422
          ? await github('/labels/' + encodeURIComponent(name), token)
          : null
      if (!existing?.ok) {
        throw createError({
          statusCode: 502,
          message:
            'Could not create the Conductor project label (' +
            created.status +
            ').',
        })
      }
    }
  } else if (!found.ok) {
    throw createError({
      statusCode: 502,
      message:
        'Could not validate the Conductor project label (' +
        found.status +
        ').',
    })
  }
  return [name]
}

export default defineEventHandler(async (event) => {
  const auth = await requireAdminApiUser(event)
  const length = Number(getHeader(event, 'content-length') || 0)
  if (length > MAX_REQUEST_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'Screenshot must be 5 MB or smaller.',
    })
  }

  const parts = await readMultipartFormData(event)
  const title = field(parts, 'title', 130)
  const note = field(parts, 'note', 6000)
  const project = field(parts, 'project', 80)
  const path = field(parts, 'path', 300)
  const viewport = field(parts, 'viewport', 80)
  const screenshot = parts?.find((part) => part.name === 'screenshot')
  const mime = screenshot?.type?.toLowerCase() || ''

  if (!title || !note) {
    throw createError({
      statusCode: 400,
      message: 'A title and feedback note are required.',
    })
  }
  if (!PROJECT_SLUG.test(project)) {
    throw createError({
      statusCode: 400,
      message: 'Select a valid Conductor project slug.',
    })
  }
  if (!path.startsWith('/') || path.startsWith('//') || /[\r\n]/.test(path)) {
    throw createError({ statusCode: 400, message: 'Invalid page path.' })
  }
  if (!screenshot?.data?.length || screenshot.data.length > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 400,
      message: 'Attach a screenshot smaller than 5 MB.',
    })
  }
  if (!IMAGE_TYPES.has(mime) || !validImage(screenshot.data, mime)) {
    throw createError({
      statusCode: 415,
      message: 'Screenshot must be PNG, JPEG or WebP.',
    })
  }

  const roadmap = await conductorGet('projects/' + project + '/roadmap.yaml')
  if (!roadmap) {
    throw createError({
      statusCode: 400,
      message: 'That Conductor project does not exist. Correct the project slug.',
    })
  }

  const token = conductorGithubToken()
  if (!token) {
    throw createError({
      statusCode: 503,
      message: 'GitHub write access is not configured.',
    })
  }
  const labels = await ensureProjectLabel(token, project)

  const image = await prisma.artImage.create({
    data: {
      userId: auth.user.id,
      fileName: 'site-feedback-' + randomUUID() + '.' + mime.split('/')[1],
      fileType: mime.split('/')[1],
      imageData: screenshot.data.toString('base64'),
      designer: 'site-feedback',
      path,
      isPublic: false,
      isMature: false,
    },
    select: { id: true },
  })

  const imageUrl = 'https://kindrobots.org/api/site-feedback/image/' + image.id
  const pageUrl = 'https://kindrobots.org' + path
  const content = [
    '## Admin screenshot feedback',
    '',
    note,
    '',
    '### Screenshot',
    '',
    '![' +
      'Screenshot of ' +
      path.replace(/[\[\]]/g, '') +
      '](' +
      imageUrl +
      ')',
    '',
    '- **Page:** ' + pageUrl,
    '- **Conductor project:** ' + project,
    '- **Viewport:** ' + (viewport || 'Not reported'),
    '- **Reported by:** ' + (auth.user.username || 'admin'),
    '',
    'Conductor: this is an admin-authored feedback issue. Import via the issue bridge, inspect the screenshot, and route implementation to the owning roadmap. Close the issue from the implementing PR.',
  ].join('\n')
  const response = await github('/issues', token, 'POST', {
    title: '[Screenshot] ' + title,
    body: content,
    labels,
  })
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message:
        'GitHub issue creation failed (' +
        response.status +
        '). No issue was submitted.',
    })
  }
  const issue = (await response.json()) as { number: number; html_url: string }
  await prisma.artImage.update({
    where: { id: image.id },
    data: { isPublic: true },
  })

  return {
    success: true,
    data: { issue: issue.number, url: issue.html_url, screenshotUrl: imageUrl },
    message: 'Issue submitted to Conductor via GitHub.',
  }
})
