// /server/utils/comicEditor.ts
//
// Runs the Comic Studio's adversarial editor (comic-creator/t-017): gathers what the
// series has established, asks Claude for a structured verdict, and stores it.
// Standards, schema and validation live in utils/comicEditor.ts.
//
// `useRuntimeConfig` is auto-imported by Nitro (see server/utils/structuredCompletion.ts).
import Anthropic from '@anthropic-ai/sdk'
import { createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { getRuntimeAnthropicKey } from '@/server/utils/textProviderService'
import {
  COMIC_EDITOR_MODEL,
  COMIC_EDITOR_SCHEMA,
  COMIC_EDITOR_SYSTEM,
  comicEditorCritiqueText,
  composeComicEditorRequest,
  normalizeComicEditorCritique,
  type ComicEditorContext,
  type ComicEditorCritique,
  type ComicEditorTarget,
} from '~/utils/comicEditor'
import type { ComicCritiqueDto } from '~/types/comicStudio'

const EDITOR_TIMEOUT_MS = 180_000
const MAX_THREAD_DEPTH = 8

type CritiqueRow = NonNullable<
  Awaited<ReturnType<typeof prisma.comicCritique.findUnique>>
>

function parseCritique(raw: string): ComicEditorCritique | null {
  try {
    return normalizeComicEditorCritique(JSON.parse(raw))
  } catch {
    return null
  }
}

export function toComicCritiqueDto(row: CritiqueRow): ComicCritiqueDto {
  const critique = parseCritique(row.body)
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    parentId: row.parentId,
    targetType: row.targetType,
    targetId: row.targetId,
    targetName: row.targetName,
    input: row.input,
    verdict: row.verdict,
    headline: row.headline,
    strengths: critique?.strengths ?? [],
    problems: critique?.problems ?? [],
    questions: critique?.questions ?? [],
    bar: critique?.bar ?? '',
    trigger: row.trigger,
    model: row.model,
  }
}

async function loadEditorContext(
  seriesId: number,
): Promise<ComicEditorContext> {
  const [series, entities, issues, recent] = await Promise.all([
    prisma.comicSeries.findUniqueOrThrow({ where: { id: seriesId } }),
    prisma.comicEntity.findMany({
      where: { seriesId, isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.comicIssue.findMany({
      where: { seriesId, isArchived: false },
      orderBy: { number: 'asc' },
    }),
    prisma.comicCritique.findMany({
      where: { seriesId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { verdict: true, headline: true, targetName: true },
    }),
  ])
  return {
    seriesTitle: series.title,
    seriesNotes: series.notes,
    style: series.styleProse,
    entities: entities.map((entity) => ({
      name: entity.name,
      kind: entity.kind,
      notes: entity.notes,
      secretUntil: entity.secretUntil,
    })),
    issues: issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      notes: issue.notes,
    })),
    recent: recent.reverse(),
  }
}

export async function comicEditorTarget(
  seriesId: number,
  targetType: ComicEditorTarget,
  targetId: number | null,
  text: string | null,
): Promise<{ label: string; name: string | null; material: string }> {
  if (targetType === 'pitch') {
    if (!text?.trim())
      throw createError({
        statusCode: 400,
        message: 'Pitch the editor something first.',
      })
    return {
      label: 'a new pitch from the creator',
      name: null,
      material: text.trim(),
    }
  }
  if (targetType === 'series') {
    const series = await prisma.comicSeries.findUniqueOrThrow({
      where: { id: seriesId },
    })
    return {
      label: 'the series notes as they now stand (judge the whole direction)',
      name: series.title,
      material: series.notes?.trim() || '(the series notes are empty)',
    }
  }
  if (!targetId)
    throw createError({ statusCode: 400, message: 'targetId is required.' })
  if (targetType === 'entity') {
    const entity = await prisma.comicEntity.findFirst({
      where: { id: targetId, seriesId },
    })
    if (!entity)
      throw createError({ statusCode: 404, message: 'Entity not found.' })
    return {
      label: `the ${entity.kind} "${entity.name}"`,
      name: entity.name,
      material: `${entity.name} (${entity.kind})${entity.secretUntil ? `, secret until ${entity.secretUntil}` : ''}\n\n${entity.notes?.trim() || '(no notes yet)'}`,
    }
  }
  if (targetType === 'issue') {
    const issue = await prisma.comicIssue.findFirst({
      where: { id: targetId, seriesId },
    })
    if (!issue)
      throw createError({ statusCode: 404, message: 'Issue not found.' })
    return {
      label: `issue ${issue.number}, "${issue.title}"`,
      name: `Issue ${issue.number}`,
      material: issue.notes?.trim() || '(no issue notes yet)',
    }
  }
  const slot = await prisma.comicSlot.findFirst({
    where: { id: targetId, seriesId },
    include: { Entity: true },
  })
  if (!slot)
    throw createError({ statusCode: 404, message: 'Subject not found.' })
  return {
    label: `the ${slot.kind === 'panel' ? 'panel' : 'image subject'} "${slot.title}"${slot.Entity ? ` (for ${slot.Entity.name})` : ''}`,
    name: slot.title,
    material:
      [
        slot.notes?.trim() ? `Intent: ${slot.notes.trim()}` : '',
        slot.promptProse?.trim()
          ? `Image prompt: ${slot.promptProse.trim()}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n') || '(no prompt or notes yet)',
  }
}

async function threadFor(parentId: number | null, seriesId: number) {
  const turns: Array<{ role: 'editor' | 'creator'; text: string }> = []
  let cursor = parentId
  for (let depth = 0; cursor && depth < MAX_THREAD_DEPTH; depth += 1) {
    const row = await prisma.comicCritique.findFirst({
      where: { id: cursor, seriesId },
    })
    if (!row) break
    const stored = parseCritique(row.body)
    turns.unshift({
      role: 'editor',
      text: stored
        ? comicEditorCritiqueText(stored)
        : `${row.verdict.toUpperCase()}: ${row.headline}`,
    })
    turns.unshift({ role: 'creator', text: row.input })
    cursor = row.parentId
  }
  return turns
}

async function askEditor(
  request: string,
): Promise<{ critique: ComicEditorCritique; model: string }> {
  const apiKey = getRuntimeAnthropicKey(useRuntimeConfig())
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      message: 'The editor needs ANTHROPIC_API_KEY on the server.',
    })
  }
  const client = new Anthropic({
    apiKey,
    timeout: EDITOR_TIMEOUT_MS,
    maxRetries: 1,
  })
  const response = await client.beta.messages.create({
    model: COMIC_EDITOR_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: COMIC_EDITOR_SCHEMA },
    },
    system: [
      {
        type: 'text',
        text: COMIC_EDITOR_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: request }],
  })
  if (response.stop_reason === 'refusal') {
    throw createError({
      statusCode: 422,
      message: 'The editor declined to judge this one.',
    })
  }
  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim()
  const critique = parseCritique(text)
  if (!critique) {
    throw createError({
      statusCode: 502,
      message: 'The editor returned something unreadable. Try again.',
    })
  }
  return { critique, model: response.model }
}

export async function runComicEditor(input: {
  seriesId: number
  targetType: ComicEditorTarget
  targetId: number | null
  text: string | null
  parentId: number | null
  trigger: 'ask' | 'auto' | 'reply'
}): Promise<ComicCritiqueDto> {
  const target =
    input.parentId && input.text?.trim()
      ? {
          label: 'the creator’s reply to your last verdict',
          name: null,
          material: input.text.trim(),
        }
      : await comicEditorTarget(
          input.seriesId,
          input.targetType,
          input.targetId,
          input.text,
        )
  const parent = input.parentId
    ? await prisma.comicCritique.findFirst({
        where: { id: input.parentId, seriesId: input.seriesId },
      })
    : null
  if (input.parentId && !parent)
    throw createError({ statusCode: 404, message: 'Critique not found.' })
  const [context, thread] = await Promise.all([
    loadEditorContext(input.seriesId),
    threadFor(parent?.id ?? null, input.seriesId),
  ])
  const request = composeComicEditorRequest({
    context,
    targetLabel: target.label,
    material: target.material,
    thread,
  })
  const { critique, model } = await askEditor(request)
  const row = await prisma.comicCritique.create({
    data: {
      seriesId: input.seriesId,
      parentId: parent?.id ?? null,
      targetType: parent?.targetType ?? input.targetType,
      targetId: parent?.targetId ?? input.targetId,
      targetName: parent?.targetName ?? target.name,
      input: target.material.slice(0, 60_000),
      verdict: critique.verdict,
      headline: critique.headline.slice(0, 512),
      body: JSON.stringify(critique),
      model: model.slice(0, 64),
      trigger: input.trigger,
    },
  })
  return toComicCritiqueDto(row)
}
