<!-- /components/user/account-center.vue -->
<!--
  Account is the single navigation destination for personal settings and
  creator earnings. Keep the content page to one MDC mount and compose the
  related account surfaces here instead.
-->
<template>
  <div class="flex min-h-0 flex-col gap-4">
    <account-settings />
    <creator-earnings-page />
  </div>
</template>
