<!-- Small hand-drawn glyphs for the console: the five kingdom axes plus the
     HUD's coin, sun and moon. Inline SVG so they stay crisp and offline. -->
<template>
  <svg
    viewBox="0 0 24 24"
    class="rh-glyph"
    :class="`rh-glyph--${name}`"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'nature'">
      <path
        d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z"
        fill="#6fae4b"
        stroke="#2f5a23"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <path
        d="M5 19c4-4 7-7 10-10"
        fill="none"
        stroke="#2f5a23"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </template>
    <template v-else-if="name === 'prosperity'">
      <path
        d="M12 21V8"
        stroke="#8a5a1c"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <g fill="#e8b84a" stroke="#8a5a1c" stroke-width="1.1">
        <ellipse cx="12" cy="5" rx="2" ry="3" />
        <ellipse
          cx="8.6"
          cy="10"
          rx="2"
          ry="3"
          transform="rotate(-30 8.6 10)"
        />
        <ellipse
          cx="15.4"
          cy="10"
          rx="2"
          ry="3"
          transform="rotate(30 15.4 10)"
        />
        <ellipse
          cx="8.8"
          cy="15"
          rx="2"
          ry="3"
          transform="rotate(-30 8.8 15)"
        />
        <ellipse
          cx="15.2"
          cy="15"
          rx="2"
          ry="3"
          transform="rotate(30 15.2 15)"
        />
      </g>
    </template>
    <template v-else-if="name === 'treasury' || name === 'coin'">
      <g stroke="#7a4a12" stroke-width="1.2">
        <ellipse cx="12" cy="17" rx="7" ry="3" fill="#d79a2b" />
        <ellipse cx="12" cy="13.5" rx="7" ry="3" fill="#e6b03f" />
        <ellipse cx="12" cy="10" rx="7" ry="3" fill="#f3c95a" />
      </g>
      <path
        d="M9.5 9.6h5"
        stroke="#7a4a12"
        stroke-width="1.1"
        stroke-linecap="round"
      />
    </template>
    <template v-else-if="name === 'joy'">
      <path
        d="M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"
        fill="#e2566e"
        stroke="#7d1f33"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <path
        d="M8 9.6a2 2 0 0 1 2-1.6"
        fill="none"
        stroke="#ffd0d8"
        stroke-width="1.3"
        stroke-linecap="round"
      />
    </template>
    <template v-else-if="name === 'order'">
      <path
        d="M12 4v15M7 20h10M5 8h14"
        stroke="#4a3a6a"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <path
        d="M5 8 2.5 14h5L5 8ZM19 8l-2.5 6h5L19 8Z"
        fill="#8f9ad6"
        stroke="#4a3a6a"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <circle
        cx="12"
        cy="4"
        r="1.6"
        fill="#e6b03f"
        stroke="#4a3a6a"
        stroke-width="1"
      />
    </template>
    <template v-else-if="name === 'sun'">
      <circle
        cx="12"
        cy="12"
        r="4.6"
        fill="#f6c443"
        stroke="#9a5a10"
        stroke-width="1.2"
      />
      <g stroke="#e59a1e" stroke-width="1.6" stroke-linecap="round">
        <path
          d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"
        />
      </g>
    </template>
    <template v-else-if="name === 'moon'">
      <path
        d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5Z"
        fill="#f1e3b0"
        stroke="#6b5a2a"
        stroke-width="1.3"
        stroke-linejoin="round"
      />
      <circle cx="17" cy="8" r=".8" fill="#fff6d8" />
      <circle cx="20" cy="12" r=".6" fill="#fff6d8" />
    </template>
    <template v-else-if="name === 'crown'">
      <path
        d="M3.5 17 2.5 7l5 4 4.5-6 4.5 6 5-4-1 10h-17Z"
        fill="#f0c04a"
        stroke="#7a4a12"
        stroke-width="1.3"
        stroke-linejoin="round"
      />
      <path
        d="M4 19.5h16"
        stroke="#7a4a12"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <circle cx="12" cy="12.5" r="1.4" fill="#c0304a" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        fill="#fbf1dc"
        stroke="#6a3a2a"
        stroke-width="1.3"
      />
      <path d="M3.5 9.5h17" stroke="#6a3a2a" stroke-width="1.3" />
      <rect
        x="3.5"
        y="5"
        width="17"
        height="4.5"
        rx="2"
        fill="#c0304a"
        stroke="#6a3a2a"
        stroke-width="1.3"
      />
      <path
        d="M8 3.5v3M16 3.5v3"
        stroke="#6a3a2a"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <g fill="#6a3a2a">
        <circle cx="8" cy="13" r=".9" />
        <circle cx="12" cy="13" r=".9" />
        <circle cx="16" cy="13" r=".9" />
        <circle cx="8" cy="16.5" r=".9" />
        <circle cx="12" cy="16.5" r=".9" />
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name:
    | 'nature'
    | 'prosperity'
    | 'treasury'
    | 'joy'
    | 'order'
    | 'coin'
    | 'sun'
    | 'moon'
    | 'crown'
    | 'calendar'
}>()
</script>

<style scoped>
.rh-glyph {
  width: 1.25em;
  height: 1.25em;
  flex: none;
  filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.25));
}
</style>
