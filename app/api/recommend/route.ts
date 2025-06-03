import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'

// 缓存数据，减少数据库查询
let cachedDishes: any[] = []
let cachedDrinks: any[] = []
let lastCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

async function getCachedFoods() {
  const now = Date.now()

  // 如果缓存过期或为空，重新获取
  if (now - lastCacheTime > CACHE_DURATION || cachedDishes.length === 0) {
    try {
      console.log('刷新食物缓存...')

      // 并行获取菜品和饮品
      const [dishes, drinks] = await Promise.all([
        prisma.food.findMany({
          where: { type: FoodType.DISH, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            type: true,
            category: true,
            description: true,
            tags: true
          }
        }),
        prisma.food.findMany({
          where: { type: FoodType.DRINK, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            type: true,
            category: true,
            description: true,
            tags: true
          }
        })
      ])

      cachedDishes = dishes
      cachedDrinks = drinks
      lastCacheTime = now

      console.log(`缓存更新完成: ${dishes.length} 个菜品, ${drinks.length} 个饮品`)
    } catch (error) {
      console.error('更新缓存失败:', error)
      // 如果更新失败但有旧缓存，继续使用旧缓存
      if (cachedDishes.length === 0) {
        throw error
      }
    }
  }

  return { dishes: cachedDishes, drinks: cachedDrinks }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrink = searchParams.get('includeDrink') === 'true'

    // 获取缓存的食物数据
    const { dishes, drinks } = await getCachedFoods()

    if (dishes.length === 0) {
      return NextResponse.json(
        { error: '暂无可推荐的菜品' },
        { status: 404 }
      )
    }

    // 随机选择一个菜品
    const randomDish = dishes[Math.floor(Math.random() * dishes.length)]

    let randomDrink = null
    if (includeDrink && drinks.length > 0) {
      randomDrink = drinks[Math.floor(Math.random() * drinks.length)]
    }

    return NextResponse.json({
      success: true,
      data: {
        food: randomDish,
        drink: randomDrink
      }
    })

  } catch (error) {
    console.error('推荐API错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
