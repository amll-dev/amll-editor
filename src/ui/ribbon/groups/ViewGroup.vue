<template>
  <RibbonGroup label="视图">
    <div class="kvgrid">
      <Checkbox
        inputId="ribbon-show-syl-roman"
        value="show-syl-roman"
        size="small"
        binary
        v-model="prefStore.sylRomanEnabled"
      />
      <label for="ribbon-show-syl-roman">启用逐字音译</label>
      <Checkbox
        inputId="ribbon-auto-scroll"
        value="auto-scroll"
        size="small"
        binary
        v-model="prefStore.scrollWithPlayback"
      />
      <label for="ribbon-auto-scroll">随播放自动滚动</label>
      <Checkbox
        inputId="ribbon-swap-translate-roman"
        value="swap-translate-roman"
        size="small"
        binary
        v-model="prefStore.swapTranslateRoman"
      />
      <label for="ribbon-swap-translate-roman">交换翻译音译框</label>
    </div>
  </RibbonGroup>
</template>

<script setup lang="ts">
import { usePrefStore } from '@states/stores'

import RibbonGroup from '../RibbonGroupShell.vue'
import { Checkbox } from 'primevue'

const prefStore = usePrefStore()
</script>
