import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { formatDateTime } from '../../common/utils/date-time.util'
import { Role } from '../user/entities/role.entity'
import { Menu } from './entities/menu.entity'
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

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  private toMenuResourceResponse(menu: Menu): MenuResourceResponseDto {
    return {
      id: menu.id,
      parentId: menu.parentId,
      name: menu.name,
      type: menu.type,
      routePath: menu.routePath,
      componentPath: menu.componentPath,
      sort: menu.sort,
      status: menu.isActive ? 'enabled' : 'disabled',
      createTime: formatDateTime(menu.createTime),
      updateTime: formatDateTime(menu.updateTime)
    }
  }

  private async ensureMenuParentValid(
    parentId: string | null | undefined,
    currentId?: string
  ): Promise<void> {
    if (!parentId) {
      return
    }

    if (currentId && currentId === parentId) {
      throw new BadRequestException('父级菜单不能是自己')
    }

    const parent = await this.menuRepository.findOne({ where: { id: parentId } })
    if (!parent) {
      throw new BadRequestException('父级菜单不存在')
    }

    if (!currentId) {
      return
    }

    const allMenus = await this.menuRepository.find({
      select: {
        id: true,
        parentId: true
      }
    })

    const childrenMap = new Map<string, string[]>()
    allMenus.forEach(item => {
      if (!item.parentId) {
        return
      }
      const children = childrenMap.get(item.parentId) || []
      children.push(item.id)
      childrenMap.set(item.parentId, children)
    })

    const stack = [currentId]
    const descendants = new Set<string>()

    while (stack.length > 0) {
      const nodeId = stack.pop() as string
      const children = childrenMap.get(nodeId) || []
      children.forEach(childId => {
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(childId)
        }
      })
    }

    if (descendants.has(parentId)) {
      throw new BadRequestException('父级菜单不能是当前菜单的子节点')
    }
  }

  private buildMenuTree(items: Menu[]): MenuResourceTreeNodeDto[] {
    const nodeMap = new Map<string, MenuResourceTreeNodeDto>()

    items.forEach(item => {
      nodeMap.set(item.id, {
        ...this.toMenuResourceResponse(item),
        children: []
      })
    })

    const roots: MenuResourceTreeNodeDto[] = []

    nodeMap.forEach(node => {
      if (!node.parentId) {
        roots.push(node)
        return
      }

      const parent = nodeMap.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    const sortTree = (nodes: MenuResourceTreeNodeDto[]) => {
      nodes.sort((a, b) => a.sort - b.sort)
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortTree(node.children)
        }
      })
    }

    sortTree(roots)
    return roots
  }

  async list(query: QueryMenuDto): Promise<MenuResourceListResponseDto> {
    const { keyword, type, status, all = false, page = 1, pageSize = 20 } = query

    const qb = this.menuRepository.createQueryBuilder('menu')

    if (keyword) {
      qb.andWhere(
        '(menu.name LIKE :kw OR menu.routePath LIKE :kw OR menu.componentPath LIKE :kw)',
        { kw: `%${keyword}%` }
      )
    }

    if (type) {
      qb.andWhere('menu.type = :type', { type })
    }

    if (status) {
      qb.andWhere('menu.isActive = :isActive', { isActive: status === 'enabled' })
    }

    qb.orderBy('menu.sort', 'ASC').addOrderBy('menu.createTime', 'DESC')

    const total = await qb.getCount()
    const data = all
      ? await qb.getMany()
      : await qb
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getMany()

    return {
      list: data.map(item => this.toMenuResourceResponse(item)),
      total,
      page: all ? 1 : page,
      pageSize: all ? data.length : pageSize
    }
  }

  async tree(): Promise<MenuResourceTreeNodeDto[]> {
    const data = await this.menuRepository.find({
      order: {
        sort: 'ASC',
        createTime: 'DESC'
      }
    })

    return this.buildMenuTree(data)
  }

  async detail(id: string): Promise<MenuResourceResponseDto> {
    const menu = await this.menuRepository.findOne({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    return this.toMenuResourceResponse(menu)
  }

  async add(dto: CreateMenuDto): Promise<MenuResourceResponseDto> {
    await this.ensureMenuParentValid(dto.parentId)

    const routePathExists = await this.menuRepository.findOne({
      where: { routePath: dto.routePath }
    })
    if (routePathExists) {
      throw new ConflictException('路由路径已存在')
    }

    const menu = this.menuRepository.create({
      parentId: dto.parentId || null,
      name: dto.name,
      type: dto.type,
      routePath: dto.routePath,
      componentPath: dto.componentPath,
      sort: dto.sort ?? 0,
      isActive: dto.isActive ?? true
    })

    const saved = await this.menuRepository.save(menu)
    return this.toMenuResourceResponse(saved)
  }

  async update(id: string, dto: UpdateMenuDto): Promise<MenuResourceResponseDto> {
    const menu = await this.menuRepository.findOne({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    if (dto.parentId !== undefined) {
      await this.ensureMenuParentValid(dto.parentId, id)
      menu.parentId = dto.parentId || null
    }

    if (dto.routePath && dto.routePath !== menu.routePath) {
      const routePathExists = await this.menuRepository.findOne({
        where: { routePath: dto.routePath }
      })
      if (routePathExists) {
        throw new ConflictException('路由路径已存在')
      }
    }

    if (dto.name !== undefined) menu.name = dto.name
    if (dto.type !== undefined) menu.type = dto.type
    if (dto.routePath !== undefined) menu.routePath = dto.routePath
    if (dto.componentPath !== undefined) menu.componentPath = dto.componentPath
    if (dto.sort !== undefined) menu.sort = dto.sort
    if (dto.isActive !== undefined) menu.isActive = dto.isActive

    const saved = await this.menuRepository.save(menu)
    return this.toMenuResourceResponse(saved)
  }

  async delete(id: string): Promise<void> {
    const menu = await this.menuRepository.findOne({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    const hasChildren = await this.menuRepository.findOne({ where: { parentId: id } })
    if (hasChildren) {
      throw new BadRequestException('当前菜单存在子节点，不能直接删除')
    }

    await this.menuRepository.remove(menu)
  }

  async batchDelete(ids: string[]): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的菜单 ID')
    }

    const list = await this.menuRepository.findBy({ id: In(ids) })
    if (list.length === 0) {
      throw new NotFoundException('未找到可删除的菜单')
    }

    const hasChildren = await this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.parentId IN (:...ids)', { ids })
      .getCount()

    if (hasChildren > 0) {
      throw new BadRequestException('批量删除失败，所选菜单中包含父节点')
    }

    await this.menuRepository.remove(list)
    return { deleted: list.length }
  }

  async getRoleGrantDetail(roleId: string): Promise<RoleMenuGrantDetailResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { menus: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return {
      roleId,
      checkedMenuIds: (role.menus || []).map(item => item.id)
    }
  }

  async updateRoleGrant(dto: GrantRoleMenuDto): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: dto.roleId },
      relations: { menus: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    const menus = dto.menuIds.length
      ? await this.menuRepository.findBy({ id: In(dto.menuIds) })
      : []

    if (menus.length !== dto.menuIds.length) {
      throw new BadRequestException('菜单授权数据包含无效菜单 ID')
    }

    role.menus = menus
    await this.roleRepository.save(role)
  }
}
