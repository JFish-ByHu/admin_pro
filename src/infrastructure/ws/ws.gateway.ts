import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Server, Socket } from 'socket.io'
import { getRequiredEnv } from '../../config/env'
import { UserService } from '../../modules/user/user.service'

const USER_ROOM_PREFIX = 'user:'
const ROLE_ROOM_PREFIX = 'role:'

type JwtPayload = {
  sub: string
  username: string
}

type AuthenticatedSocketData = {
  userId?: string
  roleIds?: string[]
}

export interface WsEmitPayload {
  event: string
  data: Record<string, unknown>
}

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: true,
    credentials: true
  }
})
export class WsGateway
  implements OnGatewayInit<Server>, OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
  private readonly logger = new Logger(WsGateway.name)

  @WebSocketServer()
  private server!: Server

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  afterInit(): void {
    // no-op
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractAccessToken(client)
      if (!token) {
        client.disconnect(true)
        return
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: getRequiredEnv('JWT_ACCESS_SECRET')
      })

      const user = await this.userService.findById(payload.sub)
      if (!user || !user.isActive) {
        client.disconnect(true)
        return
      }

      const roleIds = Array.from(
        new Set((user.roles || []).filter(role => role.isActive !== false).map(role => role.id))
      )

      await client.join(this.toUserRoom(user.id))

      if (roleIds.length > 0) {
        await client.join(roleIds.map(roleId => this.toRoleRoom(roleId)))
      }

      const socketData = client.data as AuthenticatedSocketData
      socketData.userId = user.id
      socketData.roleIds = roleIds
    } catch {
      this.logger.warn('WebSocket 鉴权失败，连接已拒绝')
      client.disconnect(true)
    }
  }

  handleDisconnect(): void {
    // no-op
  }

  // ── 通用推送方法 ──────────────────────────────────────────────

  /** 向指定用户房间发送事件 */
  emitToUsers(userIds: string[], event: string, data: Record<string, unknown>): void {
    this.emitToRooms(
      userIds.map(userId => this.toUserRoom(userId)),
      event,
      data
    )
  }

  /** 向指定角色房间发送事件 */
  emitToRoles(roleIds: string[], event: string, data: Record<string, unknown>): void {
    this.emitToRooms(
      roleIds.map(roleId => this.toRoleRoom(roleId)),
      event,
      data
    )
  }

  /** 向指定用户+角色房间发送事件 */
  emitToUsersAndRoles(
    userIds: string[],
    roleIds: string[],
    event: string,
    data: Record<string, unknown>
  ): void {
    this.emitToRooms(
      [
        ...userIds.map(userId => this.toUserRoom(userId)),
        ...roleIds.map(roleId => this.toRoleRoom(roleId))
      ],
      event,
      data
    )
  }

  // ── 私有方法 ──────────────────────────────────────────────────

  private extractAccessToken(client: Socket): string {
    const authToken = client.handshake.auth?.token as unknown
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace(/^Bearer\s+/i, '').trim()
    }

    const headerToken = client.handshake.headers.authorization
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.replace(/^Bearer\s+/i, '').trim()
    }

    return ''
  }

  private toUserRoom(userId: string): string {
    return `${USER_ROOM_PREFIX}${userId}`
  }

  private toRoleRoom(roleId: string): string {
    return `${ROLE_ROOM_PREFIX}${roleId}`
  }

  private emitToRooms(roomNames: string[], event: string, data: Record<string, unknown>): void {
    const uniqueRooms = Array.from(new Set(roomNames.filter(Boolean)))
    if (!uniqueRooms.length) {
      return
    }

    this.server.to(uniqueRooms).emit(event, {
      ...data,
      at: Date.now()
    })
  }
}
