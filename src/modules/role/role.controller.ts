import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../../common/guards/permissions.guard'
import { ROLE_PERMISSION_CODES } from '../../common/rbac/permission-registry'
import { success } from '../../common/response/api-response'
import type { ApiSuccessBody } from '../../common/response/api-response'
import { RoleService } from './role.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { QueryRoleDto } from './dto/query-role.dto'
import { GrantRoleUsersDto } from './dto/grant-role-users.dto'
import {
  RoleDetailResponseDto,
  RoleListResponseDto,
  RoleUserGrantDetailResponseDto
} from './dto/role-response.dto'

@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('list')
  @RequirePermissions(ROLE_PERMISSION_CODES.LIST)
  async list(@Query() query: QueryRoleDto): Promise<ApiSuccessBody<RoleListResponseDto>> {
    const data = await this.roleService.list(query)
    return success(data, '查询成功')
  }

  @Get('simpleList')
  @RequirePermissions(ROLE_PERMISSION_CODES.LIST)
  async simpleList(): Promise<ApiSuccessBody<Array<{ id: string; code: string; name: string }>>> {
    const data = await this.roleService.listSimple()
    return success(data, '查询成功')
  }

  @Get('detail/:id')
  @RequirePermissions(ROLE_PERMISSION_CODES.DETAIL)
  async detail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<RoleDetailResponseDto>> {
    const data = await this.roleService.detail(id)
    return success(data, '查询成功')
  }

  @Post('add')
  @RequirePermissions(ROLE_PERMISSION_CODES.CREATE)
  async add(@Body() dto: CreateRoleDto): Promise<ApiSuccessBody<RoleDetailResponseDto>> {
    const data = await this.roleService.add(dto)
    return success(data, '创建成功')
  }

  @Patch('update/:id')
  @RequirePermissions(ROLE_PERMISSION_CODES.UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto
  ): Promise<ApiSuccessBody<RoleDetailResponseDto>> {
    const data = await this.roleService.update(id, dto)
    return success(data, '更新成功')
  }

  @Delete('delete/:id')
  @RequirePermissions(ROLE_PERMISSION_CODES.DELETE)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.roleService.delete(id)
    return success(null, '删除成功')
  }

  @Delete('batchDelete')
  @RequirePermissions(ROLE_PERMISSION_CODES.DELETE)
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const data = await this.roleService.batchDelete(ids)
    return success(data, `成功删除 ${data.deleted} 项`)
  }

  @Get('grant/users/detail')
  @RequirePermissions(ROLE_PERMISSION_CODES.UPDATE)
  async grantUsersDetail(
    @Query('roleId', ParseUUIDPipe) roleId: string
  ): Promise<ApiSuccessBody<RoleUserGrantDetailResponseDto>> {
    const data = await this.roleService.getRoleUserGrantDetail(roleId)
    return success(data, '查询成功')
  }

  @Post('grant/users/update')
  @RequirePermissions(ROLE_PERMISSION_CODES.UPDATE)
  async grantUsersUpdate(@Body() dto: GrantRoleUsersDto): Promise<ApiSuccessBody<null>> {
    await this.roleService.updateRoleUserGrant(dto.roleId, dto.userIds)
    return success(null, '角色用户授权成功')
  }
}
