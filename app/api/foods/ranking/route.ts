import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'

// 确保 API 路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'all', 'dish', 'drink'
    const limit = parseInt(searchParams.get('limit') || '10')

    // 构建查询条件
    const where: any = {
      status: 'ACTIVE'
    }

    if (type === 'dish') {
      where.type = FoodType.DISH
    } else if (type === 'drink') {
      where.type = FoodType.DRINK
    }

    // 获取食物及其统计数据，按接受次数排序
    const foodsWithStats = await prisma.food.findMany({
      where,
      include: {
        stats: true,
        uploader: {
          select: {
            id: true,
            nickname: true
          }
        }
      },
      take: limit
    })

    // 计算排行榜数据
    const ranking = foodsWithStats
      .map(food => {
        const stats = food.stats
        const acceptCount = stats?.acceptCount || 0
        const recommendCount = stats?.recommendCount || 0
        const rejectCount = (stats?.rejectTodayCount || 0) + (stats?.rejectForeverCount || 0)
        
        // 计算接受率
        const acceptanceRate = recommendCount > 0 ? (acceptCount / recommendCount * 100) : 0
        
        // 计算热度分数（综合考虑接受次数、接受率、推荐次数）
        const hotScore = acceptCount * 2 + acceptanceRate * 0.1 + recommendCount * 0.1

        return {
          id: food.id,
          name: food.name,
          type: food.type,
          category: food.category,
          description: food.description,
          isUserUploaded: food.isUserUploaded,
          uploader: food.uploader,
          stats: {
            acceptCount,
            recommendCount,
            rejectCount,
            acceptanceRate: Math.round(acceptanceRate * 10) / 10, // 保留1位小数
            hotScore: Math.round(hotScore * 10) / 10
          },
          tags: JSON.parse(food.tags || '[]')
        }
      })
      .sort((a, b) => {
        // 首先按接受次数排序，然后按热度分数排序
        if (b.stats.acceptCount !== a.stats.acceptCount) {
          return b.stats.acceptCount - a.stats.acceptCount
        }
        return b.stats.hotScore - a.stats.hotScore
      })

    // 添加排名
    const rankedFoods = ranking.map((food, index) => ({
      ...food,
      rank: index + 1
    }))

    const response = NextResponse.json({
      success: true,
      data: {
        ranking: rankedFoods,
        total: rankedFoods.length,
        type: type || 'all'
      }
    })

    // 添加 CORS 头部
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response

  } catch (error) {
    console.error('获取美食排行榜错误:', error)
    return NextResponse.json(
      { error: '获取美食排行榜失败' },
      { status: 500 }
    )
  }
}
