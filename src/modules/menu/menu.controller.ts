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
import { MENU_PERMISSION_CODES } from '../../common/rbac/permission-registry'
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

@Controller('menus')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('list')
  @RequirePermissions(MENU_PERMISSION_CODES.LIST)
  async list(@Query() query: QueryMenuDto): Promise<ApiSuccessBody<MenuResourceListResponseDto>> {
    const data = await this.menuService.list(query)
    return success(data, '查询成功')
  }

  @Get('tree')
  @RequirePermissions(MENU_PERMISSION_CODES.LIST)
  async tree(): Promise<ApiSuccessBody<MenuResourceTreeNodeDto[]>> {
    const data = await this.menuService.tree()
    return success(data, '查询成功')
  }

  @Get('detail/:id')
  @RequirePermissions(MENU_PERMISSION_CODES.DETAIL)
  async detail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<MenuResourceResponseDto>> {
    const data = await this.menuService.detail(id)
    return success(data, '查询成功')
  }

  @Post('add')
  @RequirePermissions(MENU_PERMISSION_CODES.CREATE)
  async add(@Body() dto: CreateMenuDto): Promise<ApiSuccessBody<MenuResourceResponseDto>> {
    const data = await this.menuService.add(dto)
    return success(data, '创建成功')
  }

  @Patch('update/:id')
  @RequirePermissions(MENU_PERMISSION_CODES.UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuDto
  ): Promise<ApiSuccessBody<MenuResourceResponseDto>> {
    const data = await this.menuService.update(id, dto)
    return success(data, '更新成功')
  }

  @Delete('delete/:id')
  @RequirePermissions(MENU_PERMISSION_CODES.DELETE)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.menuService.delete(id)
    return success(null, '删除成功')
  }

  @Delete('batchDelete')
  @RequirePermissions(MENU_PERMISSION_CODES.DELETE)
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const data = await this.menuService.batchDelete(ids)
    return success(data, `成功删除 ${data.deleted} 项`)
  }

  @Get('grant/detail')
  @RequirePermissions(MENU_PERMISSION_CODES.GRANT)
  async grantDetail(
    @Query('roleId', ParseUUIDPipe) roleId: string
  ): Promise<ApiSuccessBody<RoleMenuGrantDetailResponseDto>> {
    const data = await this.menuService.getRoleGrantDetail(roleId)
    return success(data, '查询成功')
  }

  @Post('grant/update')
  @RequirePermissions(MENU_PERMISSION_CODES.GRANT)
  async grantUpdate(@Body() dto: GrantRoleMenuDto): Promise<ApiSuccessBody<null>> {
    await this.menuService.updateRoleGrant(dto)
    return success(null, '授权成功')
  }
}
