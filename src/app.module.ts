import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CacheModule } from '@nestjs/cache-manager'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './modules/auth/auth.module'

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
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
