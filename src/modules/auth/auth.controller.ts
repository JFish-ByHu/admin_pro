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
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { SendEmailCodeDto } from './dto/send-email-code.dto'
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto'
import { success } from '../../common/response/api-response'
import type { ApiSuccessBody } from '../../common/response/api-response'
import {
  CaptchaResponseDto,
  EncryptKeyResponseDto,
  SendEmailCodeResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  RegisterResponseDto,
  VerifyEmailCodeResponseDto
} from './dto/auth-response.dto'
import { PasswordDecryptInterceptor } from '../../common/interceptors/password-decrypt.interceptor'

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
  async login(@Body() loginDto: LoginDto): Promise<ApiSuccessBody<LoginResponseDto>> {
    return success(await this.authService.login(loginDto))
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @Req() request: { user: { id: string } }
  ): Promise<ApiSuccessBody<LogoutResponseDto>> {
    return success(await this.authService.logout(request.user.id))
  }
}
