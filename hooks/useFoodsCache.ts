import { useState, useEffect, useCallback } from 'react'

// 定义食物类型
export type FoodType = 'DISH' | 'DRINK'
export type FoodStatus = 'ACTIVE' | 'PENDING' | 'HIDDEN'

export interface Food {
  id: string
  name: string
  type: FoodType
  category: string
  description?: string
  tags: string[] | string // 支持数组或JSON字符串
  status: FoodStatus
  isUserUploaded: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

interface FoodWithUploader extends Food {
  uploader?: {
    id: string
    nickname?: string
    email?: string
  }
}

interface FilterOptions {
  type: string
  status: string
  search: string
}

interface PaginationOptions {
  page: number
  limit: number
}

export function useFoodsCache() {
  const [allFoods, setAllFoods] = useState<FoodWithUploader[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)
  
  // 缓存有效期：5分钟
  const CACHE_DURATION = 5 * 60 * 1000

  // 获取所有食物数据
  const fetchAllFoods = useCallback(async (force = false) => {
    const now = Date.now()
    
    // 如果缓存还有效且不是强制刷新，直接返回
    if (!force && allFoods.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      return allFoods
    }

    setLoading(true)
    try {
      const response = await fetch('/api/foods?all=true')
      const result = await response.json()
      
      if (result.success) {
        setAllFoods(result.data)
        setLastFetch(now)
        return result.data
      } else {
        console.error('获取食物数据失败:', result.error)
        return []
      }
    } catch (error) {
      console.error('获取食物数据错误:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [allFoods, lastFetch])

  // 初始化时获取数据
  useEffect(() => {
    fetchAllFoods()
  }, [])

  // 前端筛选和搜索
  const getFilteredFoods = useCallback((filters: FilterOptions, pagination: PaginationOptions) => {
    let filtered = [...allFoods]

    // 类型筛选
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(food => food.type === filters.type)
    }

    // 状态筛选
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(food => food.status === filters.status)
    }

    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(food => {
        // 安全解析 tags
        const tags = Array.isArray(food.tags) ? food.tags :
          (typeof food.tags === 'string' ?
            (food.tags.startsWith('[') ?
              JSON.parse(food.tags || '[]') :
              food.tags.split(',').map(t => t.trim())
            ) : []
          )

        return food.name.toLowerCase().includes(searchLower) ||
               food.category.toLowerCase().includes(searchLower) ||
               (food.description && food.description.toLowerCase().includes(searchLower)) ||
               tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      })
    }

    // 计算分页
    const total = filtered.length
    const totalPages = Math.ceil(total / pagination.limit)
    const startIndex = (pagination.page - 1) * pagination.limit
    const endIndex = startIndex + pagination.limit
    const paginatedFoods = filtered.slice(startIndex, endIndex)

    return {
      foods: paginatedFoods,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }, [allFoods])

  // 添加食物到缓存
  const addFood = useCallback((newFood: FoodWithUploader) => {
    setAllFoods(prev => [newFood, ...prev])
  }, [])

  // 更新缓存中的食物
  const updateFood = useCallback((updatedFood: FoodWithUploader) => {
    setAllFoods(prev => 
      prev.map(food => 
        food.id === updatedFood.id ? updatedFood : food
      )
    )
  }, [])

  // 从缓存中删除食物
  const removeFood = useCallback((foodId: string) => {
    setAllFoods(prev => prev.filter(food => food.id !== foodId))
  }, [])

  // 批量删除
  const removeFoods = useCallback((foodIds: string[]) => {
    setAllFoods(prev => prev.filter(food => !foodIds.includes(food.id)))
  }, [])

  // 获取统计信息
  const getStats = useCallback(() => {
    const total = allFoods.length
    const dishes = allFoods.filter(food => food.type === 'DISH').length
    const drinks = allFoods.filter(food => food.type === 'DRINK').length
    const active = allFoods.filter(food => food.status === 'ACTIVE').length
    const pending = allFoods.filter(food => food.status === 'PENDING').length
    const hidden = allFoods.filter(food => food.status === 'HIDDEN').length

    return {
      total,
      dishes,
      drinks,
      active,
      pending,
      hidden
    }
  }, [allFoods])

  return {
    allFoods,
    loading,
    fetchAllFoods,
    getFilteredFoods,
    addFood,
    updateFood,
    removeFood,
    removeFoods,
    getStats
  }
}
