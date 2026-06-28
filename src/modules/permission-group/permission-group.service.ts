import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PermissionGroup } from './entities/permission-group.entity'
import { Permission } from '../user/entities/permission.entity'
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto'
import { UpdatePermissionGroupDto } from './dto/update-permission-group.dto'
import { PermissionGroupResponseDto } from './dto/permission-group-response.dto'
import { formatDateTime } from '../../core/utils/date-time.util'

@Injectable()
export class PermissionGroupService {
  constructor(
    @InjectRepository(PermissionGroup)
    private readonly groupRepository: Repository<PermissionGroup>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>
  ) {}

  private toResponse(group: PermissionGroup): PermissionGroupResponseDto {
    return {
      id: group.id,
      code: group.code,
      name: group.name,
      sort: group.sort,
      isActive: group.isActive,
      createTime: formatDateTime(group.createTime),
      updateTime: formatDateTime(group.updateTime)
    }
  }

  async list(): Promise<PermissionGroupResponseDto[]> {
    const groups = await this.groupRepository.find({
      order: { sort: 'ASC' }
    })
    return groups.map(g => this.toResponse(g))
  }

  async add(dto: CreatePermissionGroupDto): Promise<PermissionGroupResponseDto> {
    const exists = await this.groupRepository.findOne({
      where: { code: dto.code }
    })
    if (exists) {
      throw new ConflictException('分组标识已存在')
    }

    const group = this.groupRepository.create({
      code: dto.code,
      name: dto.name,
      sort: 0,
      isActive: dto.isActive ?? true
    })

    const saved = await this.groupRepository.save(group)
    return this.toResponse(saved)
  }

  async update(id: string, dto: UpdatePermissionGroupDto): Promise<PermissionGroupResponseDto> {
    const group = await this.groupRepository.findOne({ where: { id } })
    if (!group) {
      throw new NotFoundException('分组不存在')
    }

    if (dto.name !== undefined) group.name = dto.name
    if (dto.isActive !== undefined) group.isActive = dto.isActive

    const saved = await this.groupRepository.save(group)
    return this.toResponse(saved)
  }

  async resolveNameMap(codes: string[]): Promise<Map<string, string>> {
    if (!codes.length) {
      return new Map()
    }

    const groups = await this.groupRepository.find({
      where: codes.map(code => ({ code })),
      select: { code: true, name: true }
    })

    return new Map(groups.map(g => [g.code, g.name]))
  }

  async delete(id: string): Promise<void> {
    const group = await this.groupRepository.findOne({ where: { id } })
    if (!group) {
      throw new NotFoundException('分组不存在')
    }

    // 该分组下的权限 groupCode 置空，避免孤立引用
    await this.permissionRepository.update({ groupCode: group.code }, { groupCode: null })

    await this.groupRepository.remove(group)
  }

  async batchDelete(ids: string[]): Promise<{ deleted: number }> {
    if (!ids.length) {
      return { deleted: 0 }
    }

    const groups = await this.groupRepository.findBy(ids.map(id => ({ id })))
    if (!groups.length) {
      return { deleted: 0 }
    }

    const groupCodes = groups.map(g => g.code)

    await this.permissionRepository
      .createQueryBuilder()
      .update()
      .set({ groupCode: null })
      .where('groupCode IN (:...codes)', { codes: groupCodes })
      .execute()

    await this.groupRepository.remove(groups)
    return { deleted: groups.length }
  }
}
