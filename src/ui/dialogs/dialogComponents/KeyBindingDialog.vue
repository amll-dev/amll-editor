<template>
  <Dialog v-model:visible="visible" header="按键绑定" class="key-binding-dialog"> Test </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from 'primevue'

const [visible] = defineModel<boolean>({ required: true })
</script>
