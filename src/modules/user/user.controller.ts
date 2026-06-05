import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { QueryUserDto } from './dto/query-user.dto'
import { UserListResponseDto, UserResponseDto } from './dto/user-response.dto'
import { success } from '../../common/response/api-response'
import type { ApiSuccessBody } from '../../common/response/api-response'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../../common/guards/permissions.guard'

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /api/users/list
   * 分页查询用户列表，支持关键词 / 角色 / 状态筛选
   */
  @Get('list')
  @RequirePermissions('system:user:list')
  async list(@Query() query: QueryUserDto): Promise<ApiSuccessBody<UserListResponseDto>> {
    const result = await this.userService.findAll(query)
    return success(result, '查询成功')
  }

  /**
   * GET /api/users/detail/:id
   * 查询单个用户详情
   */
  @Get('detail/:id')
  @RequirePermissions('system:user:detail')
  async detail(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<UserResponseDto>> {
    const user = await this.userService.findOne(id)
    return success(user, '查询成功')
  }

  /**
   * POST /api/users/add
   * 新增用户（管理员手动创建，密码明文传入，服务层哈希处理）
   */
  @Post('add')
  @RequirePermissions('system:user:create')
  async add(@Body() dto: CreateUserDto): Promise<ApiSuccessBody<UserResponseDto>> {
    const user = await this.userService.createUser(dto)
    return success(user, '用户创建成功')
  }

  /**
   * PATCH /api/users/update/:id
   * 更新用户信息（支持部分更新）
   */
  @Patch('update/:id')
  @RequirePermissions('system:user:update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto
  ): Promise<ApiSuccessBody<UserResponseDto>> {
    const user = await this.userService.updateUser(id, dto)
    return success(user, '用户更新成功')
  }

  /**
   * DELETE /api/users/delete/:id
   * 删除单个用户
   */
  @Delete('delete/:id')
  @RequirePermissions('system:user:delete')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.userService.removeUser(id)
    return success(null, '用户删除成功')
  }

  /**
   * DELETE /api/users/batchDelete
   * 批量删除用户，Body: { ids: string[] }
   */
  @Delete('batchDelete')
  @RequirePermissions('system:user:delete')
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const result = await this.userService.batchRemoveUsers(ids)
    return success(result, `成功删除 ${result.deleted} 个用户`)
  }
}
