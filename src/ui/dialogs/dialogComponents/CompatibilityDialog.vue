<template>
  <Dialog v-model:visible="visible" header="兼容性报告" class="compat-dialog">
    <template v-for="(item, index) in list" :key="item.key">
      <Divider v-if="index !== 0" />
      <div class="compat-dialog-item">
        <div class="icon-shell">
          <i v-if="item.meet" class="compat-icon pi pi-check p-color-success"></i>
          <i v-else :class="`compat-icon pi pi-exclamation-triangle p-color-${item.severity}`"></i>
        </div>
        <div class="content">
          <div class="name">{{ item.name }}</div>
          <div class="description" v-if="item.description">{{ item.description }}</div>
          <div class="links" v-if="item.referenceUrls && item.referenceUrls.length">
            <Button
              v-for="(link, urlIndex) in item.referenceUrls"
              :key="urlIndex"
              severity="secondary"
              size="small"
              variant="link"
              :label="link.label"
              icon="pi pi-external-link"
              as="a"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="compat-link"
            />
          </div>
          <div class="notsupported" v-if="!item.meet">
            <div class="why">
              <strong :class="`why-strong p-color-${item.severity}`">不支持</strong
              ><span class="why-text">{{ item.why || '未提供说明' }}</span>
            </div>
            <div class="effect">{{ item.effect || '未提供可能导致的问题' }}</div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="compat-dialog-dont-mind">
        <Checkbox binary input-id="dont-mind-next-time" v-model="dontMindNextTime" />
        <label for="dont-mind-next-time" class="dont-mind-label">此后启动时不再检查</label>
      </div>
      <Button label="关闭" severity="secondary" icon="pi pi-times" @click="visible = false" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

import { compatibilityList } from '@core/compat'

import { usePrefStore } from '@states/stores'

import { Button, Checkbox, Dialog, Divider } from 'primevue'

const [visible] = defineModel<boolean>({ required: true })

const severityOrder = {
  info: 0,
  warn: 1,
  danger: 2,
} as const
const list = [...compatibilityList].sort((a, b) => {
  if (a.meet && !b.meet) return 1
  if (!a.meet && b.meet) return -1
  const sA = severityOrder[a.severity] ?? 0
  const sB = severityOrder[b.severity] ?? 0
  if (sA !== sB) return sB - sA
  return a.name.localeCompare(b.name)
})

const prefStore = usePrefStore()
const dontMindNextTime = computed({
  get: () => !prefStore.notifyCompatIssuesOnStartup,
  set: (val: boolean) => (prefStore.notifyCompatIssuesOnStartup = !val),
})

onMounted(() =>
  setTimeout(() => {
    if (list.some((item) => !item.meet) && prefStore.notifyCompatIssuesOnStartup) {
      visible.value = true
      dontMindNextTime.value = true
    }
  }, 5000),
)
</script>

<style lang="scss">
.compat-dialog {
  width: 36rem;
}
.compat-dialog-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  .icon-shell {
    margin-top: 0.75rem;
    display: flex;
    align-items: start;
    justify-content: center;
  }
  .compat-icon {
    font-size: 1.8rem;
  }
  .name {
    font-weight: bold;
    font-size: 1.1rem;
  }
  .description {
    margin-bottom: 0.1rem;
    opacity: 0.8;
    font-size: 0.9rem;
  }
  .compat-link {
    padding: 0;
    color: inherit;
    opacity: 0.8;
  }
  .notsupported {
    margin-top: 0.8rem;
  }
  .why-strong {
    font-weight: bold;
    margin-right: 0.5rem;
  }
  .effect {
    margin-top: 0.5rem;
    font-weight: bold;
  }
}
.compat-dialog-dont-mind {
  display: flex;
  align-items: center;
  flex-grow: 1;
  .dont-mind-label {
    padding-left: 0.6rem;
  }
}
</style>
