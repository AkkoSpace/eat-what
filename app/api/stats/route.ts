import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'

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

    return NextResponse.json({
      success: true,
      data: {
        dishCount,
        drinkCount,
        totalCount
      }
    })

  } catch (error) {
    console.error('统计API错误:', error)
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    )
  }
}
