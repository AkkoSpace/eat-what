import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

// 类型定义
interface CloudflareEnv {
  DB: D1Database
  CACHE: KVNamespace
}

// 全局变量类型扩展
declare global {
  var __prisma: PrismaClient | undefined
}

// 创建数据库客户端
export function createPrismaClient(env?: CloudflareEnv) {
  // 在 Cloudflare Workers 环境中
  if (env?.DB) {
    const adapter = new PrismaD1(env.DB)
    return new PrismaClient({
      adapter,
      log: ['error']
    })
  }

  // 在开发环境中
  if (globalThis.__prisma) {
    return globalThis.__prisma
  }

  // 检查是否使用本地 SQLite
  const isLocalSQLite = process.env.DATABASE_URL?.includes('file:') ||
                       process.env.NODE_ENV === 'development'

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db'
      }
    }
  })

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = client
  }

  return client
}

// 默认客户端 (用于开发环境)
export const prisma = createPrismaClient()

// 缓存工具函数
export class CacheManager {
  private kv: KVNamespace | null = null
  
  constructor(kv?: KVNamespace) {
    this.kv = kv || null
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.kv) return null
    
    try {
      const value = await this.kv.get(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!this.kv) return
    
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl
      })
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }
  
  async delete(key: string): Promise<void> {
    if (!this.kv) return
    
    try {
      await this.kv.delete(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }
}
