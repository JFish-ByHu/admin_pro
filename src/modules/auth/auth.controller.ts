import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UnauthorizedException,
  UseInterceptors
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { PasswordDecryptInterceptor } from '../../common/interceptors/password-decrypt.interceptor'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('captcha')
  async getCaptcha() {
    return this.authService.generateCaptcha()
  }

  @Get('encryptKey')
  async getEncryptKey() {
    return this.authService.generateEncryptKey()
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('缺少 Refresh Token')
    }
    return this.authService.refreshToken(refreshToken)
  }

  @Post('register')
  @UseInterceptors(PasswordDecryptInterceptor)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(PasswordDecryptInterceptor)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }
}
