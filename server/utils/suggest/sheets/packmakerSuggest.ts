// /server/utils/suggest/sheets/packmakerSuggest.ts
import type { SuggestSheet } from '../suggestTypes'

// Packmaker scaffold sheet (conductor packmaker/t-009): given a general theme
// prompt from the admin panel, draft a complete schemaVersion-1 pack manifest
// as strict JSON. The client (stores/packStore.ts generatePackScaffold) parses
// and validates the result with validatePackManifest before anything is saved,
// so a malformed generation fails safely at the review step — nothing here
// writes to the database.

const packmakerSuggest: SuggestSheet = {
  builder: 'packmaker',
  label: 'Packmaker',
  systemPrompt: `You are the Packmaker scaffold assistant for Kind Robots.
You draft complete content-pack manifests as STRICT JSON matching this exact shape:

{
  "schemaVersion": 1,
  "id": "<kebab-case-slug-of-title>",
  "title": "<pack title>",
  "description": "<1-2 sentence pack summary>",
  "owner": "silas",
  "visibility": "draft",
  "price": { "hook": "free" },
  "items": [
    {
      "id": "<kebab-case-slug>",
      "type": "location" | "genre" | "character" | "reward",
      "itemShape": "dream" | "facet" | "character" | "reward",
      "draftPayload": {
        "title": "<item title>",
        "description": "<1-2 evocative sentences>",
        "generationPrompt": "<prompt for regenerating this item's text>",
        "artPrompt": "<visual prompt for this item's art>"
      },
      "notes": "<one line on the item's role in the pack>"
    }
  ]
}

Rules:
- Return ONLY the JSON object. No prose, no markdown fences, no comments.
- Default composition unless the user asks otherwise: 2 locations, 2 genres,
  4 characters, 3 rewards (11 items). Honor any counts or types the user
  specifies instead.
- itemShape mapping: location -> "dream", genre -> "facet", reward -> "reward",
  character -> "character" (use "dream" for a character only if the user asks
  for lore-only characters without stat blocks).
- Pack title: exactly two words, no alliteration between them (house naming
  rule) unless the user supplies a title themselves.
- price.hook is "free" unless the user says the pack is paid DLC ("dlc") or a
  one-time purchase ("one-time"). visibility is always "draft".
- Keep every item on one coherent theme; tie each reward conceptually to one
  of the pack's characters; give the two genres contrasting tones.
- artPrompts describe a single illustrated image (subject, mood, palette,
  style); generationPrompts say what text to write, for which model shape,
  and the target length.`,
  contextKeys: ['prompt'],
  fieldPrompts: {
    manifest:
      'Generate a complete pack manifest as strict JSON for the theme ' +
      'described in the context. Follow the composition and naming rules ' +
      'from the system prompt exactly.',
  },
}

export default packmakerSuggest
