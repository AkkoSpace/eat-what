'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Food } from '@/lib/types'
import { Utensils, Coffee, ThumbsUp, ThumbsDown, RotateCcw, Check, X, Sparkles } from 'lucide-react'

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
  const [isAnimating, setIsAnimating] = useState(true)
  const [currentDisplayFood, setCurrentDisplayFood] = useState<Food>(selectedFood)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 重置状态
    setShowResult(false)
    setRating(null)
    setIsRetrying(false)
    setIsAnimating(true)
    setCurrentDisplayFood(selectedFood)

    // 清除之前的动画
    if (animationRef.current) {
      clearInterval(animationRef.current)
    }

    // 老虎机动画效果
    let animationCount = 0
    const maxAnimations = 20 // 滚动次数
    const animationSpeed = 100 // 初始速度（毫秒）

    const startSlotAnimation = () => {
      animationRef.current = setInterval(() => {
        // 随机选择一个食物进行显示
        if (foods.length > 1) {
          const randomIndex = Math.floor(Math.random() * foods.length)
          setCurrentDisplayFood(foods[randomIndex])
        }

        animationCount++

        // 逐渐减慢速度
        if (animationCount >= maxAnimations) {
          // 动画结束，显示最终结果
          clearInterval(animationRef.current!)
          setCurrentDisplayFood(selectedFood)
          setIsAnimating(false)

          // 延迟一下显示结果
          setTimeout(() => {
            setShowResult(true)
            setTimeout(() => {
              onAnimationComplete()
            }, 500)
          }, 300)
        }
      }, animationSpeed + (animationCount * 20)) // 逐渐减慢
    }

    // 开始动画
    startSlotAnimation()

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [selectedFood.id, foods]) // 依赖selectedFood.id和foods数组

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
      {/* 老虎机风格的卡片容器 */}
      <div className="flex flex-col items-center justify-center py-6 animate-fadeInUp">
        <div className={`w-full max-w-lg bg-gradient-to-br ${
          type === 'food'
            ? 'from-orange-100 via-red-50 to-pink-100'
            : 'from-blue-100 via-cyan-50 to-purple-100'
        } rounded-3xl p-6 shadow-2xl border-4 ${
          type === 'food' ? 'border-orange-200' : 'border-blue-200'
        } h-[500px] transition-all duration-500 relative overflow-hidden`}>

          {/* 老虎机装饰边框 */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 animate-pulse"></div>

          <div className="relative z-10 text-center h-full flex flex-col">
            {isAnimating || (!showResult || isRetrying) ? (
              /* 老虎机动画状态 */
              <>
                {/* 老虎机标题 */}
                <div className="flex-shrink-0 mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Sparkles className={`w-6 h-6 ${type === 'food' ? 'text-orange-500' : 'text-blue-500'} animate-spin`} />
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      {isAnimating ? '🎰 老虎机转动中...' : '正在为你挑选...'}
                    </h3>
                    <Sparkles className={`w-6 h-6 ${type === 'food' ? 'text-orange-500' : 'text-blue-500'} animate-spin`} style={{animationDirection: 'reverse'}} />
                  </div>
                </div>

                {/* 老虎机显示区域 */}
                <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                  {/* 菜品图片占位符 */}
                  <div className={`w-32 h-32 rounded-2xl ${
                    type === 'food'
                      ? 'bg-gradient-to-br from-orange-200 to-red-200'
                      : 'bg-gradient-to-br from-blue-200 to-purple-200'
                  } flex items-center justify-center shadow-lg border-4 border-white ${
                    isAnimating ? 'animate-pulse' : ''
                  }`}>
                    <div className="text-6xl">
                      {type === 'food' ? '🍽️' : '🥤'}
                    </div>
                  </div>

                  {/* 滚动的菜品名称 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border-2 border-gray-200 min-h-[80px] flex items-center justify-center">
                    <h4 className={`text-xl font-bold text-gray-800 transition-all duration-300 ${
                      isAnimating ? 'animate-bounce' : ''
                    }`}>
                      {currentDisplayFood.name}
                    </h4>
                  </div>

                  {/* 滚动的标签 */}
                  <div className="flex flex-wrap gap-2 justify-center min-h-[40px] items-center">
                    <Badge variant="secondary" className={`px-3 py-1 ${isAnimating ? 'animate-pulse' : ''}`}>
                      {currentDisplayFood.category}
                    </Badge>
                    {currentDisplayFood.tags && Array.isArray(currentDisplayFood.tags) && currentDisplayFood.tags.slice(0, 2).map((tag: string, index) => (
                      <Badge key={`${tag}-${index}`} variant="outline" className={`px-3 py-1 ${isAnimating ? 'animate-pulse' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 底部装饰 */}
                <div className="flex-shrink-0 flex justify-center pb-4">
                  <div className="flex space-x-3">
                    <div className={`w-4 h-4 ${
                      type === 'food' ? 'bg-orange-400' : 'bg-blue-400'
                    } rounded-full animate-bounce`}></div>
                    <div className={`w-4 h-4 ${
                      type === 'food' ? 'bg-orange-400' : 'bg-blue-400'
                    } rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
                    <div className={`w-4 h-4 ${
                      type === 'food' ? 'bg-orange-400' : 'bg-blue-400'
                    } rounded-full animate-bounce`} style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </>
            ) : (
              /* 🎉 推荐结果展示 - 新设计 */
              <>
                {/* 成功标题 */}
                <div className="flex-shrink-0 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-3xl">🎉</span>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      推荐结果
                    </h3>
                    <span className="text-3xl">✨</span>
                  </div>
                </div>

                {/* 菜品展示区域 */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  {/* 高清菜品图片占位符 */}
                  <div className={`w-40 h-40 mx-auto rounded-3xl ${
                    type === 'food'
                      ? 'bg-gradient-to-br from-orange-300 to-red-300'
                      : 'bg-gradient-to-br from-blue-300 to-purple-300'
                  } flex items-center justify-center shadow-2xl border-4 border-white transform hover:scale-105 transition-transform duration-300`}>
                    <div className="text-8xl">
                      {type === 'food' ? '🍽️' : '🥤'}
                    </div>
                  </div>

                  {/* 菜品名称和描述 */}
                  <div className="space-y-3">
                    <h4 className="text-2xl font-black text-gray-800">
                      {selectedFood.name}
                    </h4>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {selectedFood.description || `美味的${type === 'food' ? '菜品' : '饮品'}，值得一试！`}
                    </p>
                  </div>

                  {/* 3个关键词标签 */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
                      {selectedFood.category}
                    </Badge>
                    {selectedFood.tags && Array.isArray(selectedFood.tags) && selectedFood.tags.slice(0, 3).map((tag: string, index) => (
                      <Badge key={tag} variant="outline" className="px-4 py-2 text-sm font-semibold border-2 hover:bg-gray-50 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* 来源信息 */}
                  <div className="text-center">
                    <Badge
                      variant={selectedFood.isUserUploaded ? "default" : "outline"}
                      className={`px-4 py-2 text-sm font-medium ${
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
                </div>

                {/* 底部操作区域 - 新设计 */}
                <div className="flex-shrink-0 space-y-4">
                  {/* 主要操作按钮 - "就吃这个！"和"换一个" */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={onAccept}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      就吃这个！
                    </Button>
                    <Button
                      onClick={handleTryAgain}
                      variant="outline"
                      className="px-8 py-3 text-lg font-bold border-2 border-gray-300 hover:border-orange-300 hover:bg-orange-50 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                      size="lg"
                      disabled={isRetrying}
                    >
                      <RotateCcw className={`w-5 h-5 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? '推荐中...' : '换一个'}
                    </Button>
                  </div>

                  {/* 评分按钮 */}
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant={rating === 1 ? "default" : "outline"}
                      size="default"
                      onClick={() => handleRate(1)}
                      className="flex items-center space-x-2 px-6 py-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{type === 'food' ? '好吃' : '好喝'}</span>
                    </Button>
                    <Button
                      variant={rating === -1 ? "destructive" : "outline"}
                      size="default"
                      onClick={() => handleRate(-1)}
                      className="flex items-center space-x-2 px-6 py-2"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>不喜欢</span>
                    </Button>
                  </div>

                  {/* 拒绝选项 - 更小更低调 */}
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => onReject?.('today')}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 text-sm px-4 py-1"
                    >
                      <X className="w-3 h-3 mr-1" />
                      今天不要
                    </Button>
                    <Button
                      onClick={() => onReject?.('forever')}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 text-sm px-4 py-1"
                    >
                      <X className="w-3 h-3 mr-1" />
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
