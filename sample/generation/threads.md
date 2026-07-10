# Generating Narration Threads

Models: `NarratorTopic` + `NarratorThread`. Endpoints:
`POST /api/bots/topics`, `POST /api/bots/threads` (both batch upserts,
CHUNK_SIZE 25, accept `dryRun: true`). Read side:
`GET /api/narrators/{type}/{slug}`.

Topics are the shared conversation menu (one row per subject, reused
across all narrators). Threads are one narrator's take on one topic —
unique per `(botId, topicId)`.

## NarratorTopic field spec

Required: `slug`, `title`, `prompt`.

| Field | Fill with |
| --- | --- |
| `slug`, `title`, `subtitle` | Topic identity (`storytime`, "Story Time", …) |
| `description` | What this conversation mode is |
| `icon` | `kind-icon:*` name |
| `prompt` | System-flavored guidance for ANY narrator running this topic |
| `sampleUserPrompt` | Example user opener |
| `sortOrder` | Menu position |

Topics are near-canon: prefer reusing existing topics over minting new
ones. A new topic changes every narrator's menu — check with Silas first.

## NarratorThread field spec

Required: `botId` (or `botName` — the endpoint resolves it), `topicId`,
`openingText`.

| Field | Fill with |
| --- | --- |
| `title` | Optional thread title; falls back to topic title |
| `openingText` | The narrator's in-voice opener for this topic — written in that bot's `narrativeVoice`, not generic |
| `guidance` | Topic-specific steering for the LLM, layered on the bot's `botIntro` |
| `starterPrompts` | Json array of `{ label, prompt, action, path?, flavor?, key?, screen? }` — the suggestion chips |
| `sortOrder`, `isActive` | Menu position / soft delete |

## Art

Threads have no art of their own — the owning bot's avatar and
expression set carry the visuals. Generating threads for a bot therefore
presumes the bot already satisfies `bots.md` (avatar + expressions).

## Checklist

1. `dryRun: true` the batch first; fix `skipped/failed` rows.
2. One thread per (narrator × topic) that narrator should offer —
   a full menu is every active topic, each with a distinct in-voice
   `openingText`.
3. Verify: `/api/narrators/{type}/{slug}` returns the threads and the
   narrator screen shows the topic menu.
