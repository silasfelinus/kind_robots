import { readFileSync, writeFileSync } from 'node:fs'

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

function replaceRegexRequired(source, pattern, replacement, label) {
  const matches = source.match(pattern)

  if (!matches?.length) {
    throw new Error(`Missing expected source matches: ${label}`)
  }

  return source.replace(pattern, replacement)
}

const storePath = 'stores/dreamStore.ts'
const chooserPath = 'components/dreams/dream-art-chooser.vue'

let store = readFileSync(storePath, 'utf8')

store = replaceRequired(
  store,
  `export interface DreamForm extends Partial<Dream> {
  scenarioId?: number | null
  createCollection?: boolean
  tagIds?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  addArtToCollection?: boolean
  updateNote?: string | null
  promptIds?: number[]
}`,
  `export interface DreamForm extends Partial<Dream> {
  scenarioId?: number | null
  tagIds?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  promptIds?: number[]
}`,
  'DreamForm workflow-only fields',
)

store = replaceRequired(
  store,
  `export interface DreamChatForm extends Partial<Chat> {
  dreamId?: number | null
  updateDream?: boolean
  artId?: number | null
  addArtToCollection?: boolean
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  updateNote?: string | null
}`,
  `export interface DreamChatForm extends Partial<Chat> {
  dreamId?: number | null
  updateDream?: boolean
  artId?: number | null
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
}`,
  'DreamChatForm obsolete mutation fields',
)

store = replaceRequired(
  store,
  `
    delete mutation.createCollection
    delete mutation.addArtToCollection
    delete mutation.updateNote

    return mutation
`,
  `
    return mutation
`,
  'Dream mutation compatibility deletes',
)

store = replaceRequired(
  store,
  `          updateNote:
            payload.updateNote ??
            (body.content ? \`Dream chat update: \${body.content}\` : undefined),
`,
  '',
  'Dream chat update note bridge',
)

store = replaceRegexRequired(
  store,
  /^\s+addArtToCollection:.*\n/gm,
  '',
  'Dream store addArtToCollection callers',
)

store = replaceRegexRequired(
  store,
  /^\s+updateNote: '[^'\n]*',\n/gm,
  '',
  'Dream store update note callers',
)

store = replaceRequired(
  store,
  `      updateNote: scenarioId
        ? 'Attached a Scenario to this Dream.'
        : 'Removed the Scenario from this Dream.',
`,
  '',
  'Dream scenario update note',
)

if (store.includes('createCollection')) {
  throw new Error('createCollection remains in dreamStore.ts')
}

if (store.includes('addArtToCollection')) {
  throw new Error('addArtToCollection remains in dreamStore.ts')
}

if (store.includes('updateNote')) {
  throw new Error('updateNote remains in dreamStore.ts')
}

writeFileSync(storePath, store)

let chooser = readFileSync(chooserPath, 'utf8')

chooser = replaceRegexRequired(
  chooser,
  /^\s+addArtToCollection:.*\n/gm,
  '',
  'Dream art chooser collection side-effect flags',
)

chooser = replaceRegexRequired(
  chooser,
  /^\s+updateNote: '[^'\n]*',\n/gm,
  '',
  'Dream art chooser simple update notes',
)

chooser = replaceRegexRequired(
  chooser,
  /^\s+updateNote: `[^`\n]*`,\n/gm,
  '',
  'Dream art chooser highlight update note',
)

const randomNote = [
  '        updateNote: `Set random highlight image #${chosen.id}${',
  "          chosenCollectionId ? ` from collection #${chosenCollectionId}` : ''",
  '        }.`,',
  '',
].join('\n')

chooser = replaceRequired(
  chooser,
  randomNote,
  '',
  'Dream art chooser random image update note',
)

if (chooser.includes('addArtToCollection')) {
  throw new Error('addArtToCollection remains in dream-art-chooser.vue')
}

if (chooser.includes('updateNote')) {
  throw new Error('updateNote remains in dream-art-chooser.vue')
}

writeFileSync(chooserPath, chooser)
