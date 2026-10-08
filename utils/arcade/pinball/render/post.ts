// /utils/arcade/pinball/render/post.ts
//
// Post-processing for the pinball renderer (conductor kind-pinball/t-019):
// the scene is drawn into a multisampled half-float buffer, a restrained
// bloom makes lit inserts and flashers glow, and the output pass applies
// ACES tone mapping and sRGB. The bloom buffer can run below full resolution
// (the medium tier); the low tier skips this module and draws straight to
// the screen.

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/** Only light brighter than this (linear, before tone mapping) blooms. */
const BLOOM_THRESHOLD = 1.5
const BLOOM_STRENGTH = 0.5
const BLOOM_RADIUS = 0.35

export type PostChain = {
  render(): void
  setSize(width: number, height: number, pixelRatio: number): void
  dispose(): void
}

export function createPostChain(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { bloomScale: number; samples: number },
): PostChain {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: options.samples,
  })
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD,
  )
  // The composer sizes every pass to the drawing buffer; the bloom's own
  // buffers can be smaller, since a glow carries no fine detail.
  const sizeBloom = bloom.setSize.bind(bloom)
  bloom.setSize = (width: number, height: number) =>
    sizeBloom(
      Math.max(1, Math.round(width * options.bloomScale)),
      Math.max(1, Math.round(height * options.bloomScale)),
    )
  composer.addPass(bloom)
  const output = new OutputPass()
  composer.addPass(output)
  return {
    render: () => composer.render(),
    setSize: (width, height, pixelRatio) => {
      composer.setPixelRatio(pixelRatio)
      composer.setSize(width, height)
    },
    dispose: () => {
      bloom.dispose()
      output.dispose()
      composer.dispose()
      target.dispose()
    },
  }
}
