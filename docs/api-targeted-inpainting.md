# Targeted SDXL inpainting API

POST /api/art/inpaint-targets (authenticated generation:art scope).

Submit one source PNG/JPEG/WebP data URL and 1–12 normalized region targets.
Outside each target's explicit bleed, the output is the decoded original
image. A separate ImageCompositeMasked graph stage enforces this: SDXL's
latent inpainting mask alone is not sufficient to protect original pixels.

A target is a box with [left, top, right, bottom], or a polygon with [x, y]
vertices. All coordinates are fractions of the oriented original image
(0–1). bleedPx expands the permitted edit region. featherPx softens inside
that boundary but never expands it. Defaults are bleedPx 12, featherPx 8.

Example request:

    {
      "engine": "sdxl",
      "imageData": "data:image/png;base64,...",
      "prompt": "Two open eyes embedded in the back of a black bob haircut",
      "targets": [
        {"type":"box","box":[0.24,0.33,0.48,0.55],"bleedPx":12},
        {"type":"box","box":[0.52,0.33,0.76,0.55],"bleedPx":12}
      ],
      "mode": "crop",
      "contextPx": 128,
      "featherPx": 10,
      "steps": 24,
      "cfg": 5,
      "denoise": 0.65,
      "checkpoint": "SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors",
      "projectSlug": "shifting-desks",
      "requestKey": "shifting-desks:rear-eyes:targeted-sdxl-v1",
      "isPublic": false
    }

## Modes and preview

- full-frame: encode the full source, padding to a multiple of 8 if needed.
- crop: encode the union of the regions expanded by contextPx (default 128);
  pad the sample to a multiple of 8, inpaint, then composite at the crop offset.
  Both modes save a whole original-sized output.

Set previewOnly:true to return crop metadata and the hard/soft masks without
creating an ArtJob or consuming generation credits. The preview's noiseMaskData
shows the requested edit footprint; compositeMaskData shows the feathered
blend. Both masks are stored with the original source, sample and settings
inside the durable ArtJob payload for audit and retry.

An ordinary response returns a jobId to poll via /api/art/queue/:id.
A stable requestKey deduplicates PENDING/RUNNING/DONE submissions.

## Constraints

- Scoped generation:art authentication required.
- All created ArtImages are private; isPublic:true is rejected.
- Maximum decoded image 10 MiB and 4.2 million pixels, minimum 64px per side.
- At most 12 targets; bleedPx 0..96, featherPx 0..48, contextPx 0..384.
- ArtJob DONE means delivered, not visually approved. Each result requires
  a full-image inspection and explicit KEEP/REDO before any production link.
- The route never overwrites, attaches, or publishes the source ArtImage.

Currently engine=sdxl is implemented; this stable request contract can host
other generation engines without changing how callers describe target regions.

## Opt-in masked-source VAE pilot

By default `inpaintEncoding` is `source-preserving`, the original
`VAEEncode` plus `SetLatentNoiseMask` behavior. For a **private** corrective
art pilot where the ordinary source latents resist a requested change, set
`"inpaintEncoding": "masked-vae"`. This replaces the initial VAE encoding
node with ComfyUI's built-in `VAEEncodeForInpaint` (zero latent mask growth).
It clears the source's masked pixels to a neutral gray before encoding, while
the existing latent noise mask and final `ImageCompositeMasked` still run.

The option changes only a caller that explicitly supplies it; legacy requests
and any existing ArtJob payload retain their previous graph and dedup identity.
`previewOnly` echoes the selected encoding. The ArtJob's `regionEdit`
metadata records it for later reproducibility and audit. The endpoint remains
private-only and does not publish or attach generated ArtImages automatically.

This is an **experimental corrective option**, not evidence that a rendered
result is successful. The Shifting Desks source 273631 / targeted output 274183
had a valid nonempty preview mask but no significant in-mask pixel changes.
Before accepting a follow-up private candidate, verify a nontrivial masked-pixel
delta **and** a scene-faithful visual edit independently.
