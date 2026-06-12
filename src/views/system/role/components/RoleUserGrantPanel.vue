<script setup lang="ts">
import { computed } from 'vue'

interface GrantUserPanelItem {
  id: string
  username: string
  nickname: string
  email: string
  avatarUrl: string | null
}

const props = defineProps<{
  title: string
  keyword: string
  users: GrantUserPanelItem[]
  filteredUsers: GrantUserPanelItem[]
  checkedIds: string[]
  allChecked: boolean
  indeterminate: boolean
  emptyText: string
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:checkedIds': [value: string[]]
  toggleAll: [checked: boolean | string | number]
}>()

const localKeyword = computed({
  get: () => props.keyword,
  set: value => emit('update:keyword', value)
})

const localCheckedIds = computed({
  get: () => props.checkedIds,
  set: value => emit('update:checkedIds', value)
})

const getUserInitial = (name: string) => {
  const firstChar = name.trim().charAt(0)
  return (firstChar || '?').toUpperCase()
}
</script>

<template>
  <section class="grant-panel">
    <header class="grant-panel__header">
      <h4>{{ title }}</h4>
      <span class="count">{{ filteredUsers.length }}/{{ users.length }}</span>
    </header>

    <el-input v-model="localKeyword" placeholder="搜索昵称 / 用户名 / 邮箱" clearable>
      <template #prefix>
        <el-icon><i-ep-search /></el-icon>
      </template>
    </el-input>

    <div class="grant-panel__toolbar">
      <el-checkbox
        :model-value="allChecked"
        :indeterminate="indeterminate"
        @change="emit('toggleAll', $event)"
      >
        全选
      </el-checkbox>
      <span class="selected-tip">已选 {{ checkedIds.length }}</span>
    </div>

    <el-scrollbar class="grant-panel__list-wrap">
      <el-checkbox-group v-model="localCheckedIds" class="grant-user-list">
        <el-checkbox
          v-for="item in filteredUsers"
          :key="item.id"
          :value="item.id"
          class="grant-user-list__item"
        >
          <div class="grant-user-list__content">
            <el-avatar
              :size="36"
              :src="item.avatarUrl || undefined"
              :style="{
                backgroundColor: item.avatarUrl ? 'var(--bg-page-light)' : 'var(--c-info)'
              }"
              class="grant-user-list__avatar"
            >
              {{ getUserInitial(item.nickname) }}
            </el-avatar>
            <div class="grant-user-list__text">
              <div class="grant-user-list__main">{{ item.nickname }}</div>
              <div class="grant-user-list__sub">{{ item.username }}</div>
              <div class="grant-user-list__sub">{{ item.email }}</div>
            </div>
          </div>
        </el-checkbox>
      </el-checkbox-group>

      <el-empty v-if="!filteredUsers.length" :description="emptyText" :image-size="72" />
    </el-scrollbar>
  </section>
</template>

<style scoped lang="scss">
.grant-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--bg-white);
  min-height: 500px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;

    h4 {
      margin: 0;
      font-size: var(--font-size-base);
      color: var(--t-primary);
      font-weight: 600;
    }

    .count {
      color: var(--t-secondary);
      font-size: 12px;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .selected-tip {
      color: var(--t-secondary);
      font-size: 12px;
    }
  }

  &__list-wrap {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-2);
  }
}

.grant-user-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &__item {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-5);
    margin-right: 0;
    transition: border-color 0.2s ease;

    :deep(.el-checkbox__label) {
      width: 100%;
      padding-left: var(--space-2);
      line-height: 1.4;
      display: block;
    }

    &:hover {
      border-color: color-mix(in srgb, var(--c-primary) 22%, var(--border-light));
    }
  }

  &__content {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: var(--space-2);
    align-items: center;
  }

  &__avatar {
    border: 1px solid var(--border-light);
    font-size: 13px;
    font-weight: 600;
  }

  &__text {
    min-width: 0;
  }

  &__main {
    color: var(--t-primary);
    font-size: var(--font-size-base);
    font-weight: 600;
    margin-bottom: 2px;
  }

  &__sub {
    color: var(--t-secondary);
    font-size: 12px;
    line-height: 1.3;
    word-break: break-all;
  }
}

@include respond-to(tablet-down) {
  .grant-panel {
    min-height: 320px;
  }
}
</style>
