import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { join } from 'path'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { getRequiredEnv } from './common/config/env'
import { RbacBootstrapService } from './common/bootstrap/rbac-bootstrap.service'

async function bootstrap() {
  getRequiredEnv('JWT_ACCESS_SECRET')
  getRequiredEnv('JWT_REFRESH_SECRET')
  getRequiredEnv('UPLOAD_PUBLIC_BASE_URL')

  const uploadRootDir = process.env.UPLOAD_ROOT_DIR || 'upload'
  const uploadStaticPrefix = process.env.UPLOAD_STATIC_PREFIX || '/api/upload'
  const uploadStaticPrefixWithSlash = uploadStaticPrefix.endsWith('/')
    ? uploadStaticPrefix
    : `${uploadStaticPrefix}/`

  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const rbacBootstrapService = app.get(RbacBootstrapService)

  // 设置全局路由前缀（最佳实践）
  app.setGlobalPrefix('api')

  // 开启 CORS 允许前端跨域请求
  app.enableCors()

  // 挂载本地上传目录为静态资源访问路径
  app.useStaticAssets(join(process.cwd(), uploadRootDir), {
    prefix: uploadStaticPrefixWithSlash
  })

  // 注册全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor())

  // 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter())

  // 开启全局验证管道，使 class-validator 生效
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除 DTO 中未定义的字段（如前端传来的 terms 等 UI 状态）
      forbidNonWhitelisted: false // 不直接报错，而是静默过滤掉多余字段，对前端更友好
    })
  )

  await rbacBootstrapService.bootstrap()

  await app.listen(process.env.PORT ?? 3001)
}
void bootstrap()
