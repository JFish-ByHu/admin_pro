import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseInterceptors,
  UseGuards,
  Req
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { EmailLoginDto } from './dto/email-login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { SendEmailCodeDto } from './dto/send-email-code.dto'
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto'
import { CheckResetEmailDto } from './dto/check-reset-email.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { success } from '../../common/response/api-response'
import type { ApiSuccessBody } from '../../common/response/api-response'
import {
  CaptchaResponseDto,
  EncryptKeyResponseDto,
  SendEmailCodeResponseDto,
  CheckResetEmailResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  RegisterResponseDto,
  ResetPasswordResponseDto,
  VerifyEmailCodeResponseDto
} from './dto/auth-response.dto'
import { PasswordDecryptInterceptor } from '../../common/interceptors/password-decrypt.interceptor'
import { LogAction } from '../logging/log-action.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('captcha')
  async getCaptcha(): Promise<ApiSuccessBody<CaptchaResponseDto>> {
    return success(await this.authService.generateCaptcha())
  }

  @Get('encryptKey')
  async getEncryptKey(): Promise<ApiSuccessBody<EncryptKeyResponseDto>> {
    return success(await this.authService.generateEncryptKey())
  }

  @Post('emailCode/send')
  @HttpCode(HttpStatus.OK)
  async sendEmailCode(
    @Body() dto: SendEmailCodeDto,
    @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }
  ): Promise<ApiSuccessBody<SendEmailCodeResponseDto>> {
    const userAgent = Array.isArray(request.headers['user-agent'])
      ? request.headers['user-agent'][0]
      : request.headers['user-agent']

    return success(
      await this.authService.sendEmailCode(dto, {
        ip: request.ip,
        userAgent
      })
    )
  }

  @Post('emailCode/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmailCode(
    @Body() dto: VerifyEmailCodeDto
  ): Promise<ApiSuccessBody<VerifyEmailCodeResponseDto>> {
    return success(await this.authService.verifyEmailCode(dto))
  }

  @Post('password/emailCheck')
  @HttpCode(HttpStatus.OK)
  async checkResetEmail(
    @Body() dto: CheckResetEmailDto
  ): Promise<ApiSuccessBody<CheckResetEmailResponseDto>> {
    return success(await this.authService.checkResetEmail(dto))
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(PasswordDecryptInterceptor)
  async resetPassword(
    @Body() dto: ResetPasswordDto
  ): Promise<ApiSuccessBody<ResetPasswordResponseDto>> {
    return success(await this.authService.resetPassword(dto))
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() dto: RefreshTokenDto
  ): Promise<ApiSuccessBody<RefreshTokenResponseDto>> {
    return success(await this.authService.refreshToken(dto.refreshToken))
  }

  @Post('register')
  @UseInterceptors(PasswordDecryptInterceptor)
  async register(@Body() registerDto: RegisterDto): Promise<ApiSuccessBody<RegisterResponseDto>> {
    return success(await this.authService.register(registerDto))
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(PasswordDecryptInterceptor)
  @LogAction('认证', '登录')
  async login(@Body() loginDto: LoginDto): Promise<ApiSuccessBody<LoginResponseDto>> {
    return success(await this.authService.login(loginDto))
  }

  @Post('emailLogin')
  @HttpCode(HttpStatus.OK)
  @LogAction('认证', '邮箱登录')
  async emailLogin(@Body() dto: EmailLoginDto): Promise<ApiSuccessBody<LoginResponseDto>> {
    return success(await this.authService.emailLogin(dto))
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @Req() request: { user: { id: string } }
  ): Promise<ApiSuccessBody<LogoutResponseDto>> {
    return success(await this.authService.logout(request.user.id))
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUserInfo(
    @Req() request: { user: { id: string } }
  ): Promise<ApiSuccessBody<LoginResponseDto['userInfo']>> {
    return success(await this.authService.getCurrentUserInfo(request.user.id))
  }
}
