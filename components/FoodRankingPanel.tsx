'use client'

import { useState, useEffect } from 'react'
import { FoodType } from '@prisma/client'

interface FoodRankingItem {
  id: string
  name: string
  type: FoodType
  category: string
  description?: string
  isUserUploaded: boolean
  uploader?: {
    id: string
    nickname?: string
  }
  stats: {
    acceptCount: number
    recommendCount: number
    rejectCount: number
    acceptanceRate: number
    hotScore: number
  }
  tags: string[]
  rank: number
}

interface RankingData {
  ranking: FoodRankingItem[]
  total: number
  type: string
}

export default function FoodRankingPanel() {
  const [rankingCache, setRankingCache] = useState<{
    all?: RankingData
    dish?: RankingData
    drink?: RankingData
  }>({})
  const [loading, setLoading] = useState(true) // 初始加载状态
  const [activeTab, setActiveTab] = useState<'all' | 'dish' | 'drink'>('all')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now())

  // 获取单个类型的排行榜数据
  const fetchSingleRanking = async (type: 'all' | 'dish' | 'drink'): Promise<RankingData | null> => {
    try {
      console.log('获取排行榜数据:', type)
      const response = await fetch(`/api/foods/ranking?type=${type}&limit=10`)
      const result = await response.json()

      if (result.success) {
        console.log(`${type} 排行榜数据获取成功`)
        return result.data
      } else {
        console.error(`获取 ${type} 排行榜失败:`, result.error)
        return { ranking: [], total: 0, type }
      }
    } catch (error) {
      console.error(`获取 ${type} 排行榜错误:`, error)
      return { ranking: [], total: 0, type }
    }
  }

  // 预加载所有排行榜数据
  const preloadAllRankings = async () => {
    try {
      console.log('🚀 开始预加载所有排行榜数据')
      setLoading(true)

      // 并行获取所有类型的数据
      const [allData, dishData, drinkData] = await Promise.all([
        fetchSingleRanking('all'),
        fetchSingleRanking('dish'),
        fetchSingleRanking('drink')
      ])

      // 更新缓存
      const newCache = {
        all: allData || undefined,
        dish: dishData || undefined,
        drink: drinkData || undefined
      }

      setRankingCache(newCache)
      setLastUpdateTime(Date.now())
      console.log('✅ 所有排行榜数据预加载完成', newCache)
    } catch (error) {
      console.error('❌ 预加载排行榜数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新单个类型的数据（后台更新）
  const updateSingleRanking = async (type: 'all' | 'dish' | 'drink') => {
    const data = await fetchSingleRanking(type)
    if (data) {
      setRankingCache(prev => ({
        ...prev,
        [type]: data
      }))
      console.log(`🔄 后台更新 ${type} 排行榜完成`)
    }
  }

  // 切换标签（无需重新加载数据）
  const handleTabChange = (newTab: 'all' | 'dish' | 'drink') => {
    if (newTab === activeTab) return // 避免重复切换

    console.log('切换标签:', newTab)
    setIsTransitioning(true)
    setActiveTab(newTab)

    // 短暂的过渡效果
    setTimeout(() => {
      setIsTransitioning(false)
    }, 200)
  }

  // 定时更新数据
  useEffect(() => {
    // 初始预加载
    preloadAllRankings()

    // 设置定时更新（每5分钟更新一次）
    const updateInterval = setInterval(() => {
      console.log('🔄 定时更新排行榜数据')
      // 后台静默更新所有数据
      Promise.all([
        updateSingleRanking('all'),
        updateSingleRanking('dish'),
        updateSingleRanking('drink')
      ]).then(() => {
        setLastUpdateTime(Date.now())
      })
    }, 5 * 60 * 1000) // 5分钟

    return () => {
      clearInterval(updateInterval)
    }
  }, [])

  // 手动刷新数据
  const handleRefresh = () => {
    console.log('🔄 手动刷新排行榜数据')
    preloadAllRankings()
  }

  // 获取当前显示的排行榜数据
  const getCurrentRankingData = (): RankingData | null => {
    return rankingCache[activeTab] || null
  }

  // 格式化更新时间
  const getUpdateTimeText = () => {
    const now = Date.now()
    const diff = now - lastUpdateTime
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return '刚刚更新'
    if (minutes < 60) return `${minutes}分钟前更新`
    const hours = Math.floor(minutes / 60)
    return `${hours}小时前更新`
  }

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `${rank}`
    }
  }

  // 获取类型图标
  const getTypeIcon = (type: FoodType) => {
    return type === 'DISH' ? '🍽️' : '🥤'
  }

  const currentData = getCurrentRankingData()

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* 标题 */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">
              🏆 美食排行榜
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              根据用户选择统计 • {getUpdateTimeText()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="刷新数据"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => handleTabChange('dish')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dish'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🍽️ 菜品
          </button>
          <button
            onClick={() => handleTabChange('drink')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'drink'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🥤 饮品
          </button>
        </div>
      </div>

      {/* 排行榜内容 - 修复滚动问题 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={`h-full transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {loading && !currentData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">正在加载排行榜...</p>
              </div>
            </div>
          ) : currentData && currentData.ranking.length > 0 ? (
            <div className="h-full overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              {currentData.ranking.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 min-h-fit ${
                    item.rank <= 3 ? 'ring-2 ring-orange-200 dark:ring-orange-700' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* 排名 */}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                      {item.rank <= 3 ? (
                        <span className="text-2xl">{getRankIcon(item.rank)}</span>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                            {item.rank}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* 标题行 */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xl flex-shrink-0">{getTypeIcon(item.type)}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
                          {item.name}
                        </h3>
                      </div>

                      {/* 分类信息 */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category}
                      </div>

                      {/* 统计信息 */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-red-500">
                          <span>❤️</span>
                          <span className="font-medium">{item.stats.acceptCount}</span>
                          <span className="text-gray-500 dark:text-gray-400">次选择</span>
                        </div>
                        <div className="flex items-center space-x-1 text-blue-500">
                          <span>📊</span>
                          <span className="font-medium">{item.stats.acceptanceRate}%</span>
                          <span className="text-gray-500 dark:text-gray-400">接受率</span>
                        </div>
                      </div>

                      {/* 用户上传标识 */}
                      {item.isUserUploaded && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md inline-block">
                          👤 用户贡献
                          {item.uploader?.nickname && (
                            <span className="ml-1 font-medium">by {item.uploader.nickname}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="text-4xl">🤔</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  暂无排行数据
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  快去推荐一些菜品吧！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部说明 */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            排名基于用户选择次数和接受率
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <span>❤️</span>
              <span>选择次数</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>📊</span>
              <span>接受率</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
