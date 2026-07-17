// /components/screenfx/effect-component-registry.ts
import { defineAsyncComponent, type Component } from 'vue'
import type { AnimationEffectId } from '@/stores/animationCatalog'

type EffectModule = {
  default: Component
}

const effectModules = import.meta.glob<EffectModule>('./*.vue')
const componentCache = new Map<AnimationEffectId, Component>()

export function getAnimationEffectComponent(
  effectId: AnimationEffectId,
): Component | null {
  const cached = componentCache.get(effectId)
  if (cached) return cached

  const loader = effectModules[`./${effectId}.vue`]
  if (!loader) return null

  const component = defineAsyncComponent(async () => {
    const module = await loader()
    return module.default
  })

  componentCache.set(effectId, component)
  return component
}
