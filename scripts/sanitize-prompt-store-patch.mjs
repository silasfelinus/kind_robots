import { readFileSync, writeFileSync } from 'node:fs'

const path = 'stores/promptStore.ts'
const source = readFileSync(path, 'utf8')
const target = `        const response = await performFetch<Prompt>(
          \`/api/prompts/\${promptId}\`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          },
        )`
const replacement = `        const payload = Object.fromEntries(
          Object.entries({
            prompt: updates.prompt,
            artPrompt: updates.artPrompt,
            creationSource: updates.creationSource,
            isMature: updates.isMature,
            isPublic: updates.isPublic,
            isActive: updates.isActive,
            botId: updates.botId,
            artImageId: updates.artImageId,
          }).filter(([, value]) => value !== undefined),
        )

        const response = await performFetch<Prompt>(
          \`/api/prompts/\${promptId}\`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        )`

if (!source.includes(target)) {
  throw new Error('Expected Prompt update request block was not found.')
}

writeFileSync(path, source.replace(target, replacement), 'utf8')
