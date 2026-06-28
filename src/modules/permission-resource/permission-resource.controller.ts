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
import { RequirePermissions } from '../../core/decorators/permissions.decorator'
import { PermissionsGuard } from '../../core/guards/permissions.guard'
import { success } from '../../core/response/api-response'
import type { ApiSuccessBody } from '../../core/response/api-response'
import { PERMISSION_PERMISSION_CODES } from '../../infrastructure/rbac/permission-registry'
import { PermissionResourceService } from './permission-resource.service'
import { CreatePermissionResourceDto } from './dto/create-permission-resource.dto'
import { UpdatePermissionResourceDto } from './dto/update-permission-resource.dto'
import { QueryPermissionResourceDto } from './dto/query-permission-resource.dto'
import {
  PermissionResourceListResponseDto,
  PermissionResourceResponseDto,
  PermissionResourceTreeNodeDto,
  RolePermissionGrantDetailResponseDto
} from './dto/permission-resource-response.dto'
import { GrantRolePermissionDto } from './dto/grant-role-permission.dto'
import { LogAction } from '../../core/decorators/log-action.decorator'

@Controller('permissions')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PermissionResourceController {
  constructor(private readonly permissionResourceService: PermissionResourceService) {}

  @Get('list')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.LIST)
  async list(
    @Query() query: QueryPermissionResourceDto
  ): Promise<ApiSuccessBody<PermissionResourceListResponseDto>> {
    const data = await this.permissionResourceService.list(query)
    return success(data, 'success')
  }

  @Get('tree')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.LIST)
  async tree(): Promise<ApiSuccessBody<PermissionResourceTreeNodeDto[]>> {
    const data = await this.permissionResourceService.tree()
    return success(data, 'success')
  }

  @Get('detail/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DETAIL)
  async detail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<PermissionResourceResponseDto>> {
    const data = await this.permissionResourceService.detail(id)
    return success(data, 'success')
  }

  @Post('add')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.CREATE)
  @LogAction('权限管理', '新增')
  async add(
    @Body() dto: CreatePermissionResourceDto
  ): Promise<ApiSuccessBody<PermissionResourceResponseDto>> {
    const data = await this.permissionResourceService.add(dto)
    return success(data, 'success')
  }

  @Patch('update/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.UPDATE)
  @LogAction('权限管理', '修改')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionResourceDto
  ): Promise<ApiSuccessBody<PermissionResourceResponseDto>> {
    const data = await this.permissionResourceService.update(id, dto)
    return success(data, 'success')
  }

  @Delete('delete/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DELETE)
  @LogAction('权限管理', '删除')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.permissionResourceService.delete(id)
    return success(null, 'success')
  }

  @Delete('batchDelete')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DELETE)
  @LogAction('权限管理', '批量删除')
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const data = await this.permissionResourceService.batchDelete(ids)
    return success(data, 'success')
  }

  @Get('grant/detail')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.GRANT)
  async grantDetail(
    @Query('roleId', ParseUUIDPipe) roleId: string
  ): Promise<ApiSuccessBody<RolePermissionGrantDetailResponseDto>> {
    const data = await this.permissionResourceService.getRoleGrantDetail(roleId)
    return success(data, 'success')
  }

  @Post('grant/update')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.GRANT)
  @LogAction('权限管理', '授权')
  async grantUpdate(@Body() dto: GrantRolePermissionDto): Promise<ApiSuccessBody<null>> {
    await this.permissionResourceService.updateRoleGrant(dto)
    return success(null, 'success')
  }
}
