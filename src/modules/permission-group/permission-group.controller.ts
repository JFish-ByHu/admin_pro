import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RequirePermissions } from '../../core/decorators/permissions.decorator'
import { PermissionsGuard } from '../../core/guards/permissions.guard'
import { success } from '../../core/response/api-response'
import type { ApiSuccessBody } from '../../core/response/api-response'
import { PERMISSION_PERMISSION_CODES } from '../../infrastructure/rbac/permission-registry'
import { PermissionGroupService } from './permission-group.service'
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto'
import { UpdatePermissionGroupDto } from './dto/update-permission-group.dto'
import { BatchDeletePermissionGroupDto } from './dto/batch-delete-permission-group.dto'
import { PermissionGroupResponseDto } from './dto/permission-group-response.dto'

@Controller('permission-groups')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PermissionGroupController {
  constructor(private readonly permissionGroupService: PermissionGroupService) {}

  @Get('list')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.LIST)
  async list(): Promise<ApiSuccessBody<PermissionGroupResponseDto[]>> {
    const data = await this.permissionGroupService.list()
    return success(data, 'success')
  }

  @Post('add')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.CREATE)
  async add(
    @Body() dto: CreatePermissionGroupDto
  ): Promise<ApiSuccessBody<PermissionGroupResponseDto>> {
    const data = await this.permissionGroupService.add(dto)
    return success(data, 'success')
  }

  @Patch('update/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionGroupDto
  ): Promise<ApiSuccessBody<PermissionGroupResponseDto>> {
    const data = await this.permissionGroupService.update(id, dto)
    return success(data, 'success')
  }

  @Delete('delete/:id')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DELETE)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.permissionGroupService.delete(id)
    return success(null, 'success')
  }

  @Delete('batchDelete')
  @RequirePermissions(PERMISSION_PERMISSION_CODES.DELETE)
  async batchDelete(
    @Body() dto: BatchDeletePermissionGroupDto
  ): Promise<ApiSuccessBody<{ deleted: number }>> {
    const data = await this.permissionGroupService.batchDelete(dto.ids)
    return success(data, 'success')
  }
}
