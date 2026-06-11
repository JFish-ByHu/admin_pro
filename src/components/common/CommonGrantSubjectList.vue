<script setup lang="ts">
import { computed } from 'vue'

export interface CommonGrantSubject {
  id: string
  username: string
  nickname: string
  email: string
  role: string
}

const props = withDefaults(
  defineProps<{
    subjects: CommonGrantSubject[]
    selectedId?: string
    keyword?: string
    title?: string
    placeholder?: string
    emptyText?: string
    emptySearchText?: string
    roleLabelMap?: Record<string, string>
  }>(),
  {
    selectedId: '',
    keyword: '',
    title: '授权对象',
    placeholder: '搜索昵称 / 用户名 / 邮箱',
    emptyText: '暂无授权对象',
    emptySearchText: '未匹配到授权对象',
    roleLabelMap: () => ({
      super: '超级管理员',
      admin: '管理员',
      operator: '运营',
      user: '普通用户'
    })
  }
)

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'select', id: string): void
}>()

const currentEmptyText = computed(() => {
  return props.keyword.trim() ? props.emptySearchText : props.emptyText
})
</script>

<template>
  <div class="subject-list-card">
    <div class="subject-list-card__header">
      <span class="subject-list-card__title">{{ title }}</span>
      <span class="subject-list-card__meta">共 {{ subjects.length }} 人</span>
    </div>

    <el-input
      :model-value="keyword"
      :placeholder="placeholder"
      clearable
      @update:model-value="value => emit('update:keyword', String(value || ''))"
    >
      <template #prefix>
        <el-icon><i-ep-search /></el-icon>
      </template>
    </el-input>

    <el-scrollbar class="subject-list-card__scrollbar">
      <div v-if="subjects.length" class="subject-list-card__list">
        <button
          v-for="subject in subjects"
          :key="subject.id"
          type="button"
          class="subject-list-card__item"
          :class="{ 'is-active': subject.id === selectedId }"
          @click="emit('select', subject.id)"
        >
          <div class="subject-list-card__item-main">
            <span class="subject-list-card__item-name">{{ subject.nickname }}</span>
            <el-tag size="small" effect="plain" type="info">
              {{ roleLabelMap[subject.role] || subject.role }}
            </el-tag>
          </div>
          <span class="subject-list-card__item-sub">{{ subject.username }}</span>
          <span class="subject-list-card__item-sub">{{ subject.email }}</span>
        </button>
      </div>

      <el-empty v-else :description="currentEmptyText" :image-size="88" />
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.subject-list-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  min-height: 0;
  padding: var(--card-padding-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background-color: var(--bg-white);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  &__title {
    color: var(--t-primary);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  &__meta {
    color: var(--t-placeholder);
    font-size: 12px;
  }

  &__scrollbar {
    flex: 1;
    min-height: 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: 2px 0;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    width: 100%;
    text-align: left;
    border: 1px solid var(--border-light);
    background-color: var(--bg-white);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--c-primary) 22%, var(--border-light));
      background-color: var(--bg-hover);
    }

    &.is-active {
      border-color: color-mix(in srgb, var(--c-primary) 28%, var(--border-light));
      background-color: var(--c-primary-bg);
    }
  }

  &__item-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  &__item-name {
    color: var(--t-primary);
    font-weight: 600;
  }

  &__item-sub {
    color: var(--t-secondary);
    font-size: 12px;
    line-height: 1.4;
  }
}
</style>
