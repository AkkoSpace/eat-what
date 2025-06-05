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
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(false) // 先设为false，避免无限加载
  const [activeTab, setActiveTab] = useState<'all' | 'dish' | 'drink'>('all')

  // 获取排行榜数据
  const fetchRanking = async (type: 'all' | 'dish' | 'drink' = 'all') => {
    try {
      console.log('开始获取排行榜数据:', type)
      setLoading(true)
      const response = await fetch(`/api/foods/ranking?type=${type}&limit=10`)
      console.log('API响应状态:', response.status)
      const result = await response.json()
      console.log('API响应数据:', result)

      if (result.success) {
        setRankingData(result.data)
        console.log('排行榜数据设置成功')
      } else {
        console.error('获取排行榜失败:', result.error)
        setRankingData({ ranking: [], total: 0, type })
      }
    } catch (error) {
      console.error('获取排行榜错误:', error)
      setRankingData({ ranking: [], total: 0, type })
    } finally {
      console.log('设置loading为false')
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('useEffect 执行, activeTab:', activeTab)
    fetchRanking(activeTab)
  }, [activeTab])

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

  return (
    <div className="h-full flex flex-col">
      {/* 标题 */}
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">
          🏆 美食排行榜
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
          根据用户选择统计
        </p>
      </div>

      {/* 标签切换 */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => {
              console.log('点击全部标签')
              setActiveTab('all')
              fetchRanking('all')
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => {
              console.log('点击菜品标签')
              setActiveTab('dish')
              fetchRanking('dish')
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dish'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🍽️ 菜品
          </button>
          <button
            onClick={() => {
              console.log('点击饮品标签')
              setActiveTab('drink')
              fetchRanking('drink')
            }}
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

      {/* 排行榜内容 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          </div>
        ) : rankingData && rankingData.ranking.length > 0 ? (
          <div className="h-full overflow-y-auto space-y-3 pr-2">
            {rankingData.ranking.map((item) => (
              <div
                key={item.id}
                className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 ${
                  item.rank <= 3 ? 'ring-2 ring-orange-200 dark:ring-orange-700' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* 排名 */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {item.rank <= 3 ? (
                      <span className="text-xl">{getRankIcon(item.rank)}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        {item.rank}
                      </span>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{item.category}</span>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span>❤️ {item.stats.acceptCount}</span>
                        <span>📊 {item.stats.acceptanceRate}%</span>
                      </div>
                    </div>

                    {/* 用户上传标识 */}
                    {item.isUserUploaded && (
                      <div className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                        👤 用户贡献
                        {item.uploader?.nickname && (
                          <span className="ml-1">by {item.uploader.nickname}</span>
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
