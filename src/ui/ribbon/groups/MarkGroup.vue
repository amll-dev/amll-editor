<template>
  <RibbonGroup :label="tt.groupLabel()" more>
    <Button
      :icon="`mdi mdi-bookmark-${bookmarkAdd ? 'plus' : 'minus'}-outline`"
      :label="bookmarkAdd ? tt.addBookmark() : tt.removeBookmark()"
      :disabled="actionDisabled"
      size="small"
      severity="secondary"
      @click="bookmarkClick"
      v-tooltip="
        tipDesc(bookmarkAdd ? tt.addBookmark() : tt.removeBookmark(), tt.bookmarkDesc(), 'bookmark')
      "
    />
    <Button
      icon="mdi mdi-comment-outline"
      :label="tt.addComment()"
      size="small"
      disabled
      severity="secondary"
    />
    <Button
      icon="mdi mdi-eraser"
      :label="tt.removeAll()"
      size="small"
      severity="secondary"
      @click="removeAllMarks"
      v-tooltip="tipDesc(tt.removeAll(), tt.removeAllDesc())"
    />
  </RibbonGroup>
</template>

<script setup lang="ts">
import { t } from '@i18n'
import { computed } from 'vue'

import { useGlobalKeyboard } from '@core/hotkey'

import { useCoreStore, useRuntimeStore } from '@states/stores'

import { tipDesc } from '@utils/generateTooltip'

import RibbonGroup from '../RibbonGroupShell.vue'
import { Button } from 'primevue'

const tt = t.ribbon.mark

const runtimeStore = useRuntimeStore()

const focusingSet = computed(() =>
  runtimeStore.selectedSyllables.size > 0
    ? runtimeStore.selectedSyllables
    : runtimeStore.selectedLines,
)
const bookmarkAdd = computed(
  () => actionDisabled.value || [...focusingSet.value].some((item) => !item.bookmarked),
)
function bookmarkClick() {
  if (bookmarkAdd.value) for (const item of focusingSet.value) (item.bookmarked = true)
  else for (const item of focusingSet.value) (item.bookmarked = false)
}
const actionDisabled = computed(
  () => runtimeStore.selectedLines.size === 0 && runtimeStore.selectedSyllables.size === 0,
)
useGlobalKeyboard('bookmark', () => bookmarkClick())

const coreStore = useCoreStore()
function removeAllMarks() {
  for (const line of coreStore.lyricLines) {
    line.bookmarked = false
    for (const syl of line.syllables) (syl.bookmarked = false)
  }
}
</script>
