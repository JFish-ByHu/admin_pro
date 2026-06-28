import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PermissionGroup } from './entities/permission-group.entity'
import { Permission } from '../user/entities/permission.entity'
import { PermissionGroupService } from './permission-group.service'
import { PermissionGroupController } from './permission-group.controller'

@Module({
  imports: [TypeOrmModule.forFeature([PermissionGroup, Permission])],
  controllers: [PermissionGroupController],
  providers: [PermissionGroupService],
  exports: [PermissionGroupService, TypeOrmModule]
})
export class PermissionGroupModule {}
