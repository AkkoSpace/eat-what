'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Food } from '@/lib/types'
import { Utensils, Coffee, ThumbsUp, ThumbsDown, RotateCcw, Check, X } from 'lucide-react'

interface FoodRouletteProps {
  foods: Food[]
  selectedFood: Food
  type: 'food' | 'drink'
  onAnimationComplete: () => void
  onAccept?: () => void
  onReject?: (type: 'today' | 'forever') => void
  onTryAgain?: () => void
  onRate?: (foodId: string, rating: 1 | -1, type: 'food' | 'drink') => void
}

export function FoodRoulette({
  foods,
  selectedFood,
  type,
  onAnimationComplete,
  onAccept,
  onReject,
  onTryAgain,
  onRate
}: FoodRouletteProps) {
  const [showResult, setShowResult] = useState(false)
  const [rating, setRating] = useState<1 | -1 | null>(null)

  useEffect(() => {
    // 简单的延迟显示结果，然后触发完成回调
    const timer = setTimeout(() => {
      setShowResult(true)
      setTimeout(onAnimationComplete, 500)
    }, 1000)

    return () => clearTimeout(timer)
  }, [onAnimationComplete])

  const handleRate = (ratingValue: 1 | -1) => {
    setRating(ratingValue)
    onRate?.(selectedFood.id, ratingValue, type)
  }

  return (
    <div className="relative">
      {!showResult ? (
        /* 加载状态 */
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            {/* 旋转的图标 */}
            <div className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-orange-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl">
                {type === 'food' ? '🍽️' : '🥤'}
              </div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              正在为你挑选{type === 'food' ? '美食' : '饮品'}...
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              请稍候片刻
            </p>
          </div>
        </div>
      ) : (
        /* 结果展示 - 无边框设计 */
        <div className="flex flex-col items-center justify-center py-6 animate-fadeInUp">
          <div className={`w-full max-w-lg bg-gradient-to-br ${
            type === 'food'
              ? 'from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700'
              : 'from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700'
          } rounded-3xl p-8 shadow-xl`}>
            <div className="text-center">
              {/* 图标容器 */}
              <div className={`inline-flex items-center justify-center w-20 h-20 ${
                type === 'food'
                  ? 'bg-orange-100 dark:bg-orange-900'
                  : 'bg-blue-100 dark:bg-blue-900'
              } rounded-full mb-6`}>
                {type === 'food' ? (
                  <Utensils className={`w-10 h-10 ${
                    type === 'food'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                ) : (
                  <Coffee className={`w-10 h-10 ${
                    type === 'food'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                )}
              </div>

              {/* 标题和描述 */}
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                {selectedFood.name}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {selectedFood.description}
              </p>

              {/* 标签区域 */}
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  {selectedFood.category}
                </Badge>
                {selectedFood.tags && Array.isArray(selectedFood.tags) && selectedFood.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-sm px-4 py-2">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* 来源信息 */}
              <div className="text-center mb-6">
                <Badge
                  variant={selectedFood.isUserUploaded ? "default" : "outline"}
                  className={`text-sm px-4 py-2 ${
                    selectedFood.isUserUploaded
                      ? type === 'food'
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {selectedFood.isUserUploaded ? "👥 用户贡献" : "🏠 系统推荐"}
                </Badge>
              </div>

              {/* 评分按钮 */}
              <div className="flex justify-center space-x-6 mb-8">
                <Button
                  variant={rating === 1 ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleRate(1)}
                  className="flex items-center space-x-2 px-6 py-3"
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-semibold">{type === 'food' ? '好吃' : '好喝'}</span>
                </Button>
                <Button
                  variant={rating === -1 ? "destructive" : "outline"}
                  size="lg"
                  onClick={() => handleRate(-1)}
                  className="flex items-center space-x-2 px-6 py-3"
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span className="font-semibold">不喜欢</span>
                </Button>
              </div>

              {/* 主要操作按钮 */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
                <Button
                  onClick={onAccept}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  就这个了！
                </Button>
                <Button
                  onClick={onTryAgain}
                  variant="outline"
                  className="px-8 py-3 text-lg font-semibold border-gray-300 hover:bg-gray-50"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  再来一次
                </Button>
              </div>

              {/* 拒绝选项 */}
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => onReject?.('today')}
                  variant="outline"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 border-gray-300"
                >
                  <X className="w-4 h-4 mr-1" />
                  今天不要
                </Button>
                <Button
                  onClick={() => onReject?.('forever')}
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700 border-red-300 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  永远不要
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
