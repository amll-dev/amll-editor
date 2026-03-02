<template>
  <div
    class="timestamp-switch"
    :class="{ connect: connectNextModel }"
    @click="handleClick"
    @dblclick="handleDbClick"
  >
    <Timestamp v-model="upstream" end ref="timeComp" class="timestamp-comp" passive-active />
    <div class="connect-icon">
      <i class="mdi mdi-link-variant"></i>
      <i class="mdi mdi-arrow-down"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

import Timestamp from './Timestamp.vue'

const upstream = defineModel<number>({ required: true })
const connectNextModel = defineModel<boolean>('connect', { required: true })

const timeComp = useTemplateRef('timeComp')

function handleClick() {
  if (timeComp.value?.showInput) return
  connectNextModel.value = !connectNextModel.value
}
function handleDbClick() {
  connectNextModel.value = false
  timeComp.value?.activate()
}
</script>

<style lang="scss">
.timestamp-switch {
  display: flex;
  position: relative;
  .connect-icon {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    width: fit-content;
    height: fit-content;
    display: flex;
    gap: 0.3rem;
    color: transparent;
    font-size: 0.9rem;
    pointer-events: none;
  }
}
.timestamp-switch.connect {
  .timestamp-comp {
    color: transparent;
    pointer-events: none;
  }
  .connect-icon {
    color: inherit;
  }
}
</style>
