/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UserService } from '../../user/user.service'
import { getRequiredEnv } from '../../../common/config/env'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      // 从请求头 Authorization: Bearer <token> 中提取 Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 必须忽略过期验证，交由 Passport 自己处理
      ignoreExpiration: false,
      // 使用和签发相同的 Access Secret
      secretOrKey: getRequiredEnv('JWT_ACCESS_SECRET')
    })
  }

  // Token 验证成功后，会将解析出的 payload 传入 validate 方法
  async validate(payload: { sub: string; username: string }) {
    const user = await this.userService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('Token无效或用户不存在')
    }
    if (!user.isActive) {
      throw new UnauthorizedException('账号不可用，请联系管理员')
    }

    const permissions = user.getPermissionCodes()

    // 将 user 挂载到 request.user 上
    return { ...user, permissions }
  }
}
