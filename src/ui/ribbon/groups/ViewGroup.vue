<template>
  <RibbonGroup :label="tt.groupLabel()">
    <div class="kvgrid">
      <Checkbox
        input-id="ribbon-show-syl-roman"
        value="show-syl-roman"
        size="small"
        binary
        v-model="prefStore.sylRomanEnabled"
      />
      <label for="ribbon-show-syl-roman">{{ tt.enableSylRoman() }}</label>
      <Checkbox
        input-id="ribbon-auto-scroll"
        value="auto-scroll"
        size="small"
        binary
        v-model="prefStore.scrollWithPlayback"
      />
      <label for="ribbon-auto-scroll">{{ tt.scrollWithPlayback() }}</label>
      <Checkbox
        input-id="ribbon-swap-translate-roman"
        value="swap-translate-roman"
        size="small"
        binary
        v-model="prefStore.swapTranslateRoman"
      />
      <label for="ribbon-swap-translate-roman">{{ tt.swapTranslateRoman() }}</label>
    </div>
  </RibbonGroup>
</template>

<script setup lang="ts">
import { t } from '@i18n'

import { usePrefStore } from '@states/stores'

import RibbonGroup from '../RibbonGroupShell.vue'
import { Checkbox } from 'primevue'

const tt = t.ribbon.view

const prefStore = usePrefStore()
</script>
