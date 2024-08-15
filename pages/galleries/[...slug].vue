<template>
  <main>
    <ContentDoc path="/galleries/">
      <template #not-found> Galleries Not Found </template>
      <template #empty>
        Gallery is missing! Probably due to a human...
      </template>
    </ContentDoc>
  </main>
</template>
