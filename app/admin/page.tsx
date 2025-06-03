'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Search, Filter, Utensils, Coffee } from 'lucide-react'
import { Food, FoodType, FoodStatus } from '@/lib/types'

interface FoodWithUploader extends Food {
  uploader?: {
    id: string
    nickname?: string
    email?: string
  }
}

interface FoodsResponse {
  foods: FoodWithUploader[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminPage() {
  const [foods, setFoods] = useState<FoodWithUploader[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
  // 筛选状态
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    search: ''
  })
  
  // 编辑/新增对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodWithUploader | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'DISH' as FoodType,
    category: '',
    description: '',
    tags: '',
    status: 'ACTIVE' as FoodStatus
  })

  // 获取食物列表
  const fetchFoods = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type !== 'ALL' && { type: filters.type }),
        ...(filters.status !== 'ALL' && { status: filters.status })
      })
      
      const response = await fetch(`/api/foods?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setFoods(result.data.foods)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      console.error('获取食物列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFoods()
  }, [pagination.page, filters])

  // 打开新增对话框
  const openAddDialog = () => {
    setEditingFood(null)
    setFormData({
      name: '',
      type: 'DISH',
      category: '',
      description: '',
      tags: '',
      status: 'ACTIVE'
    })
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (food: FoodWithUploader) => {
    setEditingFood(food)
    setFormData({
      name: food.name,
      type: food.type,
      category: food.category,
      description: food.description || '',
      tags: food.tags?.join(', ') || '',
      status: food.status
    })
    setDialogOpen(true)
  }

  // 保存食物
  const saveFood = async () => {
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      const url = editingFood ? `/api/foods/${editingFood.id}` : '/api/foods'
      const method = editingFood ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setDialogOpen(false)
        fetchFoods()
      } else {
        alert(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败')
    }
  }

  // 删除食物
  const deleteFood = async (id: string) => {
    if (!confirm('确定要删除这个食物吗？')) return
    
    try {
      const response = await fetch(`/api/foods/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchFoods()
      } else {
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const getStatusBadge = (status: FoodStatus) => {
    const variants = {
      ACTIVE: 'default',
      PENDING: 'secondary',
      HIDDEN: 'destructive'
    } as const
    
    const labels = {
      ACTIVE: '活跃',
      PENDING: '待审核',
      HIDDEN: '隐藏'
    }
    
    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🛠️ 菜品管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            管理系统中的所有菜品和饮品
          </p>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            添加菜品
          </Button>
          
          <div className="flex flex-1 gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索菜品名称..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部类型</SelectItem>
                <SelectItem value="DISH">菜品</SelectItem>
                <SelectItem value="DRINK">饮品</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="ACTIVE">活跃</SelectItem>
                <SelectItem value="PENDING">待审核</SelectItem>
                <SelectItem value="HIDDEN">隐藏</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{pagination.total}</div>
              <div className="text-sm text-gray-600">总数量</div>
            </CardContent>
          </Card>
        </div>

        {/* 食物列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            foods.map((food) => (
              <Card key={food.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {food.type === 'DISH' ? (
                        <Utensils className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Coffee className="w-4 h-4 text-blue-500" />
                      )}
                      <CardTitle className="text-lg">{food.name}</CardTitle>
                    </div>
                    {getStatusBadge(food.status)}
                  </div>
                  <CardDescription>{food.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {food.description || '暂无描述'}
                  </p>
                  
                  {food.tags && food.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {food.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {food.isUserUploaded ? '用户上传' : '系统预置'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(food)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFood(food.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              上一页
            </Button>
            <span className="flex items-center px-4">
              第 {pagination.page} 页，共 {pagination.totalPages} 页
            </span>
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              下一页
            </Button>
          </div>
        )}

        {/* 编辑/新增对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingFood ? '编辑菜品' : '添加菜品'}
              </DialogTitle>
              <DialogDescription>
                {editingFood ? '修改菜品信息' : '添加新的菜品到系统中'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">类型</Label>
                <Select value={formData.type} onValueChange={(value: FoodType) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISH">菜品</SelectItem>
                    <SelectItem value="DRINK">饮品</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">分类</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="col-span-3"
                  placeholder="如：川菜、奶茶等"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="简单描述这道菜..."
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">标签</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="col-span-3"
                  placeholder="用逗号分隔，如：辣,荤菜"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">状态</Label>
                <Select value={formData.status} onValueChange={(value: FoodStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">活跃</SelectItem>
                    <SelectItem value="PENDING">待审核</SelectItem>
                    <SelectItem value="HIDDEN">隐藏</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={saveFood}>
                {editingFood ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
