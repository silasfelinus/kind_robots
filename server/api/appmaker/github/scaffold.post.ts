// POST /api/appmaker/github/scaffold — appmaker/t-009, GITHUB-APP-DESIGN.md
// §5b step 3: mint an installation token, push a `worker/scaffold-<slug>`
// branch with the app skeleton to the user's own repo, open a PR there.
// Admin-only (the Worker authenticates with the beta-admin token per
// AGENTS.md's KR_API_TOKEN convention, which authGuard.ts maps to
// isAdmin: true) — this is the one path that spends a real installation
// token, so it is never triggered directly by the app-creating user.
import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { pushScaffoldBranchAndOpenPr } from '@/server/utils/appmakerGithub'

type ScaffoldBody = {
  appRepoId?: number
}

function packageName(slug: string): string {
  return slug.replace(/-/g, '_')
}

function appClassName(slug: string): string {
  return (
    slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'App'
  )
}

function withSubPath(subPath: string, relativePath: string): string {
  return subPath ? `${subPath}/${relativePath}` : relativePath
}

// Mirrors scripts/new_app.py's Flutter skeleton, minus the conductor-only
// projects/<slug>/roadmap.yaml + CHANGELOG.md files — those describe our own
// agent workflow and have no meaning inside a user's external repo.
function buildScaffoldFiles(params: {
  slug: string
  title: string
  subPath: string
}) {
  const { slug, title, subPath } = params
  const pkg = packageName(slug)
  const appClass = appClassName(slug)

  const pubspec = `name: ${pkg}
description: "${title} — built with AppMaker on conductor."
publish_to: "none"
version: 0.1.0+1

environment:
  sdk: ^3.5.0

dependencies:
  flutter:
    sdk: flutter

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
`

  const analysisOptions = `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_single_quotes: true
    always_declare_return_types: true
`

  const gitignore = `.dart_tool/
build/
.flutter-plugins
.flutter-plugins-dependencies
*.iml
.idea/
*.env
*.keystore
key.properties
**/GoogleService-Info.plist
**/google-services.json
`

  const readme = `# ${title}

Scaffolded by AppMaker (kind_robots \`server/api/appmaker/github/scaffold.post.ts\`).

First checkout on a dev machine:

\`\`\`sh
${subPath ? `cd ${subPath}\n` : ''}flutter create . --org org.kindrobots --project-name ${pkg} --platforms ios,android
flutter pub get
flutter test
\`\`\`
`

  const mainDart = `import 'package:flutter/material.dart';

void main() => runApp(const ${appClass}());

class ${appClass} extends StatelessWidget {
  const ${appClass}({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${title}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6750A4)),
        useMaterial3: true,
      ),
      home: Scaffold(
        appBar: AppBar(title: const Text('${title}')),
        body: const Center(child: Text('${title} — scaffolded by AppMaker')),
      ),
    );
  }
}
`

  const widgetTest = `import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/main.dart';

void main() {
  testWidgets('app boots', (tester) async {
    await tester.pumpWidget(const ${appClass}());
    expect(find.text('${title}'), findsWidgets);
  });
}
`

  return [
    { path: withSubPath(subPath, 'pubspec.yaml'), content: pubspec },
    {
      path: withSubPath(subPath, 'analysis_options.yaml'),
      content: analysisOptions,
    },
    { path: withSubPath(subPath, '.gitignore'), content: gitignore },
    { path: withSubPath(subPath, 'README.md'), content: readme },
    { path: withSubPath(subPath, 'lib/main.dart'), content: mainDart },
    {
      path: withSubPath(subPath, 'test/widget_test.dart'),
      content: widgetTest,
    },
  ]
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = await readBody<ScaffoldBody>(event)

    const appRepoId = Number(body.appRepoId)
    if (!Number.isInteger(appRepoId) || appRepoId <= 0) {
      throw createError({ statusCode: 400, message: 'appRepoId is required.' })
    }

    const appRepo = await prisma.appRepo.findUnique({
      where: { id: appRepoId },
      include: { Installation: true },
    })
    if (!appRepo) {
      throw createError({ statusCode: 404, message: 'AppRepo not found.' })
    }
    if (!appRepo.Installation) {
      throw createError({
        statusCode: 409,
        message:
          'This AppRepo has no linked GitHub installation (monorepo apps scaffold via scripts/new_app.py, not this endpoint).',
      })
    }
    if (appRepo.Installation.suspendedAt) {
      throw createError({
        statusCode: 409,
        message: 'The linked GitHub installation is suspended.',
      })
    }

    const project = await prisma.project.findFirst({
      where: { OR: [{ slug: appRepo.slug }, { conductorSlug: appRepo.slug }] },
      select: { title: true },
    })

    const files = buildScaffoldFiles({
      slug: appRepo.slug,
      title: project?.title ?? appRepo.slug,
      subPath: appRepo.subPath,
    })

    const result = await pushScaffoldBranchAndOpenPr({
      installationId: Number(appRepo.Installation.installationId),
      owner: appRepo.owner,
      repo: appRepo.repo,
      slug: appRepo.slug,
      files,
      prTitle: `AppMaker: scaffold ${appRepo.slug}`,
      prBody: [
        `Scaffolded by AppMaker (kind_robots project ${appRepo.slug}).`,
        '',
        'This PR was opened by an installation-scoped GitHub App token — the',
        'Worker role: only ever pushes `worker/*` branches and opens PRs, never',
        'merges (GITHUB-APP-DESIGN.md §5d). A human on this repo reviews and',
        'merges when ready.',
      ].join('\n'),
    })

    return {
      success: true,
      data: {
        appRepoId: appRepo.id,
        branch: result.branch,
        prUrl: result.prUrl,
        prNumber: result.prNumber,
      },
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
