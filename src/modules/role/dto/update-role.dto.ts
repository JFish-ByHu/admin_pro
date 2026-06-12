import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from 'class-validator'

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'name 必须是字符串' })
  @MaxLength(50, { message: 'name 最长 50 个字符' })
  name?: string

  @IsOptional()
  @IsString({ message: 'description 必须是字符串' })
  @MaxLength(255, { message: 'description 最长 255 个字符' })
  description?: string

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须是布尔值' })
  isActive?: boolean

  @IsOptional()
  @IsArray({ message: 'permissionIds 必须是数组' })
  @ArrayUnique({ message: 'permissionIds 不能包含重复项' })
  @IsUUID('4', { each: true, message: 'permissionIds 存在不合法的 UUID' })
  permissionIds?: string[]

  @IsOptional()
  @IsArray({ message: 'menuIds 必须是数组' })
  @ArrayUnique({ message: 'menuIds 不能包含重复项' })
  @IsUUID('4', { each: true, message: 'menuIds 存在不合法的 UUID' })
  menuIds?: string[]
}
