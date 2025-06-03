import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, type, category, description, tags, status } = body

    const food = await prisma.food.update({
      where: { id: params.id },
      data: {
        name,
        type,
        category,
        description,
        tags: tags || [],
        status
      }
    })

    return NextResponse.json({
      success: true,
      data: food
    })

  } catch (error) {
    console.error('更新食物错误:', error)
    return NextResponse.json(
      { error: '更新食物失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.food.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })

  } catch (error) {
    console.error('删除食物错误:', error)
    return NextResponse.json(
      { error: '删除食物失败' },
      { status: 500 }
    )
  }
}
