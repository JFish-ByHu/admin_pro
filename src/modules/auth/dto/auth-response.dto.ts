export class CaptchaResponseDto {
  captchaId!: string
  code!: string
}

export class EncryptKeyResponseDto {
  keyId!: string
  aesKey!: string
}

export class SendEmailCodeResponseDto {
  success!: boolean
  cooldownSeconds!: number
}

export class VerifyEmailCodeResponseDto {
  emailVerifyTicket!: string
  expiresInSeconds!: number
}

export class CheckResetEmailResponseDto {
  exists!: boolean
}

export class ResetPasswordResponseDto {
  success!: boolean
}

export class RegisterUserResponseDto {
  id!: string
  username!: string
  email!: string
}

export class RegisterResponseDto {
  user!: RegisterUserResponseDto
}

export class RefreshTokenResponseDto {
  accessToken!: string
  refreshToken!: string
}

export class AuthMenuTreeNodeDto {
  id!: string
  parentId!: string | null
  name!: string
  type!: 'directory' | 'menu'
  routePath!: string
  componentPath!: string
  sort!: number
  children!: AuthMenuTreeNodeDto[]
}

export class AuthUserInfoDto {
  id!: string
  username!: string
  email!: string
  nickname!: string | null
  avatarUrl!: string | null
  role!: string
  permissions!: string[]
  menuTree!: AuthMenuTreeNodeDto[]
  menuRoutePaths!: string[]
}

export class LoginResponseDto extends RefreshTokenResponseDto {
  userInfo!: AuthUserInfoDto
}

export class LogoutResponseDto {
  success!: boolean
}
