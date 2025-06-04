'use client'

import { useState, useEffect } from 'react'
import { useFoodsCache } from '@/hooks/useFoodsCache'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Edit, Trash2, Search, Filter, Utensils, Coffee, ArrowLeft, MoreHorizontal, Copy, Eye, RefreshCw, TrendingUp } from 'lucide-react'
import { Food, FoodType, FoodStatus } from '@/lib/types'
import Link from 'next/link'

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
  // 使用缓存 Hook
  const {
    allFoods,
    loading,
    fetchAllFoods,
    getFilteredFoods,
    addFood,
    updateFood,
    removeFood,
    removeFoods,
    getStats
  } = useFoodsCache()

  const [foods, setFoods] = useState<FoodWithUploader[]>([])
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

  // 批量操作状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // 安全解析 tags 的辅助函数
  const parseTags = (tags: any): string[] => {
    if (Array.isArray(tags)) {
      return tags
    }
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        // 如果不是有效的 JSON，尝试按逗号分割
        return tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }
    }
    return []
  }

  // 应用筛选和分页（前端处理）
  useEffect(() => {
    if (allFoods.length > 0) {
      const result = getFilteredFoods(filters, pagination)
      setFoods(result.foods)
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }))
    }
  }, [allFoods, filters, pagination.page, pagination.limit, getFilteredFoods])

  // 重置到第一页当筛选条件改变时
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [filters.type, filters.status, filters.search])

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
      tags: parseTags(food.tags).join(', '),
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

        // 更新缓存
        if (editingFood) {
          updateFood(result.data)
        } else {
          addFood(result.data)
        }
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
        // 从缓存中删除
        removeFood(id)
        // 如果当前选中包含这个项目，也要移除
        setSelectedItems(prev => prev.filter(item => item !== id))
      } else {
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  // 批量操作处理
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedItems(foods.map(food => food.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
      setSelectAll(false)
    }
  }

  // 批量删除
  const batchDelete = async () => {
    if (selectedItems.length === 0) return
    if (!confirm(`确定要删除选中的 ${selectedItems.length} 个食物吗？`)) return

    try {
      await Promise.all(
        selectedItems.map(id =>
          fetch(`/api/foods/${id}`, { method: 'DELETE' })
        )
      )

      // 从缓存中批量删除
      removeFoods(selectedItems)
      setSelectedItems([])
      setSelectAll(false)
    } catch (error) {
      console.error('批量删除失败:', error)
      alert('批量删除失败')
    }
  }

  // 批量审核通过
  const batchApprove = async () => {
    if (selectedItems.length === 0) return

    const pendingItems = selectedItems.filter(id => {
      const food = foods.find(f => f.id === id)
      return food?.status === 'PENDING'
    })

    if (pendingItems.length === 0) {
      alert('选中的项目中没有待审核的菜品')
      return
    }

    if (!confirm(`确定要通过选中的 ${pendingItems.length} 个待审核菜品吗？`)) return

    try {
      await Promise.all(
        pendingItems.map(id =>
          fetch(`/api/foods/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE' })
          })
        )
      )

      // 刷新数据
      await fetchAllFoods(true)
      setSelectedItems([])
      setSelectAll(false)
      alert(`成功通过 ${pendingItems.length} 个菜品的审核`)
    } catch (error) {
      console.error('批量审核失败:', error)
      alert('批量审核失败')
    }
  }

  // 复制食物信息
  const copyFood = async (food: FoodWithUploader) => {
    const foodInfo = `名称: ${food.name}\n类型: ${food.type === 'DISH' ? '菜品' : '饮品'}\n分类: ${food.category}\n描述: ${food.description || '暂无描述'}\n标签: ${parseTags(food.tags).join(', ')}`

    try {
      await navigator.clipboard.writeText(foodInfo)
      alert('食物信息已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败')
    }
  }

  // 复制为新食物
  const duplicateFood = (food: FoodWithUploader) => {
    setEditingFood(null)
    setFormData({
      name: `${food.name} (副本)`,
      type: food.type,
      category: food.category,
      description: food.description || '',
      tags: parseTags(food.tags).join(', '),
      status: 'PENDING' as FoodStatus // 副本默认为待审核状态
    })
    setDialogOpen(true)
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              🛠️ 菜品管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              管理系统中的所有菜品和饮品
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/stats">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>统计</span>
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

        {/* 操作栏 */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* 搜索和筛选 */}
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

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchAllFoods(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>

            {selectedItems.length > 0 && (
              <>
                <Button
                  variant="default"
                  onClick={batchApprove}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Eye className="w-4 h-4" />
                  批量通过 ({selectedItems.length})
                </Button>
                <Button
                  variant="destructive"
                  onClick={batchDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中 ({selectedItems.length})
                </Button>
              </>
            )}

            <Button onClick={openAddDialog} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              添加菜品
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总数量</CardTitle>
              <Utensils className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{getStats().total}</div>
              <p className="text-xs text-muted-foreground">
                系统中的所有食物
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">菜品数量</CardTitle>
              <Utensils className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{getStats().dishes}</div>
              <p className="text-xs text-muted-foreground">
                主食和菜品
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">饮品数量</CardTitle>
              <Coffee className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{getStats().drinks}</div>
              <p className="text-xs text-muted-foreground">
                饮料和饮品
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审核</CardTitle>
              <Eye className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{getStats().pending}</div>
              <p className="text-xs text-muted-foreground">
                等待审核的菜品
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已选择</CardTitle>
              <Checkbox className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{selectedItems.length}</div>
              <p className="text-xs text-muted-foreground">
                当前选中的项目
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 食物表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              <span>菜品列表</span>
            </CardTitle>
            <CardDescription>
              管理和编辑系统中的所有菜品和饮品
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : foods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  foods.map((food) => (
                    <TableRow key={food.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(food.id)}
                          onCheckedChange={(checked) => handleSelectItem(food.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {food.type === 'DISH' ? (
                            <Utensils className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Coffee className="w-4 h-4 text-blue-500" />
                          )}
                          {food.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={food.type === 'DISH' ? 'default' : 'secondary'}>
                          {food.type === 'DISH' ? '菜品' : '饮品'}
                        </Badge>
                      </TableCell>
                      <TableCell>{food.category}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={food.description || ''}>
                          {food.description || '暂无描述'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(() => {
                            const tags = parseTags(food.tags)
                            return (
                              <>
                                {tags.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tags.length - 3}
                                  </Badge>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(food.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={food.isUserUploaded ? 'secondary' : 'outline'}>
                            {food.isUserUploaded ? '用户上传' : '系统预置'}
                          </Badge>
                          {food.isUserUploaded && food.uploader && (
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <span>👤</span>
                                <span>{food.uploader.nickname || '匿名用户'}</span>
                              </div>
                              {food.uploadIp && (
                                <div className="flex items-center gap-1">
                                  <span>🌐</span>
                                  <span>{food.uploadIp}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">打开菜单</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => copyFood(food)}>
                              <Copy className="mr-2 h-4 w-4" />
                              复制信息
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateFood(food)}>
                              <Copy className="mr-2 h-4 w-4" />
                              复制为新食物
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(food)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteFood(food.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
