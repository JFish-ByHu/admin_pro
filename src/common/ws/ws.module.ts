import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { getRequiredEnv } from '../config/env'
import { UserModule } from '../../modules/user/user.module'
import { WsGateway } from './ws.gateway'
import { RbacSyncService } from './rbac-sync.service'

@Global()
@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: getRequiredEnv('JWT_ACCESS_SECRET')
    })
  ],
  providers: [WsGateway, RbacSyncService],
  exports: [WsGateway, RbacSyncService]
})
export class WsModule {}
