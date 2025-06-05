# 🍽️ 吃啥 - 解决选择困难症的终极神器

一个基于 Next.js 开发的美食推荐应用，帮助用户解决"吃什么"的选择困难症。支持菜品和饮品推荐，具有CS风格的开箱动画效果，让选择美食变得有趣。

## ✨ 主要功能

### 🎯 核心功能
- **智能推荐**: 随机推荐菜品，可选择是否包含饮品搭配
- **CS风格动画**: 类似开箱子的动画效果，增加推荐过程的趣味性
- **黑名单系统**: 支持临时不要（当天不再出现）和永久不要（以后都不再出现）
- **点赞点踩**: 用户可以对推荐结果进行评价，帮助优化推荐算法

### 👥 用户系统
- **游客模式**: 基于设备指纹识别，无需注册即可使用
- **用户贡献**: 用户可以上传新的菜品和饮品（需管理员审核）
- **偏好记录**: 自动记录用户的选择偏好和黑名单

### 📊 数据统计
- **使用统计**: 记录点击次数、推荐次数、接受/拒绝次数等
- **可视化分析**: 管理员可查看详细的使用数据和趋势分析
- **实时监控**: 追踪用户行为，包括中途离开页面的统计

### 🛠️ 管理功能
- **菜品管理**: 管理员可以增删改查菜品，审核用户上传的内容
- **数据分析**: 查看详细的统计数据和用户行为分析
- **内容审核**: 管理用户贡献的菜品和饮品

## 🚀 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI组件库**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **数据库**: SQLite (本地) / Cloudflare D1 (生产)
- **ORM**: Prisma
- **部署**: Cloudflare Pages + Workers
- **缓存**: 内存缓存 (本地) / Cloudflare KV (生产)

## 📦 快速开始

### 环境要求
- Node.js 18+
- pnpm (推荐) 或 npm/yarn

### 安装依赖
```bash
pnpm install
```

### 数据库设置
```bash
# 生成 Prisma 客户端
pnpm db:generate

# 创建数据库表
pnpm db:push

# 插入种子数据
pnpm db:seed
```

### 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 其他有用命令
```bash
# 查看数据库
pnpm db:studio

# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

## 🌐 部署

### Cloudflare 部署
项目已配置支持 Cloudflare Pages + D1 + KV 部署：

```bash
# 创建 D1 数据库
pnpm run cf:d1:create

# 创建 KV 命名空间
pnpm run cf:kv:create

# 运行数据库迁移
pnpm run cf:d1:migrate

# 插入种子数据
pnpm run cf:d1:seed

# 构建并部署
pnpm run cf:build
pnpm run cf:deploy
```

详细部署指南请参考 [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)

### 本地调试
详细的本地开发和调试指南请参考 [LOCAL_DEBUG.md](./LOCAL_DEBUG.md)

## 📁 项目结构

```
eat-what/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理员页面
│   ├── api/               # API 路由
│   ├── stats/             # 统计页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/                # shadcn/ui 组件
│   └── food-roulette.tsx  # 推荐动画组件
├── lib/                   # 工具函数和类型
├── prisma/                # 数据库模式和种子数据
├── hooks/                 # React Hooks
└── public/                # 静态资源
```

## 🎨 界面预览

- **首页**: 简洁的推荐界面，支持菜品和饮品选择
- **推荐动画**: CS风格的开箱动画效果
- **管理页面**: 表格形式的菜品管理界面
- **统计页面**: 可视化的数据分析界面

## 🔧 配置说明

### 环境变量
```bash
# 数据库连接
DATABASE_URL="file:./dev.db"

# Cloudflare 配置 (生产环境)
CLOUDFLARE_D1_DATABASE_ID="your-d1-database-id"
CLOUDFLARE_KV_NAMESPACE_ID="your-kv-namespace-id"
```

### 数据库模式
- **Food**: 菜品和饮品信息
- **User**: 用户信息（支持游客模式）
- **UserPreference**: 用户偏好设置
- **RecommendationStat**: 推荐统计数据
- **FoodRating**: 菜品评分数据

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m ':sparkles: feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 提交规范
使用 gitmoji + 常规提交格式：
- `:tada:` 初始化项目
- `:sparkles:` 新功能
- `:bug:` 修复bug
- `:lipstick:` 更新UI
- `:wrench:` 配置更改

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Prisma](https://prisma.io/) - 数据库 ORM
- [Cloudflare](https://cloudflare.com/) - 部署平台
