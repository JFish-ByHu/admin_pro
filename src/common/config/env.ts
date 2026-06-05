export const getRequiredEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`缺少必需的环境变量: ${name}`)
  }

  return value
}
