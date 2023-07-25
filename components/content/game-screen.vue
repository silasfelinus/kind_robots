<template>
  <div
    class="h-screen flex flex-col bg-gradient-to-r from-primary to-secondary rounded-br-3xl rounded-tr-3xl"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 bg-primary rounded-tl-3xl"></div>

    <!-- Body -->
    <div class="flex-grow grid grid-cols-4 gap-4 p-6">
      <!-- Main content -->
      <div class="col-span-3 bg-secondary rounded-lg p-4">
        <slot />
      </div>

      <!-- Right Panel -->
      <div class="flex flex-col gap-4 bg-primary rounded-lg p-4">
        <button-card label="Button 1" description="Button 1 description" :color-id="1" />
        <button-card label="Button 2" description="Button 2 description" :color-id="2" />
        <button-card label="Button 3" description="Button 3 description" :color-id="3" />
        <button-card label="Button 4" description="Button 4 description" :color-id="4" />
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-end px-6 py-4 bg-primary rounded-br-3xl">
      <AmiLink />
    </div>
  </div>
</template>
