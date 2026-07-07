# Vibe Coding 雷达

给刚开始 Coding 的新手，把好玩、好用、好搓（硬件）三条路线整理成一张 90 项可分享榜单。

## 功能特性

- **90 个项目推荐**：好玩、好用、好搓三条路线，每个项目都有 MVP、体验标签和三维评分
- **GitHub 明星项目**：自动爬取 GitHub 热门项目，按 stars 排序
- **新手选择器**：根据时间、目标、熟练度和硬件意愿，推荐最适合的项目
- **开工计划**：为每个项目生成开工步骤、文件结构和 Codex Prompt
- **项目工作台**：支持项目详情深链、本地收藏、双项目对比、筛选分享和 Markdown 开工清单导出
- **必装 Skill**：推荐每个项目适合使用的 AI Skill 和 CLI 工具
- **Codex 趣味用法**：整理可复制的 Codex 使用场景，覆盖电脑整理、网页流程、小游戏原型和代码审查

## 项目结构

```
vue-radar/
├── public/                    # 静态资源
│   ├── css2.css              # 字体样式
│   └── script.js             # 统计脚本
├── src/
│   ├── App.vue               # 多页面路径分发
│   ├── main.js               # 入口文件
│   ├── style.css             # 全局样式
│   ├── pages/                # Vue 页面
│   │   ├── HomePage.vue      # 首页雷达、详情、收藏、对比
│   │   ├── SkillsPage.vue    # 必装 Skill 页面
│   │   └── CodexUsesPage.vue # Codex 趣味用法页面
│   ├── composables/          # 可复用状态逻辑
│   │   └── usePersistentIdList.js
│   ├── assets/               # 资源文件
│   │   ├── styles.css        # 主样式
│   │   ├── skills-page.css   # Skill 页面样式
│   │   ├── codex-uses-page.css # Codex 用法页面样式
│   │   ├── theme.css         # 主题变量
│   │   └── css2.css          # 字体样式
│   ├── data/                 # 数据文件
│   │   ├── index.js          # 主数据（90个项目）
│   │   ├── skill-page.js     # Skill 页人工策划数据
│   │   ├── codex-uses.js     # Codex 用法案例数据
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
│       ├── update-trending.yml  # GitHub Actions 自动更新数据
│       └── deploy-jd.yml        # GitHub Actions 自动部署京东云
├── index.html                # HTML 入口
├── skills.html               # 必装 Skill Vue 页面入口
├── codex-uses.html           # Codex 用法 Vue 页面入口
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

项目配置了 GitHub Actions，每天 UTC 00:00 自动爬取 GitHub 热门项目和 Skills 数据并提交到仓库。

目前自动更新覆盖：

- `src/data/github-trending.json`
- `src/data/skills.json`

`src/data/skill-page.js` 和 `src/data/codex-uses.js` 属于人工整理的专题页数据，不会被自动覆盖。

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
基于 GitHub topic 候选池和本地快照，追踪最近一次更新中增长最快的开源项目。

## 技术栈

- **前端框架**：Vue 3 + Composition API
- **构建工具**：Vite
- **样式**：原生 CSS + CSS 变量
- **数据**：静态数据 + GitHub API 动态爬取
- **部署**：静态文件，可部署到任何 Web 服务器

## 部署

可复用的京东云自动部署接入文档见：[GitHub 自动部署到京东云 Nginx 端口](docs/jd-cloud-auto-deploy.md)。

### 京东云自动部署

仓库包含 `.github/workflows/deploy-jd.yml`，会在以下情况自动部署到京东云 7870 站点：

- 推送到 `main`
- 手动运行 `Deploy JD Cloud`
- `Update GitHub Trending` 自动数据更新成功后

部署流程：

1. `npm ci`
2. `npm run build`
3. 打包 `dist/`
4. SSH 上传到京东云
5. 备份 `/var/www/vue-radar`
6. 覆盖最新静态文件
7. `nginx -t && nginx -s reload`
8. 访问首页和 `codex-uses.html` 做 smoke test

首次启用前，需要在 GitHub 仓库设置里添加 Secret：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

必填：

```text
JD_SSH_PASSWORD=京东云 root 密码
```

可选覆盖项：

```text
JD_HOST=111.228.44.255
JD_PORT=22
JD_USER=root
JD_DEPLOY_PATH=/var/www/vue-radar
JD_PUBLIC_URL=http://111.228.44.255:7870
JD_HOST_FINGERPRINT=SHA256:uy22N6dK/kgwYyN4wenTv2duN19qgsdADQpXDHaNzmg
```

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
