# 🛠️ 本地调试指南

本指南帮助您在迁移到 Cloudflare 的过程中进行本地开发和调试。

## 📋 当前配置

### 数据库
- **本地开发**: SQLite (`dev.db`)
- **生产环境**: Cloudflare D1 (SQLite)
- **备用**: PostgreSQL (已注释)

### 缓存
- **本地开发**: 内存缓存
- **生产环境**: Cloudflare KV

## 🚀 启动本地开发

### 1. 确保数据库已初始化
```bash
# 生成 Prisma 客户端
pnpm db:generate

# 创建数据库表
pnpm db:push

# 插入种子数据
pnpm db:seed
```

### 2. 启动开发服务器
```bash
pnpm dev
```

### 3. 访问应用
- **主页**: http://localhost:3000
- **管理页面**: http://localhost:3000/admin
- **Prisma Studio**: `pnpm db:studio`

## 🔧 调试工具

### Prisma Studio
查看和编辑数据库数据：
```bash
pnpm db:studio
```
访问: http://localhost:5555

### API 测试
```bash
# 测试推荐 API
curl "http://localhost:3000/api/recommend?includeDrink=true"

# 测试统计 API
curl "http://localhost:3000/api/stats"

# 测试食物列表 API
curl "http://localhost:3000/api/foods?limit=5"
```

### 数据库查询
```bash
# 查看所有菜品
sqlite3 dev.db "SELECT name, category, tags FROM foods WHERE type='DISH' LIMIT 5;"

# 查看所有饮品
sqlite3 dev.db "SELECT name, category, tags FROM foods WHERE type='DRINK' LIMIT 5;"

# 查看数据库结构
sqlite3 dev.db ".schema"
```

## 🐛 常见问题

### 1. 数据库连接错误
```bash
# 重新生成客户端
pnpm db:generate

# 重置数据库
rm dev.db
pnpm db:push
pnpm db:seed
```

### 2. 标签显示问题
标签现在存储为 JSON 字符串，确保前端正确解析：
```javascript
// 正确的标签解析
const tags = JSON.parse(food.tags || '[]')
```

### 3. 缓存问题
本地开发使用内存缓存，重启服务器会清空缓存。

### 4. API 路由错误
检查 API 路由是否正确处理 JSON 字符串转换。

## 📊 数据结构变化

### 原版 (PostgreSQL)
```sql
tags String[] -- 数组类型
```

### 当前版本 (SQLite)
```sql
tags String DEFAULT '[]' -- JSON 字符串
```

### 代码中的处理
```typescript
// 存储时
tags: JSON.stringify(['辣', '甜'])

// 读取时
tags: JSON.parse(food.tags || '[]')
```

## 🔄 切换数据库

### 切换到 PostgreSQL (如需要)
1. 更新 `.env`:
```env
DATABASE_URL="postgresql://..."
```

2. 更新 `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 恢复数组类型
tags String[]
```

3. 重新生成和迁移:
```bash
pnpm db:generate
pnpm db:push
```

### 切换到 SQLite
当前配置已经是 SQLite，无需额外操作。

## 🚀 Cloudflare 本地预览

### 使用 Wrangler 本地预览
```bash
# 构建项目
pnpm run cf:build

# 本地预览 (模拟 Cloudflare 环境)
pnpm run cf:preview
```

这将启动一个模拟 Cloudflare Workers 环境的本地服务器。

## 📝 开发建议

1. **数据一致性**: 确保本地 SQLite 和 Cloudflare D1 的数据结构一致
2. **API 兼容性**: API 路由应该同时支持本地和 Cloudflare 环境
3. **缓存策略**: 本地开发可以禁用缓存以便调试
4. **错误处理**: 添加详细的错误日志以便调试

## 🔍 监控和日志

### 开发环境日志
```bash
# 查看开发服务器日志
pnpm dev

# 查看数据库查询日志
# 在 lib/db.ts 中设置 log: ['query']
```

### 生产环境日志
```bash
# Cloudflare Workers 日志
npx wrangler pages deployment tail
```
