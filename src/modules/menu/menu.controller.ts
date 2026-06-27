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
import { MENU_PERMISSION_CODES } from '../../infrastructure/rbac/permission-registry'
import { MenuService } from './menu.service'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { QueryMenuDto } from './dto/query-menu.dto'
import {
  MenuResourceListResponseDto,
  MenuResourceResponseDto,
  MenuResourceTreeNodeDto,
  RoleMenuGrantDetailResponseDto
} from './dto/menu-response.dto'
import { GrantRoleMenuDto } from './dto/grant-role-menu.dto'
import { LogAction } from '../logging/log-action.decorator'

@Controller('menus')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('list')
  @RequirePermissions(MENU_PERMISSION_CODES.LIST)
  async list(@Query() query: QueryMenuDto): Promise<ApiSuccessBody<MenuResourceListResponseDto>> {
    const data = await this.menuService.list(query)
    return success(data, 'success')
  }

  @Get('tree')
  @RequirePermissions(MENU_PERMISSION_CODES.LIST)
  async tree(): Promise<ApiSuccessBody<MenuResourceTreeNodeDto[]>> {
    const data = await this.menuService.tree()
    return success(data, 'success')
  }

  @Get('detail/:id')
  @RequirePermissions(MENU_PERMISSION_CODES.DETAIL)
  async detail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<MenuResourceResponseDto>> {
    const data = await this.menuService.detail(id)
    return success(data, 'success')
  }

  @Post('add')
  @RequirePermissions(MENU_PERMISSION_CODES.CREATE)
  @LogAction('菜单管理', '新增')
  async add(@Body() dto: CreateMenuDto): Promise<ApiSuccessBody<MenuResourceResponseDto>> {
    const data = await this.menuService.add(dto)
    return success(data, 'success')
  }

  @Patch('update/:id')
  @RequirePermissions(MENU_PERMISSION_CODES.UPDATE)
  @LogAction('菜单管理', '修改')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuDto
  ): Promise<ApiSuccessBody<MenuResourceResponseDto>> {
    const data = await this.menuService.update(id, dto)
    return success(data, 'success')
  }

  @Delete('delete/:id')
  @RequirePermissions(MENU_PERMISSION_CODES.DELETE)
  @LogAction('菜单管理', '删除')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.menuService.delete(id)
    return success(null, 'success')
  }

  @Delete('batchDelete')
  @RequirePermissions(MENU_PERMISSION_CODES.DELETE)
  @LogAction('菜单管理', '批量删除')
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const data = await this.menuService.batchDelete(ids)
    return success(data, 'success')
  }

  @Get('grant/detail')
  @RequirePermissions(MENU_PERMISSION_CODES.GRANT)
  async grantDetail(
    @Query('roleId', ParseUUIDPipe) roleId: string
  ): Promise<ApiSuccessBody<RoleMenuGrantDetailResponseDto>> {
    const data = await this.menuService.getRoleGrantDetail(roleId)
    return success(data, 'success')
  }

  @Post('grant/update')
  @RequirePermissions(MENU_PERMISSION_CODES.GRANT)
  @LogAction('菜单管理', '授权')
  async grantUpdate(@Body() dto: GrantRoleMenuDto): Promise<ApiSuccessBody<null>> {
    await this.menuService.updateRoleGrant(dto)
    return success(null, 'success')
  }
}
