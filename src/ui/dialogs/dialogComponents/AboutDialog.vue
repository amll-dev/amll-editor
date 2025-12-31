<template>
  <Dialog v-model:visible="visible" header="关于" class="about-dialog"> Test </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from 'primevue'

const [visible] = defineModel<boolean>({ required: true })
</script>
