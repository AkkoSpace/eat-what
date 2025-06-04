import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

// 获取菜品评分统计
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: foodId } = await params

    // 获取评分统计
    const ratings = await prisma.foodRating.findMany({
      where: { foodId },
      select: {
        rating: true
      }
    })

    const likes = ratings.filter(r => r.rating === 1).length
    const dislikes = ratings.filter(r => r.rating === -1).length
    const total = ratings.length

    // 获取当前用户的评分
    const deviceId = generateDeviceFingerprint(request)
    const userRating = await prisma.foodRating.findUnique({
      where: {
        foodId_deviceId: {
          foodId,
          deviceId
        }
      },
      select: {
        rating: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        likes,
        dislikes,
        total,
        userRating: userRating?.rating || null
      }
    })

  } catch (error) {
    console.error('获取评分失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}

// 提交评分
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: foodId } = await params
    const body = await request.json()
    const { rating } = body

    // 验证评分值
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { success: false, error: '评分值必须是 1（点赞）或 -1（点踩）' },
        { status: 400 }
      )
    }

    // 验证菜品是否存在
    const food = await prisma.food.findUnique({
      where: { id: foodId }
    })

    if (!food) {
      return NextResponse.json(
        { success: false, error: '菜品不存在' },
        { status: 404 }
      )
    }

    // 获取设备信息
    const deviceId = generateDeviceFingerprint(request)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown'

    // 尝试更新或创建评分
    const result = await prisma.foodRating.upsert({
      where: {
        foodId_deviceId: {
          foodId,
          deviceId
        }
      },
      update: {
        rating,
        ipAddress: ip,
        updatedAt: new Date()
      },
      create: {
        foodId,
        deviceId,
        rating,
        ipAddress: ip
      }
    })

    // 获取更新后的统计
    const ratings = await prisma.foodRating.findMany({
      where: { foodId },
      select: {
        rating: true
      }
    })

    const likes = ratings.filter(r => r.rating === 1).length
    const dislikes = ratings.filter(r => r.rating === -1).length
    const total = ratings.length

    return NextResponse.json({
      success: true,
      data: {
        likes,
        dislikes,
        total,
        userRating: rating
      },
      message: rating === 1 ? '点赞成功' : '点踩成功'
    })

  } catch (error) {
    console.error('提交评分失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}

// 删除评分
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: foodId } = await params
    const deviceId = generateDeviceFingerprint(request)

    // 删除评分
    await prisma.foodRating.deleteMany({
      where: {
        foodId,
        deviceId
      }
    })

    // 获取更新后的统计
    const ratings = await prisma.foodRating.findMany({
      where: { foodId },
      select: {
        rating: true
      }
    })

    const likes = ratings.filter(r => r.rating === 1).length
    const dislikes = ratings.filter(r => r.rating === -1).length
    const total = ratings.length

    return NextResponse.json({
      success: true,
      data: {
        likes,
        dislikes,
        total,
        userRating: null
      },
      message: '取消评分成功'
    })

  } catch (error) {
    console.error('删除评分失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}
