import request from '@/utils/request'
import type {
  RoleCreateParams,
  RoleDetailView,
  RoleListParams,
  RoleListResult,
  RoleSimpleItem,
  RoleUpdateParams,
  RoleUserGrantDetailResult,
  RoleUserGrantUpdateParams,
  RoleView
} from '@/types/role'

export const getRoleList = (params: RoleListParams): Promise<RoleListResult> => {
  return request({
    url: '/roles/list',
    method: 'get',
    params
  })
}

export const getRoleSimpleList = (): Promise<RoleSimpleItem[]> => {
  return request({
    url: '/roles/simpleList',
    method: 'get'
  })
}

export const getRoleDetail = (id: string): Promise<RoleDetailView> => {
  return request({
    url: `/roles/detail/${id}`,
    method: 'get'
  })
}

export const addRole = (data: RoleCreateParams): Promise<RoleView> => {
  return request({
    url: '/roles/add',
    method: 'post',
    data
  })
}

export const updateRole = (id: string, data: RoleUpdateParams): Promise<RoleView> => {
  return request({
    url: `/roles/update/${id}`,
    method: 'patch',
    data
  })
}

export const deleteRoleById = (id: string): Promise<null> => {
  return request({
    url: `/roles/delete/${id}`,
    method: 'delete'
  })
}

export const batchDeleteRoles = (ids: string[]): Promise<{ deleted: number }> => {
  return request({
    url: '/roles/batchDelete',
    method: 'delete',
    data: { ids }
  })
}

export const getRoleUserGrantDetail = (roleId: string): Promise<RoleUserGrantDetailResult> => {
  return request({
    url: '/roles/grant/users/detail',
    method: 'get',
    params: { roleId }
  })
}

export const updateRoleUserGrant = (data: RoleUserGrantUpdateParams): Promise<null> => {
  return request({
    url: '/roles/grant/users/update',
    method: 'post',
    data
  })
}
