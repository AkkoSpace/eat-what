# 🚀 Cloudflare 部署指南

本指南将帮助您将"吃啥"项目部署到 Cloudflare 平台。

## 📋 前置要求

1. **Cloudflare 账号** - 注册 [Cloudflare](https://cloudflare.com)
2. **Wrangler CLI** - 已通过 `pnpm add wrangler` 安装
3. **项目代码** - 确保代码已推送到 GitHub

## 🛠️ 部署步骤

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 创建 D1 数据库

```bash
pnpm run cf:d1:create
```

复制返回的数据库 ID，更新 `wrangler.toml` 中的 `database_id`。

### 3. 创建 KV 命名空间

```bash
pnpm run cf:kv:create
```

复制返回的命名空间 ID，更新 `wrangler.toml` 中的 KV 配置。

### 4. 运行数据库迁移

```bash
pnpm run cf:d1:migrate
```

### 5. 插入种子数据

```bash
pnpm run cf:d1:seed
```

### 6. 构建项目

```bash
pnpm run cf:build
```

### 7. 部署到 Cloudflare Pages

```bash
pnpm run cf:deploy
```

## 🔧 配置说明

### wrangler.toml 配置

更新 `wrangler.toml` 文件中的以下值：

```toml
[[d1_databases]]
binding = "DB"
database_name = "eat-what-db"
database_id = "your-actual-database-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

### 环境变量

在 Cloudflare Pages 控制台中设置以下环境变量：

- `DATABASE_URL`: `file:./dev.db` (D1 会自动处理)
- `NEXTAUTH_URL`: 您的域名
- `NEXTAUTH_SECRET`: 随机生成的密钥

## 📊 技术栈对比

| 功能 | 原版 (PostgreSQL) | Cloudflare 版本 |
|------|------------------|----------------|
| 数据库 | PostgreSQL | Cloudflare D1 (SQLite) |
| 缓存 | 内存缓存 | Cloudflare KV |
| 部署 | 传统服务器 | Cloudflare Pages |
| CDN | 需要配置 | 自动全球 CDN |
| 扩展性 | 手动扩展 | 自动扩展 |

## 🎯 优势

1. **全球 CDN** - 自动分发到全球边缘节点
2. **无服务器** - 按需扩展，无需管理服务器
3. **高性能** - 边缘计算，响应速度快
4. **成本效益** - 免费额度慷慨，按使用付费
5. **简化运维** - 无需数据库维护

## 🔍 监控和调试

### 查看日志

```bash
npx wrangler pages deployment tail
```

### 本地预览

```bash
pnpm run cf:preview
```

### D1 数据库管理

```bash
# 查看数据库列表
npx wrangler d1 list

# 执行 SQL 查询
npx wrangler d1 execute eat-what-db --command="SELECT * FROM foods LIMIT 5"
```

## 🚨 注意事项

1. **数据库差异** - D1 基于 SQLite，某些 PostgreSQL 特性不支持
2. **冷启动** - 首次访问可能有轻微延迟
3. **限制** - 免费版有请求数量和存储限制
4. **数据迁移** - 从 PostgreSQL 迁移需要数据转换

## 📞 支持

如果遇到问题，请查看：
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Next.js on Cloudflare 指南](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
