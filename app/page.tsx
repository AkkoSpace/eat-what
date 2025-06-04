'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Dice6, Utensils, Coffee, RotateCcw, X, Settings, Heart, TrendingUp, Plus, Upload, ChefHat, ThumbsUp, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { Food } from '@/lib/types'
import { FoodRoulette } from '@/components/food-roulette'
import { useRecommendationStats } from '@/hooks/useRecommendationStats'

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


  // 上传相关状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [uploadType, setUploadType] = useState<'DISH' | 'DRINK'>('DISH')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    duplicates: string[]
    errors: string[]
  } | null>(null)

  // 评分相关状态
  const [foodRating, setFoodRating] = useState<{
    likes: number
    dislikes: number
    total: number
    userRating: number | null
  } | null>(null)
  const [drinkRating, setDrinkRating] = useState<{
    likes: number
    dislikes: number
    total: number
    userRating: number | null
  } | null>(null)

  // 推荐统计 Hook
  const {
    currentSession,
    startSession,
    recordAttempt,
    recordAcceptance,
    recordRejection,
    recordClick
  } = useRecommendationStats()

  // 使用统计状态
  const [usageStats, setUsageStats] = useState<{
    totalHelped: number
    totalUsers: number
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

        // 异步记录统计，不阻塞主流程
        setTimeout(async () => {
          try {
            await recordClick()
            if (!currentSession) {
              await startSession(includeDrink)
            }
            await recordAttempt(result.data.food, result.data.drink)
          } catch (statsError) {
            console.error('统计记录失败:', statsError)
            // 统计失败不影响主功能
          }
        }, 0)
      } else {
        throw new Error(result.error || '获取推荐失败')
      }
    } catch (err) {
      console.error('推荐失败:', err)
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试')
      setIsLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    setShowAnimation(false)
    setIsLoading(false)

    // 只获取评分信息，不设置推荐结果
    // 让用户在FoodRoulette组件中进行操作
    if (animationData) {
      fetchRating(animationData.food.id, 'food')
      if (animationData.drink) {
        fetchRating(animationData.drink.id, 'drink')
      }
    }
  }

  const handleReject = async (type: 'today' | 'forever') => {
    // 处理来自FoodRoulette组件的拒绝
    if (animationData) {
      // 记录拒绝统计
      await recordRejection(animationData.food, animationData.drink, type)
      console.log(`${type === 'today' ? '今天' : '永久'}不要这个`)
      setAnimationData(null)
      return
    }

    // 处理来自主页面结果的拒绝
    if (recommendation) {
      // 记录拒绝统计
      await recordRejection(recommendation.food, recommendation.drink, type)
      console.log(`${type === 'today' ? '今天' : '永久'}不要这个`)
      setRecommendation(null)
    }
  }

  const handleAcceptResult = async () => {
    if (animationData) {
      // 记录接受统计
      await recordAcceptance(animationData.food, animationData.drink)
      // 设置推荐结果，切换到主页面的结果展示
      setRecommendation(animationData)
      setAnimationData(null)
      console.log('用户接受了推荐')
    }
  }

  const handleTryAgain = () => {
    setRecommendation(null)
    setAnimationData(null)
    handleRecommend()
  }

  // 新增：处理用户接受推荐
  const handleAccept = async () => {
    if (recommendation) {
      // 记录接受统计
      await recordAcceptance(recommendation.food, recommendation.drink)

      console.log('用户选择了:', recommendation.food.name, recommendation.drink?.name)
      // 可以在这里添加更多的接受逻辑，比如显示感谢信息
    }
  }

  // 新增：独立重新推荐菜品
  const handleRecommendFood = async () => {
    setIsLoading(true)
    setError(null)
    setRecommendation(null)

    try {
      const response = await fetch('/api/recommend?includeDrink=false')
      const result = await response.json()

      if (result.success) {
        const newAnimationData = {
          food: result.data.food,
          drink: recommendation?.drink || null // 保持原有饮品
        }
        setAnimationData(newAnimationData)
        setShowAnimation(true)

        // 记录使用统计
        await fetch('/api/stats/usage', { method: 'POST' })

        setTimeout(() => {
          setShowAnimation(false)
        }, 2000)
      } else {
        setError(result.error || '推荐失败，请稍后重试')
      }
    } catch (error) {
      console.error('推荐失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 新增：独立重新推荐饮品
  const handleRecommendDrink = async () => {
    setIsLoading(true)
    setError(null)
    setRecommendation(null)

    try {
      const response = await fetch('/api/recommend?includeDrink=true&onlyDrink=true')
      const result = await response.json()

      if (result.success) {
        const newAnimationData = {
          food: recommendation?.food || null, // 保持原有菜品
          drink: result.data.drink
        }
        setAnimationData(newAnimationData)
        setShowAnimation(true)

        // 记录使用统计
        await fetch('/api/stats/usage', { method: 'POST' })

        setTimeout(() => {
          setShowAnimation(false)
        }, 2000)
      } else {
        setError(result.error || '推荐失败，请稍后重试')
      }
    } catch (error) {
      console.error('推荐失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 批量上传处理函数
  const handleBatchUpload = async () => {
    if (!uploadText.trim()) {
      setError('请输入要上传的菜品名称')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      // 解析输入文本，支持多种分隔符
      const lines = uploadText
        .split(/[\n,，、；;]/)
        .map(line => line.trim())
        .filter(line => line.length > 0)

      if (lines.length === 0) {
        throw new Error('没有找到有效的菜品名称')
      }

      // 批量创建菜品
      const response = await fetch('/api/foods/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foods: lines.map(name => ({
            name: name,
            type: uploadType,
            category: uploadType === 'DISH' ? '家常菜' : '饮品',
            description: `用户上传的${uploadType === 'DISH' ? '菜品' : '饮品'}`
          }))
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '上传失败')
      }

      setUploadResult(result.data)

      // 清空输入
      setUploadText('')

      // 如果有成功上传的，显示成功消息并关闭弹窗
      if (result.data.success > 0) {
        setTimeout(() => {
          setUploadDialogOpen(false)
          setUploadResult(null)
        }, 3000)
      }

    } catch (err) {
      console.error('批量上传失败:', err)
      setError(err instanceof Error ? err.message : '上传失败，请稍后重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 刷新统计数据的函数
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('刷新统计数据失败:', error)
    }
  }

  // 处理评分
  const handleRating = async (foodId: string, rating: number, type: 'food' | 'drink') => {
    try {
      const response = await fetch(`/api/foods/${foodId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      })

      const result = await response.json()
      if (result.success) {
        if (type === 'food') {
          setFoodRating(result.data)
        } else {
          setDrinkRating(result.data)
        }
      } else {
        setError(result.error || '评分失败')
      }
    } catch (error) {
      console.error('评分失败:', error)
      setError('评分失败，请稍后重试')
    }
  }

  // 获取评分信息
  const fetchRating = async (foodId: string, type: 'food' | 'drink') => {
    try {
      const response = await fetch(`/api/foods/${foodId}/rating`)
      const result = await response.json()
      if (result.success) {
        if (type === 'food') {
          setFoodRating(result.data)
        } else {
          setDrinkRating(result.data)
        }
      }
    } catch (error) {
      console.error('获取评分失败:', error)
    }
  }

  // 获取统计信息和食物数据
  useEffect(() => {
    const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-cache',
            signal: AbortSignal.timeout(10000) // 10秒超时
          })

          if (response.ok) {
            return response
          } else {
            if (i === retries - 1) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          if (i === retries - 1) throw error
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
      throw new Error('所有重试都失败了')
    }

    const fetchData = async () => {
      try {
        // 获取统计信息
        try {
          const statsResponse = await fetchWithRetry('/api/stats')
          const statsResult = await statsResponse.json()
          if (statsResult.success) {
            setStats(statsResult.data)
          }
        } catch (error) {
          console.error('获取统计信息失败:', error)
          // 继续尝试获取食物数据
        }

        // 获取使用统计
        try {
          const usageResponse = await fetchWithRetry('/api/stats/usage?type=simple')
          const usageResult = await usageResponse.json()
          if (usageResult.success) {
            setUsageStats(usageResult.data)
          }
        } catch (error) {
          console.error('获取使用统计失败:', error)
        }

        // 获取所有食物数据
        try {
          const foodsResponse = await fetchWithRetry('/api/foods?all=true')
          const foodsResult = await foodsResponse.json()
          if (foodsResult.success) {
            // 分离菜品和饮品
            const dishes = foodsResult.data.filter((food: any) => food.type === 'DISH')
            const drinks = foodsResult.data.filter((food: any) => food.type === 'DRINK')
            setAllFoods(dishes)
            setAllDrinks(drinks)
          }
        } catch (error) {
          console.error('获取食物数据失败:', error)
          setError('无法加载食物数据，请检查网络连接')
        }
      } catch (error) {
        console.error('获取数据失败:', error)
        setError(`数据加载失败: ${error instanceof Error ? error.message : '未知错误'}`)
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

          {/* 导航按钮 */}
          <div className="absolute top-0 right-0 flex space-x-2">
            <Link href="/stats">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <TrendingUp className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 主要内容区域 - 无边框设计 */}
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[600px] flex flex-col justify-center">
            {animationData ? (
              /* 推荐过程和结果区域 */
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
                    {showAnimation ? '🎲 正在推荐...' : '🎉 推荐结果'}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    {showAnimation ? '正在为你挑选美食' : '为你精心挑选的美食'}
                  </p>
                </div>

                {/* 菜品展示区域 */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 flex items-center justify-center space-x-2">
                    <span>🍽️</span>
                    <span>今天吃什么</span>
                  </h3>
                  <FoodRoulette
                    foods={allFoods.length > 0 ? allFoods : [animationData.food]}
                    selectedFood={animationData.food}
                    type="food"
                    onAnimationComplete={animationData.drink ? () => {} : handleAnimationComplete}
                    onAccept={handleAcceptResult}
                    onReject={handleReject}
                    onTryAgain={handleTryAgain}
                    onRate={handleRating}
                  />
                </div>

                {/* 饮品展示区域 */}
                {animationData.drink && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 flex items-center justify-center space-x-2">
                      <span>🥤</span>
                      <span>配点什么喝</span>
                    </h3>
                    <FoodRoulette
                      foods={allDrinks.length > 0 ? allDrinks : [animationData.drink]}
                      selectedFood={animationData.drink}
                      type="drink"
                      onAnimationComplete={handleAnimationComplete}
                      onAccept={handleAcceptResult}
                      onReject={handleReject}
                      onTryAgain={handleTryAgain}
                      onRate={handleRating}
                    />
                  </div>
                )}
              </div>
              ) : recommendation ? (
                /* 最终确认结果区域 */
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                      🎉 今天就吃这个！
                    </h2>
                  </div>

                  {/* 食物推荐区域 */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
                        <Utensils className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {recommendation.food.name}
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        {recommendation.food.description}
                      </p>
                    </div>

                    {/* 标签区域 */}
                    <div className="flex flex-wrap gap-3 justify-center mb-6">
                      <Badge variant="secondary" className="text-sm px-4 py-2">{recommendation.food.category}</Badge>
                      {recommendation.food.tags && recommendation.food.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-sm px-4 py-2">{tag}</Badge>
                      ))}
                    </div>

                    {/* 来源信息 */}
                    <div className="text-center mb-6">
                      <Badge
                        variant={recommendation.food.isUserUploaded ? "default" : "outline"}
                        className={`text-sm px-4 py-2 ${recommendation.food.isUserUploaded ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-gray-100 text-gray-600"}`}
                      >
                        {recommendation.food.isUserUploaded ? "👥 用户贡献" : "🏠 系统推荐"}
                      </Badge>
                    </div>

                    {/* 点赞点踩区域 */}
                    <div className="flex items-center justify-center space-x-6">
                      <Button
                        variant={foodRating?.userRating === 1 ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleRating(recommendation.food.id, 1, 'food')}
                        className="flex items-center space-x-2 px-6 py-3"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span className="font-semibold">{foodRating?.likes || 0}</span>
                      </Button>
                      <Button
                        variant={foodRating?.userRating === -1 ? "destructive" : "outline"}
                        size="lg"
                        onClick={() => handleRating(recommendation.food.id, -1, 'food')}
                        className="flex items-center space-x-2 px-6 py-3"
                      >
                        <ThumbsDown className="w-5 h-5" />
                        <span className="font-semibold">{foodRating?.dislikes || 0}</span>
                      </Button>
                    </div>
                  </div>

                  {/* 饮品推荐区域 */}
                  {recommendation.drink && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                          <Coffee className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                          {recommendation.drink.name}
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          {recommendation.drink.description}
                        </p>
                      </div>

                      {/* 标签区域 */}
                      <div className="flex flex-wrap gap-3 justify-center mb-6">
                        <Badge variant="secondary" className="text-sm px-4 py-2">{recommendation.drink.category}</Badge>
                        {recommendation.drink.tags && recommendation.drink.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-sm px-4 py-2">{tag}</Badge>
                        ))}
                      </div>

                      {/* 来源信息 */}
                      <div className="text-center mb-6">
                        <Badge
                          variant={recommendation.drink.isUserUploaded ? "default" : "outline"}
                          className={`text-sm px-4 py-2 ${recommendation.drink.isUserUploaded ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-600"}`}
                        >
                          {recommendation.drink.isUserUploaded ? "👥 用户贡献" : "🏠 系统推荐"}
                        </Badge>
                      </div>

                      {/* 点赞点踩区域 */}
                      <div className="flex items-center justify-center space-x-6">
                        <Button
                          variant={drinkRating?.userRating === 1 ? "default" : "outline"}
                          size="lg"
                          onClick={() => handleRating(recommendation.drink.id, 1, 'drink')}
                          className="flex items-center space-x-2 px-6 py-3"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          <span className="font-semibold">{drinkRating?.likes || 0}</span>
                        </Button>
                        <Button
                          variant={drinkRating?.userRating === -1 ? "destructive" : "outline"}
                          size="lg"
                          onClick={() => handleRating(recommendation.drink.id, -1, 'drink')}
                          className="flex items-center space-x-2 px-6 py-3"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          <span className="font-semibold">{drinkRating?.dislikes || 0}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-4 justify-center mt-6">
                {/* 主要操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={(e) => {
                      console.log('💚 就这个按钮被点击了！', e)
                      handleAccept()
                    }}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    <Heart className="w-5 h-5" />
                    <span>就这个！</span>
                  </Button>

                  {/* 根据是否有饮品显示不同的重新推荐按钮 */}
                  {animationData?.drink ? (
                    // 有饮品时显示独立的重新推荐按钮
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          console.log('🍽️ 换个菜品按钮被点击了！', e)
                          handleRecommendFood()
                        }}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center space-x-2 border-orange-300 hover:bg-orange-50 text-orange-600"
                        size="lg"
                        style={{ position: 'relative', zIndex: 10 }}
                      >
                        {isLoading ? (
                          <>
                            <Dice6 className="animate-spin w-4 h-4" />
                            <span>换菜中...</span>
                          </>
                        ) : (
                          <>
                            <Utensils className="w-4 h-4" />
                            <span>换个菜</span>
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={(e) => {
                          console.log('🥤 换个饮品按钮被点击了！', e)
                          handleRecommendDrink()
                        }}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center space-x-2 border-blue-300 hover:bg-blue-50 text-blue-600"
                        size="lg"
                        style={{ position: 'relative', zIndex: 10 }}
                      >
                        {isLoading ? (
                          <>
                            <Dice6 className="animate-spin w-4 h-4" />
                            <span>换饮中...</span>
                          </>
                        ) : (
                          <>
                            <Coffee className="w-4 h-4" />
                            <span>换个饮品</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    // 只有菜品时显示普通的重新推荐按钮
                    <Button
                      onClick={(e) => {
                        console.log('🔄 再来一次按钮被点击了！', e)
                        handleRecommend()
                      }}
                      disabled={isLoading}
                      variant="outline"
                      className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
                      size="lg"
                      style={{ position: 'relative', zIndex: 10 }}
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
                  )}
                </div>

                {/* 拒绝按钮 */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      console.log('⏰ 今天不要按钮被点击了！', e)
                      handleReject('today')
                    }}
                    className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
                    size="sm"
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    <X className="w-4 h-4" />
                    <span>今天不要</span>
                  </Button>

                  <Button
                    onClick={(e) => {
                      console.log('🚫 永久不要按钮被点击了！', e)
                      handleReject('forever')
                    }}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    <X className="w-4 h-4" />
                    <span>永久不要</span>
                  </Button>
                </div>
                  </div>
                </div>
          ) : (
            /* 推荐按钮区域 */
            <div className="text-center space-y-12">
              <div className="space-y-6">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-center space-x-4">
                    <Switch
                      id="include-drink"
                      checked={includeDrink}
                      onCheckedChange={setIncludeDrink}
                      className="data-[state=checked]:bg-orange-500"
                    />
                    <label
                      htmlFor="include-drink"
                      className="text-xl font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      同时推荐喝的
                    </label>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Button
                  size="xl"
                  onClick={(e) => {
                    console.log('🎯 Button 被点击了！', e)
                    handleRecommend()
                  }}
                  disabled={isLoading}
                  className="relative w-80 h-24 text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <Dice6 className="animate-spin w-8 h-8" />
                      <span>正在选择...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Utensils className="w-8 h-8" />
                      <span>吃什么？</span>
                    </div>
                  )}
                </Button>
              </div>

              <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                点击按钮，让我们为你决定今天吃什么！
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-lg">
                  {error}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-16 space-y-6">
          {/* 统计信息 */}
          <div className="space-y-2">
            {stats && (
              <p className="text-gray-500 dark:text-gray-400">
                已收录 {stats.totalCount} 种美食
              </p>
            )}
            {usageStats && (
              <p className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                🎉 已帮助 {usageStats.totalHelped.toLocaleString()} 次选择
              </p>
            )}
            {!stats && !usageStats && (
              <p className="text-gray-500 dark:text-gray-400">正在加载数据...</p>
            )}
          </div>

          {/* 贡献菜品区域 */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <Plus className="w-4 h-4" />
                  <span>贡献菜品</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <ChefHat className="w-5 h-5 text-orange-500" />
                    <span>贡献菜品</span>
                  </DialogTitle>
                  <DialogDescription>
                    帮助我们丰富菜品库，让更多人受益！<br />
                    <span className="text-orange-600 font-medium">提交后需要管理员审核通过才会显示</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      类型选择
                    </label>
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="dish"
                          name="uploadType"
                          value="DISH"
                          checked={uploadType === 'DISH'}
                          onChange={(e) => setUploadType(e.target.value as 'DISH' | 'DRINK')}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 focus:ring-2"
                        />
                        <label
                          htmlFor="dish"
                          className="text-sm font-medium text-gray-700 cursor-pointer flex items-center space-x-2"
                        >
                          <span>🍽️</span>
                          <span>菜品</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="drink"
                          name="uploadType"
                          value="DRINK"
                          checked={uploadType === 'DRINK'}
                          onChange={(e) => setUploadType(e.target.value as 'DISH' | 'DRINK')}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 focus:ring-2"
                        />
                        <label
                          htmlFor="drink"
                          className="text-sm font-medium text-gray-700 cursor-pointer flex items-center space-x-2"
                        >
                          <span>🥤</span>
                          <span>饮品</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {uploadType === 'DISH' ? '菜品' : '饮品'}名称（每行一个，或用逗号分隔）
                    </label>
                    <Textarea
                      value={uploadText}
                      onChange={(e) => setUploadText(e.target.value)}
                      placeholder={uploadType === 'DISH'
                        ? "例如：\n红烧肉\n宫保鸡丁\n麻婆豆腐\n\n或：红烧肉,宫保鸡丁,麻婆豆腐"
                        : "例如：\n可乐\n雪碧\n橙汁\n\n或：可乐,雪碧,橙汁"
                      }
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleBatchUpload}
                      disabled={isUploading || !uploadText.trim()}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="w-4 h-4 mr-2 animate-pulse" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          提交审核
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadDialogOpen(false)
                        setUploadText('')
                        setUploadResult(null)
                        setError(null)
                      }}
                    >
                      取消
                    </Button>
                  </div>

                  {/* 上传结果 */}
                  {uploadResult && (
                    <div className="space-y-2">
                      {uploadResult.success > 0 && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                          ✅ 成功提交 {uploadResult.success} 个{uploadType === 'DISH' ? '菜品' : '饮品'}，等待管理员审核
                        </div>
                      )}
                      {uploadResult.duplicates.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
                          ⚠️ 重复的{uploadType === 'DISH' ? '菜品' : '饮品'}：{uploadResult.duplicates.join('、')}
                        </div>
                      )}
                      {uploadResult.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                          ❌ 失败：{uploadResult.errors.join('、')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-sm text-gray-500 mt-2">
              帮助我们丰富菜品库，让更多人受益
            </p>
          </div>
        </div>
      </div>


    </div>
  )
}
