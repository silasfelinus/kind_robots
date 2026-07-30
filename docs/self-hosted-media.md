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
