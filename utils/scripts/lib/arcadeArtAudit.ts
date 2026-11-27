import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type ArtRequest = {
  id?: string
  target_repo?: string
  image_path?: string
  source_url?: string
  status?: string
  last_art_job_id?: number
}

export type ArcadeArtSite = {
  game: string
  source: string
  line: number
  symbol: string
  operations: string[]
  functionalUiCandidate: boolean
  imagePatterns: string[]
  requests: { id: string; status: string; jobId: number | null }[]
}

const DRAW_OPERATIONS = new Set([
  'pixelSprite',
  'fillRect',
  'fill',
  'stroke',
  'arc',
  'ellipse',
  'fillPath',
  'BoxGeometry',
  'SphereGeometry',
  'CylinderGeometry',
  'ConeGeometry',
  'PlaneGeometry',
])
const FRAMEWORK = new Set([
  'snes.ts',
  'font.ts',
  'sound.ts',
  'types.ts',
  'display.ts',
  'input.ts',
  'loop.ts',
])
const UTILITY_NAME =
  /^(?:draw)?(?:hud|text|readout|gauge|meter|button|panel|focus|hitbox|debug|bounds|progressbar)$/i

type Declaration = {
  name: string
  node: ts.Node
  operations: Set<string>
  images: Set<string>
  references: Set<string>
}
type Module = {
  source: ts.SourceFile
  operationAliases: Map<string, string>
  imports: Map<string, { file: string; name: string }>
  dependencies: Set<string>
  declarations: Map<string, Declaration>
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

function nameOf(node: ts.Node): string | null {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return null
}

function declarationName(node: ts.Node): string | null {
  if (
    ts.isVariableDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node)
  ) {
    const name = node.name && nameOf(node.name)
    if (!name) return null
    const parent = node.parent
    if (
      ts.isVariableDeclaration(node) &&
      !ts.isSourceFile(parent.parent?.parent)
    )
      return null
    if (ts.isFunctionDeclaration(node) && !ts.isSourceFile(parent)) return null
    return (
      (ts.isClassDeclaration(parent) && parent.name
        ? `${parent.name.text}.`
        : '') + name
    )
  }
  return null
}

function assetPattern(node: ts.Node): string | null {
  let value: string | null = null
  if (ts.isStringLiteralLike(node)) value = node.text
  if (ts.isTemplateExpression(node))
    value =
      node.head.text +
      node.templateSpans.map((s) => `*${s.literal.text}`).join('')
  if (!value || !/^\/(?:images|.*-art)\//.test(value)) return null
  return /\.(?:webp|png|jpe?g|gif|avif|svg)(?:\?.*)?$/i.test(value)
    ? value.split('?')[0]!
    : null
}

function normalizeAsset(value: string | undefined): string | null {
  if (!value) return null
  const pathname = /^https?:\/\//.test(value)
    ? new URL(value).pathname
    : value.replace(/^public\//, '/')
  return pathname.startsWith('/') ? pathname.split('?')[0]! : null
}

function matches(pattern: string, asset: string) {
  const expression = pattern
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*')
  return new RegExp(`^${expression}$`).test(asset)
}

export function auditArcadeArt(
  root: string,
  requests: readonly ArtRequest[],
): { games: string[]; sites: ArcadeArtSite[] } {
  const arcadeRoot = path.resolve(root, 'utils/arcade')
  const modules = new Map<string, Module>()

  function resolveImport(from: string, specifier: string) {
    if (!specifier.startsWith('.')) return null
    const base = path.resolve(path.dirname(from), specifier)
    if (!base.startsWith(arcadeRoot + path.sep)) return null
    return [base + '.ts', path.join(base, 'index.ts')].find(existsSync) ?? null
  }

  function readModule(file: string): Module {
    const cached = modules.get(file)
    if (cached) return cached
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )
    const module: Module = {
      source,
      operationAliases: new Map(),
      imports: new Map(),
      dependencies: new Set(),
      declarations: new Map(),
    }
    modules.set(file, module)
    for (const statement of source.statements) {
      if (
        ts.isExportDeclaration(statement) &&
        !statement.isTypeOnly &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const target = resolveImport(file, statement.moduleSpecifier.text)
        if (!target || FRAMEWORK.has(path.basename(target))) continue
        module.dependencies.add(target)
        if (statement.exportClause && ts.isNamedExports(statement.exportClause))
          for (const item of statement.exportClause.elements)
            module.imports.set(item.name.text, {
              file: target,
              name: item.propertyName?.text ?? item.name.text,
            })
      }
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue
      if (statement.importClause?.isTypeOnly) continue
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings))
        for (const item of bindings.elements) {
          const original = item.propertyName?.text ?? item.name.text
          if (!item.isTypeOnly && DRAW_OPERATIONS.has(original))
            module.operationAliases.set(item.name.text, original)
        }
      const target = resolveImport(file, statement.moduleSpecifier.text)
      if (!target || FRAMEWORK.has(path.basename(target))) continue
      module.dependencies.add(target)
      if (bindings && ts.isNamedImports(bindings))
        for (const item of bindings.elements) {
          if (item.isTypeOnly) continue
          module.imports.set(item.name.text, {
            file: target,
            name: item.propertyName?.text ?? item.name.text,
          })
        }
    }
    walk(source, (node) => {
      const name = declarationName(node)
      if (!name) return
      const declaration: Declaration = {
        name,
        node,
        operations: new Set(),
        images: new Set(),
        references: new Set(),
      }
      walk(node, (child) => {
        const image = assetPattern(child)
        if (image) declaration.images.add(image)
        if (ts.isIdentifier(child)) declaration.references.add(child.text)
        if (ts.isCallExpression(child) || ts.isNewExpression(child)) {
          const expression = child.expression
          const operation = ts.isPropertyAccessExpression(expression)
            ? expression.name.text
            : ts.isIdentifier(expression)
              ? expression.text
              : null
          const canonical =
            operation && (module.operationAliases.get(operation) ?? operation)
          if (
            canonical &&
            (DRAW_OPERATIONS.has(canonical) ||
              (ts.isNewExpression(child) && canonical.endsWith('Geometry')))
          )
            declaration.operations.add(canonical)
        }
      })
      module.declarations.set(name, declaration)
    })
    for (const dependency of module.dependencies) readModule(dependency)
    return module
  }

  function imagesFor(
    file: string,
    name: string,
    seen = new Set<string>(),
  ): Set<string> {
    const key = `${file}#${name}`
    if (seen.has(key)) return new Set()
    seen.add(key)
    const module = readModule(file)
    const declaration = module.declarations.get(name)
    if (!declaration) {
      const imported = module.imports.get(name)
      return imported
        ? imagesFor(imported.file, imported.name, seen)
        : new Set()
    }
    const images = new Set(declaration.images)
    for (const reference of declaration.references) {
      const imported = module.imports.get(reference)
      const target = imported ?? { file, name: reference }
      for (const image of imagesFor(target.file, target.name, seen))
        images.add(image)
    }
    return images
  }

  const registry = readModule(path.join(arcadeRoot, 'games.ts'))
  const loaders = registry.declarations.get('LOADERS')
  if (!loaders) throw new Error('Arcade registry has no LOADERS declaration')
  const entries = new Map<string, Set<string>>()
  walk(loaders.node, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    const slug = nameOf(node.name)
    if (!slug) return
    walk(node.initializer, (child) => {
      if (
        !ts.isCallExpression(child) ||
        child.expression.kind !== ts.SyntaxKind.ImportKeyword
      )
        return
      const specifier = child.arguments[0]
      if (!specifier || !ts.isStringLiteral(specifier)) return
      const target = resolveImport(registry.source.fileName, specifier.text)
      if (!target)
        throw new Error(
          `Cannot resolve Arcade loader ${slug}: ${specifier.text}`,
        )
      const files = entries.get(slug) ?? new Set<string>()
      files.add(target)
      entries.set(slug, files)
    })
  })
  if (!entries.size)
    throw new Error('No Arcade loaders found; refusing an empty audit')

  const normalizedRequests = requests
    .filter(
      (request) =>
        !request.target_repo ||
        request.target_repo === 'silasfelinus/kind_robots',
    )
    .map((request) => ({
      request,
      assets: [
        normalizeAsset(request.image_path),
        normalizeAsset(request.source_url),
      ].filter((asset): asset is string => asset !== null),
    }))
  const sites: ArcadeArtSite[] = []
  for (const [game, roots] of entries) {
    const visited = new Set<string>()
    function inspect(file: string) {
      if (visited.has(file)) return
      visited.add(file)
      const module = readModule(file)
      for (const declaration of module.declarations.values()) {
        if (!declaration.operations.size) continue
        const imagePatterns = [...imagesFor(file, declaration.name)].sort()
        const linked = normalizedRequests.filter(({ assets }) =>
          assets.some((asset) =>
            imagePatterns.some((pattern) => matches(pattern, asset)),
          ),
        )
        sites.push({
          game,
          source: path.relative(root, file).split(path.sep).join('/'),
          line:
            module.source.getLineAndCharacterOfPosition(
              declaration.node.getStart(),
            ).line + 1,
          symbol: declaration.name,
          operations: [...declaration.operations].sort(),
          functionalUiCandidate: UTILITY_NAME.test(
            declaration.name.split('.').at(-1)!,
          ),
          imagePatterns,
          requests: linked.map(({ request }) => ({
            id: request.id ?? '(unnamed)',
            status: request.status ?? 'unknown',
            jobId: request.last_art_job_id ?? null,
          })),
        })
      }
      for (const dependency of module.dependencies) inspect(dependency)
    }
    for (const file of roots) inspect(file)
  }
  sites.sort(
    (a, b) =>
      a.game.localeCompare(b.game) ||
      a.source.localeCompare(b.source) ||
      a.line - b.line,
  )
  return { games: [...entries.keys()].sort(), sites }
}
