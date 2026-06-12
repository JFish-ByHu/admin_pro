import { ArrayUnique, IsArray, IsUUID } from 'class-validator'

export class AssignUserRolesDto {
  @IsUUID('4', { message: 'userId 必须是合法的 UUID' })
  userId!: string

  @IsArray({ message: 'roleIds 必须是数组' })
  @ArrayUnique({ message: 'roleIds 不能包含重复项' })
  @IsUUID('4', { each: true, message: 'roleIds 存在不合法的 UUID' })
  roleIds!: string[]
}
