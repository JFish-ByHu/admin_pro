import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Permission } from '../user/entities/permission.entity'
import { Role } from '../user/entities/role.entity'
import { PermissionResourceService } from './permission-resource.service'
import { PermissionResourceController } from './permission-resource.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role])],
  controllers: [PermissionResourceController],
  providers: [PermissionResourceService],
  exports: [PermissionResourceService]
})
export class PermissionResourceModule {}
