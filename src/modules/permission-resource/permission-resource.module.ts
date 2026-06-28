import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Permission } from '../user/entities/permission.entity'
import { Role } from '../user/entities/role.entity'
import { PermissionResourceService } from './permission-resource.service'
import { PermissionResourceController } from './permission-resource.controller'
import { PermissionGroupModule } from '../permission-group/permission-group.module'
import { RbacSyncService } from '../../infrastructure/ws/rbac-sync.service'

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role]), PermissionGroupModule],
  controllers: [PermissionResourceController],
  providers: [PermissionResourceService, RbacSyncService],
  exports: [PermissionResourceService]
})
export class PermissionResourceModule {}
