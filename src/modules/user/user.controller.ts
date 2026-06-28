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
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  UsePipes,
  BadRequestException
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FileInterceptor } from '@nestjs/platform-express'
import { randomUUID } from 'crypto'
import { extname, join } from 'path'
import { mkdir, unlink, writeFile } from 'fs/promises'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { QueryUserDto } from './dto/query-user.dto'
import { AssignUserRolesDto } from './dto/assign-user-roles.dto'
import { UserListResponseDto, UserResponseDto } from './dto/user-response.dto'
import { success } from '../../core/response/api-response'
import type { ApiSuccessBody } from '../../core/response/api-response'
import { RequirePermissions } from '../../core/decorators/permissions.decorator'
import { PermissionsGuard } from '../../core/guards/permissions.guard'
import { USER_PERMISSION_CODES } from '../../infrastructure/rbac/permission-registry'
import { LogAction } from '../../core/decorators/log-action.decorator'

const UPLOAD_ROOT_DIR = process.env.UPLOAD_ROOT_DIR || 'upload'
const UPLOAD_AVATAR_DIR = process.env.UPLOAD_AVATAR_DIR || 'avatars'
const UPLOAD_STATIC_PREFIX = process.env.UPLOAD_STATIC_PREFIX || '/api/upload'
const AVATAR_UPLOAD_DIR = join(process.cwd(), UPLOAD_ROOT_DIR, UPLOAD_AVATAR_DIR)
const UPLOAD_STATIC_PREFIX_WITH_SLASH = UPLOAD_STATIC_PREFIX.endsWith('/')
  ? UPLOAD_STATIC_PREFIX
  : `${UPLOAD_STATIC_PREFIX}/`
const UPLOAD_AVATAR_WEB_PREFIX = `${UPLOAD_STATIC_PREFIX_WITH_SLASH}${UPLOAD_AVATAR_DIR}`
const AVATAR_MIME_WHITELIST = ['image/jpeg', 'image/png', 'image/webp']
const AVATAR_MAX_SIZE = Number(process.env.UPLOAD_AVATAR_MAX_SIZE || 2 * 1024 * 1024)

const AVATAR_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

type UploadedAvatarFile = {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

const normalizeAvatarPathForStorage = (avatarUrl: string): string | null => {
  const normalized = avatarUrl.trim()

  if (!normalized.startsWith(UPLOAD_STATIC_PREFIX_WITH_SLASH)) {
    return null
  }

  return normalized.replace(UPLOAD_STATIC_PREFIX_WITH_SLASH, '')
}

const buildAvatarFilename = (file: UploadedAvatarFile): string => {
  const extension = AVATAR_EXTENSION_MAP[file.mimetype] || extname(file.originalname) || '.jpg'
  return `${randomUUID()}${extension.toLowerCase()}`
}

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /api/users/list
   * 分页查询用户列表，支持关键词 / 角色 / 状态筛选
   */
  @Get('list')
  @RequirePermissions(USER_PERMISSION_CODES.LIST)
  async list(@Query() query: QueryUserDto): Promise<ApiSuccessBody<UserListResponseDto>> {
    const result = await this.userService.findAll(query)
    return success(result, 'success')
  }

  /**
   * GET /api/users/detail/:id
   * 查询单个用户详情
   */
  @Get('detail/:id')
  @RequirePermissions(USER_PERMISSION_CODES.DETAIL)
  async detail(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<UserResponseDto>> {
    const user = await this.userService.findOne(id)
    return success(user, 'success')
  }

  /**
   * POST /api/users/add
   * 新增用户（管理员手动创建，密码明文传入，服务层哈希处理）
   */
  @Post('add')
  @RequirePermissions(USER_PERMISSION_CODES.CREATE)
  @LogAction('用户管理', '新增')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  )
  async add(@Body() dto: CreateUserDto): Promise<ApiSuccessBody<UserResponseDto>> {
    const user = await this.userService.createUser(dto)
    return success(user, 'success')
  }

  /**
   * PATCH /api/users/update/:id
   * 更新用户信息（支持部分更新）
   */
  @Patch('update/:id')
  @RequirePermissions(USER_PERMISSION_CODES.UPDATE)
  @LogAction('用户管理', '修改')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_MAX_SIZE }
    })
  )
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() avatar?: UploadedAvatarFile
  ): Promise<ApiSuccessBody<UserResponseDto>> {
    if (avatar && !AVATAR_MIME_WHITELIST.includes(avatar.mimetype)) {
      throw new BadRequestException('头像仅支持 jpg/png/webp 格式')
    }

    let newAvatarAbsolutePath = ''
    let nextAvatarUrl: string | undefined

    if (avatar) {
      const filename = buildAvatarFilename(avatar)
      nextAvatarUrl = `${UPLOAD_AVATAR_WEB_PREFIX}/${filename}`
      newAvatarAbsolutePath = join(AVATAR_UPLOAD_DIR, filename)

      await mkdir(AVATAR_UPLOAD_DIR, { recursive: true })
      await writeFile(newAvatarAbsolutePath, avatar.buffer)
    }

    const currentUser = await this.userService.findById(id)
    if (!currentUser) {
      if (newAvatarAbsolutePath) {
        await unlink(newAvatarAbsolutePath).catch(() => undefined)
      }
      throw new BadRequestException('用户不存在')
    }

    const existingAvatarUrl = currentUser.avatarUrl
    const shouldRemoveAvatar = !avatar && dto.avatarUrl === ''

    try {
      const user = await this.userService.updateUser(id, {
        ...dto,
        avatarUrl: nextAvatarUrl ?? (shouldRemoveAvatar ? '' : dto.avatarUrl)
      })

      if (avatar && existingAvatarUrl && existingAvatarUrl !== user.avatarUrl) {
        const relativePath = normalizeAvatarPathForStorage(existingAvatarUrl)
        if (relativePath) {
          void unlink(join(process.cwd(), UPLOAD_ROOT_DIR, relativePath)).catch(() => undefined)
        }
      }

      if (shouldRemoveAvatar && existingAvatarUrl) {
        const relativePath = normalizeAvatarPathForStorage(existingAvatarUrl)
        if (relativePath) {
          void unlink(join(process.cwd(), UPLOAD_ROOT_DIR, relativePath)).catch(() => undefined)
        }
      }

      return success(user, 'success')
    } catch (error) {
      if (newAvatarAbsolutePath) {
        await unlink(newAvatarAbsolutePath).catch(() => undefined)
      }

      throw error
    }
  }

  /**
   * DELETE /api/users/delete/:id
   * 删除单个用户
   */
  @Delete('delete/:id')
  @RequirePermissions(USER_PERMISSION_CODES.DELETE)
  @LogAction('用户管理', '删除')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<ApiSuccessBody<null>> {
    await this.userService.removeUser(id)
    return success(null, 'success')
  }

  /**
   * DELETE /api/users/batchDelete
   * 批量删除用户，Body: { ids: string[] }
   */
  @Delete('batchDelete')
  @RequirePermissions(USER_PERMISSION_CODES.DELETE)
  @LogAction('用户管理', '批量删除')
  async batchDelete(@Body('ids') ids: string[]): Promise<ApiSuccessBody<{ deleted: number }>> {
    const result = await this.userService.batchRemoveUsers(ids)
    return success(result, 'success')
  }

  /**
   * GET /api/users/roleDetail/:id
   * 查询用户角色分配明细
   */
  @Get('roleDetail/:id')
  @RequirePermissions(USER_PERMISSION_CODES.DETAIL)
  async roleDetail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<{ userId: string; roleIds: string[] }>> {
    const result = await this.userService.getUserRoleDetail(id)
    return success(result, 'success')
  }

  /**
   * POST /api/users/assignRoles
   * 分配用户角色（角色管理主导）
   */
  @Post('assignRoles')
  @RequirePermissions(USER_PERMISSION_CODES.UPDATE)
  @LogAction('用户管理', '角色分配')
  async assignRoles(@Body() dto: AssignUserRolesDto): Promise<ApiSuccessBody<UserResponseDto>> {
    const result = await this.userService.assignUserRoles(dto.userId, dto.roleIds)
    return success(result, 'success')
  }
}
