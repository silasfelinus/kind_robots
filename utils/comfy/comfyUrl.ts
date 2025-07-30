// utils/comfy/comfyUrl.ts
export function comfyUrl(): string {
  return process.env.COMFY_WS || 'wss://0.0.0.0:8188'
}
