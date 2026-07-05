# Da Vinci ending seed importer

Populates the 1024 deterministic Da Vinci ending records from the conductor
generator output. Source of truth for the payload shape lives in the conductor
repo: `scripts/generate_davinci_endings.py` and
`projects/davinci/docs/ending-seed-and-art-flow.md`.

## Generate the seed file (conductor repo)

```bash
python scripts/generate_davinci_endings.py --format jsonl --output tmp/davinci-endings.jsonl
```

JSON (`--format json`) works too — the importer accepts both.

## Import (this repo)

```bash
npm run seed:davinci -- path/to/davinci-endings.jsonl            # dry run
npm run seed:davinci -- path/to/davinci-endings.jsonl --write    # apply
```

Requires `DATABASE_URL`. The importer is idempotent — safe to re-run; counts
do not grow on repeat runs.

## What it writes

Per ending payload:

- **Milestone** upserted by `triggerCode` (`davinci-ending-{outcomeKey}`),
  non-repeatable, active, with icon/imagePath as path strings and the art
  prompt stored for the future local generator pipeline.
- **LifeEnding** upserted by `outcomeKey`, linked to the Milestone via
  `milestoneId`.
- **LifeAchievement** matched by `conditionKey` (`ending:{outcomeKey}`),
  type `ENDING`, linked to both the Milestone and the LifeEnding.

## What it deliberately does NOT do

- No `ArtImage` rows are created. `iconArtImageId`, `heroArtImageId`, and
  `artImageId` stay null until the local generator pipeline produces real
  files — icon and hero images exist only as path strings for now.
- No art generation jobs are enqueued.
- No `LifeAchievementUnlock` rows. Note for the future unlock endpoint:
  MySQL treats NULLs as distinct in the `(userId, achievementId, lifeRunId)`
  unique constraint, so global unlocks (null `lifeRunId`) need an explicit
  API-layer duplicate guard.
