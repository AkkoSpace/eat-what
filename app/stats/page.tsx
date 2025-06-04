'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Target, Award, ArrowLeft, MousePointer, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'

interface RecommendationStatsData {
  totalSessions: number
  completedSessions: number
  acceptedSessions: number
  abandonedSessions: number
  completionRate: string
  acceptanceRate: string
  abandonRate: string
  avgAttempts: string
  popularFoods: Array<{
    food: {
      id: string
      name: string
      type: string
      category: string
      description?: string
    }
    stats: {
      recommendCount: number
      acceptCount: number
      acceptRate: string
    }
  }>
}

interface UsageStatsData {
  global: {
    totalClicks: number
    totalUsers: number
    totalSessions: number
    totalAttempts: number
    totalAccepted: number
    totalRejected: number
    totalAbandoned: number
  }
  daily: Array<{
    date: string
    dailyClicks: number
    dailyUsers: number
    dailySessions: number
    dailyAttempts: number
    dailyAccepted: number
    dailyRejected: number
    dailyAbandoned: number
  }>
}

export default function StatsPage() {
  const [recommendationStats, setRecommendationStats] = useState<RecommendationStatsData | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取推荐统计
        const [recommendationResponse, usageResponse] = await Promise.all([
          fetch('/api/stats/recommendation?type=summary'),
          fetch('/api/stats/usage?type=detailed')
        ])

        const [recommendationResult, usageResult] = await Promise.all([
          recommendationResponse.json(),
          usageResponse.json()
        ])

        if (recommendationResult.success) {
          setRecommendationStats(recommendationResult.data)
        }

        if (usageResult.success) {
          setUsageStats(usageResult.data)
        }

        if (!recommendationResult.success && !usageResult.success) {
          setError('获取统计数据失败')
        }
      } catch (err) {
        setError('网络错误，请稍后重试')
        console.error('获取统计数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载统计数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              📊 推荐统计
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              了解用户的选择偏好和推荐效果
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>管理</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>返回首页</span>
              </Button>
            </Link>
          </div>
        </div>

        {(usageStats || recommendationStats) && (
          <div className="space-y-8">
            {/* 使用统计 */}
            {usageStats && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">📊 使用统计</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">总点击次数</CardTitle>
                      <MousePointer className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{usageStats.global.totalClicks.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        用户点击"吃什么"按钮次数
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{usageStats.global.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        基于设备指纹的唯一用户
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">总会话数</CardTitle>
                      <Calendar className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{usageStats.global.totalSessions.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        推荐会话总数
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">总推荐次数</CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{usageStats.global.totalAttempts.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        推荐尝试总次数
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* 推荐效果统计 */}
            {recommendationStats && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">🎯 推荐效果</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">接受率</CardTitle>
                      <Target className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{recommendationStats.acceptanceRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        {recommendationStats.acceptedSessions} / {recommendationStats.totalSessions} 次接受
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">放弃率</CardTitle>
                      <Target className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{recommendationStats.abandonRate}%</div>
                      <p className="text-xs text-muted-foreground">
                        {recommendationStats.abandonedSessions} 次中途离开
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">平均尝试次数</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{recommendationStats.avgAttempts}</div>
                      <p className="text-xs text-muted-foreground">
                        用户平均推荐次数
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">热门食物</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{recommendationStats.popularFoods.length}</div>
                      <p className="text-xs text-muted-foreground">
                        有统计数据的食物
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* 热门食物排行 */}
            {recommendationStats && recommendationStats.popularFoods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span>最受欢迎的食物</span>
                  </CardTitle>
                  <CardDescription>
                    根据用户接受率排序的热门食物
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendationStats.popularFoods.slice(0, 10).map((item, index) => (
                      <div key={item.food.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                              {item.food.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={item.food.type === 'DISH' ? 'default' : 'secondary'}>
                                {item.food.type === 'DISH' ? '菜品' : '饮品'}
                              </Badge>
                              <Badge variant="outline">
                                {item.food.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {item.stats.acceptRate}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.stats.acceptCount} / {item.stats.recommendCount} 次接受
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
