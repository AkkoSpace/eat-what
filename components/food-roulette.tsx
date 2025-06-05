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
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // 重置状态
    setShowResult(false)
    setRating(null)
    setIsRetrying(false)

    // 简单的延迟显示结果，然后触发完成回调
    const timer = setTimeout(() => {
      setShowResult(true)
      setTimeout(() => {
        onAnimationComplete()
        // 在显示结果后获取评分信息（如果需要的话）
        // 这里可以调用获取评分的API，但要避免无限循环
      }, 500)
    }, 1000)

    return () => clearTimeout(timer)
  }, [selectedFood.id]) // 只依赖selectedFood.id，避免函数引用导致的无限循环

  const handleRate = (ratingValue: 1 | -1) => {
    setRating(ratingValue)
    onRate?.(selectedFood.id, ratingValue, type)
  }

  const handleTryAgain = async () => {
    setIsRetrying(true)
    setShowResult(false)
    setRating(null)

    // 调用父组件的重新推荐逻辑
    await onTryAgain?.()

    setIsRetrying(false)
  }

  return (
    <div className="relative">
      {/* 统一的卡片容器 - 只改变内部内容 */}
      <div className="flex flex-col items-center justify-center py-6 animate-fadeInUp">
        <div className={`w-full max-w-sm bg-gradient-to-br ${
          type === 'food'
            ? 'from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700'
            : 'from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700'
        } rounded-3xl p-3 shadow-xl h-[400px] transition-all duration-300`}>
          <div className="text-center h-full flex flex-col">
            {!showResult || isRetrying ? (
              /* 加载状态内容 - 固定布局 */
              <>
                {/* 顶部区域 */}
                <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                  {/* 图标容器 - 加载状态 */}
                  <div className={`inline-flex items-center justify-center w-20 h-20 ${
                    type === 'food'
                      ? 'bg-orange-100 dark:bg-orange-900'
                      : 'bg-blue-100 dark:bg-blue-900'
                  } rounded-full relative transition-all duration-300`}>
                    {/* 旋转边框 */}
                    <div className={`absolute inset-0 rounded-full border-4 ${
                      type === 'food'
                        ? 'border-orange-200 border-t-orange-500'
                        : 'border-blue-200 border-t-blue-500'
                    } animate-spin`}></div>

                    {/* 中心图标 */}
                    <div className="relative z-10">
                      <div className="text-3xl animate-bounce" style={{animationDelay: '0.5s'}}>
                        {type === 'food' ? '🍽️' : '🥤'}
                      </div>
                    </div>
                  </div>

                  {/* 加载文字 */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 transition-all duration-300">
                      正在为你挑选{type === 'food' ? '美食' : '饮品'}...
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 transition-all duration-300">
                      请稍候片刻，好东西值得等待 ✨
                    </p>
                  </div>
                </div>

                {/* 底部区域 */}
                <div className="flex justify-center pb-4">
                  <div className="flex space-x-2">
                    <div className={`w-3 h-3 ${
                      type === 'food' ? 'bg-orange-400' : 'bg-blue-400'
                    } rounded-full animate-bounce`}></div>
                    <div className={`w-3 h-3 ${
                      type === 'food' ? 'bg-orange-400' : 'bg-blue-400'
                    } rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                    <div className={`w-3 h-3 ${
                      type === 'food' ? 'bg-orange-400' : 'bg-blue-400'
                    } rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </>
            ) : (
              /* 结果展示内容 - 固定布局 */
              <>
                {/* 顶部区域 */}
                <div className="flex-shrink-0">
                  {/* 图标容器 - 结果状态 */}
                  <div className={`inline-flex items-center justify-center w-20 h-20 ${
                    type === 'food'
                      ? 'bg-orange-100 dark:bg-orange-900'
                      : 'bg-blue-100 dark:bg-blue-900'
                  } rounded-full mb-4 transition-all duration-300`}>
                    {type === 'food' ? (
                      <Utensils className={`w-10 h-10 ${
                        type === 'food'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-blue-600 dark:text-blue-400'
                      } transition-all duration-300`} />
                    ) : (
                      <Coffee className={`w-10 h-10 ${
                        type === 'food'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-blue-600 dark:text-blue-400'
                      } transition-all duration-300`} />
                    )}
                  </div>
                </div>

                {/* 中间内容区域 - 优化间距 */}
                <div className="flex-1 flex flex-col justify-center space-y-2 overflow-hidden">
                  {/* 标题和描述 */}
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                    {selectedFood.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {selectedFood.description}
                  </p>

                  {/* 标签区域 */}
                  <div className="flex flex-wrap gap-1 justify-center max-h-12 overflow-hidden">
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {selectedFood.category}
                    </Badge>
                    {selectedFood.tags && Array.isArray(selectedFood.tags) && selectedFood.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* 来源信息 */}
                  <div className="text-center">
                    <Badge
                      variant={selectedFood.isUserUploaded ? "default" : "outline"}
                      className={`text-xs px-2 py-1 ${
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

                  {/* 评分按钮 - 优化布局 */}
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant={rating === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRate(1)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{type === 'food' ? '好吃' : '好喝'}</span>
                    </Button>
                    <Button
                      variant={rating === -1 ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleRate(-1)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>不喜欢</span>
                    </Button>
                  </div>
                </div>

                {/* 底部操作区域 - 优化布局 */}
                <div className="flex-shrink-0 space-y-2">
                  {/* 主要操作按钮 - 并排显示 */}
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={onAccept}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-xs font-semibold flex-1 max-w-[100px]"
                      size="sm"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      就这个了！
                    </Button>
                    <Button
                      onClick={handleTryAgain}
                      variant="outline"
                      className="px-4 py-1 text-xs font-semibold border-gray-300 hover:bg-gray-50 flex-1 max-w-[100px]"
                      size="sm"
                      disabled={isRetrying}
                    >
                      <RotateCcw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? '推荐中...' : '再来一次'}
                    </Button>
                  </div>

                  {/* 拒绝选项 - 更紧凑 */}
                  <div className="flex justify-center gap-1">
                    <Button
                      onClick={() => onReject?.('today')}
                      variant="outline"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 border-gray-300 text-xs px-2 py-1 h-6"
                    >
                      <X className="w-2 h-2 mr-1" />
                      今天不要
                    </Button>
                    <Button
                      onClick={() => onReject?.('forever')}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 border-red-300 hover:bg-red-50 text-xs px-2 py-1 h-6"
                    >
                      <X className="w-2 h-2 mr-1" />
                      永远不要
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
