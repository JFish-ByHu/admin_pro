<script setup lang="ts">
import { computed } from 'vue'
import { Setting } from '@element-plus/icons-vue'

export interface CommonTableSettingColumnOption {
  key: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    rowSortableEnabled?: boolean
    showRowSortableSwitch?: boolean
    selectionEnabled?: boolean
    showSelectionSwitch?: boolean
    columnOptions?: CommonTableSettingColumnOption[]
    visibleColumnKeys?: string[]
  }>(),
  {
    modelValue: false,
    rowSortableEnabled: false,
    showRowSortableSwitch: false,
    selectionEnabled: false,
    showSelectionSwitch: false,
    columnOptions: () => [],
    visibleColumnKeys: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:rowSortableEnabled', value: boolean): void
  (e: 'update:selectionEnabled', value: boolean): void
  (e: 'update:visibleColumnKeys', value: string[]): void
  (e: 'reset'): void
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const hasColumnOptions = computed(() => props.columnOptions.length > 0)

const openDrawer = () => {
  drawerVisible.value = true
}

const resetSettings = () => {
  emit('reset')
}

const updateVisibleColumnKeys = (nextKeys: Array<string | number>) => {
  emit('update:visibleColumnKeys', nextKeys.map(String))
}

const updateRowSortableEnabled = (value: string | number | boolean) => {
  emit('update:rowSortableEnabled', Boolean(value))
}

const updateSelectionEnabled = (value: string | number | boolean) => {
  emit('update:selectionEnabled', Boolean(value))
}
</script>

<template>
  <div class="common-table-setting">
    <el-tooltip content="表格设置" placement="top">
      <el-button
        class="common-table-setting__trigger"
        :icon="Setting"
        size="small"
        circle
        @click="openDrawer"
      />
    </el-tooltip>

    <el-drawer v-model="drawerVisible" title="表格设置" :size="520" destroy-on-close>
      <div class="common-table-setting__content">
        <section
          v-if="showRowSortableSwitch || showSelectionSwitch"
          class="common-table-setting__section"
        >
          <div class="common-table-setting__heading">功能设置</div>
          <div class="common-table-setting__option common-table-setting__option--switch">
            <div>
              <div class="common-table-setting__label">开启拖拽排序</div>
              <div class="common-table-setting__desc">关闭后隐藏拖拽列，表格恢复普通浏览模式</div>
            </div>
            <el-switch
              v-if="showRowSortableSwitch"
              :model-value="rowSortableEnabled"
              @update:model-value="updateRowSortableEnabled"
            />
          </div>

          <div
            v-if="showSelectionSwitch"
            class="common-table-setting__option common-table-setting__option--switch"
          >
            <div>
              <div class="common-table-setting__label">显示勾选列</div>
              <div class="common-table-setting__desc">关闭后隐藏多选勾选列，表格仅保留浏览模式</div>
            </div>
            <el-switch
              :model-value="selectionEnabled"
              @update:model-value="updateSelectionEnabled"
            />
          </div>
        </section>

        <section v-if="hasColumnOptions" class="common-table-setting__section">
          <div class="common-table-setting__heading">列显示</div>
          <el-checkbox-group
            :model-value="visibleColumnKeys"
            class="common-table-setting__columns"
            @update:model-value="updateVisibleColumnKeys"
          >
            <div
              v-for="option in columnOptions"
              :key="option.key"
              class="common-table-setting__column-item"
            >
              <div class="common-table-setting__label">{{ option.label }}</div>
              <el-checkbox :value="option.key" />
            </div>
          </el-checkbox-group>
        </section>

        <div class="common-table-setting__footer">
          <el-button plain color="var(--t-info)" @click="resetSettings">恢复默认配置</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.common-table-setting {
  display: inline-flex;
  align-items: center;

  &__trigger {
    flex: none;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--layout-gap);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: calc(var(--layout-gap) * 0.6);
    padding: var(--layout-padding);
    background: var(--bg-page-light);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
  }

  &__heading {
    color: var(--t-primary);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  &__option,
  &__column-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__option--switch {
    align-items: flex-start;
  }

  &__columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: calc(var(--layout-gap) * 0.5);
  }

  &__column-item {
    min-width: 0;
    padding: calc(var(--layout-padding) * 0.7);
    background: var(--bg-page);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
  }

  &__label {
    color: var(--t-primary);
    font-size: var(--font-size-base);
    font-weight: 500;
  }

  &__desc {
    margin-top: 4px;
    color: var(--t-secondary);
    font-size: calc(var(--font-size-base) * 0.9);
    line-height: 1.5;
  }

  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: var(--layout-padding);
  }

  :deep(.el-drawer__body) {
    padding: var(--layout-padding);
    background: var(--bg-page);
  }
  @include respond-to(tablet-down) {
    &__columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @include respond-to(mobile) {
    &__columns {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
