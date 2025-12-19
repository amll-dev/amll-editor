<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="从其他歌词格式导入"
    class="from-other-fmt-modal"
    maximizable
  >
    <Listbox
      v-model="selectedFormat"
      :options="formats"
      checkmark
      optionLabel="name"
      class="format-listbox"
    >
      <template #option="{ option: format }">
        {{ format.name }}
        <span class="accept">{{ format.accept }}</span>
      </template>
    </Listbox>
    <div class="format-details">
      <template v-if="selectedFormat">
        <div class="description">{{ selectedFormat.description || '未提供说明' }}</div>
        <div class="references" v-if="selectedFormat.reference || selectedFormat.example">
          <Button
            label="显示示例"
            size="small"
            icon="pi pi-align-left"
            :severity="showExample ? undefined : 'secondary'"
            @click="showExample = !showExample"
          />
          <Button
            v-for="item in selectedFormat.reference"
            :key="item.url"
            :label="item.name"
            size="small"
            icon="pi pi-external-link"
            severity="secondary"
            @click="openUrl(item.url)"
          />
        </div>
        <div class="example monospace" v-if="selectedFormat.example && showExample">
          {{ selectedFormat.example }}
        </div>
        <hr />
        <CodeMirror class="input-cm" showLineNumbers v-model:content="inputText" />
        <div class="action-buttons">
          <Button
            label="从文件打开"
            icon="pi pi-paperclip"
            severity="secondary"
            @click="handleOpenFromFile"
          />
          <div style="flex: 1"></div>
          <Button label="取消" icon="pi pi-times" severity="secondary" @click="visible = false" />
          <Button
            label="导入"
            icon="pi pi-arrow-right"
            :disabled="!inputText"
            @click="handleImport"
          />
        </div>
      </template>
      <div v-else class="require-select-tip">请在左侧选择格式</div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { importPersist, type Persist } from '@/ports'
import { parseLRC } from '@/ports/formats/lrc'
import { parseLRCa2 } from '@/ports/formats/lrca2'
import { parseQRC } from '@/ports/formats/qrc'
import { parseSPL } from '@/ports/formats/spl'
import { parseYRC } from '@/ports/formats/yrc'
import { chooseFile } from '@/core/file'
import { Button, Dialog, IftaLabel, Listbox, Tag, Textarea } from 'primevue'
import { ref } from 'vue'
import CodeMirror from '@/components/repack/CodeMirror.vue'

const [visible] = defineModel<boolean>({ required: true })

interface FormatInfo {
  name: string
  description?: string
  accept: string
  example?: string
  reference?: {
    name: string
    url: string
  }[]
  parser: (content: string) => Persist
}

const formats: FormatInfo[] = [
  {
    name: '基本 LRC',
    description:
      '最常见的歌词格式。支持以行时间戳，不支持逐字时间戳。此处指基本 LRC 格式，若导入基于 LRC 的扩展格式，请选择对应扩展格式选项。',
    accept: '.lrc',
    example:
      `[02:01.079]Get in the line, to dream alive\n` +
      `[02:03.552]In our souls, do we know?\n` +
      `[02:06.103][02:08.916][02:11.135]On the journey`,
    reference: [{ name: '维基百科', url: 'https://en.wikipedia.org/wiki/LRC_(file_format)' }],
    parser: parseLRC,
  },
  {
    name: 'LRC A2 扩展',
    description: '基于 LRC 的扩展格式，支持行时间戳和逐字时间戳，最早由 A2 Media Player 提出。',
    accept: '.lrc',
    example:
      `[02:38.850]<02:38.850>Words <02:39.030>are <02:39.120>made <02:39.360>of <02:39.420>plastic<02:40.080>\n` +
      `[02:40.080]<02:40.080>Come <02:40.290>back <02:40.470>like <02:40.680>elastic<02:41.370>`,
    reference: [{ name: '维基百科', url: 'https://en.wikipedia.org/wiki/LRC_(file_format)' }],
    parser: parseLRCa2,
  },
  {
    name: '网易云逐字',
    description: '网易云音乐的私有逐字歌词格式。支持行时间戳和逐字时间戳。',
    accept: '.yrc',
    example:
      `[190871,1984](190871,361,0)For(0,0,0) (191232,172,0)the(0,0,0) (191404,376,0)first(0,0,0) (191780,1075,0)time\n` +
      `[193459,4198](193459,412,0)What's(0,0,0) (193871,574,0)past(0,0,0) (194445,506,0)is(0,0,0) (194951,2706,0)past`,
    parser: parseYRC,
  },
  {
    name: 'QQ 音乐逐字',
    description: 'QQ 音乐的私有逐字歌词格式。支持行时间戳和逐字时间戳。',
    accept: '.qrc',
    example:
      `[190871,1984]For(190871,361) (0,0)the(191232,172) (0,0)first(191404,376) (0,0)time(191780,1075)\n` +
      `[193459,4198]What's(193459,412) (0,0)past(193871,574) (0,0)is(194445,506) (0,0)past(194951,2706)`,
    parser: parseQRC,
  },
  {
    name: '椒盐音乐逐字',
    description:
      '椒盐音乐的私有格式，基于 LRC 扩展，支持行时间戳和逐字时间戳，并支持翻译。由于规则繁杂，可能不完全可用。',
    accept: '.spl,.lrc',
    example:
      `[02:38.850]<02:38.850>Words <02:39.030>are <02:39.120>made <02:39.360>of <02:39.420>plastic[02:40.080]\n` +
      `[02:40.080]<02:40.080>Come <02:40.290>back <02:40.470>like <02:40.680>elastic[02:41.370]`,
    reference: [{ name: '椒盐官方文档', url: 'https://moriafly.com/standards/spl.html' }],
    parser: parseSPL,
  },
]
const selectedFormat = ref<FormatInfo | undefined>(formats[0])
const showExample = ref(false)
const inputText = ref('')

async function handleOpenFromFile() {
  if (!selectedFormat.value) return
  const file = await chooseFile(selectedFormat.value.accept)
  if (!file) return
  inputText.value = file.content || ''
}
function handleImport() {
  if (!selectedFormat.value) return
  try {
    const persist = selectedFormat.value.parser(inputText.value)
    importPersist(persist)
    visible.value = false
  } catch (err) {
    console.error(err)
  }
}
function openUrl(url: string) {
  window.open(url, '_blank')
}
</script>

<style lang="scss">
.from-other-fmt-modal {
  &:not(.p-dialog-maximized) {
    width: 80vw;
    height: 80vh;
    max-width: 90rem;
    max-height: 60rem;
  }
  .p-dialog-content {
    height: 0;
    flex: 1;
    display: flex;
    gap: 1rem;
  }
  .format-listbox {
    min-width: 12rem;
    --p-listbox-option-padding: 0.5rem 1.2rem 0.5rem 1rem;
    .accept {
      margin-inline-start: 0.3rem;
      opacity: 0.5;
    }
  }
  .format-details {
    width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    position: relative;
    .description {
      opacity: 0.8;
    }
    .references {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .example {
      user-select: text;
      cursor: text;
      white-space: pre-wrap;
      padding: 0.5rem;
      font-size: 0.9rem;
      background-color: var(--p-listbox-background);
      border: 1px solid var(--p-listbox-border-color);
      border-radius: var(--p-listbox-border-radius);
      &::before {
        font-family: var(--font-main);
        content: '示例格式';
        display: block;
        opacity: 0.7;
        margin-bottom: 0.2rem;
      }
    }
  }
  .input-cm {
    height: 0;
    flex: 1;
  }
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  .require-select-tip {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
    width: max-content;
    height: max-content;
    font-size: 1.5rem;
    opacity: 0.5;
  }
}
</style>
