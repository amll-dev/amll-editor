<template>
  <div class="empty-tip">
    <i class="pi empty-tip-icon" :class="props.icon || 'pi-asterisk'"></i>
    <div class="empty-tip-title">{{ props.title || '当前视图无内容可显示' }}</div>
    <div class="empty-tip-tip" v-if="props.tip">{{ props.tip }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  tip?: string
  icon?: string
}>()
</script>

<style lang="scss">
.empty-tip {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  width: fit-content;
  height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: light-dark(var(--p-zinc-500), var(--p-zinc-400));
}
.empty-tip-icon {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  opacity: 0.8;
}
.empty-tip-title {
  font-size: 1.3rem;
}
</style>
