import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CacheModule } from '@nestjs/cache-manager'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'
import { RoleModule } from './modules/role/role.module'
import { MenuModule } from './modules/menu/menu.module'
import { PermissionResourceModule } from './modules/permission-resource/permission-resource.module'
import { RbacBootstrapService } from './common/bootstrap/rbac-bootstrap.service'
import { Role } from './modules/user/entities/role.entity'
import { Menu } from './modules/menu/entities/menu.entity'
import { Permission } from './modules/user/entities/permission.entity'
import { User } from './modules/user/entities/user.entity'

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // 全局可用
      ttl: 5 * 60 * 1000 // 缓存过期时间为 5 分钟 (毫秒)
    }),
    TypeOrmModule.forRoot({
      type: 'sqljs', // 使用纯 JS 的 SQLite 驱动
      location: 'database.sqlite', // 数据库文件路径
      autoSave: true, // 开启自动保存到本地文件
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true
    }),
    TypeOrmModule.forFeature([Role, Menu, Permission, User]),
    UserModule,
    AuthModule,
    RoleModule,
    MenuModule,
    PermissionResourceModule
  ],
  controllers: [AppController],
  providers: [AppService, RbacBootstrapService],
  exports: [RbacBootstrapService]
})
export class AppModule {}
