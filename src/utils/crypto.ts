import CryptoJS from 'crypto-js'

/**
 * AES-256-ECB 加密
 * @param text 需要加密的明文密码
 * @param key 动态获取的 AES 密钥 (32 字符的 hex 字符串)
 * @returns Base64 编码的加密字符串
 */
export const encryptAES = (text: string, key: string): string => {
  // 将后端的 32 字符 hex string 解析为 CryptoJS 需要的 WordArray
  const keyHex = CryptoJS.enc.Utf8.parse(key)

  const encrypted = CryptoJS.AES.encrypt(text, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })

  // 默认 toString 就是 Base64 格式
  return encrypted.toString()
}
