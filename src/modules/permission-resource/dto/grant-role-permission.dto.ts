import { ArrayUnique, IsArray, IsUUID } from 'class-validator'

export class GrantRolePermissionDto {
  @IsUUID('4', { message: 'roleId 必须是合法的 UUID' })
  roleId!: string

  @IsArray({ message: 'permissionIds 必须是数组' })
  @ArrayUnique({ message: 'permissionIds 不能包含重复项' })
  @IsUUID('4', { each: true, message: 'permissionIds 存在不合法的 UUID' })
  permissionIds!: string[]
}
