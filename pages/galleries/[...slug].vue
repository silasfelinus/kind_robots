<template>
  <main>
    <NuxtLayout>
      <ContentDoc path="/galleries/">
        <template #not-found> Galleries Not Found </template>
        <template #empty>Gallery is missing! Probably due to a human... </template>
      </ContentDoc>
    </NuxtLayout>
  </main>
</template>
