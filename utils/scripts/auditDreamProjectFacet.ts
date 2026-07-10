// /utils/scripts/auditDreamProjectFacet.ts
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing')
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
})

const outputDirectory = resolve('artifacts/schema-audit')
const generatedAt = new Date().toISOString()
const fileStamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-')

type AuditIssue = {
  severity: 'info' | 'warning' | 'error'
  code: string
  model: string
  id?: number
  title?: string | null
  detail: string
}

const issues: AuditIssue[] = []

function addIssue(issue: AuditIssue): void {
  issues.push(issue)
}

async function main(): Promise<void> {
  const [dreamCounts, projectDreams, pitchSheets, todos, chats, reactions, relations] =
    await Promise.all([
      prisma.dream.groupBy({
        by: ['dreamType'],
        _count: { _all: true },
        orderBy: { dreamType: 'asc' },
      }),
      prisma.dream.findMany({
        where: { dreamType: 'PROJECT' },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          projectStatus: true,
          priority: true,
          repoUrl: true,
          liveUrl: true,
          goal: true,
          waypoints: true,
          artImageId: true,
          artCollectionId: true,
          PitchSheet: { select: { id: true, title: true } },
          _count: {
            select: {
              Todos: true,
              Chats: true,
              Reactions: true,
              Characters: true,
              Rewards: true,
              Scenarios: true,
              ArtImages: true,
              ArtCollections: true,
            },
          },
        },
      }),
      prisma.pitchSheet.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          dreamId: true,
          title: true,
          Dream: {
            select: {
              id: true,
              title: true,
              slug: true,
              dreamType: true,
            },
          },
        },
      }),
      prisma.todo.findMany({
        where: { dreamId: { not: null } },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          dreamId: true,
          Dream: { select: { title: true, dreamType: true } },
        },
      }),
      prisma.chat.findMany({
        where: { dreamId: { not: null } },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          channel: true,
          dreamId: true,
          Dream: { select: { title: true, dreamType: true } },
        },
      }),
      prisma.reaction.findMany({
        where: { dreamId: { not: null } },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          dreamId: true,
          Dream: { select: { title: true, dreamType: true } },
        },
      }),
      prisma.dreamRelation.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          relationType: true,
          note: true,
          FromDream: { select: { id: true, title: true, dreamType: true } },
          ToDream: { select: { id: true, title: true, dreamType: true } },
        },
      }),
    ])

  for (const dream of projectDreams) {
    if (!dream.slug) {
      addIssue({
        severity: 'error',
        code: 'PROJECT_DREAM_MISSING_SLUG',
        model: 'Dream',
        id: dream.id,
        title: dream.title,
        detail: 'Project migration requires a stable slug or an explicit legacy mapping.',
      })
    }

    const creativeRelationCount =
      dream._count.Characters + dream._count.Rewards + dream._count.Scenarios

    if (creativeRelationCount > 0) {
      addIssue({
        severity: 'warning',
        code: 'PROJECT_DREAM_HAS_CREATIVE_RELATIONS',
        model: 'Dream',
        id: dream.id,
        title: dream.title,
        detail: `Characters=${dream._count.Characters}, Rewards=${dream._count.Rewards}, Scenarios=${dream._count.Scenarios}. These relations need an explicit keep, move, or detach decision.`,
      })
    }
  }

  for (const pitchSheet of pitchSheets) {
    if (pitchSheet.Dream.dreamType === 'PROJECT') {
      addIssue({
        severity: 'info',
        code: 'PITCH_SHEET_MOVES_TO_PROJECT',
        model: 'PitchSheet',
        id: pitchSheet.id,
        title: pitchSheet.title,
        detail: `Currently belongs to Project Dream ${pitchSheet.Dream.id} (${pitchSheet.Dream.slug ?? pitchSheet.Dream.title}).`,
      })
    }
  }

  for (const todo of todos) {
    if (todo.Dream?.dreamType !== 'PROJECT') {
      addIssue({
        severity: 'warning',
        code: 'TODO_LINKED_TO_NON_PROJECT_DREAM',
        model: 'Todo',
        id: todo.id,
        title: todo.title,
        detail: `dreamId=${todo.dreamId} belongs to ${todo.Dream?.dreamType ?? 'missing Dream'}.`,
      })
    }
  }

  for (const chat of chats) {
    const isProjectDream = chat.Dream?.dreamType === 'PROJECT'
    const looksProjectScoped = chat.channel?.startsWith('project-') ?? false

    if (isProjectDream || looksProjectScoped) {
      addIssue({
        severity: isProjectDream ? 'info' : 'warning',
        code: isProjectDream
          ? 'CHAT_MOVES_TO_PROJECT'
          : 'PROJECT_CHANNEL_CHAT_WITH_NON_PROJECT_DREAM',
        model: 'Chat',
        id: chat.id,
        title: chat.title,
        detail: `dreamId=${chat.dreamId}, channel=${chat.channel ?? 'null'}, DreamType=${chat.Dream?.dreamType ?? 'missing'}.`,
      })
    }
  }

  for (const reaction of reactions) {
    if (reaction.Dream?.dreamType === 'PROJECT') {
      addIssue({
        severity: 'info',
        code: 'REACTION_MOVES_TO_PROJECT',
        model: 'Reaction',
        id: reaction.id,
        title: reaction.Dream.title,
        detail: `Currently linked to Project Dream ${reaction.dreamId}.`,
      })
    }
  }

  for (const relation of relations) {
    const facetLikeTypes = new Set(['GENRE', 'BRAINSTORM', 'ART'])
    const looksTaxonomic =
      relation.relationType === 'IS_A' ||
      relation.relationType === 'CONTAINS' ||
      facetLikeTypes.has(relation.FromDream.dreamType) ||
      facetLikeTypes.has(relation.ToDream.dreamType)

    if (looksTaxonomic) {
      addIssue({
        severity: 'info',
        code: 'DREAM_RELATION_FACET_CANDIDATE',
        model: 'DreamRelation',
        id: relation.id,
        title: `${relation.FromDream.title} → ${relation.ToDream.title}`,
        detail: `${relation.relationType}${relation.note ? `: ${relation.note}` : ''}`,
      })
    }
  }

  const duplicateProjectSlugs = projectDreams
    .filter((dream): dream is typeof dream & { slug: string } => Boolean(dream.slug))
    .reduce<Record<string, number[]>>((result, dream) => {
      result[dream.slug] = [...(result[dream.slug] ?? []), dream.id]
      return result
    }, {})

  for (const [slug, ids] of Object.entries(duplicateProjectSlugs)) {
    if (ids.length > 1) {
      addIssue({
        severity: 'error',
        code: 'DUPLICATE_PROJECT_SLUG',
        model: 'Dream',
        title: slug,
        detail: `Project Dream IDs: ${ids.join(', ')}`,
      })
    }
  }

  const report = {
    generatedAt,
    summary: {
      dreamCounts,
      projectDreamCount: projectDreams.length,
      pitchSheetCount: pitchSheets.length,
      projectPitchSheetCount: pitchSheets.filter(
        (pitchSheet) => pitchSheet.Dream.dreamType === 'PROJECT',
      ).length,
      scopedTodoCount: todos.length,
      scopedChatCount: chats.length,
      scopedReactionCount: reactions.length,
      dreamRelationCount: relations.length,
      issueCount: issues.length,
      errorCount: issues.filter((issue) => issue.severity === 'error').length,
      warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    },
    projectDreams,
    pitchSheets,
    todos,
    chats,
    reactions,
    relations,
    issues,
  }

  const markdown = [
    '# Dream / Project / Facet migration audit',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    `- Project Dreams: ${report.summary.projectDreamCount}`,
    `- PitchSheets: ${report.summary.pitchSheetCount}`,
    `- PitchSheets moving to Projects: ${report.summary.projectPitchSheetCount}`,
    `- Dream-scoped Todos: ${report.summary.scopedTodoCount}`,
    `- Dream-scoped Chats: ${report.summary.scopedChatCount}`,
    `- Dream-scoped Reactions: ${report.summary.scopedReactionCount}`,
    `- DreamRelations: ${report.summary.dreamRelationCount}`,
    `- Errors: ${report.summary.errorCount}`,
    `- Warnings: ${report.summary.warningCount}`,
    '',
    '## Dream counts',
    '',
    ...dreamCounts.map(
      (entry) => `- ${entry.dreamType}: ${entry._count._all}`,
    ),
    '',
    '## Findings',
    '',
    ...issues.map(
      (issue) =>
        `- **${issue.severity.toUpperCase()} ${issue.code}** ${issue.model}${issue.id ? ` #${issue.id}` : ''}${issue.title ? ` — ${issue.title}` : ''}: ${issue.detail}`,
    ),
    '',
  ].join('\n')

  await mkdir(outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(
      resolve(outputDirectory, `dream-project-facet-${fileStamp}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    ),
    writeFile(
      resolve(outputDirectory, `dream-project-facet-${fileStamp}.md`),
      markdown,
      'utf8',
    ),
  ])

  console.log(markdown)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
