import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UserModule } from '../user/user.module'
import { JwtStrategy } from './strategies/jwt.strategy'
import { getRequiredEnv } from '../../common/config/env'

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: getRequiredEnv('JWT_ACCESS_SECRET'),
      signOptions: { expiresIn: '2h' } // Access Token 默认 2 小时过期
    })
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
