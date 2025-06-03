import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FoodType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as FoodType | null
    const status = searchParams.get('status') || 'ACTIVE'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = {
      ...(status !== 'ALL' && { status: status as any }),
      ...(type && { type })
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

    return NextResponse.json({
      success: true,
      data: {
        foods,
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
        tags: tags || [],
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
