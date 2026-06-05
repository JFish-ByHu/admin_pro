export class CaptchaResponseDto {
  captchaId!: string
  code!: string
}

export class EncryptKeyResponseDto {
  keyId!: string
  aesKey!: string
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

export class AuthUserInfoDto {
  id!: string
  username!: string
  email!: string
  nickname!: string | null
  avatarUrl!: string | null
  role!: string
  permissions!: string[]
}

export class LoginResponseDto extends RefreshTokenResponseDto {
  userInfo!: AuthUserInfoDto
}

export class LogoutResponseDto {
  success!: boolean
}
