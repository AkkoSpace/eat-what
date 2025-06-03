'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Food } from '@/lib/types'
import { Utensils, Coffee } from 'lucide-react'

interface FoodRouletteProps {
  foods: Food[]
  selectedFood: Food
  type: 'food' | 'drink'
  onAnimationComplete: () => void
}

export function FoodRoulette({ foods, selectedFood, type, onAnimationComplete }: FoodRouletteProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 创建一个包含更多食物的数组用于动画，确保选中的食物在最后
  const animationFoods = foods.length > 0 ? [
    ...foods.slice(0, Math.min(8, foods.length)), // 前8个食物（或全部如果不足8个）
    ...foods.slice(0, Math.min(5, foods.length)), // 再重复5个
    selectedFood // 最后是选中的食物
  ] : [selectedFood] // 如果没有其他食物，就只显示选中的

  useEffect(() => {
    if (!isAnimating) return

    let animationSpeed = 100 // 初始速度
    let currentStep = 0
    const totalSteps = animationFoods.length - 1

    const animate = () => {
      if (currentStep >= totalSteps) {
        setIsAnimating(false)
        setTimeout(onAnimationComplete, 500) // 延迟一点再触发完成回调
        return
      }

      setCurrentIndex(currentStep)
      currentStep++

      // 逐渐减慢速度，模拟真实的开箱效果
      if (currentStep > totalSteps - 5) {
        animationSpeed = 300 + (totalSteps - currentStep) * 100
      } else if (currentStep > totalSteps - 8) {
        animationSpeed = 200
      } else {
        animationSpeed = Math.min(animationSpeed + 10, 150)
      }

      setTimeout(animate, animationSpeed)
    }

    animate()
  }, [isAnimating, animationFoods.length, onAnimationComplete])

  const Icon = type === 'food' ? Utensils : Coffee
  const borderColor = type === 'food' ? 'border-orange-300' : 'border-blue-300'
  const iconColor = type === 'food' ? 'text-orange-500' : 'text-blue-500'

  // 根据食物类型和名称生成颜色
  const getFoodColor = (food: Food) => {
    const colors = [
      'from-blue-500 to-blue-600',    // 蓝色 - 普通
      'from-purple-500 to-purple-600', // 紫色 - 稀有
      'from-pink-500 to-pink-600',    // 粉色 - 史诗
      'from-orange-500 to-orange-600', // 橙色 - 传说
      'from-green-500 to-green-600',  // 绿色 - 特殊
    ]
    // 根据食物名称的哈希值选择颜色
    const hash = food.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="relative">
      {/* CS风格开箱容器 */}
      <div className="relative h-40 overflow-hidden rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 shadow-2xl">
        {/* 中央指示器 - CS风格的黄色线 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-yellow-500 z-20 transform -translate-x-1/2 shadow-lg"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-300 z-30 transform -translate-x-1/2"></div>

        {/* 滚动的食物列表 */}
        <div
          className="flex items-center h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(50% - ${currentIndex * 160 + 80}px))`,
            width: `${animationFoods.length * 160}px`
          }}
        >
          {animationFoods.map((food, index) => (
            <div
              key={`${food.id}-${index}`}
              className="flex-shrink-0 w-36 h-32 mx-2 relative"
            >
              {/* CS风格的物品卡片 */}
              <div className={`h-full rounded-lg bg-gradient-to-br ${getFoodColor(food)} shadow-lg border border-white/20 flex flex-col items-center justify-center p-3 transform transition-all duration-200 ${
                index === currentIndex ? 'scale-110 shadow-2xl' : 'scale-95'
              }`}>
                {/* 物品图标 */}
                <div className="text-3xl mb-2 filter drop-shadow-lg">
                  {type === 'food' ? '🍽️' : '🥤'}
                </div>

                {/* 物品名称 */}
                <div className="text-white font-bold text-sm text-center leading-tight mb-1 drop-shadow-md">
                  {food.name}
                </div>

                {/* 物品类别 */}
                <div className="text-white/80 text-xs text-center">
                  {food.category}
                </div>

                {/* 稀有度指示器 */}
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/60"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 渐变遮罩 - 模拟CS的边缘模糊效果 */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-900 to-transparent z-10"></div>
      </div>

      {/* CS风格的获得物品展示 */}
      {!isAnimating && (
        <div className="mt-6 animate-fadeInUp">
          {/* 获得提示 */}
          <div className="text-center mb-4">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg">
              🎉 恭喜获得
            </div>
          </div>

          {/* CS风格的物品展示卡片 */}
          <div className="flex justify-center">
            <div className={`relative bg-gradient-to-br ${getFoodColor(selectedFood)} rounded-lg p-6 shadow-2xl border border-white/30 max-w-sm w-full transform hover:scale-105 transition-all duration-300`}>
              {/* 稀有度光效 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>

              <div className="relative text-center text-white">
                {/* 物品图标 */}
                <div className="text-5xl mb-4 filter drop-shadow-lg">
                  {type === 'food' ? '🍽️' : '🥤'}
                </div>

                {/* 物品名称 */}
                <h3 className="text-2xl font-bold mb-2 drop-shadow-md">
                  {selectedFood.name}
                </h3>

                {/* 物品描述 */}
                <p className="text-white/90 mb-4 text-sm leading-relaxed">
                  {selectedFood.description}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {selectedFood.category}
                  </div>
                  {selectedFood.tags && selectedFood.tags.map((tag: string) => (
                    <div key={tag} className="bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>

              {/* 装饰性光点 */}
              <div className="absolute top-2 right-2 w-3 h-3 bg-white/60 rounded-full animate-pulse"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/40 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
