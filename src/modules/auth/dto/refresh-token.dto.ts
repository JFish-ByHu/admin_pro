import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenDto {
  @IsNotEmpty({ message: '缺少 Refresh Token' })
  @IsString({ message: 'Refresh Token 必须是字符串' })
  refreshToken!: string
}
