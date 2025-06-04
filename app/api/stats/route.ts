import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'

// 确保 API 路由是动态的
export const dynamic = 'force-dynamic'

// Cloudflare 环境类型
interface CloudflareEnv {
  DB: D1Database
  CACHE: KVNamespace
}

export async function GET() {
  try {
    // 获取菜品数量
    const dishCount = await prisma.food.count({
      where: {
        type: FoodType.DISH,
        status: 'ACTIVE'
      }
    })

    // 获取饮品数量
    const drinkCount = await prisma.food.count({
      where: {
        type: FoodType.DRINK,
        status: 'ACTIVE'
      }
    })

    // 总数量
    const totalCount = dishCount + drinkCount

    const response = NextResponse.json({
      success: true,
      data: {
        dishCount,
        drinkCount,
        totalCount
      }
    })

    // 添加 CORS 头部
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response

  } catch (error) {
    console.error('统计API错误:', error)
    const errorResponse = NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    )

    // 添加 CORS 头部到错误响应
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return errorResponse
  }
}
