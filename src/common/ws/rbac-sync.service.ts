import { Injectable } from '@nestjs/common'
import { WsGateway } from './ws.gateway'

export interface RbacChangedEventPayload {
  scope: 'menu' | 'permission' | 'role-user' | 'rbac'
  roleId?: string
  userId?: string
}

const RBAC_CHANGED_EVENT = 'rbac:changed'

@Injectable()
export class RbacSyncService {
  constructor(private readonly wsGateway: WsGateway) {}

  /** 向指定用户推送 RBAC 变更 */
  emitToUsers(userIds: string[], payload: RbacChangedEventPayload): void {
    this.wsGateway.emitToUsers(
      userIds,
      RBAC_CHANGED_EVENT,
      payload as unknown as Record<string, unknown>
    )
  }

  /** 向指定角色推送 RBAC 变更 */
  emitToRoles(roleIds: string[], payload: RbacChangedEventPayload): void {
    this.wsGateway.emitToRoles(
      roleIds,
      RBAC_CHANGED_EVENT,
      payload as unknown as Record<string, unknown>
    )
  }

  /** 向指定用户+角色推送 RBAC 变更 */
  emitToUsersAndRoles(
    userIds: string[],
    roleIds: string[],
    payload: RbacChangedEventPayload
  ): void {
    this.wsGateway.emitToUsersAndRoles(
      userIds,
      roleIds,
      RBAC_CHANGED_EVENT,
      payload as unknown as Record<string, unknown>
    )
  }
}
