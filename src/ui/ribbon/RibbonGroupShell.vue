<template>
  <div class="ribbon-group">
    <div class="ribbon-group-content">
      <slot></slot>
    </div>
    <div class="ribbon-group-label">
      <div></div>
      <span class="ribbon-group-label-text">{{ props.label }}</span>
      <div class="hflex" style="justify-content: end">
        <Button
          v-if="props.more"
          class="ribbon-group-label-button"
          icon="pi pi-arrow-down-right"
          size="small"
          variant="text"
          severity="secondary"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from 'primevue'

const props = defineProps<{
  label: string
  more?: boolean // to do
  direction?: 'row' | 'column'
}>()
</script>

<style lang="scss">
.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  padding-right: 1px;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 0.5rem;
    bottom: 0.5rem;
    right: 0;
    width: 0;
    border-right: 1px solid var(--p-content-border-color);
  }
}
.ribbon-group-content {
  flex: 1;
  padding: 0.2rem 0.8rem 0;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  row-gap: 0.3rem;
  column-gap: 0.5rem;
  font-size: 0.9rem;
  --p-inputtext-sm-padding-y: 0.3em;
  --p-inputtext-sm-padding-x: 0.5em;
  --p-button-sm-padding-y: 0.3rem;
}
.ribbon-group-label {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
}
.ribbon-group-label-text {
  color: var(--p-slate-400);
  font-size: 0.85rem;
  margin: 0.1rem 0.5rem 0.25rem;
}
.ribbon-group-label-button {
  --p-button-sm-padding-y: 0.25rem;
  --p-button-sm-padding-x: 0.2rem;
  --p-button-sm-icon-only-width: 1.5rem;
  --p-button-sm-font-size: 0.7rem;
  --p-button-text-secondary-color: var(--p-slate-400);
}
</style>
