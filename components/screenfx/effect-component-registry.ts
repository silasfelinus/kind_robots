// /components/screenfx/effect-component-registry.ts
import { defineAsyncComponent, type Component } from 'vue'
import {
  getAnimationComponentName,
  type AnimationEffectId,
} from '@/stores/animationCatalog'

type EffectModule = {
  default: Component
}

const effectModules = import.meta.glob<EffectModule>('./*.vue')
const componentCache = new Map<AnimationEffectId, Component>()

function pascalFromPath(path: string): string {
  const filename = path.split('/').at(-1)?.replace(/\.vue$/, '') ?? ''

  return filename
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

const effectLoaders = new Map(
  Object.entries(effectModules).map(([path, loader]) => [
    pascalFromPath(path),
    loader,
  ]),
)

export function getAnimationEffectComponent(
  effectId: AnimationEffectId,
): Component | null {
  const cached = componentCache.get(effectId)
  if (cached) return cached

  const componentName = getAnimationComponentName(effectId).replace(/^Lazy/, '')
  const loader = effectLoaders.get(componentName)
  if (!loader) return null

  const component = defineAsyncComponent(async () => {
    const module = await loader()
    return module.default
  })

  componentCache.set(effectId, component)
  return component
}
