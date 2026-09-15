// /server/utils/fluxTextEncoders.ts
//
// One definition of which text encoders Flux-family workflows load, and which
// loader node expresses each pair.
//
// Most Flux workflows use a GGUF T5 encoder to stay inside the render box's
// 12 GB VRAM budget:
//
//   flux1-kontext-dev-Q5_K_M.gguf        unet, GGUF          ~8.0 GB
//   t5xxl_fp8_e4m3fn_scaled.safetensors  text encoder, fp8    4.80 GB
//   clip_l.safetensors                                        0.23 GB
//   ae.safetensors                       VAE                  0.33 GB
//                                                    total  ~13.4 GB
//
// t5-v1_1-xxl-encoder-Q5_K_S.gguf is 3.07 GB, recovering 1.73 GB for ordinary
// Flux workloads. Kontext is the exception: the GGUF T5 switch introduced in
// #1870 produces pure static on the live image-edit path, while the proven
// working graph uses t5xxl_fp8_e4m3fn_scaled.safetensors with DualCLIPLoader.
// Keep that compatibility choice separate so ordinary Flux keeps the memory win.
//
// Why a module rather than edited literals. The same pair is used by several
// workflow builders and artJobRetry's normalizer. Retry normalization must use
// the same engine-specific choice as fresh jobs or a healthy Kontext job can be
// silently rewritten back onto the broken encoder path.

const DEFAULT_T5 = 't5-v1_1-xxl-encoder-Q5_K_S.gguf'
const DEFAULT_KONTEXT_T5 = 't5xxl_fp8_e4m3fn_scaled.safetensors'
const DEFAULT_CLIP_L = 'clip_l.safetensors'

function envName(key: string, fallback: string): string {
  const value = (process.env[key] || '').trim()
  return value || fallback
}

/** The T5 encoder ordinary Flux-family graphs load. */
export const FLUX_T5_ENCODER = envName('FLUX_T5_ENCODER', DEFAULT_T5)

/**
 * The T5 encoder Kontext image-edit graphs load.
 *
 * This intentionally defaults to the fp8 safetensors encoder used by the
 * known-good Kontext workflow and by Kind Robots before #1870. It has its own
 * override so operators can experiment without changing ordinary Flux jobs.
 */
export const KONTEXT_T5_ENCODER = envName(
  'KONTEXT_T5_ENCODER',
  DEFAULT_KONTEXT_T5,
)

/** The CLIP-L encoder every Flux-family graph loads. */
export const FLUX_CLIP_L_ENCODER = envName(
  'FLUX_CLIP_L_ENCODER',
  DEFAULT_CLIP_L,
)

export function isGgufEncoder(name: string): boolean {
  return name.trim().toLowerCase().endsWith('.gguf')
}

/** True when the ordinary Flux encoder pair needs city96's GGUF loader node. */
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

function dualClipLoaderNode(
  t5Encoder: string,
  clipLEncoder: string,
): DualClipLoaderNode {
  const gguf = isGgufEncoder(t5Encoder) || isGgufEncoder(clipLEncoder)
  const inputs: Record<string, unknown> = {
    clip_name1: t5Encoder,
    clip_name2: clipLEncoder,
    type: 'flux',
  }
  if (!gguf) inputs.device = 'default'

  return {
    inputs,
    class_type: gguf ? 'DualCLIPLoaderGGUF' : 'DualCLIPLoader',
    _meta: { title: gguf ? 'DualCLIPLoader (GGUF)' : 'DualCLIPLoader' },
  }
}

/**
 * The complete DualCLIPLoader node for ordinary Flux graphs.
 *
 * `device` is emitted only for the stock loader. DualCLIPLoaderGGUF's inputs
 * are clip_name1/clip_name2/type, and passing it an input it does not declare
 * risks a validation rejection at submit.
 */
export function fluxDualClipLoaderNode(): DualClipLoaderNode {
  return dualClipLoaderNode(FLUX_T5_ENCODER, FLUX_CLIP_L_ENCODER)
}

/** The proven-good text-loader node for Kontext image-edit graphs. */
export function kontextDualClipLoaderNode(): DualClipLoaderNode {
  return dualClipLoaderNode(KONTEXT_T5_ENCODER, FLUX_CLIP_L_ENCODER)
}
