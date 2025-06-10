'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Dice6, Utensils, Coffee, RotateCcw, X, Settings, Heart, TrendingUp, Plus, Upload, ChefHat, ThumbsUp, ThumbsDown, Filter, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Food } from '@/lib/types'
import { FoodRoulette } from '@/components/food-roulette'
import { useRecommendationStats } from '@/hooks/useRecommendationStats'
import { FlipCounter } from '@/components/flip-counter'
import FoodRankingPanel from '@/components/FoodRankingPanel'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [includeDrink, setIncludeDrink] = useState(false)
  const [recommendation, setRecommendation] = useState<{
    food: Food
    drink?: Food
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  // 机械翻页数字状态
  const [displayedCount, setDisplayedCount] = useState(0)
  const [isCountAnimating, setIsCountAnimating] = useState(false)
  const [flipDigits, setFlipDigits] = useState<string[]>(['0'])

  // 实时更新相关状态
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // 管理员权限状态
  const [isAdmin, setIsAdmin] = useState(false)

  // 筛选功能状态
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    taste: [] as string[], // 口味偏好：不吃辣、清淡等
    cuisine: [] as string[], // 菜系选择：粤菜、日料等
    dietary: [] as string[] // 饮食忌口：不吃海鲜、不吃香菜等
  })

  // 屏幕切换状态
  const [currentScreen, setCurrentScreen] = useState<'main' | 'ranking'>('main')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // 屏幕切换函数
  const switchToRanking = useCallback(() => {
    if (currentScreen === 'ranking' || isTransitioning) return

    setIsTransitioning(true)
    setCurrentScreen('ranking')

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500) // 动画持续时间
  }, [currentScreen, isTransitioning])

  const switchToMain = useCallback(() => {
    if (currentScreen === 'main' || isTransitioning) return

    setIsTransitioning(true)
    setCurrentScreen('main')

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500) // 动画持续时间
  }, [currentScreen, isTransitioning])

  // 触摸手势监听
  useEffect(() => {
    let startY = 0
    let startTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return

      const endY = e.changedTouches[0].clientY
      const endTime = Date.now()
      const deltaY = endY - startY
      const deltaTime = endTime - startTime

      // 检查是否是有效的滑动手势
      if (Math.abs(deltaY) > 50 && deltaTime < 500) {
        if (deltaY < -50 && currentScreen === 'main') {
          // 向上滑动，切换到排行榜
          switchToRanking()
        } else if (deltaY > 50 && currentScreen === 'ranking') {
          // 向下滑动，切换到主页
          switchToMain()
        }
      }
    }

    // 滚轮监听
    let wheelTimeout: NodeJS.Timeout | null = null
    const handleWheel = (e: WheelEvent) => {
      if (isTransitioning) return

      // 防抖处理
      if (wheelTimeout) clearTimeout(wheelTimeout)
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 50 && currentScreen === 'main') {
          // 向下滚动，切换到排行榜
          switchToRanking()
        } else if (e.deltaY < -50 && currentScreen === 'ranking') {
          // 向上滚动，切换到主页
          switchToMain()
        }
      }, 100)
    }

    // 键盘监听
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return

      if (e.key === 'ArrowDown' && currentScreen === 'main') {
        switchToRanking()
      } else if (e.key === 'ArrowUp' && currentScreen === 'ranking') {
        switchToMain()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('wheel', handleWheel, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentScreen, isTransitioning, switchToRanking, switchToMain])

  // 数字动画函数
  const animateCount = useCallback((targetCount: number) => {
    if (targetCount === displayedCount) return

    setIsCountAnimating(true)
    const startCount = displayedCount
    const difference = targetCount - startCount
    const duration = 1500 // 1.5秒动画
    const startTime = Date.now()

    const updateCount = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用缓动函数让动画更自然
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.round(startCount + difference * easeOutQuart)

      setDisplayedCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      } else {
        setIsCountAnimating(false)
      }
    }

    requestAnimationFrame(updateCount)
  }, [displayedCount])

  // 获取最新统计数据
  const fetchLatestStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/usage?type=simple', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const result = await response.json()

      if (result.success) {
        const newCount = result.data.totalHelped || result.data.totalClicks || 0
        const currentCount = usageStats?.totalHelped || usageStats?.totalClicks || 0

        // 只有数字真的变化了才更新和动画
        if (newCount !== currentCount && newCount !== displayedCount) {
          setUsageStats(result.data)
          animateCount(newCount)
          setLastUpdateTime(Date.now())

          console.log(`📊 统计更新: ${currentCount} → ${newCount}`)
        }
      }
    } catch (error) {
      console.error('获取最新统计失败:', error)
    }
  }, [usageStats, displayedCount, animateCount])

  // 启动实时轮询
  const startPolling = useCallback(() => {
    // 清除现有的轮询
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // 设置新的轮询 - 每30秒检查一次
    const interval = setInterval(() => {
      fetchLatestStats()
    }, 30000) // 30秒间隔

    setPollingInterval(interval)
    console.log('🔄 开始实时轮询统计数据 (30秒间隔)')
  }, [pollingInterval, fetchLatestStats])

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
      console.log('⏹️ 停止实时轮询')
    }
  }, [pollingInterval])

  const handleRecommend = async () => {
    console.log('🎲 推荐按钮被点击了！')
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

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false)
    setIsLoading(false)

    // 只获取评分信息，不设置推荐结果
    // 让用户在FoodRoulette组件中进行操作
    // 注意：这里不能依赖animationData，因为会导致无限循环
    // 评分信息会在用户点击评分按钮时获取
  }, [])

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



  // 新增：FoodRoulette组件内部的"再来一次"处理
  const handleTryAgainInCard = useCallback(async (currentType: 'food' | 'drink') => {
    if (!animationData) return

    try {
      // 根据类型获取新的推荐
      const response = await fetch(`/api/recommend?type=${currentType}`)
      const result = await response.json()

      if (result.success) {
        // 更新对应类型的数据
        const newAnimationData = {
          ...animationData,
          [currentType]: result.data[currentType]
        }
        setAnimationData(newAnimationData)

        // 记录统计
        await recordAttempt(
          currentType === 'food' ? result.data.food : animationData.food,
          currentType === 'drink' ? result.data.drink : animationData.drink
        )
      }
    } catch (error) {
      console.error('重新推荐失败:', error)
      setError('重新推荐失败，请稍后重试')
    }
  }, [animationData, recordAttempt])

  // 创建稳定的回调函数
  const handleTryAgainFood = useCallback(() => handleTryAgainInCard('food'), [handleTryAgainInCard])
  const handleTryAgainDrink = useCallback(() => handleTryAgainInCard('drink'), [handleTryAgainInCard])

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



  // 检查管理员权限
  const checkAdminPermission = async () => {
    try {
      // 这里可以添加实际的权限检查逻辑
      // 目前简化为检查localStorage中的admin标识
      const adminFlag = localStorage.getItem('eat_what_admin')
      setIsAdmin(adminFlag === 'true')
    } catch (error) {
      console.error('检查管理员权限失败:', error)
      setIsAdmin(false)
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
        // 检查管理员权限
        await checkAdminPermission()

        // 获取统计信息 - 暂时注释掉，因为我们使用了专门的hook
        // try {
        //   const statsResponse = await fetchWithRetry('/api/stats')
        //   const statsResult = await statsResponse.json()
        //   if (statsResult.success) {
        //     setStats(statsResult.data)
        //   }
        // } catch (error) {
        //   console.error('获取统计信息失败:', error)
        //   // 继续尝试获取食物数据
        // }

        // 获取使用统计
        try {
          const usageResponse = await fetchWithRetry('/api/stats/usage?type=simple')
          const usageResult = await usageResponse.json()
          if (usageResult.success) {
            setUsageStats(usageResult.data)
            // 触发数字动画
            const targetCount = usageResult.data.totalHelped || usageResult.data.totalClicks || 0
            animateCount(targetCount)
            setLastUpdateTime(Date.now())

            // 启动实时轮询
            startPolling()
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
            const dishes = foodsResult.data.filter((food: Food) => food.type === 'DISH')
            const drinks = foodsResult.data.filter((food: Food) => food.type === 'DRINK')
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

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-x-hidden">
      {/* 背景装饰 - 美食雨滴 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute text-4xl opacity-20 animate-meteor-1">🍕</div>
        <div className="absolute text-3xl opacity-15 animate-meteor-2">🍔</div>
        <div className="absolute text-5xl opacity-10 animate-meteor-3">🍜</div>
        <div className="absolute text-3xl opacity-20 animate-meteor-4">🥤</div>
        <div className="absolute text-4xl opacity-15 animate-meteor-5">🍰</div>
        <div className="absolute text-3xl opacity-10 animate-meteor-6">🍣</div>
        <div className="absolute text-6xl opacity-5 animate-meteor-7">🍲</div>
        <div className="absolute text-4xl opacity-15 animate-meteor-8">🥗</div>
        <div className="absolute text-3xl opacity-12 animate-meteor-9">🥟</div>
        <div className="absolute text-4xl opacity-18 animate-meteor-10">🍱</div>
        <div className="absolute text-3xl opacity-14 animate-meteor-11">🧋</div>
        <div className="absolute text-5xl opacity-8 animate-meteor-12">🍛</div>
      </div>

      {/* 右上角功能区 */}
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
        {/* 贡献菜品按钮 - 放在最左边，所有用户都能看到 */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="group text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 flex items-center space-x-2 overflow-hidden"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:hidden md:group-hover:inline-block lg:hidden lg:group-hover:inline-block whitespace-nowrap transition-all duration-300">
                贡献
              </span>
              {/* 移动端始终显示文字 */}
              <span className="md:hidden whitespace-nowrap">
                贡献
              </span>
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
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="dish" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center space-x-2">
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
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="drink" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center space-x-2">
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
                    ? "例如：\n红烧肉\n宫保鸡丁\n麻婆豆腐"
                    : "例如：\n可乐\n雪碧\n橙汁"
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

        {/* 管理员专用按钮 */}
        {isAdmin && (
          <>
            {/* 统计按钮 - 仅管理员可见 */}
            <Link href="/stats">
              <Button
                variant="ghost"
                size="sm"
                className="group text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 flex items-center space-x-2 overflow-hidden"
              >
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:hidden md:group-hover:inline-block lg:hidden lg:group-hover:inline-block whitespace-nowrap transition-all duration-300">
                  统计
                </span>
                {/* 移动端始终显示文字 */}
                <span className="md:hidden whitespace-nowrap">
                  统计
                </span>
              </Button>
            </Link>

            {/* 管理面板按钮 - 仅管理员可见 */}
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="group text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 flex items-center space-x-2 overflow-hidden"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:hidden md:group-hover:inline-block lg:hidden lg:group-hover:inline-block whitespace-nowrap transition-all duration-300">
                  管理
                </span>
                {/* 移动端始终显示文字 */}
                <span className="md:hidden whitespace-nowrap">
                  管理
                </span>
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* 主要内容区域 - 单屏切换设计 */}
      <div className="relative z-10 h-screen overflow-hidden">
        {/* 屏幕容器 */}
        <div className={`screen-transition ${isTransitioning ? 'screen-transitioning' : ''} ${
          currentScreen === 'main' ? 'screen-main' : 'screen-ranking'
        }`}>
          {/* 第一屏：主要推荐功能 */}
          <div className="h-screen flex flex-col px-4 py-8 relative">
          {/* 切换提示 - 只在主页显示，放在右下角 */}
          {!animationData && !recommendation && currentScreen === 'main' && (
            <div className="fixed bottom-6 right-6 z-30 floating-button">
              <div className="relative group">
                <button
                  onClick={switchToRanking}
                  className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-orange-50 hover:border-orange-200 hover:scale-110"
                >
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                {/* 悬浮提示 */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                    查看排行榜
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {animationData ? (
              /* 推荐过程和结果区域 - 老虎机动画 */
              <div className="w-full max-w-4xl mx-auto space-y-8 flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
                    {showAnimation ? '🎰 正在为你挑选...' : '🎉 推荐结果'}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {showAnimation ? '请稍候，好东西值得等待' : '为你精心挑选的美食'}
                  </p>
                </div>

                {/* 老虎机动画展示区域 */}
                <div className={`grid gap-8 ${animationData.drink ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
                  {/* 菜品展示区域 */}
                  <div>
                    <FoodRoulette
                      foods={allFoods.length > 0 ? allFoods : [animationData.food]}
                      selectedFood={animationData.food}
                      type="food"
                      onAnimationComplete={animationData.drink ? () => {} : handleAnimationComplete}
                      onAccept={handleAcceptResult}
                      onReject={handleReject}
                      onTryAgain={handleTryAgainFood}
                      onRate={handleRating}
                    />
                  </div>

                  {/* 饮品展示区域 */}
                  {animationData.drink && (
                    <div>
                      <FoodRoulette
                        foods={allDrinks.length > 0 ? allDrinks : [animationData.drink]}
                        selectedFood={animationData.drink}
                        type="drink"
                        onAnimationComplete={handleAnimationComplete}
                        onAccept={handleAcceptResult}
                        onReject={handleReject}
                        onTryAgain={handleTryAgainDrink}
                        onRate={handleRating}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : recommendation ? (
                /* 推荐结果页面 */
                <div className="w-full max-w-4xl mx-auto space-y-4 flex-1 flex flex-col justify-center overflow-y-auto max-h-screen py-4">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      🎉 推荐结果
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      为你精心挑选的美食
                    </p>
                  </div>

                  {/* 推荐卡片区域 */}
                  <div className={`grid gap-6 ${recommendation.drink ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
                    {/* 食物推荐卡片 */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl border-2 border-orange-200 dark:border-gray-600">
                      <div className="text-center mb-6">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                          <Utensils className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-black text-gray-800 dark:text-white mb-2">
                          {recommendation.food.name}
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          {recommendation.food.description}
                        </p>
                      </div>

                      {/* 标签区域 */}
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        <Badge variant="secondary" className="px-3 py-1">
                          {recommendation.food.category}
                        </Badge>
                        {recommendation.food.tags && recommendation.food.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="px-3 py-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* 来源信息 */}
                      <div className="text-center mb-4">
                        <Badge
                          variant={recommendation.food.isUserUploaded ? "default" : "outline"}
                          className={`px-3 py-1 ${
                            recommendation.food.isUserUploaded
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {recommendation.food.isUserUploaded ? "👥 用户贡献" : "🏠 系统推荐"}
                        </Badge>
                      </div>

                      {/* 点赞点踩区域 */}
                      <div className="flex items-center justify-center space-x-4">
                        <Button
                          variant={foodRating?.userRating === 1 ? "default" : "outline"}
                          size="default"
                          onClick={() => handleRating(recommendation.food.id, 1, 'food')}
                          className="flex items-center space-x-2"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{foodRating?.likes || 0}</span>
                        </Button>
                        <Button
                          variant={foodRating?.userRating === -1 ? "destructive" : "outline"}
                          size="default"
                          onClick={() => handleRating(recommendation.food.id, -1, 'food')}
                          className="flex items-center space-x-2"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>{foodRating?.dislikes || 0}</span>
                        </Button>
                      </div>
                    </div>

                    {/* 饮品推荐卡片 */}
                    {recommendation.drink && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl border-2 border-blue-200 dark:border-gray-600">
                        <div className="text-center mb-6">
                          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                            <Coffee className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                          </div>
                          <h3 className="text-2xl lg:text-3xl font-black text-gray-800 dark:text-white mb-2">
                            {recommendation.drink.name}
                          </h3>
                          <p className="text-lg text-gray-600 dark:text-gray-300">
                            {recommendation.drink.description}
                          </p>
                        </div>

                        {/* 标签区域 */}
                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                          <Badge variant="secondary" className="px-3 py-1">
                            {recommendation.drink.category}
                          </Badge>
                          {recommendation.drink.tags && recommendation.drink.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="px-3 py-1">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* 来源信息 */}
                        <div className="text-center mb-4">
                          <Badge
                            variant={recommendation.drink.isUserUploaded ? "default" : "outline"}
                            className={`px-3 py-1 ${
                              recommendation.drink.isUserUploaded
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {recommendation.drink.isUserUploaded ? "👥 用户贡献" : "🏠 系统推荐"}
                          </Badge>
                        </div>

                        {/* 点赞点踩区域 */}
                        <div className="flex items-center justify-center space-x-4">
                          <Button
                            variant={drinkRating?.userRating === 1 ? "default" : "outline"}
                            size="default"
                            onClick={() => handleRating(recommendation.drink.id, 1, 'drink')}
                            className="flex items-center space-x-2"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{drinkRating?.likes || 0}</span>
                          </Button>
                          <Button
                            variant={drinkRating?.userRating === -1 ? "destructive" : "outline"}
                            size="default"
                            onClick={() => handleRating(recommendation.drink.id, -1, 'drink')}
                            className="flex items-center space-x-2"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{drinkRating?.dislikes || 0}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮区域 */}
                  <div className="space-y-4">
                    {/* 主要操作按钮 */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={handleAccept}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-xl"
                        size="lg"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        就这个！
                      </Button>

                      <Button
                        onClick={() => {
                          setRecommendation(null)
                          setAnimationData(null)
                          setError(null)
                        }}
                        variant="outline"
                        className="px-8 py-3 text-lg font-semibold rounded-xl"
                        size="lg"
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        重新开始
                      </Button>
                    </div>

                    {/* 辅助操作按钮 */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {recommendation.drink ? (
                        <>
                          <Button
                            onClick={handleRecommendFood}
                            disabled={isLoading}
                            variant="outline"
                            className="flex items-center space-x-2"
                          >
                            {isLoading ? (
                              <Dice6 className="animate-spin w-4 h-4" />
                            ) : (
                              <Utensils className="w-4 h-4" />
                            )}
                            <span>换个菜</span>
                          </Button>

                          <Button
                            onClick={handleRecommendDrink}
                            disabled={isLoading}
                            variant="outline"
                            className="flex items-center space-x-2"
                          >
                            {isLoading ? (
                              <Dice6 className="animate-spin w-4 h-4" />
                            ) : (
                              <Coffee className="w-4 h-4" />
                            )}
                            <span>换个饮品</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleRecommend}
                          disabled={isLoading}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          {isLoading ? (
                            <Dice6 className="animate-spin w-4 h-4" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          <span>再来一次</span>
                        </Button>
                      )}
                    </div>

                    {/* 拒绝按钮 */}
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => handleReject('today')}
                        className="flex items-center space-x-2"
                        size="default"
                      >
                        <X className="w-4 h-4" />
                        <span>今天不要</span>
                      </Button>

                      <Button
                        onClick={() => handleReject('forever')}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
                        size="default"
                      >
                        <X className="w-4 h-4" />
                        <span>永久不要</span>
                      </Button>
                    </div>
                  </div>
                </div>
          ) : (
            /* 🎯 新版沉浸式单屏设计 */
            <div className="w-full max-w-4xl mx-auto space-y-12 flex-1 flex flex-col justify-center">
              {/* 主标题区域 */}
              <div className="text-center space-y-6">
                <div className="relative">
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg leading-none">
                    吃啥
                  </h1>
                  {/* 标题装饰 */}
                  <div className="absolute -top-4 -right-4 text-3xl animate-spin-slow">✨</div>
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-center space-x-6 text-lg text-gray-600">
                  <div className="flex items-center space-x-3">
                    <span>已为吃货们决定</span>
                    <span className={`text-3xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent transition-all duration-500 ${
                      isCountAnimating ? 'scale-110 animate-pulse' : ''
                    }`}>
                      {displayedCount}
                    </span>
                    <span>次</span>
                  </div>
                  {pollingInterval && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">实时更新</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 主要交互区域 */}
              <div className="space-y-8 relative z-20">
                {/* 主推荐按钮 - 绝对视觉中心 */}
                <div className="relative flex justify-center">
                  <Button
                    onClick={() => {
                      console.log('主推荐按钮被点击了！')
                      handleRecommend()
                    }}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white text-2xl md:text-3xl font-black py-8 px-16 rounded-full shadow-2xl hover:scale-110 hover:shadow-3xl transition-all duration-300 disabled:opacity-50 hover:animate-pulse"
                    size="xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>正在推荐...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-3xl animate-bounce">🎲</span>
                        <span>帮我决定！</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* 饮品开关和筛选功能 */}
                <div className="flex flex-col items-center space-y-6">
                  {/* 饮品开关 */}
                  <div className="flex items-center justify-center space-x-4 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
                    <span className="text-2xl">🥤</span>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">同时推荐饮品</div>
                      <div className="text-sm text-gray-600">让搭配更完美</div>
                    </div>
                    <button
                      onClick={() => setIncludeDrink(!includeDrink)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                        includeDrink
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                          includeDrink ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 筛选引导 */}
                  <div className="text-center space-y-3">
                    <p className="text-gray-600 text-sm">
                      有什么忌口吗？想吃点清淡的？
                    </p>
                    <Button
                      onClick={() => {
                        console.log('筛选按钮被点击了！')
                        setShowFilters(!showFilters)
                      }}
                      variant="outline"
                      className="bg-white border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Filter className="w-5 h-5 mr-2" />
                      <span className="font-medium">个性化筛选</span>
                      <Sparkles className="w-4 h-4 ml-2 text-orange-500" />
                    </Button>
                  </div>
                </div>

                {/* ⚠️ 错误提示 */}
                {error && (
                  <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl text-lg font-medium shadow-lg">
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-2xl">⚠️</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          {/* 第二屏：本周热门（美食排行榜） */}
          <div className="h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                🏆 本周热门
              </h2>
              <p className="text-xl text-gray-600">
                看看大家都在选什么
              </p>
            </div>

            {/* 图文并茂的卡片流样式 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
              <FoodRankingPanel />
            </div>
          </div>

            {/* 返回主页按钮 - 放在右下角 */}
            {currentScreen === 'ranking' && (
              <div className="fixed bottom-6 right-6 z-30 floating-button">
                <div className="relative group">
                  <button
                    onClick={switchToMain}
                    className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-blue-50 hover:border-blue-200 hover:scale-110"
                  >
                    <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  {/* 悬浮提示 */}
                  <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
                      返回推荐
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
