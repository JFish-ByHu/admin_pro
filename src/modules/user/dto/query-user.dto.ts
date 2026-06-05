import { IsOptional, IsString, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { IsNumber } from 'class-validator'

export class QueryUserDto {
  /** 关键词：匹配用户名 / 昵称 / 邮箱 */
  @IsOptional()
  @IsString()
  keyword?: string

  /** 角色筛选 */
  @IsOptional()
  @IsIn(['super', 'admin', 'operator', 'user'], { message: '角色值不合法' })
  role?: string

  /** 状态筛选：enabled / disabled */
  @IsOptional()
  @IsIn(['enabled', 'disabled'], { message: 'status 只能是 enabled 或 disabled' })
  status?: 'enabled' | 'disabled'

  /** 页码，从 1 开始，默认 1 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'page 必须是数字' })
  @Min(1, { message: 'page 最小为 1' })
  page?: number = 1

  /** 每页条数，默认 20 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize 必须是数字' })
  @Min(1, { message: 'pageSize 最小为 1' })
  pageSize?: number = 20
}
