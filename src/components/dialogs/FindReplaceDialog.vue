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
        <div class="findreplace-find-input">
          <IftaLabel>
            <InputText id="findInput" v-model="findInput" fluid />
            <label for="findInput">查找内容</label>
          </IftaLabel>
        </div>
        <div class="findreplace-replace-input" v-if="showReplace">
          <IftaLabel>
            <InputText id="replaceInput" v-model="replaceInput" fluid />
            <label for="replaceInput">替换为</label>
          </IftaLabel>
        </div>
      </div>
      <div class="findreplace-range">
        <div class="findreplace-range-title">匹配范围</div>
      </div>
      <div class="findreplace-options"></div>
      <div class="findreplace-actions"></div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { useCoreStore, type LyricLine, type LyricWord } from '@/stores/core'
import { useRuntimeStore } from '@/stores/runtime'
import { useStaticStore } from '@/stores/static'
import { Button, Dialog, IftaLabel, InputNumber, RadioButton, ToggleSwitch } from 'primevue'
import { ref } from 'vue'
import InputText from '../repack/InputText.vue'

const [visible] = defineModel<boolean>({ required: true })

const shiftMs = ref<number | null>(0)

const coreStore = useCoreStore()
const runtimeStore = useRuntimeStore()
const staticStore = useStaticStore()

const showReplace = ref(false)
const showOptions = ref(false)

const findInput = ref('')
const replaceInput = ref('')
</script>

<style lang="scss">
.findreplace-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 20rem;
  margin-top: 0.3rem;
}
.findreplace-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.findreplace-radios {
  display: flex;
  gap: 1.2rem;
}
.findreplace-radio-item {
  display: flex;
  align-items: center;
}
.findreplace-radio-label {
  padding-left: 0.4rem;
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
</style>
