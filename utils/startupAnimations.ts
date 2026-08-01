export const STARTUP_ANIMATION_SOURCES = Array.from(
  { length: 12 },
  (_, index) =>
    `/images/startup-animations/launch-${String(index + 1).padStart(2, '0')}.webp`,
)

export const DEFAULT_STARTUP_ANIMATION_SRC = STARTUP_ANIMATION_SOURCES[0]!
export const STARTUP_ANIMATION_META_NAME = 'kind-robots-startup-animation'

export function getStartupAnimationSrc(): string {
  if (import.meta.client) {
    const selected = document
      .querySelector<HTMLMetaElement>(
        `meta[name="${STARTUP_ANIMATION_META_NAME}"]`,
      )
      ?.content.trim()

    if (selected && STARTUP_ANIMATION_SOURCES.includes(selected)) {
      return selected
    }
  }

  return DEFAULT_STARTUP_ANIMATION_SRC
}
