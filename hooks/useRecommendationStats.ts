import { useState, useCallback, useEffect } from 'react'
import { getDeviceId } from '@/lib/device-fingerprint'

interface RecommendationSession {
  sessionId: string
  id: string
  startTime: number
  lastActivity: number
  attemptCount: number
}

interface Food {
  id: string
  name: string
  type: string
  category: string
  description?: string
  tags: string[]
}

const SESSION_STORAGE_KEY = 'eat_what_current_session'
const SESSION_TIMEOUT = 5 * 60 * 1000 // 5分钟超时

export function useRecommendationStats() {
  const [currentSession, setCurrentSession] = useState<RecommendationSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 保存会话到本地存储
  const saveSessionToStorage = useCallback((session: RecommendationSession | null) => {
    if (typeof window !== 'undefined') {
      if (session) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
  }, [])

  // 从本地存储恢复会话
  const loadSessionFromStorage = useCallback((): RecommendationSession | null => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const session = JSON.parse(stored) as RecommendationSession
          // 检查会话是否超时
          const now = Date.now()
          if (now - session.lastActivity < SESSION_TIMEOUT) {
            return session
          } else {
            // 会话超时，直接清除本地存储，不调用 API
            localStorage.removeItem(SESSION_STORAGE_KEY)
            console.log('会话已超时，已清除本地存储:', session.sessionId)
          }
        }
      } catch (error) {
        console.error('恢复会话失败:', error)
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
    return null
  }, [])

  // 标记会话为放弃
  const markSessionAsAbandoned = useCallback(async (session: RecommendationSession) => {
    try {
      await fetch('/api/stats/recommendation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'abandon',
          abandonReason: 'timeout'
        })
      })
      console.log('会话已标记为放弃:', session.sessionId)
    } catch (error) {
      console.error('标记会话放弃失败:', error)
    }
  }, [])

  // 更新会话活动时间
  const updateSessionActivity = useCallback((session: RecommendationSession) => {
    const updatedSession = {
      ...session,
      lastActivity: Date.now()
    }
    setCurrentSession(updatedSession)
    saveSessionToStorage(updatedSession)
    return updatedSession
  }, [saveSessionToStorage])

  // 记录使用统计的辅助函数
  const recordUsageStats = useCallback(async (action: string) => {
    try {
      const deviceId = getDeviceId()
      await fetch('/api/stats/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          deviceId
        })
      })
    } catch (error) {
      console.error('记录使用统计失败:', error)
    }
  }, [])

  // 开始新的推荐会话
  const startSession = useCallback(async (includeDrink: boolean = false) => {
    try {
      setIsLoading(true)
      const deviceId = getDeviceId()

      // 记录会话开始统计
      await recordUsageStats('session_start')

      const response = await fetch('/api/stats/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          includeDrink
        })
      })

      const result = await response.json()

      if (result.success) {
        const now = Date.now()
        const session: RecommendationSession = {
          sessionId: result.data.sessionId,
          id: result.data.id,
          startTime: now,
          lastActivity: now,
          attemptCount: 0
        }

        setCurrentSession(session)
        saveSessionToStorage(session)
        console.log('推荐会话已开始:', session.sessionId)
        return session
      } else {
        console.error('开始推荐会话失败:', result.error)
        return null
      }
    } catch (error) {
      console.error('开始推荐会话失败:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [saveSessionToStorage, recordUsageStats])

  // 记录推荐尝试
  const recordAttempt = useCallback(async (food: Food, drink?: Food) => {
    if (!currentSession) {
      console.warn('没有活跃的推荐会话')
      return
    }

    try {
      // 记录尝试统计
      await recordUsageStats('attempt')

      // 更新会话活动时间和尝试次数
      const updatedSession = {
        ...currentSession,
        lastActivity: Date.now(),
        attemptCount: currentSession.attemptCount + 1
      }
      setCurrentSession(updatedSession)
      saveSessionToStorage(updatedSession)

      const response = await fetch('/api/stats/recommendation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          foodId: food.id,
          drinkId: drink?.id,
          action: 'attempt'
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('推荐尝试已记录:', food.name, drink?.name)
      } else {
        console.error('记录推荐尝试失败:', result.error)
      }
    } catch (error) {
      console.error('记录推荐尝试失败:', error)
    }
  }, [currentSession, saveSessionToStorage, recordUsageStats])

  // 记录用户接受推荐
  const recordAcceptance = useCallback(async (food: Food, drink?: Food) => {
    if (!currentSession) {
      console.warn('没有活跃的推荐会话')
      return
    }

    try {
      // 记录接受统计
      await recordUsageStats('accept')

      const response = await fetch('/api/stats/recommendation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          foodId: food.id,
          drinkId: drink?.id,
          action: 'accept'
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('用户接受推荐已记录:', food.name, drink?.name)
        // 会话结束，清除当前会话
        setCurrentSession(null)
        saveSessionToStorage(null)
      } else {
        console.error('记录用户接受失败:', result.error)
      }
    } catch (error) {
      console.error('记录用户接受失败:', error)
    }
  }, [currentSession, saveSessionToStorage, recordUsageStats])

  // 记录用户拒绝推荐
  const recordRejection = useCallback(async (food: Food, drink: Food | undefined, rejectionType: 'today' | 'forever') => {
    if (!currentSession) {
      console.warn('没有活跃的推荐会话')
      return
    }

    try {
      // 记录拒绝统计
      await recordUsageStats('reject')

      const response = await fetch('/api/stats/recommendation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          foodId: food.id,
          drinkId: drink?.id,
          action: 'reject',
          rejectionType
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('用户拒绝推荐已记录:', food.name, drink?.name, rejectionType)
        // 会话结束，清除当前会话
        setCurrentSession(null)
        saveSessionToStorage(null)
      } else {
        console.error('记录用户拒绝失败:', result.error)
      }
    } catch (error) {
      console.error('记录用户拒绝失败:', error)
    }
  }, [currentSession, saveSessionToStorage, recordUsageStats])

  // 标记当前会话为放弃
  const markCurrentSessionAsAbandoned = useCallback(async (reason: string = 'page_leave') => {
    if (currentSession) {
      try {
        // 记录放弃统计
        await recordUsageStats('abandon')

        await fetch('/api/stats/recommendation', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: currentSession.sessionId,
            action: 'abandon',
            abandonReason: reason
          })
        })
        console.log('当前会话已标记为放弃:', currentSession.sessionId, reason)
        setCurrentSession(null)
        saveSessionToStorage(null)
      } catch (error) {
        console.error('标记当前会话放弃失败:', error)
      }
    }
  }, [currentSession, saveSessionToStorage, recordUsageStats])

  // 获取统计数据
  const getStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/recommendation?type=summary')
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        console.error('获取统计数据失败:', result.error)
        return null
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      return null
    }
  }, [])

  // 页面加载时恢复会话
  useEffect(() => {
    const restoredSession = loadSessionFromStorage()
    if (restoredSession) {
      setCurrentSession(restoredSession)
      console.log('恢复会话:', restoredSession.sessionId)
    }
  }, [loadSessionFromStorage])

  // 监听页面离开事件
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentSession) {
        // 标记会话为放弃（页面离开）
        markCurrentSessionAsAbandoned('page_leave')

        // 显示确认对话框（可选）
        event.preventDefault()
        event.returnValue = '您有正在进行的推荐会话，确定要离开吗？'
        return event.returnValue
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentSession) {
        // 页面隐藏时标记为放弃
        markCurrentSessionAsAbandoned('page_hidden')
      }
    }

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 清理函数
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentSession, markCurrentSessionAsAbandoned])

  // 记录点击统计（每次点击"吃什么"按钮）
  const recordClick = useCallback(async () => {
    await recordUsageStats('click')
  }, [recordUsageStats])

  return {
    currentSession,
    isLoading,
    startSession,
    recordAttempt,
    recordAcceptance,
    recordRejection,
    markCurrentSessionAsAbandoned,
    recordClick,
    getStats
  }
}
