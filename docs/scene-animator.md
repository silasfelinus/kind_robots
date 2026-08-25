# Scene Animator

Scene Animator is an administrator-only folder-to-video production surface at
`/admin/scene-animator`. It turns a directory of still scene images into short
LTX or WAN clips by reusing the normal Kind Robots video path:

```text
Scene Animator
  -> POST /api/scene-animator/enqueue
  -> POST /api/video/generate
  -> POST /api/art/enqueue
  -> ArtJob
  -> kr-relay
  -> ComfyUI LTX/WAN
  -> ArtImage
```

It deliberately does not own another render queue. ArtJobs remain the durable
ledger for pending, running, failed, cancelled, and completed work.

## Source tree

Scene Animator reads source stills from a dedicated tree, separate from
`kindrobots/images` generated/public art.

Production target:

```text
/mnt/user/pc/kindrobots/animate/
  project-a/
    scene-001.webp
    scene-002.png
  project-b/
    shot-01.jpg
```

Set the source root explicitly when the application can see that path:

```dotenv
ANIMATE_PATH=/mnt/user/pc/kindrobots/animate
```

For WSL development the equivalent is typically:

```dotenv
ANIMATE_PATH=/mnt/z/kindrobots/animate
```

When `ANIMATE_PATH` is absent but `IMAGES_PATH` is configured, Scene Animator
uses an `animate` sibling of the configured image root. With
`IMAGES_PATH=/mnt/user/pc/kindrobots/images`, that resolves to
`/mnt/user/pc/kindrobots/animate`. When neither variable exists, local
development falls back to `<repo>/animate`.

The source API only accepts normalized relative folders and image filenames.
Absolute paths, `..` traversal, and symlink escapes are rejected. The MVP is
read-only: it never deletes, renames, or mutates source stills.

## Verifying the mount

`GET /api/scene-animator/health` (admin-only) reports whether the configured
source root actually resolves, without loading the full folder/source
listing: which of `ANIMATE_PATH`, an `IMAGES_PATH`-derived sibling, or the
local `<repo>/animate` fallback is in effect, plus a folder/image count when
reachable. It answers `200` when the root is reachable and `503` with a
specific reason (not mounted, wrong permissions, etc.) when it is not.

The batch page's own `GET /api/scene-animator` reports the same signal inline
as `rootAvailable` in its response, so a misconfigured or not-yet-mounted
root surfaces as a clear message in the admin UI instead of an opaque request
failure.

The application/container still needs read access to the chosen source root.
Adding or changing a production bind mount is an operator deployment step; the
code does not attempt to alter container configuration itself.

## Automatic motion prompt

The still image is treated as the creative prompt. Every batch uses the same
scene-preserving motion direction:

> Bring this still scene naturally to life with subtle coherent motion. Preserve
> the subjects, composition, identity, lighting, and visual style. Add only
> plausible ambient movement, gentle secondary motion, and stable cinematic
> camera behavior. Do not introduce new characters, objects, text, or scene
> changes.

Manual per-shot prompting remains available in `/play/video-generator` rather
than complicating the batch workflow.

## Resume and deduplication

Each Scene Animator ArtJob receives a `sceneAnimator` provenance object in its
payload containing:

- source folder and filename
- SHA-256 of the source bytes
- effective video configuration
- a deterministic dedupe key

The dedupe key is derived from source bytes plus engine, preset, duration, FPS,
size, output format, loop mode, render scale, and maturity. The admin page
reconstructs progress from those ArtJobs after a refresh or restart.

`Start / Resume` skips matching PENDING, RUNNING, and DONE jobs. Failed and
cancelled jobs stay visible and can be retried explicitly. Editing a source
image or changing effective render settings creates a new key on purpose.

## Privacy and maturity

Generated Scene Animator ArtImages are private by default. The batch maturity
toggle is forwarded to the existing ArtJob/ArtImage maturity fields; no new
content classification system is introduced. Source previews are streamed
through an authenticated admin API rather than exposed as a public source
folder.
