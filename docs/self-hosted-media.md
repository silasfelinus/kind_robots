# Self-hosted image storage

Kind Robots keeps `/images/...` as its stable public URL contract while the
underlying files live outside the Git repository.

## Current infrastructure

- Public origin: `https://media.acrocatranch.com/images/...`
- Unraid filesystem root: `/mnt/user/pc/kindrobots/images`
- Windows share: `Z:\kindrobots\images`
- WSL mount: `/mnt/z/kindrobots/images`
- Nginx container: `media`

The Nginx container mounts the Unraid image root read-only and Traefik exposes
it publicly. Application writers use the filesystem path; browsers use the
stable `/images/...` path.

## Local environment

For development and maintenance commands running inside WSL, add this to the
local `.env` file:

```dotenv
IMAGES_PATH=/mnt/z/kindrobots/images
```

For commands running directly in Windows, use a Windows path instead:

```dotenv
IMAGES_PATH=Z:\kindrobots\images
```

Do not set `IMAGES_PATH` on Vercel. Vercel cannot write to the Unraid share.
Production upload behavior remains database-backed until a separate authenticated
media-ingest path is deliberately introduced.

When `IMAGES_PATH` is absent, the application falls back to `public/images`, so
existing checkouts continue to work.

## Startup intro animations

The full startup intro may replace the normal logo with one randomly selected
animated WebP. Store those files in the canonical external image tree:

```text
/mnt/user/pc/kindrobots/images/startup-animations/
Z:\kindrobots\images\startup-animations\
/mnt/z/kindrobots/images/startup-animations/
```

Use the numbered naming contract:

```text
launch-01.webp
launch-02.webp
launch-03.webp
```

The browser-facing URLs remain:

```text
/images/startup-animations/launch-01.webp
/images/startup-animations/launch-02.webp
```

`GET /api/startup/animations` discovers matching files directly from
`IMAGES_PATH` when the mounted share is available. On Vercel it discovers the
same public media directory through the media origin. Directory indexes and
`manifest.json` or `index.json` are supported; when none is present, the endpoint
probes the numbered `launch-01.webp` through `launch-40.webp` contract. Results
are cached briefly.

A manifest is optional. When used, it can be either an array or an object with an
`images` array:

```json
{
  "images": ["launch-01.webp", "launch-02.webp"]
}
```

The intro always falls back to `/images/kindlogo_new.webp` when no animation is
found or an animation cannot load.

## Live migration sync

During cutover, keep copying repository images to Unraid without deleting files
that exist only on Unraid:

```bash
rsync -rv \
  --size-only \
  --info=progress2 \
  --no-owner \
  --no-group \
  --no-perms \
  --no-times \
  --omit-dir-times \
  public/images/ \
  /mnt/z/kindrobots/images/
```

Never add `--delete` during migration. Unraid becomes the canonical store and
may contain new files that are not present in the repository.

A safe comparison pass is:

```bash
rsync -rvin \
  --size-only \
  --no-owner \
  --no-group \
  --no-perms \
  --no-times \
  --omit-dir-times \
  public/images/ \
  /mnt/z/kindrobots/images/
```

## Verification

Confirm the media origin and the Unraid file contain identical bytes:

```bash
curl -fsSL \
  https://media.acrocatranch.com/images/kindlogo_new.webp \
  -o /tmp/kindlogo_new.webp

sha256sum \
  /mnt/user/pc/kindrobots/images/kindlogo_new.webp \
  /tmp/kindlogo_new.webp
```

Normal media should return a one-hour migration cache, while collection
manifests use a 60-second cache:

```bash
curl -sSI https://media.acrocatranch.com/images/kindlogo_new.webp
curl -sSI https://media.acrocatranch.com/images/collections.json
curl -sSI https://media.acrocatranch.com/images/generated/gallery.json
```

## Cutover order

1. Set `IMAGES_PATH` locally and restart writers.
2. Create one new test image and confirm it lands on Unraid and is public.
3. Run the final incremental rsync without `--delete`.
4. Add the Vercel `/images/:path*` redirect to the media origin.
5. Verify the deployed application and folder manifests.
6. Stop committing new image binaries.
7. Remove the tracked image tree in a separate change.
8. Rewrite Git history only after all working copies and automation are ready.

## Automatic offload of generated art

Every art path funnels through `saveImage()`, which writes raw base64 into
`ArtImage.imageData` — a LongText column. Until 2026-08-05 nothing ever took it
back out, so the column grew with every completed job: **6,775 rows /
6,123.2 MB** at the point it was measured.

`server/utils/artImageOffload.ts` closes that loop. After a job completes — and
after any completion proof has been verified — `offloadArtImageBytes()` writes
the image to `IMAGES_PATH` under `generated/<year>/<month>/artimage-<id>.webp`,
points `imagePath` at it, and nulls `imageData`.

It runs from four places: the queue completion route
(`/api/art/queue/[id]/complete`) and the three direct generate routes
(`/api/art/generate`, `/api/comfy/sdxl/generate`,
`/api/chats/openai/images/generate`).

### It only runs where the share is real

**Only when `IMAGES_PATH` is set.** That is an explicit opt-in rather than a
probe of "is this directory writable", because the dangerous failure is the
inverse: a serverless filesystem accepts the write, discards it at the end of
the invocation, and leaves a row pointing at a file that no longer exists with
its only copy already deleted.

Vercel must never set `IMAGES_PATH` (see above), so **on Vercel this is a
no-op** and behaviour is exactly what it was. New art generated through a
Vercel-hosted API still lands in the database and needs the backfill below, run
from a host that can reach the share. Making production offload directly would
need the "separate authenticated media-ingest path" this document already names
as deliberately not built.

### It cannot destroy the only copy

`imageData` is nulled only after the file has been written, read back off the
filesystem, and hashed identical to what was written. The clearing update is
conditional on `imageData` still holding the value that was read, so a
concurrent write loses the race instead of being clobbered. Any failure leaves
the row exactly as it was, and the function never throws — it runs after the
caller's work has committed, where a throw would turn a finished generation
into a 500 and lose the job.

`npm run test:art-image-offload` pins all of that; every assertion in it has
been watched to fail under mutation.

### Backfilling what is already stored

```bash
npm run offload:art-images                 # dry run
npm run offload:art-images -- --write      # move bytes, largest rows first
```

Safe to interrupt and safe to re-run. Afterwards, `OPTIMIZE TABLE ArtImage`
returns the freed pages to the filesystem — until then the tablespace stays the
same size on disk.

#### Run it on the box that holds the share

The script needs the repository, not just the file — it imports the same
`offloadArtImageBytes` helper the live routes use, plus the Prisma client. So
copying `offloadArtImageData.ts` alone will not work; check the repo out on the
network machine instead:

```bash
git clone https://github.com/silasfelinus/kind_robots   # or: git pull
cd kind_robots
npm ci
npx prisma generate

# Point at the share's NATIVE path on that box, not a Windows/WSL mount
export IMAGES_PATH=/mnt/user/pc/kindrobots/images
export DATABASE_URL='...'                # same database the app uses

npm run offload:art-images               # dry run first — reports the plan
npm run offload:art-images -- --write
```

Writing several gigabytes across an SMB mount from WSL is far slower than
writing to the Unraid filesystem directly, and every byte crosses the network
twice (database → WSL → share) instead of once. Running on the box that owns
the share avoids both.

**It refuses to run against a path that is not the share.** The root must
already exist as a directory *and* already contain files. Everything here uses
`mkdir -p`, so without that preflight a typo'd `IMAGES_PATH` would be silently
created, gigabytes would be written to the wrong filesystem, every read-back
would verify happily, and the database copies would be deleted — a run that
looks completely successful and has lost the art. A mounted share has thousands
of images at its root; an empty directory means the mount is absent.

### Export → link → prune, in that order

`npm run prune:art-image-data` only reclaims rows that **already** have a
verified external copy. On 2026-08-05 that population was empty, which is worth
recording because the dry run's output actively misled:

```
100 KB and over    3791 rows   6131.2 MB
under 100 KB        211 rows     16.9 MB
empty              2784 rows        0 MB
under 512 B           2 rows        0 MB
```

All 2,784 rows the pruner examined and rejected as "stored base64 did not
decode" were `imageData = ''` — an empty string passes an `IS NOT NULL` filter
and then fails a truthiness check. Nothing was corrupt and nothing was wrong
with the decoder; the prune simply had the wrong population, because the
6.1 GB lives in 3,791 rows that have no external copy for it to verify. The
pruner now reports those as `skip-empty-column` so the distinction is visible.
