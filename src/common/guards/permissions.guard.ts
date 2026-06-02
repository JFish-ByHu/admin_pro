import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    // 如果接口没有标注 @RequirePermissions，则默认放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const req = context.switchToHttp().getRequest<{ user?: { permissions?: string[] } }>()
    const user = req.user

    // 注意：目前这只是基底架构，实际业务中需要在 JwtStrategy 验证 Token 后，
    // 去数据库联表查出该用户的所有权限标识，并挂载到 user.permissions 上
    const userPermissions: string[] = user?.permissions || []

    // 只要用户的权限数组中包含了接口要求的某个权限，即认为有权限 (或者你可以改为 .every 要求全满足)
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    )

    if (!hasPermission) {
      throw new ForbiddenException('权限不足，拒绝访问')
    }

    return true
  }
}
