import { ArrayUnique, IsArray, IsUUID } from 'class-validator'

export class GrantRoleMenuDto {
  @IsUUID('4', { message: 'roleId 必须是合法的 UUID' })
  roleId!: string

  @IsArray({ message: 'menuIds 必须是数组' })
  @ArrayUnique({ message: 'menuIds 不能包含重复项' })
  @IsUUID('4', { each: true, message: 'menuIds 存在不合法的 UUID' })
  menuIds!: string[]
}
