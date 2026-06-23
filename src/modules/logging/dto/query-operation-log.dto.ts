import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryOperationLogDto {
  @IsOptional()
  @IsString({ message: 'keyword 必须是字符串' })
  @MaxLength(100, { message: 'keyword 最长 100 个字符' })
  keyword?: string

  @IsOptional()
  @IsString({ message: 'module 必须是字符串' })
  @MaxLength(50, { message: 'module 最长 50 个字符' })
  module?: string

  @IsOptional()
  @IsString({ message: 'action 必须是字符串' })
  @MaxLength(30, { message: 'action 最长 30 个字符' })
  action?: string

  @IsOptional()
  @IsIn(['success', 'fail'], { message: 'result 只能是 success 或 fail' })
  result?: 'success' | 'fail'

  @IsOptional()
  @IsString({ message: 'startDate 必须是字符串' })
  startDate?: string

  @IsOptional()
  @IsString({ message: 'endDate 必须是字符串' })
  endDate?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page 必须是整数' })
  @Min(1, { message: 'page 不能小于 1' })
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize 必须是整数' })
  @Min(1, { message: 'pageSize 不能小于 1' })
  pageSize?: number = 20
}
