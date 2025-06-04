import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'
import crypto from 'crypto'

// 生成设备指纹
function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`
  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16)
}

// 获取或创建匿名用户
async function getOrCreateAnonymousUser(deviceFingerprint: string, ip: string) {
  // 查找是否已有该设备的用户记录
  let user = await prisma.user.findFirst({
    where: {
      nickname: `游客_${deviceFingerprint}`
    }
  })

  if (!user) {
    // 创建新的匿名用户
    user = await prisma.user.create({
      data: {
        nickname: `游客_${deviceFingerprint}`,
        role: 'USER'
      }
    })
  }

  return user
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { foods } = body

    if (!foods || !Array.isArray(foods)) {
      return NextResponse.json(
        { success: false, error: '请提供有效的菜品数组' },
        { status: 400 }
      )
    }

    if (foods.length === 0) {
      return NextResponse.json(
        { success: false, error: '菜品数组不能为空' },
        { status: 400 }
      )
    }

    if (foods.length > 50) {
      return NextResponse.json(
        { success: false, error: '一次最多只能上传50个菜品' },
        { status: 400 }
      )
    }

    // 获取用户信息
    const deviceFingerprint = generateDeviceFingerprint(request)
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown'

    // 获取或创建匿名用户
    const user = await getOrCreateAnonymousUser(deviceFingerprint, ip)

    const results = {
      success: 0,
      duplicates: [] as string[],
      errors: [] as string[]
    }

    // 批量处理每个菜品
    for (const food of foods) {
      try {
        const { name, type, category, description } = food

        // 验证必填字段
        if (!name || !type) {
          results.errors.push(`菜品 "${name || '未知'}" 缺少必填字段`)
          continue
        }

        // 验证类型
        if (!['DISH', 'DRINK'].includes(type)) {
          results.errors.push(`菜品 "${name}" 的类型无效`)
          continue
        }

        // 检查是否已存在
        const existing = await prisma.food.findFirst({
          where: {
            name: name.trim(),
            type: type as FoodType
          }
        })

        if (existing) {
          results.duplicates.push(name.trim())
          continue
        }

        // 创建新菜品（用户上传的默认为待审核状态）
        await prisma.food.create({
          data: {
            name: name.trim(),
            type: type as FoodType,
            category: category || (type === 'DISH' ? '家常菜' : '饮品'),
            description: description || `用户贡献的${type === 'DISH' ? '菜品' : '饮品'}`,
            status: 'PENDING', // 用户上传的内容需要审核
            tags: '',
            isUserUploaded: true, // 标记为用户上传
            uploadedBy: user.id, // 记录上传者
            uploadIp: ip // 记录上传IP
          }
        })

        results.success++
      } catch (error) {
        console.error(`创建菜品 "${food.name}" 失败:`, error)
        results.errors.push(`菜品 "${food.name}" 创建失败`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功上传 ${results.success} 个菜品${results.duplicates.length > 0 ? `，${results.duplicates.length} 个重复` : ''}${results.errors.length > 0 ? `，${results.errors.length} 个失败` : ''}`
    })

  } catch (error) {
    console.error('批量上传菜品失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}
