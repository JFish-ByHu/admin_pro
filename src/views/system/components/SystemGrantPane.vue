<script setup lang="ts">
import CommonGrantSubjectList from '@/components/common/CommonGrantSubjectList.vue'
import CommonGrantTreeCard from '@/components/common/CommonGrantTreeCard.vue'
import type { MenuAuthSubject } from '@/types/menu'

const props = withDefaults(
  defineProps<{
    subjects: MenuAuthSubject[]
    selectedSubjectId: string
    subjectKeyword: string
    roleLabelMap: Record<string, string>
    checkedKeys: string[]
    treeData: unknown[]
    subjectName: string
    saving?: boolean
    subjectTitle?: string
    subjectPlaceholder?: string
    subjectEmptyText?: string
    treeTitle: string
    summaryUnitText: string
    grantPermissionCode?: string
  }>(),
  {
    saving: false,
    subjectTitle: '授权角色',
    subjectPlaceholder: '搜索角色名称 / 编码',
    subjectEmptyText: '暂无可授权角色',
    grantPermissionCode: ''
  }
)

const emit = defineEmits<{
  'update:subjectKeyword': [value: string]
  'update:checkedKeys': [value: string[]]
  select: [subjectId: string]
  checkAll: []
  clearAll: []
  reset: []
  save: []
}>()
</script>

<template>
  <div class="system-grant-pane">
    <div class="system-grant-pane__left">
      <CommonGrantSubjectList
        :subjects="props.subjects"
        :selected-id="props.selectedSubjectId"
        :keyword="props.subjectKeyword"
        :title="props.subjectTitle"
        :placeholder="props.subjectPlaceholder"
        :empty-text="props.subjectEmptyText"
        :role-label-map="props.roleLabelMap"
        @update:keyword="emit('update:subjectKeyword', $event)"
        @select="emit('select', $event)"
      />
    </div>

    <div class="system-grant-pane__right">
      <CommonGrantTreeCard
        :checked-keys="props.checkedKeys"
        :tree-data="props.treeData"
        :subject-name="props.subjectName"
        :saving="props.saving"
        :title="props.treeTitle"
        :summary-unit-text="props.summaryUnitText"
        :grant-permission-code="props.grantPermissionCode"
        @update:checked-keys="emit('update:checkedKeys', $event)"
        @check-all="emit('checkAll')"
        @clear-all="emit('clearAll')"
        @reset="emit('reset')"
        @save="emit('save')"
      >
        <template #node="{ data }">
          <slot name="node" :data="data" />
        </template>
      </CommonGrantTreeCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.system-grant-pane {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: var(--layout-gap);
  height: 100%;
  min-height: 0;

  &__left,
  &__right {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  @include respond-to(tablet-down) {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(280px, 36vh) minmax(0, 1fr);
  }
}
</style>
