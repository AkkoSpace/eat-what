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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrink = searchParams.get('includeDrink') === 'true'
    const onlyDrink = searchParams.get('onlyDrink') === 'true'
    const type = searchParams.get('type') // 'food' 或 'drink'

    let randomDish = null
    let randomDrink = null

    // 如果指定了类型，只推荐该类型
    if (type === 'drink' || onlyDrink) {
      const drinks = await prisma.food.findMany({
        where: { type: FoodType.DRINK, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          type: true,
          category: true,
          description: true,
          tags: true,
          isUserUploaded: true,
          ratings: {
            select: {
              rating: true
            }
          }
        }
      })

      if (drinks.length === 0) {
        return NextResponse.json(
          { error: '暂无可推荐的饮品' },
          { status: 404 }
        )
      }

      const drinksWithTags = drinks.map(drink => {
        const likes = drink.ratings.filter(r => r.rating === 1).length
        const dislikes = drink.ratings.filter(r => r.rating === -1).length
        const { ratings, ...drinkWithoutRatings } = drink
        return {
          ...drinkWithoutRatings,
          tags: JSON.parse(drink.tags || '[]'),
          ratingStats: {
            likes,
            dislikes,
            total: likes + dislikes
          }
        }
      })
      randomDrink = drinksWithTags[Math.floor(Math.random() * drinksWithTags.length)]
    } else if (type === 'food' || !type) {
      // 获取菜品（默认行为或明确指定food类型）
      const dishes = await prisma.food.findMany({
        where: { type: FoodType.DISH, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          type: true,
          category: true,
          description: true,
          tags: true,
          isUserUploaded: true,
          ratings: {
            select: {
              rating: true
            }
          }
        }
      })

      if (dishes.length === 0) {
        return NextResponse.json(
          { error: '暂无可推荐的菜品' },
          { status: 404 }
        )
      }

      // 转换 tags 并添加评分统计，然后随机选择一个菜品
      const dishesWithTags = dishes.map(dish => {
        const likes = dish.ratings.filter(r => r.rating === 1).length
        const dislikes = dish.ratings.filter(r => r.rating === -1).length
        const { ratings, ...dishWithoutRatings } = dish
        return {
          ...dishWithoutRatings,
          tags: JSON.parse(dish.tags || '[]'),
          ratingStats: {
            likes,
            dislikes,
            total: likes + dislikes
          }
        }
      })
      randomDish = dishesWithTags[Math.floor(Math.random() * dishesWithTags.length)]
    }

    // 如果需要推荐饮品且不是只推荐饮品的情况
    if (includeDrink && !onlyDrink) {
      const drinks = await prisma.food.findMany({
        where: { type: FoodType.DRINK, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          type: true,
          category: true,
          description: true,
          tags: true,
          isUserUploaded: true,
          ratings: {
            select: {
              rating: true
            }
          }
        }
      })

      if (drinks.length > 0) {
        const drinksWithTags = drinks.map(drink => {
          const likes = drink.ratings.filter(r => r.rating === 1).length
          const dislikes = drink.ratings.filter(r => r.rating === -1).length
          const { ratings, ...drinkWithoutRatings } = drink
          return {
            ...drinkWithoutRatings,
            tags: JSON.parse(drink.tags || '[]'),
            ratingStats: {
              likes,
              dislikes,
              total: likes + dislikes
            }
          }
        })
        randomDrink = drinksWithTags[Math.floor(Math.random() * drinksWithTags.length)]
      }
    }

    // 根据请求类型返回相应的数据结构
    if (type === 'food') {
      return NextResponse.json({
        success: true,
        data: {
          food: randomDish,
          drink: null
        }
      })
    } else if (type === 'drink') {
      return NextResponse.json({
        success: true,
        data: {
          food: null,
          drink: randomDrink
        }
      })
    } else {
      // 默认返回完整数据
      return NextResponse.json({
        success: true,
        data: {
          food: randomDish,
          drink: randomDrink
        }
      })
    }

  } catch (error) {
    console.error('推荐API错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
