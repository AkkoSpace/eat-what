// 设备指纹生成工具
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    // 服务端返回随机ID
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const components = []

  // 用户代理
  components.push(navigator.userAgent || '')

  // 屏幕分辨率
  components.push(`${screen.width}x${screen.height}`)

  // 时区
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '')

  // 语言
  components.push(navigator.language || '')

  // 平台
  components.push(navigator.platform || '')

  // 颜色深度
  components.push(screen.colorDepth?.toString() || '')

  // 像素比
  components.push(window.devicePixelRatio?.toString() || '')

  // Canvas指纹（简化版）
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint', 2, 2)
      components.push(canvas.toDataURL().slice(-50)) // 取最后50个字符
    }
  } catch (e) {
    components.push('canvas_error')
  }

  // 生成哈希
  const fingerprint = components.join('|')
  return hashCode(fingerprint).toString()
}

// 简单的哈希函数
function hashCode(str: string): number {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash)
}

// 获取或创建设备ID
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return generateDeviceFingerprint()
  }

  const storageKey = 'eat_what_device_id'
  let deviceId = localStorage.getItem(storageKey)

  if (!deviceId) {
    deviceId = generateDeviceFingerprint()
    localStorage.setItem(storageKey, deviceId)
  }

  return deviceId
}
