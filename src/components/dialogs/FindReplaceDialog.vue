<template>
  <Dialog class="thin-padding" v-model:visible="visible" header="查找替换">
    <div class="findreplace-content" v-focustrap>
      <div class="findreplace-mode">
        <div class="findreplace-radios">
          <div class="findreplace-radio-item">
            <RadioButton
              v-model="showReplace"
              inputId="findMode"
              name="findReplaceMode"
              :value="false"
            />
            <label for="findMode" class="findreplace-radio-label">查找</label>
          </div>
          <div class="findreplace-radio-item">
            <RadioButton
              v-model="showReplace"
              inputId="replaceMode"
              name="findReplaceMode"
              :value="true"
            />
            <label for="replaceMode" class="findreplace-radio-label">替换</label>
          </div>
        </div>
        <div class="findreplace-options-toggle">
          <label
            for="findShowOptions"
            class="findreplace-options-toggle-label"
            :class="{ enabled: showOptions }"
          >
            更多选项
          </label>
          <ToggleSwitch v-model="showOptions" inputId="findShowOptions" />
        </div>
      </div>
      <div class="findreplace-inputs">
        <div
          class="findreplace-find-input findreplace-input"
          :class="{ showformatbtn: showOptions }"
        >
          <IftaLabel>
            <InputText
              id="findInput"
              v-model="findInput"
              fluid
              :placeholder="showOptions ? '留空仅匹配格式' : undefined"
            />
            <label for="findInput">查找内容</label>
          </IftaLabel>
          <Button
            v-if="showOptions"
            icon="pi pi-hammer"
            size="small"
            severity="secondary"
            v-tooltip="'设置查找目标格式'"
            class="findreplace-format-btn"
          />
        </div>
        <div
          class="findreplace-replace-input findreplace-input"
          :class="{ showformatbtn: showOptions }"
          v-if="showReplace"
        >
          <IftaLabel>
            <InputText
              id="replaceInput"
              v-model="replaceInput"
              fluid
              :placeholder="showOptions ? '留空仅替换格式' : undefined"
            />
            <label for="replaceInput">替换为</label>
          </IftaLabel>
          <Button
            v-if="showOptions"
            icon="pi pi-hammer"
            size="small"
            severity="secondary"
            v-tooltip="'设置替换格式'"
            class="findreplace-format-btn"
          />
        </div>
      </div>
      <div class="findreplace-range">
        <div class="findreplace-range-title">匹配范围</div>
        <div class="findreplace-range-options">
          <div class="findreplace-range-option-item">
            <Checkbox v-model="findInWords" inputId="findInWords" binary />
            <label for="findInWords" class="findreplace-range-option-label">单词</label>
          </div>
          <div class="findreplace-range-option-item">
            <Checkbox v-model="findInTranslations" inputId="findInTranslations" binary />
            <label for="findInTranslations" class="findreplace-range-option-label">翻译</label>
          </div>
          <div class="findreplace-range-option-item">
            <Checkbox v-model="findInRoman" inputId="findInRoman" binary />
            <label for="findInRoman" class="findreplace-range-option-label">音译</label>
          </div>
        </div>
      </div>
      <div class="findreplace-options" v-if="showOptions">
        <div class="findreplace-options-title">匹配选项</div>
        <div class="findreplace-options-list">
          <div class="findreplace-option-item">
            <Checkbox v-model="matchCase" inputId="matchCase" binary />
            <label for="matchCase" class="findreplace-option-label">区分大小写</label>
          </div>
          <div class="findreplace-option-item">
            <Checkbox v-model="matchWholeWord" inputId="matchWholeWord" binary />
            <label for="matchWholeWord" class="findreplace-option-label">全字匹配</label>
          </div>
          <div class="findreplace-option-item">
            <Checkbox v-model="matchFullHalfWidth" inputId="matchFullHalfWidth" binary />
            <label for="matchFullHalfWidth" class="findreplace-option-label">区分全半角</label>
          </div>
          <div class="findreplace-option-item">
            <Checkbox v-model="useRegex" inputId="useRegex" binary />
            <label for="useRegex" class="findreplace-option-label">使用正则</label>
          </div>
          <div class="findreplace-option-item">
            <Checkbox v-model="wrapSearch" inputId="wrapSearch" binary />
            <label for="wrapSearch" class="findreplace-option-label">循环搜索</label>
          </div>
        </div>
      </div>
      <div class="findreplace-actions">
        <template v-if="showReplace">
          <Button
            icon="pi pi-reply"
            label="替换"
            severity="secondary"
            :disabled="findRangeEmpty"
            @click="handleReplace"
          />
          <Button
            icon="pi pi-angle-double-right"
            v-tooltip="'全部替换'"
            severity="secondary"
            :disabled="findRangeEmpty"
            @click="handleReplaceAll"
          />
          <div style="flex: 1"></div>
        </template>
        <Button
          icon="pi pi-arrow-up"
          v-tooltip="'查找上一个'"
          severity="secondary"
          :disabled="findRangeEmpty"
          @click="handleFindPrev"
        />
        <Button
          label="查找下一个"
          icon="pi pi-arrow-down"
          severity="secondary"
          :disabled="findRangeEmpty"
          @click="handleFindNext"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { useCoreStore, type LyricLine, type LyricWord } from '@/stores/core'
import { useRuntimeStore } from '@/stores/runtime'
import { useStaticStore } from '@/stores/static'
import {
  Button,
  Checkbox,
  Dialog,
  IftaLabel,
  InputNumber,
  RadioButton,
  ToggleSwitch,
} from 'primevue'
import { computed, ref } from 'vue'
import InputText from '../repack/InputText.vue'
import { useGlobalKeyboard } from '@/utils/hotkey'

const [visible] = defineModel<boolean>({ required: true })

const coreStore = useCoreStore()
const runtimeStore = useRuntimeStore()
const staticStore = useStaticStore()

const showReplace = ref(false)
const showOptions = ref(false)

const findInput = ref('')
const replaceInput = ref('')

const findInWords = ref(true)
const findInTranslations = ref(false)
const findInRoman = ref(false)
const findRangeEmpty = computed(
  () => !findInWords.value && !findInTranslations.value && !findInRoman.value,
)

const matchCase = ref(false)
const matchWholeWord = ref(false)
const matchFullHalfWidth = ref(false)
const useRegex = ref(false)
const wrapSearch = ref(true)

function handleFindNext() {}
function handleFindPrev() {}
function handleReplace() {}
function handleReplaceAll() {}

useGlobalKeyboard('find', () => {
  if (visible.value && !showReplace.value) {
    visible.value = false
  } else {
    visible.value = true
    showReplace.value = false
  }
})
useGlobalKeyboard('replace', () => {
  if (visible.value && showReplace.value) {
    visible.value = false
  } else {
    visible.value = true
    showReplace.value = true
  }
})
</script>

<style lang="scss">
.findreplace-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 22rem;
  margin-top: 0.3rem;
}
.findreplace-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.findreplace-radios {
  display: flex;
  gap: 1.5rem;
}
.findreplace-radio-item {
  display: flex;
  align-items: center;
}
.findreplace-radio-label {
  padding-left: 0.5rem;
}
.findreplace-options-toggle {
  display: flex;
  align-items: center;
}
.findreplace-options-toggle-label {
  padding-right: 0.5rem;
  opacity: 0.7;
  font-size: 0.9rem;
  transition: opacity 0.2s;
  &.enabled {
    opacity: 1;
  }
}
.findreplace-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.findreplace-input {
  position: relative;
  &.showformatbtn {
    --p-inputtext-padding-x: 0.75rem 3rem;
  }
}
.findreplace-format-btn {
  position: absolute !important;
  bottom: 0.5rem;
  right: 0.5rem;
}
.findreplace-range,
.findreplace-options {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}
.findreplace-range-title,
.findreplace-options-title {
  font-weight: bold;
  flex-shrink: 0;
}
.findreplace-range-options {
  display: flex;
  gap: 1.2rem;
  align-items: center;
}
.findreplace-range-option-item {
  display: flex;
  align-items: center;
}
.findreplace-range-option-label {
  padding-left: 0.5rem;
}
.findreplace-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.findreplace-options-list {
  display: flex;
  row-gap: 0.4rem;
  column-gap: 1.5rem;
  flex-wrap: wrap;
}
.findreplace-option-item {
  display: flex;
  align-items: center;
}
.findreplace-option-label {
  padding-left: 0.5rem;
}
</style>
