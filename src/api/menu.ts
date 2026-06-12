import request from '@/utils/request'
import type {
  MenuResourceCreateParams,
  MenuResourceListParams,
  MenuResourceListResult,
  MenuResourceNode,
  MenuResourceUpdateParams,
  RoleMenuGrantDetailResult,
  RoleMenuGrantUpdateParams
} from '@/types/menu'

export const getMenuResourceList = (
  params: MenuResourceListParams
): Promise<MenuResourceListResult> => {
  return request({
    url: '/menus/list',
    method: 'get',
    params
  })
}

export const getMenuResourceTree = (): Promise<MenuResourceNode[]> => {
  return request({
    url: '/menus/tree',
    method: 'get'
  })
}

export const getRoleMenuGrantDetail = (roleId: string): Promise<RoleMenuGrantDetailResult> => {
  return request({
    url: '/menus/grant/detail',
    method: 'get',
    params: { roleId }
  })
}

export const updateRoleMenuGrant = (data: RoleMenuGrantUpdateParams): Promise<null> => {
  return request({
    url: '/menus/grant/update',
    method: 'post',
    data
  })
}

export const addMenuResource = (data: MenuResourceCreateParams): Promise<MenuResourceNode> => {
  return request({
    url: '/menus/add',
    method: 'post',
    data
  })
}

export const updateMenuResource = (
  id: string,
  data: MenuResourceUpdateParams
): Promise<MenuResourceNode> => {
  return request({
    url: `/menus/update/${id}`,
    method: 'patch',
    data
  })
}

export const deleteMenuResourceById = (id: string): Promise<null> => {
  return request({
    url: `/menus/delete/${id}`,
    method: 'delete'
  })
}

export const batchDeleteMenuResources = (ids: string[]): Promise<{ deleted: number }> => {
  return request({
    url: '/menus/batchDelete',
    method: 'delete',
    data: { ids }
  })
}
