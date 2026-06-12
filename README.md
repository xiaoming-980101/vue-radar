# Vibe Coding 雷达

给刚开始 Coding 的新手，把好玩、好用、好搓（硬件）三条路线整理成一张 90 项可分享榜单。

## 功能特性

- **90 个项目推荐**：好玩、好用、好搓三条路线，每个项目都有 MVP、体验标签和三维评分
- **GitHub 明星项目**：自动爬取 GitHub 热门项目，按 stars 排序
- **新手选择器**：根据时间、目标、熟练度和硬件意愿，推荐最适合的项目
- **开工计划**：为每个项目生成开工步骤、文件结构和 Codex Prompt
- **必装 Skill**：推荐每个项目适合使用的 AI Skill 和 CLI 工具

## 项目结构

```
vue-radar/
├── public/                    # 静态资源
│   ├── skills.html           # 必装 Skill 页面
│   ├── skills.css            # Skill 页面样式
│   ├── css2.css              # 字体样式
│   └── script.js             # 统计脚本
├── src/
│   ├── App.vue               # 主组件
│   ├── main.js               # 入口文件
│   ├── style.css             # 全局样式
│   ├── assets/               # 资源文件
│   │   ├── styles.css        # 主样式
│   │   ├── theme.css         # 主题变量
│   │   └── css2.css          # 字体样式
│   ├── components/           # 组件目录
│   ├── data/                 # 数据文件
│   │   ├── index.js          # 主数据（90个项目）
│   │   ├── github-trending.json  # GitHub 爬取数据
│   │   ├── tagline-zh.json   # 中文翻译映射
│   │   └── trending-loader.js    # 数据加载器
│   └── utils/
│       └── browser-crawler.js    # 浏览器端爬虫
├── scripts/
│   ├── fetch-trending.mjs    # Node.js 爬虫脚本
│   ├── print-data.mjs        # 数据打印脚本
│   └── check-tagline.mjs    # 标签检查脚本
├── .github/
│   └── workflows/
│       └── update-trending.yml  # GitHub Actions 自动更新
├── index.html                # HTML 入口
├── vite.config.js            # Vite 配置
└── package.json              # 依赖配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

## 数据更新

### 自动更新（GitHub Actions）

项目配置了 GitHub Actions，每天 UTC 00:00 自动爬取 GitHub 热门项目数据并提交到仓库。

### 手动更新

#### 方式1：Node.js 脚本

```bash
# 更新 GitHub 热门项目
npm run fetch

# 更新 Skills 数据
npm run fetch-skills
```

#### 方式2：浏览器端爬取

1. 启动开发服务器
2. 点击页面右下角的刷新按钮
3. 输入密码 `955976`
4. 点击"开始爬取"
5. 爬取完成后页面自动更新

**注意**：GitHub API 未认证有速率限制（每小时 10 次搜索请求）。如需更高限额，可在爬取时提供 GitHub Token。

### 创建 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 只需勾选 `public_repo` 权限
4. 生成 Token 后保存

## 项目分类

### 好玩的项目（fun）
即时反馈、强互动、适合用一天做出能给朋友看的版本。

### 最好用的项目（useful）
做完能进入日常工作流，优先解决信息、文档、财务和个人知识管理。

### 最好搓的项目（hardware）
小预算也能跑通，硬件反馈明确，适合从 ESP32 和 Raspberry Pi 起步。

### 明星项目（stars）
基于 GitHub Trending，追踪本周增长最快的开源项目。

## 技术栈

- **前端框架**：Vue 3 + Composition API
- **构建工具**：Vite
- **样式**：原生 CSS + CSS 变量
- **数据**：静态数据 + GitHub API 动态爬取
- **部署**：静态文件，可部署到任何 Web 服务器

## 部署

### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 其他平台

构建后的文件在 `dist/` 目录，可直接部署到任何支持静态文件的平台。

## 许可证

MIT License
