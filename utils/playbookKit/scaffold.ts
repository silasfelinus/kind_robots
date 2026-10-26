import type { PlaybookKitSpec, PlaybookTier } from './types'

// What `npm run playbook:new` writes. Pure, so the kit test can prove a
// freshly scaffolded playbook is green (under-built, never over budget).

export const IMPORT_MARKER = '// playbook:new imports'
export const ENTRY_MARKER = '  // playbook:new entries'

export function pascalCase(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function camelCase(id: string): string {
  const pascal = pascalCase(id)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function constName(id: string): string {
  return id.replace(/-/g, '_').toUpperCase()
}

/** The smallest valid playbook: one act, one meter, one follower, one villain, everything else still to build. */
export function starterSpec(
  id: string,
  title: string,
  tier: PlaybookTier = 'vignette',
): PlaybookKitSpec {
  return {
    id,
    conductorSlug: id,
    title,
    tagline: `${title}: one line that sells it.`,
    premise: 'Write the dramatic question in one sentence.',
    tier,
    route: `/admin/${id}`,
    keyArt: {
      brief: `Key art for ${title}: the protagonist, the world and the threat in one painted frame`,
      alt: `${title} key art`,
    },
    acts: [
      {
        id: 1,
        title: 'Act One',
        blurb: 'What the first act asks of the player.',
      },
    ],
    meters: [{ id: 'resolve', label: 'Resolve', min: 0, max: 10, start: 5 }],
    factions: [],
    cast: [
      {
        id: 'first-follower',
        role: 'follower',
        name: 'First follower',
        tagline:
          'Who they are, in one line, and what they want from the player.',
        portrait: { brief: 'Character portrait of the first follower' },
      },
      {
        id: 'nemesis',
        role: 'villain',
        primary: true,
        name: 'Nemesis',
        tagline: 'What they want, and why they are not simply wrong.',
        portrait: { brief: 'Villain portrait of the nemesis' },
      },
    ],
    reveals: [],
    endings: [],
    moments: [],
    trailer: { tagline: 'One line for the title card.', beats: [] },
  }
}

const quote = (text: string) =>
  `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const KEY = /^[A-Za-z_$][\w$]*$/

/** A TypeScript object literal in the repo's Prettier style. */
export function toSource(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent + 1)
  const close = '  '.repeat(indent)
  if (typeof value === 'string') return quote(value)
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    return `[\n${value.map((v) => `${pad}${toSource(v, indent + 1)},`).join('\n')}\n${close}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    if (!entries.length) return '{}'
    return `{\n${entries
      .map(
        ([k, v]) =>
          `${pad}${KEY.test(k) ? k : quote(k)}: ${toSource(v, indent + 1)},`,
      )
      .join('\n')}\n${close}}`
  }
  return 'null'
}

export function specSource(spec: PlaybookKitSpec): string {
  return `import type { PlaybookKitSpec } from '../types'

// ${spec.title}: scaffolded by npm run playbook:new. Build it rung by rung in
// the order the Forge Kit console shows; the kit test fails if it goes over budget.

export const ${constName(spec.id)}: PlaybookKitSpec = ${toSource(spec)}
`
}

/** Adds one playbook to utils/playbookKit/games/index.ts at its markers. */
export function registerSource(index: string, id: string): string {
  if (!index.includes(IMPORT_MARKER) || !index.includes(ENTRY_MARKER))
    throw new Error(
      'utils/playbookKit/games/index.ts lost its playbook:new markers',
    )
  const name = constName(id)
  if (index.includes(`{ ${name} }`)) return index
  return index
    .replace(
      IMPORT_MARKER,
      `import { ${name} } from './${camelCase(id)}'\n${IMPORT_MARKER}`,
    )
    .replace(ENTRY_MARKER, `  ${name},\n${ENTRY_MARKER}`)
}

export function pageSource(spec: PlaybookKitSpec): string {
  return `<template>
  <main
    class="kr-surface h-full min-h-0 overflow-hidden gap-0"
    data-layout="console-fixed"
  >
    <PlaybookKitShell :spec="${camelCase(spec.id)}">
      <div class="grid h-full min-h-full place-items-center p-4">
        <div class="flex w-full max-w-3xl flex-col gap-3">
          <PlaybookKitArt
            :art="${camelCase(spec.id)}.keyArt"
            tone="primary"
            icon="kind-icon:sparkles"
            with-brief
            class="aspect-video w-full rounded-2xl"
          />
          <p class="pk-prose">{{ ${camelCase(spec.id)}.premise }}</p>
          <NuxtLink
            :to="\`/admin/playbook-forge?kit=\${${camelCase(spec.id)}.id}\`"
            class="btn btn-primary self-start rounded-2xl"
          >
            Open the budget and ladder
          </NuxtLink>
        </div>
      </div>
    </PlaybookKitShell>
  </main>
</template>

<script setup lang="ts">
import { ${constName(spec.id)} as ${camelCase(spec.id)} } from '~/utils/playbookKit/games/${camelCase(spec.id)}'
</script>
`
}

const yaml = (text: string) => JSON.stringify(text)

export function tabSource(
  spec: PlaybookKitSpec,
  icon: string,
  sort: number,
): string {
  return `---
contentType: tab
channelKey: admin
tabKey: ${spec.id}
label: ${yaml(spec.title)}
title: ${yaml(spec.title)}
subtitle: ${yaml(spec.tagline)}
description: ${yaml(spec.premise)}
summary: ${yaml('A playbook in development.')}
icon: ${icon}
route: /admin/${spec.id}
sort: ${sort}
requiredRole: ADMIN
tutorial:
  title: ${yaml(spec.title)}
  body: >-
    A playbook in development on the Playbook Kit. Its spec lives in
    utils/playbookKit/games/${camelCase(spec.id)}.ts; the Playbook Kit console
    shows its complexity budget and the next rung to build.
  image: /images/art/resources.webp
---

Development preview of ${spec.title}.
`
}

/** Icons a scaffolded tab may take, in order; the first one the admin channel has not used wins. */
export const TAB_ICON_CANDIDATES = [
  'kind-icon:theater',
  'kind-icon:compass',
  'kind-icon:scroll',
  'kind-icon:wand',
  'kind-icon:layers',
  'kind-icon:toolbox',
  'kind-icon:rocket',
  'kind-icon:crown',
  'kind-icon:mask',
  'kind-icon:heart',
]
