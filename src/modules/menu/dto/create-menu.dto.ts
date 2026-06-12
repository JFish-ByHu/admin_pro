import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from 'class-validator'

export class CreateMenuDto {
  @IsOptional()
  @IsUUID('4', { message: 'parentId 必须是合法的 UUID' })
  parentId?: string

  @IsString({ message: 'name 必须是字符串' })
  @MaxLength(100, { message: 'name 最长 100 个字符' })
  name!: string

  @IsIn(['directory', 'menu'], { message: 'type 只能是 directory 或 menu' })
  type!: 'directory' | 'menu'

  @IsString({ message: 'routePath 必须是字符串' })
  @MaxLength(255, { message: 'routePath 最长 255 个字符' })
  routePath!: string

  @IsString({ message: 'componentPath 必须是字符串' })
  @MaxLength(255, { message: 'componentPath 最长 255 个字符' })
  componentPath!: string

  @IsOptional()
  @IsString({ message: 'icon 必须是字符串' })
  @MaxLength(50, { message: 'icon 最长 50 个字符' })
  icon?: string

  @IsOptional()
  @IsInt({ message: 'sort 必须是整数' })
  @Min(0, { message: 'sort 不能小于 0' })
  sort?: number

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须是布尔值' })
  isActive?: boolean
}
