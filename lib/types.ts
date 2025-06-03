import { Food, FoodType, FoodStatus, User, UserPreference, GuestPreference } from '@prisma/client'

// 基础类型
export type { Food, FoodType, FoodStatus, User, UserPreference, GuestPreference }

// 扩展类型
export interface FoodWithUploader extends Food {
  uploader?: User | null
}

export interface UserWithPreferences extends User {
  preferences?: UserPreference | null
}

// 推荐结果类型
export interface RecommendationResult {
  food: Food
  drink?: Food
}

// 用户偏好类型
export interface UserPreferences {
  todayBlacklist: string[]
  permanentBlacklist: string[]
  lastActiveDate: Date
}

// 设备指纹类型
export interface DeviceFingerprint {
  userAgent: string
  language: string
  screenResolution: string
  timezone: number
  canvasFingerprint: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 上传限制类型
export interface UploadLimitInfo {
  remainingUploads: number
  resetTime: Date
  isLimited: boolean
}

// 推荐请求参数
export interface RecommendationRequest {
  includeDrink?: boolean
  deviceId?: string
  userId?: string
}

// 食物上传请求
export interface FoodUploadRequest {
  name: string
  type: FoodType
  category: string
  description?: string
  tags?: string[]
}
