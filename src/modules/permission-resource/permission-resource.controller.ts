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
import { success } from '../../common/response/api-response'
import type { ApiSuccessBody } from '../../common/response/api-response'
import { PERMISSION_PERMISSION_CODES } from '../../common/rbac/permission-registry'
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
    return success(data, '查询成功')
  }

  @Get('tree')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.LIST)
  async tree(): Promise<ApiSuccessBody<PermissionResourceTreeNodeDto[]>> {
    const data = await this.permissionResourceService.tree()
    return success(data, '查询成功')
  }

  @Get('detail/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DETAIL)
  async detail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<PermissionResourceResponseDto>> {
    const data = await this.permissionResourceService.detail(id)
    return success(data, '查询成功')
  }

  @Post('add')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.CREATE)
  async add(
    @Body() dto: CreatePermissionResourceDto
  ): Promise<ApiSuccessBody<PermissionResourceResponseDto>> {
    const data = await this.permissionResourceService.add(dto)
    return success(data, '创建成功')
  }

  @Patch('update/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionResourceDto
  ): Promise<ApiSuccessBody<PermissionResourceResponseDto>> {
    const data = await this.permissionResourceService.update(id, dto)
    return success(data, '更新成功')
  }

  @Delete('delete/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DELETE)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.permissionResourceService.delete(id)
    return success(null, '删除成功')
  }

  @Delete('batchDelete')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DELETE)
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const data = await this.permissionResourceService.batchDelete(ids)
    return success(data, `成功删除 ${data.deleted} 项`)
  }

  @Get('grant/detail')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.GRANT)
  async grantDetail(
    @Query('roleId', ParseUUIDPipe) roleId: string
  ): Promise<ApiSuccessBody<RolePermissionGrantDetailResponseDto>> {
    const data = await this.permissionResourceService.getRoleGrantDetail(roleId)
    return success(data, '查询成功')
  }

  @Post('grant/update')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.GRANT)
  async grantUpdate(@Body() dto: GrantRolePermissionDto): Promise<ApiSuccessBody<null>> {
    await this.permissionResourceService.updateRoleGrant(dto)
    return success(null, '授权成功')
  }
}
