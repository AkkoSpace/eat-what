import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'

// 确保 API 路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true' // 是否获取所有数据

    if (all) {
      // 获取所有数据，用于前端缓存
      const foods = await prisma.food.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          uploader: {
            select: {
              id: true,
              nickname: true,
              email: true
            }
          }
        }
      })

      // 转换 tags 从 JSON 字符串到数组
      const foodsWithTags = foods.map(food => ({
        ...food,
        tags: JSON.parse(food.tags || '[]')
      }))

      const response = NextResponse.json({
        success: true,
        data: foodsWithTags
      })

      // 添加 CORS 头部
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return response
    }

    // 原有的分页逻辑（保留兼容性）
    const type = searchParams.get('type') as FoodType | null
    const status = searchParams.get('status') || 'ACTIVE'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = {
      ...(status !== 'ALL' && { status: status as any }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { category: { contains: search } },
          { description: { contains: search } }
        ]
      })
    }

    const [foods, total] = await Promise.all([
      prisma.food.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          uploader: {
            select: {
              id: true,
              nickname: true,
              email: true
            }
          }
        }
      }),
      prisma.food.count({ where })
    ])

    // 转换 tags
    const foodsWithTags = foods.map(food => ({
      ...food,
      tags: JSON.parse(food.tags || '[]')
    }))

    return NextResponse.json({
      success: true,
      data: {
        foods: foodsWithTags,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取食物列表错误:', error)
    return NextResponse.json(
      { error: '获取食物列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, category, description, tags } = body

    // 验证必填字段
    if (!name || !type || !category) {
      return NextResponse.json(
        { error: '名称、类型和分类为必填项' },
        { status: 400 }
      )
    }

    const food = await prisma.food.create({
      data: {
        name,
        type,
        category,
        description,
        tags: JSON.stringify(tags || []), // 转换为 JSON 字符串
        isUserUploaded: false, // 管理员添加的标记为非用户上传
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      data: food
    })

  } catch (error) {
    console.error('创建食物错误:', error)
    return NextResponse.json(
      { error: '创建食物失败' },
      { status: 500 }
    )
  }
}
