# Generating Dreams

Model: `Dream`. Endpoints: `POST /api/dreams`, `POST /api/dreams/batch`.
Helper: `stores/helpers/dreamHelper.ts` (`parseDreamType` maps legacy names).

## Resource boundary

Dream endpoints create and update Dream rows. They may connect existing related records by ID, but they do not create chats, art collections, starter images, bots, characters, rewards, scenarios, or pitch sheets.

Create optional resources through their own stores and endpoints only when the workflow needs them:

- Art collections: `collectionStore`
- Art images: art generation and image endpoints
- Bots and narrators: `botStore`
- Characters: `characterStore`
- Rewards: `rewardStore`
- Scenarios: `scenarioStore`
- Pitch sheets: PitchSheet store and endpoints
- Chats: `chatStore`

## The flavors

`dreamType` enum: `ART, BRAINSTORM, PROMPTBOT, NARRATOR, CHARACTER, REWARD, SCENARIO, LOCATION, PITCH, WISH` with `PITCH` as the default.

| dreamType | What it is |
| --- | --- |
| `LOCATION` | A place or world that can later be connected to narrators, cast, art, and stories |
| `BRAINSTORM` | A container for generated ideas and remix material |
| `PROMPTBOT` | A reusable bot concept or prompt seed |
| `NARRATOR` | A narrator concept or voice seed |
| `CHARACTER` | A character concept ready for expansion |
| `REWARD` | An item, ability, permission, or prize concept |
| `SCENARIO` | A situation with pressure, choices, and consequences |
| `ART` | A visual concept or art-generation seed |
| `PITCH` | A compact reusable idea |
| `WISH` | A request or intention ready to become a useful plan |

## Field spec

Required: `title`.

Recommended: `slug`, `dreamType`, `description`, `pitch`, `artPrompt`, and `creationSource`.

| Field | Fill with |
| --- | --- |
| `title`, `slug` | Evocative title and kebab-case slug |
| `pitch` | The one-to-three sentence hook |
| `description` | Expanded context, constraints, conflicts, or story fuel |
| `flavorText` | One quotable mood line |
| `examples` | Optional riffs or reusable outputs |
| `artPrompt` | A visual brief, not an instruction to create art during Dream persistence |
| `icon` | A `kind-icon:*` name |
| `designer`, `userId` | Ownership and attribution |
| `cardPath`, `heroPath`, `imagePath` | Existing paths when art already exists |
| `artImageId`, `artCollectionId` | Existing primary records to connect |

Relations may be connected at creation time when their IDs already exist. Create the related objects first through their own endpoints, then pass the IDs to Dream or use the relevant relationship endpoint.

## Workflow bundles

A larger workflow may coordinate a Dream with art, a narrator, scenarios, characters, rewards, or a PitchSheet. That coordination belongs in stores or an explicitly named workflow endpoint. `POST /api/dreams` and `POST /api/dreams/batch` remain fast and unsurprising.
