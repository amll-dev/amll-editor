<template>
  <div class="pref-item">
    <div class="text" :class="{ disabled }">
      <div class="label">
        {{ props.label
        }}<i
          v-if="props.experimental"
          class="pi pi-filter exp-icon"
          v-tooltip="'实验性选项，可能不稳定'"
        ></i>
      </div>
      <div v-if="props.desc" class="description">{{ props.desc }}</div>
    </div>
    <div class="field">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  desc?: string
  disabled?: boolean
  experimental?: boolean
}>()
</script>

<style lang="scss">
.pref-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  .text {
    transition:
      color 0.2s,
      opacity 0.2s;
    &.disabled {
      color: var(--p-inputtext-disabled-color);
      opacity: 0.7;
    }
  }
  .description {
    font-size: 0.8rem;
    opacity: 0.6;
  }
  .exp-icon {
    font-size: 0.9rem;
    margin-left: 0.3rem;
    transform: rotate(180deg);
    opacity: 0.8;
    color: var(--p-primary-color);
  }
}
</style>
