'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dice6, Utensils, Coffee, RotateCcw, X, Settings } from 'lucide-react'
import Link from 'next/link'
import { Food } from '@/lib/types'
import { FoodRoulette } from '@/components/food-roulette'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [includeDrink, setIncludeDrink] = useState(false)
  const [recommendation, setRecommendation] = useState<{
    food: Food
    drink?: Food
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalCount: number
    dishCount: number
    drinkCount: number
  } | null>(null)
  const [allFoods, setAllFoods] = useState<Food[]>([])
  const [allDrinks, setAllDrinks] = useState<Food[]>([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationData, setAnimationData] = useState<{
    food: Food
    drink?: Food
  } | null>(null)

  const handleRecommend = async () => {
    setIsLoading(true)
    setError(null)
    setRecommendation(null)

    try {
      const response = await fetch(`/api/recommend?includeDrink=${includeDrink}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取推荐失败')
      }

      if (result.success) {
        // 设置动画数据并开始动画
        setAnimationData(result.data)
        setShowAnimation(true)
      } else {
        throw new Error(result.error || '获取推荐失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试')
      console.error('推荐失败:', err)
      setIsLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    setShowAnimation(false)
    setRecommendation(animationData)
    setIsLoading(false)
  }

  const handleReject = (type: 'today' | 'forever') => {
    // TODO: 实现黑名单逻辑
    console.log(`${type === 'today' ? '今天' : '永久'}不要这个`)
    setRecommendation(null)
  }

  // 获取统计信息和食物数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取统计信息
        const statsResponse = await fetch('/api/stats')
        const statsResult = await statsResponse.json()
        if (statsResult.success) {
          setStats(statsResult.data)
        }

        // 获取所有菜品
        const foodsResponse = await fetch('/api/foods?type=DISH')
        const foodsResult = await foodsResponse.json()
        if (foodsResult.success) {
          setAllFoods(foodsResult.data)
        }

        // 获取所有饮品
        const drinksResponse = await fetch('/api/foods?type=DRINK')
        const drinksResult = await drinksResponse.json()
        if (drinksResult.success) {
          setAllDrinks(drinksResult.data)
        }
      } catch (error) {
        console.error('获取数据失败:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-pink-500 rounded-full blur-2xl"></div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-12 relative">
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4">
            🍽️ 吃啥
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            解决选择困难症的终极神器
          </p>

          {/* 管理员入口 */}
          <Link href="/admin" className="absolute top-0 right-0">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* 主要内容区域 */}
        <div className="max-w-2xl mx-auto">
          {showAnimation && animationData ? (
            /* 开箱动画区域 */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6">
                  🎰 开箱中...
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  正在为你随机选择美食
                </p>
              </div>

              {/* 菜品动画 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                  🍽️ 今天吃什么
                </h3>
                <FoodRoulette
                  foods={allFoods.length > 0 ? allFoods : [animationData.food]}
                  selectedFood={animationData.food}
                  type="food"
                  onAnimationComplete={animationData.drink ? () => {} : handleAnimationComplete}
                />
              </div>

              {/* 饮品动画 */}
              {animationData.drink && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                    🥤 配点什么喝
                  </h3>
                  <FoodRoulette
                    foods={allDrinks.length > 0 ? allDrinks : [animationData.drink]}
                    selectedFood={animationData.drink}
                    type="drink"
                    onAnimationComplete={handleAnimationComplete}
                  />
                </div>
              )}
            </div>
          ) : !recommendation ? (
            /* 推荐按钮区域 */
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Switch
                    id="include-drink"
                    checked={includeDrink}
                    onCheckedChange={setIncludeDrink}
                  />
                  <label
                    htmlFor="include-drink"
                    className="text-lg font-medium text-gray-700 dark:text-gray-300"
                  >
                    同时推荐喝的
                  </label>
                </div>
              </div>

              <Button
                size="xl"
                onClick={handleRecommend}
                disabled={isLoading}
                className="w-64 h-20 text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transform transition-all duration-200 hover:scale-105 border border-green-500"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Dice6 className="animate-spin" />
                    <span>正在选择...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Utensils />
                    <span>吃什么？</span>
                  </div>
                )}
              </Button>

              <p className="text-gray-500 dark:text-gray-400">
                点击按钮，让我们为你决定今天吃什么！
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* 推荐结果区域 */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  🎉 今天就吃这个！
                </h2>
              </div>

              {/* 食物推荐卡片 */}
              <Card className="border-2 border-orange-200 shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                    <Utensils className="text-orange-500" />
                    <span>{recommendation.food.name}</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {recommendation.food.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">{recommendation.food.category}</Badge>
                    {recommendation.food.tags && recommendation.food.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 饮品推荐卡片 */}
              {recommendation.drink && (
                <Card className="border-2 border-blue-200 shadow-lg">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                      <Coffee className="text-blue-500" />
                      <span>{recommendation.drink.name}</span>
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {recommendation.drink.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="secondary">{recommendation.drink.category}</Badge>
                      {recommendation.drink.tags && recommendation.drink.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleRecommend}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Dice6 className="animate-spin" />
                      <span>正在选择...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw />
                      <span>再来一次</span>
                    </>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject('today')}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>今天不要</span>
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => handleReject('forever')}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>永久不要</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          {stats ? (
            <p>已收录 {stats.totalCount} 种美食 ({stats.dishCount} 个菜品 + {stats.drinkCount} 个饮品) • 让选择变得简单</p>
          ) : (
            <p>正在加载美食数据...</p>
          )}
        </div>
      </div>
    </div>
  )
}
