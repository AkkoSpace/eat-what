import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 确保 API 路由是动态的
export const dynamic = 'force-dynamic'

// 记录使用统计
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, deviceId } = body

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (action === 'click') {
      // 记录点击统计
      await updateGlobalStats('click', deviceId)
      await updateDailyStats(today, 'click', deviceId)
      
      return NextResponse.json({
        success: true,
        message: '点击统计已记录'
      })
    }

    if (action === 'session_start') {
      // 记录会话开始
      await updateGlobalStats('session', deviceId)
      await updateDailyStats(today, 'session', deviceId)
      
      return NextResponse.json({
        success: true,
        message: '会话统计已记录'
      })
    }

    if (action === 'attempt') {
      // 记录推荐尝试
      await updateGlobalStats('attempt', deviceId)
      await updateDailyStats(today, 'attempt', deviceId)
      
      return NextResponse.json({
        success: true,
        message: '尝试统计已记录'
      })
    }

    if (action === 'accept') {
      // 记录接受
      await updateGlobalStats('accept', deviceId)
      await updateDailyStats(today, 'accept', deviceId)
      
      return NextResponse.json({
        success: true,
        message: '接受统计已记录'
      })
    }

    if (action === 'reject') {
      // 记录拒绝
      await updateGlobalStats('reject', deviceId)
      await updateDailyStats(today, 'reject', deviceId)
      
      return NextResponse.json({
        success: true,
        message: '拒绝统计已记录'
      })
    }

    if (action === 'abandon') {
      // 记录放弃
      await updateGlobalStats('abandon', deviceId)
      await updateDailyStats(today, 'abandon', deviceId)
      
      return NextResponse.json({
        success: true,
        message: '放弃统计已记录'
      })
    }

    return NextResponse.json(
      { error: '未知的操作类型' },
      { status: 400 }
    )

  } catch (error) {
    console.error('记录使用统计失败:', error)
    return NextResponse.json(
      { error: '记录使用统计失败' },
      { status: 500 }
    )
  }
}

// 获取使用统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'simple'

    if (type === 'simple') {
      // 获取简单统计（首页显示）
      const globalStats = await getOrCreateGlobalStats()
      
      return NextResponse.json({
        success: true,
        data: {
          totalHelped: globalStats.totalClicks, // 总帮助次数（点击次数）
          totalUsers: globalStats.totalUsers,   // 总用户数
        }
      })
    }

    if (type === 'detailed') {
      // 获取详细统计（管理页面）
      const [globalStats, recentDailyStats] = await Promise.all([
        getOrCreateGlobalStats(),
        prisma.dailyUsageStat.findMany({
          orderBy: { date: 'desc' },
          take: 30 // 最近30天
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          global: globalStats,
          daily: recentDailyStats
        }
      })
    }

    return NextResponse.json(
      { error: '未知的统计类型' },
      { status: 400 }
    )

  } catch (error) {
    console.error('获取使用统计失败:', error)
    return NextResponse.json(
      { error: '获取使用统计失败' },
      { status: 500 }
    )
  }
}

// 更新全局统计的辅助函数
async function updateGlobalStats(action: string, deviceId: string) {
  const globalStats = await getOrCreateGlobalStats()
  
  const updateData: any = {
    lastUpdated: new Date()
  }

  // 记录设备ID（简单去重）
  const existingUserIds = await prisma.recommendationStat.findMany({
    where: { deviceId },
    select: { deviceId: true },
    distinct: ['deviceId']
  })

  const isNewUser = existingUserIds.length === 0

  switch (action) {
    case 'click':
      updateData.totalClicks = globalStats.totalClicks + 1
      if (isNewUser) {
        updateData.totalUsers = globalStats.totalUsers + 1
      }
      break
    case 'session':
      updateData.totalSessions = globalStats.totalSessions + 1
      break
    case 'attempt':
      updateData.totalAttempts = globalStats.totalAttempts + 1
      break
    case 'accept':
      updateData.totalAccepted = globalStats.totalAccepted + 1
      break
    case 'reject':
      updateData.totalRejected = globalStats.totalRejected + 1
      break
    case 'abandon':
      updateData.totalAbandoned = globalStats.totalAbandoned + 1
      break
  }

  await prisma.globalUsageStat.update({
    where: { id: globalStats.id },
    data: updateData
  })
}

// 更新每日统计的辅助函数
async function updateDailyStats(date: string, action: string, deviceId: string) {
  let dailyStats = await prisma.dailyUsageStat.findUnique({
    where: { date }
  })

  if (!dailyStats) {
    dailyStats = await prisma.dailyUsageStat.create({
      data: { date }
    })
  }

  const activeUsers = JSON.parse(dailyStats.activeUsers || '[]')
  const isNewDailyUser = !activeUsers.includes(deviceId)

  const updateData: any = {}

  switch (action) {
    case 'click':
      updateData.dailyClicks = dailyStats.dailyClicks + 1
      if (isNewDailyUser) {
        updateData.dailyUsers = dailyStats.dailyUsers + 1
        updateData.activeUsers = JSON.stringify([...activeUsers, deviceId])
      }
      break
    case 'session':
      updateData.dailySessions = dailyStats.dailySessions + 1
      break
    case 'attempt':
      updateData.dailyAttempts = dailyStats.dailyAttempts + 1
      break
    case 'accept':
      updateData.dailyAccepted = dailyStats.dailyAccepted + 1
      break
    case 'reject':
      updateData.dailyRejected = dailyStats.dailyRejected + 1
      break
    case 'abandon':
      updateData.dailyAbandoned = dailyStats.dailyAbandoned + 1
      break
  }

  await prisma.dailyUsageStat.update({
    where: { date },
    data: updateData
  })
}

// 获取或创建全局统计记录
async function getOrCreateGlobalStats() {
  let globalStats = await prisma.globalUsageStat.findFirst()
  
  if (!globalStats) {
    globalStats = await prisma.globalUsageStat.create({
      data: {}
    })
  }
  
  return globalStats
}
