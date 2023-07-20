<template>
  <ContentQuery v-slot="{ data }" :path="$route.path">
    <ContentRenderer :value="data"><slot /></ContentRenderer>
  </ContentQuery>
</template>
