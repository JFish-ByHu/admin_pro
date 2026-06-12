import request from '@/utils/request'
import type {
  PermissionResourceCreateParams,
  PermissionResourceListParams,
  PermissionResourceListResult,
  PermissionResourceNode,
  PermissionResourceUpdateParams,
  RolePermissionGrantDetailResult,
  RolePermissionGrantUpdateParams
} from '@/types/permission'

export const getPermissionResourceList = (
  params: PermissionResourceListParams
): Promise<PermissionResourceListResult> => {
  return request({
    url: '/permissions/list',
    method: 'get',
    params
  })
}

export const getPermissionResourceTree = (): Promise<PermissionResourceNode[]> => {
  return request({
    url: '/permissions/tree',
    method: 'get'
  })
}

export const getRolePermissionGrantDetail = (
  roleId: string
): Promise<RolePermissionGrantDetailResult> => {
  return request({
    url: '/permissions/grant/detail',
    method: 'get',
    params: { roleId }
  })
}

export const updateRolePermissionGrant = (data: RolePermissionGrantUpdateParams): Promise<null> => {
  return request({
    url: '/permissions/grant/update',
    method: 'post',
    data
  })
}

export const addPermissionResource = (
  data: PermissionResourceCreateParams
): Promise<PermissionResourceNode> => {
  return request({
    url: '/permissions/add',
    method: 'post',
    data
  })
}

export const updatePermissionResource = (
  id: string,
  data: PermissionResourceUpdateParams
): Promise<PermissionResourceNode> => {
  return request({
    url: `/permissions/update/${id}`,
    method: 'patch',
    data
  })
}

export const deletePermissionResourceById = (id: string): Promise<null> => {
  return request({
    url: `/permissions/delete/${id}`,
    method: 'delete'
  })
}

export const batchDeletePermissionResources = (ids: string[]): Promise<{ deleted: number }> => {
  return request({
    url: '/permissions/batchDelete',
    method: 'delete',
    data: { ids }
  })
}
