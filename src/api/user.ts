import request from '@/utils/request'
import type {
  UserCreateParams,
  UserListParams,
  UserListResult,
  UserUpdateParams,
  UserView
} from '@/types/user'

export const getUserList = (params: UserListParams): Promise<UserListResult> => {
  return request({
    url: '/users/list',
    method: 'get',
    params
  })
}

export const getUserDetail = (id: string): Promise<UserView> => {
  return request({
    url: `/users/detail/${id}`,
    method: 'get'
  })
}

export const addUser = (data: UserCreateParams): Promise<UserView> => {
  return request({
    url: '/users/add',
    method: 'post',
    data
  })
}

export const updateUser = (id: string, data: UserUpdateParams): Promise<UserView> => {
  return request({
    url: `/users/update/${id}`,
    method: 'patch',
    data
  })
}

export const updateUserWithFormData = (id: string, data: FormData): Promise<UserView> => {
  return request({
    url: `/users/update/${id}`,
    method: 'patch',
    data
  })
}

export const deleteUserById = (id: string): Promise<null> => {
  return request({
    url: `/users/delete/${id}`,
    method: 'delete'
  })
}

export const batchDeleteUsers = (ids: string[]): Promise<{ deleted: number }> => {
  return request({
    url: '/users/batchDelete',
    method: 'delete',
    data: { ids }
  })
}
