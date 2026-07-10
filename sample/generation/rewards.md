# Generating Rewards

Model: `Reward`. Endpoints: `POST /api/rewards`, `POST /api/rewards/batch`,
`GET /api/rewards/random`.

Rewards are narrative accelerants: loot, powers, skills, secrets, pets,
curses, keys, plot grenades. They get played into scenarios and attached
to characters and dreams.

## Field spec

Required: `name`. Always set: `slug`, `description`, `flavorText`,
`effect`, `rarity`, `rewardType`, `icon`, `artPrompt`.

| Field | Fill with |
| --- | --- |
| `name`, `slug` | Punchy item name; kebab slug |
| `rewardType` | `SKILL / ITEM / POWER / PET / MAGIC / FAVOR` |
| `rarity` | `COMMON / UNCOMMON / RARE / EPIC / LEGENDARY / MYTHIC` — skew common; legendaries are earned |
| `flavorText` | One quotable line (≤512) — the card text |
| `effect` | What it mechanically/narratively DOES when played into a scene |
| `description` | Longer lore |
| `collection` | Set name when generating themed batches (e.g. a dream's loot table) |
| `icon` | `kind-icon:*` name |
| `artPrompt` | Item-card prompt, house style |
| `userId`, `designer` | README rule 5 |

Connect when generating themed sets: `Dreams` (the loot's home world),
`Characters` (signature owner).

## Art set

| Asset | Path / field | Notes |
| --- | --- | --- |
| Card image | `imagePath` / `artImageId` (512×768) | one per reward |
| Collection folder | `public/images/rewards/{collection-slug}/` | themed batches share a folder; ArtCollection rows use `parentFolder: 'rewards'` |

## Checklist

1. Batch-write the reward rows (a themed set is 5–12 rewards spanning
   rarities and types).
2. Generate one card image per reward from `artPrompt`.
3. Verify: rewards render in the gallery, rarity/type filters catch
   them, and `random.get` can serve them.
