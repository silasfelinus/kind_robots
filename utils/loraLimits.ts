// /utils/loraLimits.ts
//
// How many LoRAs one job may stack.
//
// ComfyUI itself has no limit -- LoRA loaders chain -- but each link is another
// set of weights merged at load time: past a handful the render slows and the
// styles mud together. A request over the cap is truncated rather than rejected.
//
// It lives in utils/ rather than beside the chain builder so the browser and the
// server import the SAME number. A picker offering a slot the queue refuses is
// the kind of drift that only shows up as a 400 in someone's face.
export const MAX_LORAS_PER_JOB = 6
