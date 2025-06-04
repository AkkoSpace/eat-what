import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 确保 API 路由是动态的
export const dynamic = 'force-dynamic'

// 开始新的推荐会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, userId, includeDrink } = body

    // 生成会话ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建推荐统计记录
    const stat = await prisma.recommendationStat.create({
      data: {
        sessionId,
        deviceId,
        userId,
        includeDrink: includeDrink || false,
        totalAttempts: 0, // 初始为0，第一次推荐时会更新
        attemptHistory: '[]'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: stat.sessionId,
        id: stat.id
      }
    })

  } catch (error) {
    console.error('创建推荐会话失败:', error)
    return NextResponse.json(
      { error: '创建推荐会话失败' },
      { status: 500 }
    )
  }
}

// 记录推荐尝试
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, foodId, drinkId, action } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少会话ID' },
        { status: 400 }
      )
    }

    // 查找推荐统计记录
    const stat = await prisma.recommendationStat.findFirst({
      where: { sessionId }
    })

    if (!stat) {
      return NextResponse.json(
        { error: '推荐会话不存在' },
        { status: 404 }
      )
    }

    // 解析历史记录
    const history = JSON.parse(stat.attemptHistory || '[]')

    if (action === 'attempt') {
      // 记录新的推荐尝试
      history.push({
        foodId,
        drinkId,
        timestamp: new Date().toISOString()
      })

      // 更新统计记录
      await prisma.recommendationStat.update({
        where: { id: stat.id },
        data: {
          totalAttempts: stat.totalAttempts + 1,
          attemptHistory: JSON.stringify(history)
        }
      })

      // 更新食物推荐统计
      if (foodId) {
        await updateFoodStats(foodId, 'recommend')
      }
      if (drinkId) {
        await updateFoodStats(drinkId, 'recommend')
      }

    } else if (action === 'accept') {
      // 用户接受推荐
      await prisma.recommendationStat.update({
        where: { id: stat.id },
        data: {
          isAccepted: true,
          finalFoodId: foodId,
          finalDrinkId: drinkId,
          completedAt: new Date()
        }
      })

      // 更新食物接受统计
      if (foodId) {
        await updateFoodStats(foodId, 'accept')
      }
      if (drinkId) {
        await updateFoodStats(drinkId, 'accept')
      }

    } else if (action === 'reject') {
      // 用户拒绝推荐
      const { rejectionType } = body // 'today' | 'forever'

      await prisma.recommendationStat.update({
        where: { id: stat.id },
        data: {
          rejectionType,
          completedAt: new Date()
        }
      })

      // 更新食物拒绝统计
      if (foodId) {
        await updateFoodStats(foodId, rejectionType === 'forever' ? 'reject_forever' : 'reject_today')
      }
      if (drinkId) {
        await updateFoodStats(drinkId, rejectionType === 'forever' ? 'reject_forever' : 'reject_today')
      }

    } else if (action === 'abandon') {
      // 用户放弃推荐（页面离开、超时等）
      const { abandonReason } = body // 'page_leave' | 'page_hidden' | 'timeout'

      await prisma.recommendationStat.update({
        where: { id: stat.id },
        data: {
          rejectionType: 'abandon',
          completedAt: new Date(),
          // 可以在 attemptHistory 中记录放弃原因
          attemptHistory: JSON.stringify([
            ...history,
            {
              action: 'abandon',
              reason: abandonReason,
              timestamp: new Date().toISOString()
            }
          ])
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: { sessionId }
    })

  } catch (error) {
    console.error('更新推荐统计失败:', error)
    return NextResponse.json(
      { error: '更新推荐统计失败' },
      { status: 500 }
    )
  }
}

// 更新食物统计的辅助函数
async function updateFoodStats(foodId: string, action: 'recommend' | 'accept' | 'reject_today' | 'reject_forever') {
  try {
    // 查找或创建食物统计记录
    let foodStat = await prisma.foodSelectionStat.findUnique({
      where: { foodId }
    })

    if (!foodStat) {
      foodStat = await prisma.foodSelectionStat.create({
        data: { foodId }
      })
    }

    // 根据动作更新统计
    const updateData: any = {}
    const now = new Date()

    switch (action) {
      case 'recommend':
        updateData.recommendCount = foodStat.recommendCount + 1
        updateData.lastRecommended = now
        break
      case 'accept':
        updateData.acceptCount = foodStat.acceptCount + 1
        updateData.lastAccepted = now
        break
      case 'reject_today':
        updateData.rejectTodayCount = foodStat.rejectTodayCount + 1
        updateData.lastRejected = now
        break
      case 'reject_forever':
        updateData.rejectForeverCount = foodStat.rejectForeverCount + 1
        updateData.lastRejected = now
        break
    }

    await prisma.foodSelectionStat.update({
      where: { foodId },
      data: updateData
    })

  } catch (error) {
    console.error('更新食物统计失败:', error)
  }
}

// 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'

    if (type === 'summary') {
      // 获取总体统计
      const [totalSessions, completedSessions, acceptedSessions, abandonedSessions, avgAttempts] = await Promise.all([
        prisma.recommendationStat.count(),
        prisma.recommendationStat.count({
          where: { completedAt: { not: null } }
        }),
        prisma.recommendationStat.count({
          where: { isAccepted: true }
        }),
        prisma.recommendationStat.count({
          where: { rejectionType: 'abandon' }
        }),
        prisma.recommendationStat.aggregate({
          _avg: { totalAttempts: true },
          where: { completedAt: { not: null } }
        })
      ])

      // 获取最受欢迎的食物
      const popularFoods = await prisma.foodSelectionStat.findMany({
        include: { food: true },
        orderBy: { acceptCount: 'desc' },
        take: 10
      })

      return NextResponse.json({
        success: true,
        data: {
          totalSessions,
          completedSessions,
          acceptedSessions,
          abandonedSessions,
          completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(1) : '0',
          acceptanceRate: totalSessions > 0 ? (acceptedSessions / totalSessions * 100).toFixed(1) : '0',
          abandonRate: totalSessions > 0 ? (abandonedSessions / totalSessions * 100).toFixed(1) : '0',
          avgAttempts: avgAttempts._avg.totalAttempts?.toFixed(1) || '0',
          popularFoods: popularFoods.map(stat => ({
            food: stat.food,
            stats: {
              recommendCount: stat.recommendCount,
              acceptCount: stat.acceptCount,
              acceptRate: stat.recommendCount > 0 ? (stat.acceptCount / stat.recommendCount * 100).toFixed(1) : '0'
            }
          }))
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {}
    })

  } catch (error) {
    console.error('获取推荐统计失败:', error)
    return NextResponse.json(
      { error: '获取推荐统计失败' },
      { status: 500 }
    )
  }
}
