// /server/utils/fluxTextEncoders.ts
//
// One definition of which text encoders every Flux-family workflow loads, and
// which loader node to express them with.
//
// Why this exists. The render box is a 12 GB card with little system RAM, and
// the Kontext graph did not fit in it:
//
//   flux1-kontext-dev-Q5_K_M.gguf        unet, GGUF          ~8.0 GB
//   t5xxl_fp8_e4m3fn_scaled.safetensors  text encoder, fp8    4.80 GB
//   clip_l.safetensors                                        0.23 GB
//   ae.safetensors                       VAE                  0.33 GB
//                                                    total  ~13.4 GB
//
// Over 12 GB, so ComfyUI spilled to system RAM and thrashed. ArtJob 8276 blew
// through the relay's 30-minute GEN_TIMEOUT without producing an image. The
// unet was already quantised; the text encoder was the half nobody had moved.
// t5-v1_1-xxl-encoder-Q5_K_S.gguf is 3.07 GB -- 1.73 GB back, from a file
// already sitting in the same folder, with no download.
//
// Why a module rather than six edited literals. The same pair was hardcoded in
// six places (kontext/utils/workflow, kontext/generate, kontext/kombine, flux,
// characterSheet, comfyTestClient) AND in artJobRetry's normalizer, which
// rewrites clip_name1/clip_name2 on every retry. Changing only the builders
// would work until a job was retried, at which point the normalizer would put
// the fp8 encoder back -- an intermittent regression that would have looked
// like the GGUF switch "not sticking".
//
// The loader class follows the filename, so switching back is an env change
// rather than a code edit: point FLUX_T5_ENCODER at a .safetensors and the
// stock DualCLIPLoader returns. Note the GGUF loader takes no `device` input --
// kombine.post.ts already used DualCLIPLoaderGGUF and correctly omitted it,
// while feeding it a .safetensors name, which is the drift this consolidates.

const DEFAULT_T5 = 't5-v1_1-xxl-encoder-Q5_K_S.gguf'
const DEFAULT_CLIP_L = 'clip_l.safetensors'

function envName(key: string, fallback: string): string {
  const value = (process.env[key] || '').trim()
  return value || fallback
}

/** The T5 encoder every Flux-family graph loads. */
export const FLUX_T5_ENCODER = envName('FLUX_T5_ENCODER', DEFAULT_T5)

/** The CLIP-L encoder every Flux-family graph loads. */
export const FLUX_CLIP_L_ENCODER = envName(
  'FLUX_CLIP_L_ENCODER',
  DEFAULT_CLIP_L,
)

export function isGgufEncoder(name: string): boolean {
  return name.trim().toLowerCase().endsWith('.gguf')
}

/** True when this workflow's encoders need city96's GGUF loader node. */
export function fluxEncodersAreGguf(): boolean {
  return isGgufEncoder(FLUX_T5_ENCODER) || isGgufEncoder(FLUX_CLIP_L_ENCODER)
}

export const FLUX_DUAL_CLIP_LOADER_CLASSES = [
  'DualCLIPLoader',
  'DualCLIPLoaderGGUF',
] as const

/** Does this node load the Flux text-encoder pair, in either loader flavour? */
export function isFluxDualClipLoader(classType: unknown): boolean {
  return (
    typeof classType === 'string' &&
    (FLUX_DUAL_CLIP_LOADER_CLASSES as readonly string[]).includes(classType)
  )
}

type DualClipLoaderNode = {
  inputs: Record<string, unknown>
  class_type: string
  _meta: { title: string }
}

/**
 * The complete DualCLIPLoader node for a Flux graph.
 *
 * `device` is emitted only for the stock loader. DualCLIPLoaderGGUF's inputs
 * are clip_name1/clip_name2/type, and passing it an input it does not declare
 * risks a validation rejection at submit — the same class of failure as a
 * lora_name that is not in the list.
 */
export function fluxDualClipLoaderNode(): DualClipLoaderNode {
  const gguf = fluxEncodersAreGguf()
  const inputs: Record<string, unknown> = {
    clip_name1: FLUX_T5_ENCODER,
    clip_name2: FLUX_CLIP_L_ENCODER,
    type: 'flux',
  }
  if (!gguf) inputs.device = 'default'

  return {
    inputs,
    class_type: gguf ? 'DualCLIPLoaderGGUF' : 'DualCLIPLoader',
    _meta: { title: gguf ? 'DualCLIPLoader (GGUF)' : 'DualCLIPLoader' },
  }
}
