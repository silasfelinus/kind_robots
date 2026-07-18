// /utils/scripts/auditWonderLabPreviews.ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getWonderLabPreviewFixture } from '../wonderlab/previewFixtureCatalog'

const componentRoot = path.resolve(process.cwd(), 'components')
const ignoredSegments = new Set(['abandonware', '__tests__', '__fixtures__'])
const strict = process.argv.includes('--strict')

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

function shouldIgnore(relativePath: string): boolean {
  return toPosix(relativePath)
    .split('/')
    .some((segment) => ignoredSegments.has(segment))
}

async function collectVueFiles(directory: string, files: string[] = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.relative(componentRoot, absolutePath)

    if (shouldIgnore(relativePath)) continue

    if (entry.isDirectory()) {
      await collectVueFiles(absolutePath, files)
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(absolutePath)
    }
  }

  return files
}

function extractTypeRequiredProps(source: string): string[] {
  const matches = source.matchAll(/defineProps\s*<\s*\{([\s\S]*?)\}\s*>\s*\(/g)
  const props = new Set<string>()

  for (const match of matches) {
    const body = match[1] || ''
    const lines = body.split('\n')

    for (const line of lines) {
      const property = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*/)
      if (property?.[1]) props.add(property[1])
    }
  }

  return [...props]
}

function extractRuntimeRequiredProps(source: string): string[] {
  const props = new Set<string>()
  const objectMatch = source.match(/defineProps\s*\(\s*\{([\s\S]*?)\}\s*\)/)
  const body = objectMatch?.[1] || ''
  const propertyPattern = /([A-Za-z_$][\w$]*)\s*:\s*\{([\s\S]*?)\}(?:,|$)/g

  for (const match of body.matchAll(propertyPattern)) {
    if (/required\s*:\s*true/.test(match[2] || '') && match[1]) {
      props.add(match[1])
    }
  }

  return [...props]
}

function extractRequiredProps(source: string): string[] {
  return [
    ...new Set([
      ...extractTypeRequiredProps(source),
      ...extractRuntimeRequiredProps(source),
    ]),
  ].sort()
}

async function main() {
  const files = await collectVueFiles(componentRoot)
  const uncovered: Array<{
    sourcePath: string
    componentName: string
    requiredProps: string[]
    missingProps: string[]
  }> = []
  let covered = 0

  for (const absolutePath of files) {
    const source = await fs.readFile(absolutePath, 'utf8')
    const requiredProps = extractRequiredProps(source)
    if (!requiredProps.length) continue

    const relativePath = toPosix(path.relative(componentRoot, absolutePath))
    const sourcePath = `components/${relativePath}`
    const componentName = path.basename(relativePath, '.vue')
    const fixture = getWonderLabPreviewFixture(componentName, sourcePath)

    if (fixture?.skipReason) {
      covered += 1
      continue
    }

    const fixtureProps = new Set(Object.keys(fixture?.props || {}))
    const missingProps = requiredProps.filter((prop) => !fixtureProps.has(prop))

    if (missingProps.length) {
      uncovered.push({
        sourcePath,
        componentName,
        requiredProps,
        missingProps,
      })
    } else {
      covered += 1
    }
  }

  console.log(`WonderLab preview audit scanned ${files.length} Vue components.`)
  console.log(`${covered} required-prop components have fixture coverage or an explicit skip reason.`)
  console.log(`${uncovered.length} required-prop components still need preview coverage.`)

  for (const item of uncovered) {
    console.log(
      `- ${item.sourcePath}: missing fixture props ${item.missingProps.join(', ')}`,
    )
  }

  if (strict && uncovered.length) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('WonderLab preview audit failed:', error)
  process.exitCode = 1
})
