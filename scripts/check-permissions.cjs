const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT_DIR, 'src')
const REGISTRY_FILE = path.join(SRC_DIR, 'common', 'rbac', 'permission-registry.ts')

const readText = filePath => fs.readFileSync(filePath, 'utf8')

const walkFiles = (dirPath, result = []) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, result)
      continue
    }

    if (entry.isFile()) {
      result.push(fullPath)
    }
  }

  return result
}

const parsePermissionRegistry = () => {
  const source = readText(REGISTRY_FILE)
  const objectRegex = /export const (\w+_PERMISSION_CODES)\s*=\s*\{([\s\S]*?)\} as const/g
  const lineRegex = /(\w+)\s*:\s*'([^']+)'/g

  const referenceMap = new Map()
  const codeSet = new Set()

  let objectMatch
  while ((objectMatch = objectRegex.exec(source)) !== null) {
    const objectName = objectMatch[1]
    const body = objectMatch[2]

    let lineMatch
    while ((lineMatch = lineRegex.exec(body)) !== null) {
      const property = lineMatch[1]
      const code = lineMatch[2]
      referenceMap.set(`${objectName}.${property}`, code)
      codeSet.add(code)
    }
  }

  if (codeSet.size === 0) {
    throw new Error('权限注册表解析失败：未找到任何权限码定义')
  }

  return {
    referenceMap,
    codeSet
  }
}

const parseRequirePermissionsFromControllers = referenceMap => {
  const controllerFiles = walkFiles(path.join(SRC_DIR, 'modules')).filter(filePath =>
    filePath.endsWith('.controller.ts')
  )

  const requireRegex = /@RequirePermissions\(([^)]*)\)/g
  const stringLiteralRegex = /'([^']+)'/g

  const usedCodes = new Set()
  const unknownRefs = []
  const rawLiteralUsages = []

  for (const filePath of controllerFiles) {
    const content = readText(filePath)
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')

    let requireMatch
    while ((requireMatch = requireRegex.exec(content)) !== null) {
      const args = requireMatch[1]
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

      for (const arg of args) {
        if (arg.startsWith("'") && arg.endsWith("'")) {
          const code = arg.slice(1, -1)
          usedCodes.add(code)
          rawLiteralUsages.push(`${relativePath} -> ${code}`)
          continue
        }

        if (/^\w+_PERMISSION_CODES\.\w+$/.test(arg)) {
          const code = referenceMap.get(arg)
          if (!code) {
            unknownRefs.push(`${relativePath} -> ${arg}`)
            continue
          }
          usedCodes.add(code)
          continue
        }

        const inlineCodes = [...args.matchAll(stringLiteralRegex)].map(match => match[1])
        if (inlineCodes.length > 0) {
          inlineCodes.forEach(code => usedCodes.add(code))
          rawLiteralUsages.push(`${relativePath} -> ${inlineCodes.join(', ')}`)
          continue
        }

        unknownRefs.push(`${relativePath} -> ${arg}`)
      }
    }
  }

  return {
    usedCodes,
    unknownRefs,
    rawLiteralUsages
  }
}

const printList = (title, values) => {
  console.error(`\n${title}`)
  values.forEach(item => console.error(`- ${item}`))
}

const main = () => {
  const { referenceMap, codeSet } = parsePermissionRegistry()
  const { usedCodes, unknownRefs, rawLiteralUsages } =
    parseRequirePermissionsFromControllers(referenceMap)

  const missingInRegistry = [...usedCodes].filter(code => !codeSet.has(code))
  const unusedInControllers = [...codeSet].filter(code => !usedCodes.has(code))

  if (rawLiteralUsages.length > 0) {
    printList('发现直接字符串权限写法（建议改为常量）:', rawLiteralUsages)
  }

  if (unusedInControllers.length > 0) {
    printList('注册表中存在未被控制器使用的权限码（请确认是否废弃）:', unusedInControllers)
  }

  if (unknownRefs.length > 0) {
    printList('无法解析的权限常量引用:', unknownRefs)
  }

  if (missingInRegistry.length > 0) {
    printList('控制器使用了未注册权限码:', missingInRegistry)
  }

  if (unknownRefs.length > 0 || missingInRegistry.length > 0) {
    console.error('\n权限一致性检查失败')
    process.exit(1)
  }

  console.log('权限一致性检查通过')
}

main()
