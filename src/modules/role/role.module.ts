import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Menu } from '../menu/entities/menu.entity'
import { Permission } from '../user/entities/permission.entity'
import { Role } from '../user/entities/role.entity'
import { User } from '../user/entities/user.entity'
import { RoleService } from './role.service'
import { RoleController } from './role.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, Menu, User])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService]
})
export class RoleModule {}
