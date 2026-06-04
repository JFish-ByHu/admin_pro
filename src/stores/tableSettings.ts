import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface TableSettingState {
  rowSortableEnabled?: boolean
  selectionEnabled?: boolean
  visibleColumnKeys?: string[]
}

export const useTableSettingsStore = defineStore(
  'table-settings',
  () => {
    const tableSettingsMap = ref<Record<string, TableSettingState>>({})

    const getTableSettings = (settingsKey: string) => {
      return tableSettingsMap.value[settingsKey]
    }

    const setTableSettings = (settingsKey: string, nextState: TableSettingState) => {
      tableSettingsMap.value = {
        ...tableSettingsMap.value,
        [settingsKey]: {
          ...tableSettingsMap.value[settingsKey],
          ...nextState
        }
      }
    }

    const resetTableSettings = (settingsKey: string) => {
      const nextTableSettingsMap = { ...tableSettingsMap.value }

      delete nextTableSettingsMap[settingsKey]
      tableSettingsMap.value = nextTableSettingsMap
    }

    return {
      tableSettingsMap,
      getTableSettings,
      setTableSettings,
      resetTableSettings
    }
  },
  {
    persist: {
      key: 'admin-pro-table-settings',
      pick: ['tableSettingsMap']
    }
  }
)
